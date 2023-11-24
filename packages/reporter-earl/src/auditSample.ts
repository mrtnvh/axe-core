import { AxeResults } from 'axe-core';
import { AuditSample, Outcome } from './types';
import wcag from './wcag.json';

export function getOutcomeByStatus(status?: string): Outcome {
  switch (status) {
    case 'passed':
      return {
        id: 'earl:passed',
        type: ['OutcomeValue', 'Pass'],
        title: 'Passed'
      };
    case 'failed':
      return {
        id: 'earl:failed',
        type: ['OutcomeValue', 'Fail'],
        title: 'Failed'
      };
    case 'inapplicable':
      return {
        id: 'earl:inapplicable',
        type: ['OutcomeValue', 'NotApplicable']
      };
    default:
      return {
        id: 'earl:untested',
        type: ['OutcomeValue', 'NotTested']
      };
  }
}

export function getDefaultAssertion({
  axeResults
}: {
  axeResults: AxeResults;
}) {
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
    }
  };
}

export function getDefaultAuditSample({
  testId,
  axeResults
}: {
  testId: string;
  axeResults: AxeResults;
}): AuditSample {
  const defaultAssertion = getDefaultAssertion({ axeResults });
  return {
    ...defaultAssertion,
    subject: {
      ...defaultAssertion.subject,
      description: ''
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

export function transformWcagJsonToAuditSamples({
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
  return transformWcagJsonToAuditSamples({ axeResults });
}
