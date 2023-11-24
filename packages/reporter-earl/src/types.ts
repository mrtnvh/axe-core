export interface EarlReport {
  '@context': Context;
  language: string;
  type: string;
  defineScope: DefineScope;
  exploreTarget: ExploreTarget;
  selectSample: SelectSample;
  auditSample: AuditSample[];
  reportFindings: ReportFindings;
}

export interface Context {
  reporter: string;
  wcagem: string;
  Evaluation: string;
  defineScope: string;
  scope: string;
  step1b: Step1b;
  conformanceTarget: string;
  accessibilitySupportBaseline: string;
  additionalEvaluationRequirements: string;
  exploreTarget: string;
  essentialFunctionality: string;
  pageTypeVariety: string;
  technologiesReliedUpon: string;
  selectSample: string;
  structuredSample: string;
  randomSample: string;
  Website: string;
  Webpage: string;
  auditSample: string;
  reportFindings: string;
  documentSteps: string;
  commissioner: string;
  evaluator: string;
  evaluationSpecifics: string;
  WCAG: string;
  WCAG20: string;
  WCAG21: string;
  WAI: string;
  A: string;
  AA: string;
  AAA: string;
  wcagVersion: string;
  earl: string;
  Assertion: string;
  TestMode: string;
  TestCriterion: string;
  TestCase: string;
  TestRequirement: string;
  TestSubject: string;
  TestResult: string;
  OutcomeValue: string;
  Pass: string;
  Fail: string;
  CannotTell: string;
  NotApplicable: string;
  NotTested: string;
  assertedBy: string;
  mode: string;
  result: string;
  subject: string;
  test: string;
  outcome: string;
  dcterms: string;
  title: string;
  description: string;
  summary: string;
  date: string;
  hasPart: string;
  isPartOf: string;
  id: string;
  type: string;
  language: string;
}

export interface Step1b {
  '@id': string;
  '@type': string;
}

export interface DefineScope {
  id: string;
  scope: Scope;
  conformanceTarget: string;
  accessibilitySupportBaseline: string;
  additionalEvaluationRequirements: string;
  wcagVersion: string;
}

export interface Scope {
  description: string;
  title: string;
}

export interface ExploreTarget {
  id: string;
  essentialFunctionality: string;
  pageTypeVariety: string;
  technologiesReliedUpon: any[];
}

export interface SelectSample {
  id: string;
  structuredSample: any[];
  randomSample: any[];
}

export interface AuditSample {
  type: string;
  date: string;
  mode: Mode;
  result: Result;
  subject: Subject;
  test?: Test;
}

export interface Mode {
  type: string;
  '@value': string;
}

export interface Result {
  type: string;
  date: string;
  description: string;
  outcome: Outcome;
  pointer?: string;
}

export interface Outcome {
  id: string;
  type: string[];
  title?: string;
}

export interface Subject {
  id: string;
  type: string[];
  date: string;
  description: string;
  title: string;
}

export interface Test {
  id: string;
  type: string[];
  date: string;
}

export interface ReportFindings {
  date: Date;
  summary: string;
  title: string;
  commissioner: string;
  evaluator: 'Testevaluator';
  documentSteps: DocumentStep[];
  evaluationSpecifics: string;
}

export interface Date {
  type: 'http://www.w3.org/TR/NOTE-datetime';
  '@value': string;
}

export interface DocumentStep {
  id: string;
}

export type WcagVersion = '2.2' | '2.1' | '2.0';
