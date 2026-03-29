const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const queries = [
  { file: 'card_ganga_aarti.jpg', query: 'Ganga Aarti Dashashwamedh Ghat Varanasi 4k photography' },
  { file: 'explore_dashashwamedh.jpg', query: 'Varanasi Ghats boat ride Ganges 4k travel photography' },
  { file: 'card_amer_fort.jpg', query: 'Amer Fort Amber Fort Jaipur Rajasthan 4k' },
  { file: 'explore_city_palace.jpg', query: 'City Palace Udaipur Lake Pichola 4k' },
  { file: 'explore_mehrangarh.jpg', query: 'Mehrangarh Fort Jodhpur blue city High resolution' },
  { file: 'explore_spiti.jpg', query: 'Spiti Valley Key Monastery Himachal Pradesh 4k' },
  { file: 'explore_pangong.jpg', query: 'Pangong Lake Ladakh crystal clear water mountains 4k' },
  { file: 'scroll_festival.jpg', query: 'Holi festival of colors India travel 4k' },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  for (const item of queries) {
    try {
      console.log(`Searching for: ${item.query}`);
      // Go to Google Image Search
      await page.goto(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.query)}`);
      
      // Wait for results
      await page.waitForSelector('img.YQ4gaf', { timeout: 10000 });
      
      // Extract the first high-quality image URL. Sometimes they are base64, sometimes they are standard HTTP urls.
      // We will look for an img tag under the search results that has an http src or data-src 
      const imageUrl = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img.YQ4gaf'));
        for (const img of imgs) {
          const src = img.getAttribute('src') || img.getAttribute('data-src');
          if (src && src.startsWith('http')) {
            return src;
          }
        }
        return null;
      });

      if (!imageUrl || imageUrl.startsWith('data:')) {
        console.log(`❌ No valid HTTP URL found for ${item.file}`);
        continue;
      }
      
      console.log(`Found URL: ${imageUrl.substring(0, 50)}...`);
      const dest = path.join(__dirname, 'public', 'images', item.file);
      await downloadFile(imageUrl, dest);
      console.log(`✅ Saved ${item.file}`);
    } catch (e) {
      console.log(`❌ Failed for ${item.query}:`, e.message);
    }
  }
  
  await browser.close();
  console.log('Done!');
}

run().catch(console.error);
