const fs = require('fs');
const path = require('path');
const https = require('https');

const PUBLIC_DIR = path.join(__dirname, 'public', 'images');

// All unique unsplash URLs found across the codebase, keyed by local filename
const images = {
  // HeroSlider.tsx - Hero backgrounds (large)
  'hero_varanasi.jpg': 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=2200&q=80',
  'hero_rajasthan.jpg': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=2200&q=80',
  'hero_himalayas.jpg': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=2200&q=80',
  'hero_kerala.jpg': 'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=2200&q=80',
  'hero_tajmahal.jpg': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=2200&q=80',

  // HeroSlider.tsx - Side cards (medium)
  'card_ganga_aarti.jpg': 'https://images.unsplash.com/photo-1582283925565-d053709d3bdf?auto=format&fit=crop&w=900&q=80',
  'card_amer_fort.jpg': 'https://images.unsplash.com/photo-1599661502283-a44ea24dfc74?auto=format&fit=crop&w=900&q=80',
  'card_kerala_sm.jpg': 'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=900&q=80',
  'card_himalayas_sm.jpg': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=80',

  // HeroExploreShell.tsx
  'explore_varanasi_bg.jpg': 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1920&q=80',
  'explore_dashashwamedh.jpg': 'https://images.unsplash.com/photo-1621516900609-0d1dc90b6cb9?auto=format&fit=crop&w=900&q=80',
  'explore_assi_ghat.jpg': 'https://images.unsplash.com/photo-1628126235206-5260b9ea6441?auto=format&fit=crop&w=900&q=80',
  'explore_rajasthan_bg.jpg': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1920&q=80',
  'explore_city_palace.jpg': 'https://images.unsplash.com/photo-1615836245337-f5b9b2301f49?auto=format&fit=crop&w=900&q=80',
  'explore_mehrangarh.jpg': 'https://images.unsplash.com/photo-1590050860551-8dfaa6c15b10?auto=format&fit=crop&w=900&q=80',
  'explore_himalayas_bg.jpg': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1920&q=80',
  'explore_spiti.jpg': 'https://images.unsplash.com/photo-1574883584852-6bdde6f3be69?auto=format&fit=crop&w=900&q=80',
  'explore_pangong.jpg': 'https://images.unsplash.com/photo-1577717467651-78924b232753?auto=format&fit=crop&w=900&q=80',
  'explore_kerala_bg.jpg': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1920&q=80',
  'explore_alleppey.jpg': 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=900&q=80',
  'explore_eravikulam.jpg': 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=900&q=80',
  'explore_kochi.jpg': 'https://images.unsplash.com/photo-1621330396167-b3d451b9b83b?auto=format&fit=crop&w=900&q=80',

  // HorizontalScroll.tsx
  'scroll_temple.jpg': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
  'scroll_city.jpg': 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
  'scroll_tajmahal.jpg': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
  'scroll_festival.jpg': 'https://images.unsplash.com/photo-1515091943-9d5c0ad2084c?auto=format&fit=crop&w=1200&q=80',

  // page.tsx (homepage) - background texture
  'bg_texture.jpg': 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&q=80',

  // about/page.tsx
  'about_tajmahal.jpg': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2000&auto=format&fit=crop',
  'team_member1.jpg': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&auto=format&fit=crop',
  'team_member2.jpg': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=400&auto=format&fit=crop',
  'team_member3.jpg': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=400&auto=format&fit=crop',
};

// homepage destination card images from page.tsx
const homepageCardIDs = [
  '1544644181-1484b3fdfc62',  // Varanasi
  '1599661046289-e31897846e41', // Rajasthan
  '1626621341517-bbf3d9990a23', // Himalayas
  '1593693411515-c20261bcad6e', // Kerala
];
homepageCardIDs.forEach((id, i) => {
  const names = ['home_varanasi', 'home_rajasthan', 'home_himalayas', 'home_kerala'];
  images[`${names[i]}.jpg`] = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=400&h=600`;
});

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
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  let success = 0, failed = 0;
  const failures = [];

  for (const [filename, url] of Object.entries(images)) {
    const filepath = path.join(PUBLIC_DIR, filename);
    process.stdout.write(`  ${filename}... `);
    try {
      await downloadImage(url, filepath);
      const size = fs.statSync(filepath).size;
      console.log(`OK (${Math.round(size/1024)}KB)`);
      success++;
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      failures.push(filename);
      failed++;
    }
  }

  console.log(`\n✅ ${success} downloaded, ❌ ${failed} failed`);
  if (failures.length) console.log('Failed:', failures.join(', '));
  process.exit(0);
}

run().catch(console.error);
