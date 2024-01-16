import { AxeResults } from 'axe-core';
import { AuditSample } from './types';
import wcag from './wcag.json';
import { getOutcomeByStatus } from './outcome';

export type GetDefaultAuditSampleParams = {
  testId: string;
  axeResults: AxeResults;
};

export function getDefaultAuditSample({
  testId,
  axeResults
}: GetDefaultAuditSampleParams): AuditSample {
  return {
    type: 'Assertion',
    date: axeResults.timestamp,
    mode: {
      type: 'TestMode',
      '@value': 'earl:automatic'
    },
    subject: {
      id: '_:subject_1',
      type: ['TestSubject', 'Website'],
      date: axeResults.timestamp,
      description: '',
      title: axeResults.url
    },
    test: {
      id: testId,
      type: ['TestCriterion', 'TestRequirement'],
      date: axeResults.timestamp
    },
    result: {
      type: 'TestResult',
      date: axeResults.timestamp,
      description: '',
      outcome: getOutcomeByStatus()
    }
  };
}

export function getDefaultAuditSamplesFromWcagJson({
  axeResults
}: {
  axeResults: AxeResults;
}) {
  const auditSamples: AuditSample[] = [];
  Object.entries(wcag).forEach(([wcagVersion, successCriteria]) => {
    Object.entries(successCriteria).forEach(([, { id }]) => {
      const wcagVersionForTestId = wcagVersion.replace('.', '');
      const auditSample = getDefaultAuditSample({
        testId: `WCAG${wcagVersionForTestId}:${id}`,
        axeResults
      });
      auditSamples.push(auditSample);
    });
  });

  return auditSamples;
}

export function getDefaultAuditSamples({
  axeResults
}: {
  axeResults: AxeResults;
}) {
  return getDefaultAuditSamplesFromWcagJson({ axeResults });
}
export { getOutcomeByStatus };
