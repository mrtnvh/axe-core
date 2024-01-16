import { Outcome } from './types';

export function aggregateOutcome(
  previousOutcome: Outcome,
  currentOutcome: Outcome
): Outcome {
  if (
    previousOutcome.id === 'earl:passed' ||
    previousOutcome.id === 'earl:failed'
  )
    return previousOutcome;
  return currentOutcome;
}

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
