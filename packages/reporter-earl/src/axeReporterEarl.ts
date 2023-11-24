import { AuditSample, EarlReport, WcagVersion } from './types';
import context from './context.json';
import axe, { AxeResults } from 'axe-core';
import ruleGroups from './ruleGroups.json';
import { getDefaultAuditSamples, getOutcomeByStatus } from './auditSample';

function cssToPointer(selector: axe.NodeResult[]) {
  const item = selector?.[0]?.target;
  if (!item) return '';

  if (Array.isArray(item)) {
    return `${item[0]}`;
  }
  return `${item}`;
}

function transformWcagUrlToWcagId(wcagUrl: string): string | undefined {
  // to WCAG21:non-text-content
  // From https://www.w3.org/TR/WCAG22/#name-role-value
  // to WCAG22:name-role-value
  // Ignore URLs that don't match the pattern
  // https://www.w3.org/WAI/WCAG21/Techniques/general/G202
  const { hash, pathname } = new URL(wcagUrl);
  const wcagId = hash.replace('#', '');
  const wcagVersion = /\/TR\/(.*)\//.exec(pathname)?.[1];
  const result = `${wcagVersion}:${wcagId}`;
  if (result.startsWith('WCAG')) return result;
  return undefined;
}

function getWcagIdsFromHelpUrl(
  helpUrl: string,
  wcagVersion: WcagVersion
): string[] {
  let url: URL | undefined = undefined;

  try {
    url = new URL(helpUrl);
  } catch (error) {
    throw new Error(`Invalid helpUrl: ${helpUrl}`);
  }

  const normalizedUrl = url.origin + url.pathname;
  const ruleGroup = ruleGroups.find(
    ({ rulePage }) => rulePage === normalizedUrl
  );
  const wcagUrls = ruleGroup?.ruleSets[`WCAG ${wcagVersion}`] || [];
  return wcagUrls.reduce((acc, wcagUrl) => {
    const wcagId = transformWcagUrlToWcagId(wcagUrl);
    if (wcagId) acc.push(wcagId);
    return acc;
  }, [] as string[]);
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

  const results: Array<axe.Result & { status: string }> = [
    ...violations.map(r => ({ ...r, status: 'failed' })),
    ...passes.map(r => ({ ...r, status: 'passed' })),
    ...incomplete.map(r => ({ ...r, status: 'incomplete' })),
    ...inapplicable.map(r => ({ ...r, status: 'inapplicable' }))
  ];

  const defaultAuditSamples = getDefaultAuditSamples({ axeResults });

  const returnValue = results.reduce((acc, result) => {
    const wcagVersions = getWcagVersionFromTags(result.tags);
    if (!wcagVersions.length) return acc;
    const wcagIds = wcagVersions
      .map(wcagVersion => getWcagIdsFromHelpUrl(result.helpUrl, wcagVersion))
      .flat();
    wcagIds.forEach(wcagId => {
      const newAuditSample = acc.find(({ test }) => {
        return test?.id.split(':')[1] === wcagId.split(':')[1];
      });
      if (!newAuditSample) return;
      const newDescription =
        cssToPointer(result.nodes) + ':' + result.description;
      newAuditSample.result.outcome = getOutcomeByStatus(result.status);
      newAuditSample.result.description += `${newDescription}\n\n`;
    });
    return acc;
  }, defaultAuditSamples as AuditSample[]);
  return returnValue;
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
