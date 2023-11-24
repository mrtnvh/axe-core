import axe from 'axe-core';
import clone from 'clone';

let _dummyData: axe.AxeResults;
export async function getDummyData(): Promise<axe.AxeResults> {
  if (!_dummyData) {
    document.body.innerHTML = `
      <h1>My page </h1>
      <main>
        <p>Some page</p>
        <p><input type="text"> Failing input field</p>
      </main>
    `;
    const params: any = {
      // reporter: function (raw: any, _: any, callback: Function) {
      //   callback(JSON.parse(JSON.stringify(raw)));
      // },

      reporter: 'raw-env',

      rules: [
        {
          // color contrast checking doesn't work in a jsdom environment (since it depends on canvas)
          id: 'color-contrast',
          enabled: false
        }
      ]
    };
    axe.configure(params);
    _dummyData = await axe.run();
    _dummyData.timestamp = new Date('Mon Jun 28 2021').toISOString();
  }
  return clone(_dummyData as axe.AxeResults);
}
