const fs = require('fs');
const path = require('path');
const https = require('https');

const PUBLIC_DIR = path.join(__dirname, 'public', 'images');
const ARTIFACT_DIR = 'C:\\Users\\Dev\\.gemini\\antigravity\\brain\\0268a1ad-bbfe-4546-a943-c87d8a115e56';

// Working alternative Unsplash photo IDs for the broken ones
const replacements = {
  // card_ganga_aarti - use a real working ganga aarti photo
  'card_ganga_aarti.jpg': 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=900&q=80',
  // card_amer_fort - use jaipur/hawa mahal which works
  'card_amer_fort.jpg': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80',
  // explore_dashashwamedh - use varanasi ghat
  'explore_dashashwamedh.jpg': 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=900&q=80',
  // explore_city_palace - use udaipur lake palace  
  'explore_city_palace.jpg': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=900&q=80',
  // explore_mehrangarh - use rajasthan fort
  'explore_mehrangarh.jpg': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=900&q=80',
  // explore_spiti - use himalayan mountain pass
  'explore_spiti.jpg': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80',
  // explore_pangong - use lake in mountains
  'explore_pangong.jpg': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
  // scroll_festival - use indian festival
  'scroll_festival.jpg': 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
};

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'NaviiGO/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const stream = fs.createWriteStream(filepath);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(); });
      stream.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  // First, copy the AI-generated himalayas image
  const heroSrc = path.join(ARTIFACT_DIR, 'hero_himalayas_1774693056815.png');
  const heroDst = path.join(PUBLIC_DIR, 'hero_himalayas.jpg');
  if (fs.existsSync(heroSrc)) {
    fs.copyFileSync(heroSrc, heroDst);
    console.log('✅ hero_himalayas.jpg copied from AI-generated image');
  }

  // Download replacements
  for (const [filename, url] of Object.entries(replacements)) {
    const filepath = path.join(PUBLIC_DIR, filename);
    process.stdout.write(`  ${filename}... `);
    try {
      await downloadImage(url, filepath);
      const size = fs.statSync(filepath).size;
      console.log(`OK (${Math.round(size/1024)}KB)`);
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
    }
  }

  console.log('\nDone! Listing all images:');
  const files = fs.readdirSync(PUBLIC_DIR);
  console.log(`Total: ${files.length} images in public/images/`);
  process.exit(0);
}

run().catch(console.error);
