const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/bookings', { waitUntil: 'networkidle2' });
    
    // wait for widget to render
    await page.waitForTimeout(3000);

    const html = await page.evaluate(() => {
        const el = document.getElementById('tpwl-search');
        if (!el) return 'NO TPWL_SEARCH FOUND';
        
        // Remove massive SVG paths to keep output clean
        const clone = el.cloneNode(true);
        clone.querySelectorAll('path').forEach(p => p.remove());
        clone.querySelectorAll('svg').forEach(p => p.innerHTML = '');
        return clone.outerHTML;
    });

    console.log(html);
    await browser.close();
})();
