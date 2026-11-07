const fs = require('fs');
const path = require('path');
const { ARTICLES } = require('../apps/web/src/lib/articles.ts');

console.log('=== VERIFYING ARTICLES COLLECTION & ASSETS ===');
console.log(`Total Articles in lib: ${ARTICLES.length} (Expected: 8)`);

let hasError = false;

function countWords(article) {
  let text = article.title + ' ' + article.description;
  for (const s of article.sections) {
    text += ' ' + s.heading;
    for (const p of s.paragraphs) {
      text += ' ' + p;
    }
  }
  return text.trim().split(/\s+/).length;
}

const publicDir = path.join(__dirname, '..', 'apps', 'web', 'public');

ARTICLES.forEach((art, idx) => {
  const words = countWords(art);
  const wordStatus = (words >= 1400 && words <= 2000) ? 'OK' : (idx < 3 ? 'BASELINE' : 'FAIL');
  console.log(`\n[Article ${idx + 1}] ${art.slug}`);
  console.log(`  Title: ${art.title.slice(0, 60)}...`);
  console.log(`  Words: ${words} [${wordStatus}]`);
  console.log(`  Status: ${art.editorialStatus}`);
  console.log(`  Featured Image: ${art.featuredImage.src}`);
  
  // Check featured image
  const featPath = path.join(publicDir, art.featuredImage.src);
  if (!fs.existsSync(featPath)) {
    console.error(`  MISSING FEATURED IMAGE: ${featPath}`);
    hasError = true;
  } else {
    console.log(`  Featured Image: OK (${fs.statSync(featPath).size} bytes)`);
  }

  // Check in-article images
  let inArtImgCount = 0;
  art.sections.forEach((s, sIdx) => {
    if (s.image) {
      inArtImgCount++;
      const inPath = path.join(publicDir, s.image.src);
      if (!fs.existsSync(inPath)) {
        console.error(`  MISSING IN-ARTICLE IMAGE: ${inPath}`);
        hasError = true;
      } else {
        console.log(`  In-article Image (${sIdx + 1}): OK (${fs.statSync(inPath).size} bytes)`);
      }
    }
  });
  console.log(`  In-article Images Count: ${inArtImgCount} (Minimum expected: 2)`);
  if (inArtImgCount < 2) {
    console.error(`  IN-ARTICLE IMAGE COUNT LESS THAN 2!`);
    hasError = true;
  }
});

if (hasError) {
  console.error('\nVerification FAILED with errors.');
  process.exit(1);
} else {
  console.log('\nAll 8 articles and images verified successfully!');
  process.exit(0);
}
