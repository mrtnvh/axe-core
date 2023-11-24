// Get rule pages from rule overview
// const rulePages = Array.from(document.querySelectorAll('table tr'))
//   .filter(
//     row =>
//       row.querySelector('td:nth-child(4)')?.textContent?.includes('wcag2a') &&
//       row.querySelector('td:nth-child(1) a')
//   )
//   .map(row => {
//     const rulePage = row.querySelector('td:nth-child(1) a')?.href;
//     const actRulePage = row.querySelector('td:nth-child(6) a')?.href;

//     return {
//       rulePage,
//       actRulePage,
//     };
//   });

// Get WCAG rules from rule page
// Array.from(
//   document
//     ?.evaluate(
//       '//h3[contains(text(), "WCAG")]/following-sibling::ul',
//       document,
//       null,
//       XPathResult.FIRST_ORDERED_NODE_TYPE,
//       null
//     )
//     .singleNodeValue.querySelectorAll('li')
// ).map(item => item.textContent);
