import { WcagVersion } from './types';
import ruleGroups from './ruleGroups.json';

export function transformWcagUrlToWcagId(wcagUrl: string): string | undefined {
  // To WCAG21:non-text-content
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

export function getWcagIdsFromHelpUrl(
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
