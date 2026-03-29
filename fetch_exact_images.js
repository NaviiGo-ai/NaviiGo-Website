const https = require('https');
const fs = require('fs');
const path = require('path');

const directUrls = {
  'card_ganga_aarti.jpg': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Ganga_Aarti_Dashashwamedh_Ghat_Varanasi.jpg',
  'explore_dashashwamedh.jpg': 'https://upload.wikimedia.org/wikipedia/commons/2/22/Varanasi_ghats_from_the_Ganges.jpg',
  'card_amer_fort.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Amber_Fort_Jaipur.jpg',
  'explore_city_palace.jpg': 'https://upload.wikimedia.org/wikipedia/commons/7/7e/City_Palace%2C_Udaipur%2C_Rajasthan.jpg',
  'explore_mehrangarh.jpg': 'https://upload.wikimedia.org/wikipedia/commons/6/64/Mehrangarh_Fort_in_Jodhpur.jpg',
  'explore_spiti.jpg': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Spiti_Valley_Himachal_Pradesh.jpg',
  'explore_pangong.jpg': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Pangong_Tso.jpg',
  'scroll_festival.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Holi_Festival_of_Colors.jpg'
};

function fetchImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'NaviiGOScraper/1.0 (naviigo24@gmail.com)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchImage(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => resolve());
    }).on('error', reject);
  });
}

async function run() {
  for (const [file, url] of Object.entries(directUrls)) {
    try {
      process.stdout.write(`Downloading ${file} ... `);
      const dest = path.join(__dirname, 'public', 'images', file);
      await fetchImage(url, dest);
      console.log('✅ OK');
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
    }
  }
}

run();
