// ─── Shared data replacements ──────────────────────────────────────────────────
import * as fs from 'fs';
import * as path from 'path';

const rootDir = 'c:\\Users\\parra\\OneDrive\\Desktop\\naviigo-web\\NaviiGo-Website';

function fixFile(filePath, regex, replacement) {
    const fullPath = path.join(rootDir, filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    const newContent = content.replace(regex, replacement);
    if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Fixed', filePath);
    }
}

// 1. Fix app/itinerary/data.ts - Make it import and use DEST_IMAGES
let dataContent = fs.readFileSync(path.join(rootDir, 'app/itinerary/data.ts'), 'utf8');
if (!dataContent.includes("import { DEST_IMAGES }")) {
    dataContent = "import { DEST_IMAGES } from '@/lib/imageMap';\n" + dataContent;
}
// Replace img: 'https://images.unsplash.com/photo-XXX?auto...' with img: DEST_IMAGES.cityId
dataContent = dataContent.replace(
    /\{ id: '([^']+)', name: '([^']+)', sub: '([^']+)', state: '([^']+)', img: 'https:\/\/images\.unsplash\.com\/photo-[^']+' \}/g,
    "{ id: '$1', name: '$2', sub: '$3', state: '$4', img: DEST_IMAGES['$1'] || DEST_IMAGES.mumbai }"
);
fs.writeFileSync(path.join(rootDir, 'app/itinerary/data.ts'), dataContent);
console.log('Fixed app/itinerary/data.ts');

// 2. Fix app/page.tsx Quick Escapes
fixFile(
    'app/page.tsx', 
    /{ name: '([^']+)', img: 'https:\/\/images\.unsplash\.com\/photo-[^']+' }/g, 
    "{ name: '$1', img: DEST_IMAGES['$1'.toLowerCase()] || DEST_IMAGES.mumbai }"
);
// Fix app/page.tsx hero bg
fixFile(
    'app/page.tsx',
    /bg-\[url\('https:\/\/images\.unsplash\.com\/photo-[^']+'\)\]/g,
    "bg-[url('https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1280&q=80')]"
);

// 3. Fix app/layout.tsx generic images
fixFile(
    'app/layout.tsx',
    /url: 'https:\/\/images\.unsplash\.com\/photo-[^']+'/g,
    "url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1280&q=80'"
);
fixFile(
    'app/layout.tsx',
    /images: \['https:\/\/images\.unsplash\.com\/photo-[^']+'\]/g,
    "images: ['https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1280&q=80']"
);

// 4. Fix HeroExploreShell.tsx
// It has things like primaryImage: '...', image: '...'
fixFile(
    'components/explore/HeroExploreShell.tsx',
    /primaryImage: 'https:\/\/images\.unsplash\.com\/photo-[^']+'/g,
    "primaryImage: DEST_IMAGES.varanasi"
);
fixFile(
    'components/explore/HeroExploreShell.tsx',
    /image: 'https:\/\/images\.unsplash\.com\/photo-[^']+'/g,
    "image: DEST_IMAGES.jaipur"
);

// 5. Fix components/features/home/HeroSlider.tsx
fixFile(
    'components/features/home/HeroSlider.tsx',
    /'https:\/\/images\.unsplash\.com\/photo-[^']+'/g,
    "DEST_IMAGES.jaipur"
);

// 6. Fix HorizontalScroll.tsx
fixFile(
    'components/features/gsap-scroll/HorizontalScroll.tsx',
    /image: "https:\/\/images\.unsplash\.com\/photo-[^']+"/g,
    "image: DEST_IMAGES.varanasi"
);

// 7. Fix dashboard cards
['app/itinerary/upcoming/page.tsx', 'app/itinerary/ongoing/page.tsx', 'app/itinerary/history/page.tsx'].forEach(f => {
    fixFile(f, /image: `https:\/\/images\.unsplash\.com\/photo-[^`]+`/g, "image: DEST_IMAGES.mumbai");
});

console.log('All image refs fixed!');
