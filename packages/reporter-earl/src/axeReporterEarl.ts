import { AuditSample, EarlReport, ResultStatus, WcagVersion } from './types';
import context from './context.json';
import axe, { AxeResults } from 'axe-core';
import { getDefaultAuditSamples, getOutcomeByStatus } from './auditSample';
import { getWcagIdsFromHelpUrl } from './wcagId';
import { aggregateOutcome } from './outcome';

function getAuditSampleResultDescriptionFromAxeResult({
  result
}: {
  result: axe.Result & { status: ResultStatus };
}): string {
  const { nodes, status } = result;
  return nodes
    .reduce((acc, node, index) => {
      const checkResults = [...node.all, ...node.any, ...node.none];
      const checkResultsDescription = checkResults
        .reduce(
          (acc, checkResult) => [acc, `- ${checkResult.message}`].join('\n'),
          ''
        )
        .trim();
      if (index === 0)
        return [
          acc,
          `**${status}**`,
          node.target,
          checkResultsDescription
        ].join('\n');
      return [
        acc,
        '---',
        `**${status}**`,
        node.target,
        checkResultsDescription
      ].join('\n');
    }, '')
    .trim();
}

function getAuditSampleFromAxeResults(
  axeResults: axe.AxeResults
): AuditSample[] {
  const { violations, passes, incomplete, inapplicable } = axeResults || {
    violations: [],
    passes: [],
    incomplete: [],
    inapplicable: []
  };

  const results: Array<axe.Result & { status: ResultStatus }> = [
    ...violations.map(r => ({ ...r, status: 'failed' as ResultStatus })),
    ...passes.map(r => ({ ...r, status: 'passed' as ResultStatus })),
    ...incomplete.map(r => ({ ...r, status: 'incomplete' as ResultStatus })),
    ...inapplicable.map(r => ({ ...r, status: 'inapplicable' as ResultStatus }))
  ];

  const defaultAuditSamples = getDefaultAuditSamples({ axeResults });

  // const test = [] as [string, string][];

  const newAuditSamples = results.reduce((acc, result) => {
    const wcagVersions = getWcagVersionFromTags(result.tags);
    if (!wcagVersions.length) return acc;
    const wcagIds = wcagVersions
      .map(wcagVersion => getWcagIdsFromHelpUrl(result.helpUrl, wcagVersion))
      .flat();
    wcagIds.forEach(wcagId => {
      const newAuditSampleIndex = acc.findIndex(({ test }) => {
        return test?.id.split(':')[1] === wcagId.split(':')[1];
      });
      if (newAuditSampleIndex === -1) return;
      // test.push([wcagId, result.status]);

      const newOutcome = aggregateOutcome(
        acc[newAuditSampleIndex].result.outcome,
        getOutcomeByStatus(result.status)
      );
      acc[newAuditSampleIndex].result.outcome = newOutcome;
      acc[newAuditSampleIndex].result.description +=
        getAuditSampleResultDescriptionFromAxeResult({ result });
    });
    return acc;
  }, defaultAuditSamples as AuditSample[]);

  // console.log(test);

  return newAuditSamples;
}

function getDefaultEarlReport({
  date,
  url,
  conformanceTarget,
  wcagVersion
}: {
  date: string;
  url: string;
  conformanceTarget: string;
  wcagVersion: WcagVersion | undefined;
}): Omit<EarlReport, 'auditSample'> {
  return {
    '@context': context,
    language: 'en',
    type: 'Evaluation',
    defineScope: {
      id: '_:defineScope',
      scope: {
        title: 'Axe Report for ' + url,
        description: ''
      },
      conformanceTarget,
      accessibilitySupportBaseline: '',
      additionalEvaluationRequirements: '',
      wcagVersion: wcagVersion || ''
    },
    exploreTarget: {
      id: '_:exploreTarget',
      essentialFunctionality: '',
      pageTypeVariety: '',
      technologiesReliedUpon: [
        'HTML',
        'CSS',
        'JavaScript',
        'axe core'
        // {
        //   '@id': `https://github.com/dequelabs/axe-core`,
        //   '@type': ['earl:Assertor', 'earl:Software', 'doap:Project'],
        //   'doap:name': 'axe',
        //   'doap:vendor': {
        //     '@id': 'https://deque.com/',
        //     '@type': 'foaf:Organization',
        //     'foaf:name': 'Deque Systems'
        //   }
        // }
      ]
    },
    selectSample: {
      id: '_:selectSample',
      structuredSample: [],
      randomSample: []
    },
    reportFindings: {
      date: {
        type: 'http://www.w3.org/TR/NOTE-datetime',
        '@value': date
      },
      title: '',
      summary: '',
      commissioner: '',
      evaluator: 'Testevaluator',
      documentSteps: [
        { id: '_:about' },
        { id: '_:defineScope' },
        { id: '_:exploreTarget' },
        { id: '_:selectSample' }
      ],
      evaluationSpecifics: ''
    }
  };
}

function getTagSetFromResults(results: axe.Result[]) {
  const allTags = results.reduce(
    (acc, { tags }) => [...acc, ...tags],
    [] as string[]
  );
  return new Set(allTags);
}

function concatResultGroups(
  axeResults: AxeResults
): Array<axe.Result & { status: string }> {
  return [
    ...axeResults.violations.map(r => ({ ...r, status: 'failed' })),
    ...axeResults.passes.map(r => ({ ...r, status: 'passed' })),
    ...axeResults.incomplete.map(r => ({ ...r, status: 'incomplete' })),
    ...axeResults.inapplicable.map(r => ({ ...r, status: 'inapplicable' }))
  ];
}

function getConformanceTargetFromAxeResults(axeResults: AxeResults): string {
  const rules = concatResultGroups(axeResults);
  const tagSet = getTagSetFromResults(rules);
  if (tagSet.has('wcag2a')) return 'A';
  if (tagSet.has('wcag2aa')) return 'AA';
  if (tagSet.has('wcag2aaa')) return 'AAA';
  return '';
}

function getWcagVersionFromTags(tags: string[]): WcagVersion[] {
  const versions = [];
  // const hasWcag22 = tags.some(tag => tag.startsWith('wcag22'));
  const hasWcag21 = tags.some(tag => tag.startsWith('wcag21'));
  const hasWcag2 = tags.some(tag => tag.startsWith('wcag2'));
  // if (hasWcag22) return '2.2';
  if (hasWcag21) versions.push('2.1');
  if (hasWcag2) versions.push('2.0');
  return versions as WcagVersion[];
}

function getWcagVersionFromAxeResults(
  axeResults: AxeResults
): WcagVersion | undefined {
  const rules = concatResultGroups(axeResults);
  const tags = Array.from(getTagSetFromResults(rules));
  return getWcagVersionFromTags(tags)[0];
}

export function createEarlReportFromAxeResults(
  axeResults: AxeResults
): EarlReport {
  // debugger;
  return {
    ...getDefaultEarlReport({
      date: axeResults.timestamp,
      url: axeResults.url,
      conformanceTarget: getConformanceTargetFromAxeResults(axeResults),
      wcagVersion: getWcagVersionFromAxeResults(axeResults)
    }),
    auditSample: getAuditSampleFromAxeResults(axeResults)
  };
}

export default function axeReporterEarl(
  axeResults: AxeResults,
  {},
  callback: Function
): void {
  callback(createEarlReportFromAxeResults(axeResults));
}
