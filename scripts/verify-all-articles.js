const fs = require('fs');
const path = require('path');

const artFile = path.resolve(__dirname, '../apps/web/src/lib/articles.ts');
let code = fs.readFileSync(artFile, 'utf8');

// Strip TS types
code = code.replace(/export interface Article[\s\S]*?export const ARTICLES: Article\[\] =/, 'module.exports =');
fs.writeFileSync(path.resolve(__dirname, 'temp-articles-eval.js'), code, 'utf8');

const articles = require('./temp-articles-eval.js');
console.log(`\n========================================`);
console.log(`TOTAL ARTICLES IN CATALOG: ${articles.length}`);
console.log(`========================================\n`);

let allValid = true;

articles.forEach((a, idx) => {
  let text = a.title + ' ' + a.description;
  let inArticleImages = [];
  
  for (const s of a.sections) {
    text += ' ' + s.heading;
    for (const p of s.paragraphs) {
      text += ' ' + p;
    }
    if (s.image && s.image.src) {
      inArticleImages.push(s.image.src);
    }
  }

  const wordCount = text.trim().split(/\s+/).length;
  const featuredSrc = (a.featuredImage && a.featuredImage.src) || a.heroImage;
  const heroPath = path.resolve(__dirname, '../apps/web/public', (featuredSrc || '').replace(/^\//, ''));
  const heroExists = fs.existsSync(heroPath);

  const imagesExist = inArticleImages.map(img => {
    const p = path.resolve(__dirname, '../apps/web/public', img.replace(/^\//, ''));
    return fs.existsSync(p);
  });

  const passedWordCount = wordCount >= 1400 && wordCount <= 2000;
  const passedHero = heroExists && !!featuredSrc;
  const passedDiagrams = inArticleImages.length >= 2 && imagesExist.every(Boolean);

  console.log(`Article ${idx + 1}: ${a.slug}`);
  console.log(`  - Word count: ${wordCount} ${passedWordCount ? '✅' : '❌ (must be 1400-2000)'}`);
  console.log(`  - Featured Image: ${featuredSrc} (${heroExists ? '✅ exists' : '❌ missing'})`);
  console.log(`  - In-Article Images: ${inArticleImages.length} diagrams (${passedDiagrams ? '✅ all exist' : '❌ issue'})`);
  console.log(`  - Editorial Status: ${a.editorialStatus}`);

  if (!passedWordCount || !passedHero || !passedDiagrams) {
    allValid = false;
  }
});

fs.unlinkSync(path.resolve(__dirname, 'temp-articles-eval.js'));

if (!allValid) {
  console.error('\n❌ Verification FAILED for one or more articles.');
  process.exit(1);
} else {
  console.log('\n✅ All articles fully verified and compliant with Editorial Quality Rules.');
}
