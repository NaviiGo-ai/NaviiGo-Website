const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({channel:'chrome', args:['--no-sandbox']});
  const p = await b.newPage();
  try {
    const res = await p.goto('http://[::1]:3000/explore', { timeout: 10000 });
    console.log(res.status());
  } catch (e) {
    console.error(e.message);
  }
  await b.close();
})();
