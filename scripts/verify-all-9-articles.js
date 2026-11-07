const fs = require('fs');
const path = require('path');
const { ARTICLES } = require('../apps/web/src/lib/articles.ts');

console.log('=== VERIFYING EXACTLY 9 ARTICLES ===');
console.log(`Total Articles in lib: ${ARTICLES.length} (Expected: 9)`);

if (ARTICLES.length !== 9) {
  console.error(`Article count mismatch! Expected 9, got ${ARTICLES.length}`);
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'apps', 'web', 'public');
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

ARTICLES.forEach((art, idx) => {
  const words = countWords(art);
  const wordStatus = (words >= 1400 && words <= 2000) ? 'OK' : 'FAIL';
  console.log(`\n[${idx + 1}/9] ${art.slug}`);
  console.log(`  Title: ${art.title.slice(0, 60)}...`);
  console.log(`  Words: ${words} [${wordStatus}]`);
  console.log(`  Editorial Status: ${art.editorialStatus}`);
  
  if (words < 1400 || words > 2000) {
    console.error(`  WORD COUNT OUT OF BOUNDS: ${words}`);
    hasError = true;
  }

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
  art.sections.forEach((s) => {
    if (s.image) {
      inArtImgCount++;
      const inPath = path.join(publicDir, s.image.src);
      if (!fs.existsSync(inPath)) {
        console.error(`  MISSING IN-ARTICLE IMAGE: ${inPath}`);
        hasError = true;
      }
    }
  });
  console.log(`  In-article Images: ${inArtImgCount} (Minimum: 2)`);
  if (inArtImgCount < 2) {
    console.error(`  LESS THAN 2 IN-ARTICLE IMAGES!`);
    hasError = true;
  }
});

if (hasError) {
  console.error('\nVerification failed.');
  process.exit(1);
} else {
  console.log('\nAll 9 articles fully verified against editorial quality standards!');
  process.exit(0);
}

