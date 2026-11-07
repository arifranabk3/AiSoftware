import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const markdownPath = path.resolve('deliverables/products/zero-cost-agency-blueprint/final/zero-cost-autonomous-agency-blueprint-v1.0.md');
const htmlOutputPath = path.resolve('deliverables/products/zero-cost-agency-blueprint/final/zero-cost-autonomous-agency-blueprint-v1.0.html');
const pdfOutputPath = path.resolve('deliverables/products/zero-cost-agency-blueprint/final/zero-cost-autonomous-agency-blueprint-v1.0.pdf');

const markdownContent = fs.readFileSync(markdownPath, 'utf8');

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseMarkdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const htmlLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBuffer: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        htmlLines.push(`<pre><code class="language-${codeBlockLang}">${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        if (inList) {
          htmlLines.push('</ul>');
          inList = false;
        }
        inCodeBlock = true;
        codeBlockLang = line.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
      if (!inList) {
        htmlLines.push('<ul class="checklist">');
        inList = true;
      }
      const isChecked = line.trim().startsWith('- [x]');
      const itemText = line.trim().substring(5).trim();
      htmlLines.push(`<li><input type="checkbox" ${isChecked ? 'checked' : ''} disabled /> ${formatInline(itemText)}</li>`);
      continue;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) {
        htmlLines.push('<ul>');
        inList = true;
      }
      htmlLines.push(`<li>${formatInline(line.trim().substring(2).trim())}</li>`);
      continue;
    }

    if (inList && line.trim() === '') {
      htmlLines.push('</ul>');
      inList = false;
    }

    if (line.startsWith('# ')) {
      const title = line.substring(2).trim();
      htmlLines.push(`<h1 class="page-break-before">${escapeHtml(title)}</h1>`);
      continue;
    }

    if (line.startsWith('## ')) {
      const title = line.substring(3).trim();
      htmlLines.push(`<h2>${escapeHtml(title)}</h2>`);
      continue;
    }

    if (line.startsWith('### ')) {
      const title = line.substring(4).trim();
      htmlLines.push(`<h3>${escapeHtml(title)}</h3>`);
      continue;
    }

    if (line.startsWith('#### ')) {
      const title = line.substring(5).trim();
      htmlLines.push(`<h4>${escapeHtml(title)}</h4>`);
      continue;
    }

    if (line.trim() === '---') {
      htmlLines.push('<hr />');
      continue;
    }

    if (line.trim() === '') {
      continue;
    }

    htmlLines.push(`<p>${formatInline(line.trim())}</p>`);
  }

  if (inList) {
    htmlLines.push('</ul>');
  }

  return htmlLines.join('\n');
}

function formatInline(text: string): string {
  let res = escapeHtml(text);
  res = res.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  res = res.replace(/\*(.+?)\*/g, '<em>$1</em>');
  res = res.replace(/`([^`]+)`/g, '<code>$1</code>');
  return res;
}

const bodyHtml = parseMarkdownToHtml(markdownContent);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Zero-Cost Autonomous Agency Blueprint</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page);
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      font-size: 11pt;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .cover {
      page-break-after: always;
      text-align: center;
      padding-top: 100px;
      padding-bottom: 80px;
    }
    .cover h1 {
      font-size: 28pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 12px;
      border: none;
    }
    .cover .subtitle {
      font-size: 14pt;
      color: #475569;
      margin-bottom: 60px;
    }
    .cover .badge {
      display: inline-block;
      padding: 6px 16px;
      background: #f1f5f9;
      color: #0f172a;
      font-size: 10pt;
      font-weight: 600;
      border-radius: 20px;
      border: 1px solid #cbd5e1;
      margin-bottom: 40px;
    }
    .cover .meta {
      font-size: 10pt;
      color: #64748b;
      margin-top: 80px;
      line-height: 1.8;
    }
    .page-break-before {
      page-break-before: always;
    }
    h1 {
      color: #0f172a;
      font-size: 20pt;
      font-weight: 700;
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
    }
    h2 {
      color: #1e293b;
      font-size: 15pt;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 10px;
    }
    h3 {
      color: #334155;
      font-size: 13pt;
      font-weight: 600;
      margin-top: 18px;
      margin-bottom: 8px;
    }
    h4 {
      color: #475569;
      font-size: 11pt;
      font-weight: 600;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    p {
      margin: 8px 0;
      text-align: justify;
    }
    ul, ol {
      margin: 8px 0;
      padding-left: 24px;
    }
    li {
      margin: 4px 0;
    }
    ul.checklist {
      list-style-type: none;
      padding-left: 0;
    }
    ul.checklist li {
      margin: 6px 0;
    }
    pre {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      font-family: "Courier New", Courier, monospace;
      font-size: 9.5pt;
      line-height: 1.4;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    code {
      font-family: "Courier New", Courier, monospace;
      font-size: 10pt;
      background: #f1f5f9;
      padding: 2px 4px;
      border-radius: 4px;
      color: #0f172a;
    }
    pre code {
      background: transparent;
      padding: 0;
      border-radius: 0;
    }
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 20px 0;
    }
    blockquote {
      border-left: 4px solid #3b82f6;
      background: #eff6ff;
      margin: 12px 0;
      padding: 10px 16px;
      color: #1e3a8a;
    }
  </style>
</head>
<body>
  <div class="cover">
    <div class="badge">PRODUCTION DIGITAL PRODUCT • FIELD EDITION</div>
    <h1>The Zero-Cost Autonomous<br/>Agency Blueprint</h1>
    <div class="subtitle">A Field Guide to Running Multi-Department AI Specialist Teams<br/>with Local LLMs, Fastify & BullMQ</div>
    <div class="meta">
      <strong>Author:</strong> Arif Rana<br/>
      <strong>Publication Date:</strong> November 7, 2026<br/>
      <strong>Version:</strong> 1.0.0 (Release Candidate)<br/>
      <strong>Product ID:</strong> <code>DIG-PROD-01</code><br/>
      <strong>License:</strong> Single-User Commercial License<br/>
      © 2026 Arif Rana. All Rights Reserved.
    </div>
  </div>

  ${bodyHtml}
</body>
</html>
`;

fs.writeFileSync(htmlOutputPath, fullHtml, 'utf8');
console.log('Generated HTML preview at:', htmlOutputPath);

const msedgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

console.log('Printing to PDF via Edge headless...');
const printRes = spawnSync(msedgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${pdfOutputPath}`,
  htmlOutputPath
]);

if (fs.existsSync(pdfOutputPath)) {
  const stats = fs.statSync(pdfOutputPath);
  console.log(`PDF generated successfully: ${pdfOutputPath} (${stats.size} bytes)`);
} else {
  console.error('PDF generation failed. Exit code:', printRes.status);
  console.error('stderr:', printRes.stderr?.toString());
  process.exit(1);
}
