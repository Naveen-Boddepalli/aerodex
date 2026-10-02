// Shared layout engine: ONE slide spec -> (a) editable .pptx with native shapes (pptxgenjs)
// and (b) an absolutely-positioned HTML page that Chrome prints to PDF. Geometry is in inches
// on a 13.333 x 7.5 canvas, font sizes in points, so both outputs lay out identically.
const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs'); // npm install in this folder first

const W = 13.333, H = 7.5;
const LH = 1.15; // natural line height factor for Arial / Times New Roman

// ---------- inline markup: **bold**  ~~italic~~  {{HEX|coloured}}  [[url|label]] ----------
function parse(s, st = {}) {
  const out = [];
  const re = /\*\*(.+?)\*\*|~~(.+?)~~|\{\{([0-9A-Fa-f]{6})\|(.+?)\}\}|\[\[(.+?)\|(.+?)\]\]/s;
  while (s.length) {
    const m = re.exec(s);
    if (!m) { out.push({ t: s, ...st }); break; }
    if (m.index > 0) out.push({ t: s.slice(0, m.index), ...st });
    if (m[1] !== undefined) out.push(...parse(m[1], { ...st, b: true }));
    else if (m[2] !== undefined) out.push(...parse(m[2], { ...st, i: true }));
    else if (m[3] !== undefined) out.push(...parse(m[4], { ...st, c: m[3] }));
    else out.push({ t: m[6], ...st, link: m[5], u: true, c: st.linkc || '0070C0' });
    s = s.slice(m.index + m[0].length);
  }
  return out;
}

// ---------- element constructors ----------
const rect = (x, y, w, h, o = {}) => ({ k: 'rect', x, y, w, h, ...o });
const ellipse = (x, y, w, h, o = {}) => ({ k: 'ell', x, y, w, h, ...o });
const line = (x1, y1, x2, y2, o = {}) => ({ k: 'line', x1, y1, x2, y2, ...o });
const img = (file, x, y, w, h, o = {}) => ({ k: 'img', file, x, y, w, h, ...o });
// text(x,y,w,h, paras, opts): paras = string | [string | {s, ...paraOpts}]
function text(x, y, w, h, paras, o = {}) {
  if (!Array.isArray(paras)) paras = [paras];
  return { k: 'txt', x, y, w, h, paras: paras.map(p => (typeof p === 'string' ? { s: p } : p)), ...o };
}

// ---------- PPTX emitter ----------
function emitPptx(deck, outFile, meta) {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = meta.title; pres.author = meta.author; pres.company = meta.company; pres.subject = meta.subject;
  const T = pres.ShapeType;
  for (const s of deck) {
    const sl = pres.addSlide();
    sl.background = { color: s.bg || 'FFFFFF' };
    for (const e of s.els) {
      if (e.k === 'rect' || e.k === 'ell') {
        const o = { x: e.x, y: e.y, w: e.w, h: e.h };
        o.fill = e.fill ? { color: e.fill, transparency: e.alpha != null ? Math.round((1 - e.alpha) * 100) : 0 } : { type: 'none' };
        o.line = e.line ? { color: e.line, width: e.lw || 1, dashType: e.dash || 'solid' } : { type: 'none' };
        if (e.shadow) o.shadow = { type: 'outer', color: '000000', opacity: 0.14, blur: 6, offset: 2, angle: 90 };
        let shape = e.k === 'ell' ? T.ellipse : T.rect;
        if (e.k === 'rect' && e.r) { shape = T.roundRect; o.rectRadius = e.r; }
        sl.addShape(shape, o);
      } else if (e.k === 'line') {
        const x = Math.min(e.x1, e.x2), y = Math.min(e.y1, e.y2);
        const o = { x, y, w: Math.abs(e.x2 - e.x1), h: Math.abs(e.y2 - e.y1),
          line: { color: e.c || '5A6878', width: e.w || 1.25, dashType: e.dash || 'solid', endArrowType: e.arrow ? 'triangle' : undefined } };
        if ((e.y2 < e.y1) !== (e.x2 < e.x1)) o.flipV = true;
        if (e.x2 < e.x1 && e.y2 === e.y1) o.flipH = true;
        sl.addShape(T.line, o);
      } else if (e.k === 'img') {
        sl.addImage({ path: e.file, x: e.x, y: e.y, w: e.w, h: e.h, altText: e.alt || '' });
      } else if (e.k === 'txt') {
        const runs = [];
        e.paras.forEach((p, pi) => {
          const base = { c: p.c || e.c || '1B2733', b: !!(p.b ?? e.b), i: !!(p.i ?? e.i), linkc: p.linkc };
          const rs = parse(p.s, base);
          const sz = p.sz || e.sz || 12, face = p.f || e.f || 'Arial';
          const bullet = p.bul ?? e.bul;
          rs.forEach((r, ri) => {
            const o = { fontFace: face, fontSize: sz, bold: !!r.b, italic: !!r.i, color: r.c || base.c,
              align: p.al || e.al || 'left', paraSpaceAfter: p.sa ?? e.sa ?? 0, paraSpaceBefore: p.sb ?? 0,
              lineSpacingMultiple: p.lh || e.lh || 1 };
            if (bullet) o.bullet = { indent: p.ind || e.ind || 12 };
            if (r.link) { o.hyperlink = { url: r.link }; o.underline = { style: 'sng' }; }
            if (ri === rs.length - 1 && pi < e.paras.length - 1) o.breakLine = true;
            runs.push({ text: r.t, options: o });
          });
        });
        const o = { x: e.x, y: e.y, w: e.w, h: e.h, margin: 0, valign: { t: 'top', m: 'middle', b: 'bottom' }[e.va || 't'],
          isTextBox: true, wrap: !e.nw, fit: 'none' };
        if (e.fill) o.fill = { color: e.fill };
        sl.addText(runs, o);
      }
    }
    if (s.notes) sl.addNotes(s.notes);
  }
  return pres.writeFile({ fileName: outFile });
}

// ---------- HTML emitter (Chrome -> PDF) ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const px = v => (v * 96).toFixed(2) + 'px';
function runsHtml(rs) {
  return rs.map(r => {
    const st = [`color:#${r.c}`];
    if (r.b) st.push('font-weight:700');
    if (r.i) st.push('font-style:italic');
    const inner = `<span style="${st.join(';')}">${esc(r.t).replace(/ {2}/g, ' &nbsp;')}</span>`;
    return r.link ? `<a href="${esc(r.link)}" style="text-decoration:underline;color:#${r.c}">${inner}</a>` : inner;
  }).join('');
}
function emitHtml(deck, outFile, meta) {
  const css = `
  @page { size: 13.333in 7.5in; margin: 0 }
  * { box-sizing: border-box; margin: 0; padding: 0 }
  html, body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact }
  body { font-family: Arial, 'Helvetica Neue', sans-serif }
  .slide { position: relative; width: 13.333in; height: 7.5in; overflow: hidden; page-break-after: always; break-after: page }
  .slide:last-child { page-break-after: auto; break-after: auto }
  .e { position: absolute }
  .tx { display: flex; flex-direction: column; overflow: visible }
  .tx p { position: relative }
  .tx p.b::before { content: '\\2022'; position: absolute; left: 0 }
  .tx p:last-child { margin-bottom: 0 !important }
  a { text-decoration: none }
  `;
  let body = '';
  deck.forEach((s, si) => {
    let h = `<section class="slide" data-n="${si + 1}" style="background:#${s.bg || 'FFFFFF'}">`;
    let svg = '';
    for (const e of s.els) {
      if (e.k === 'rect' || e.k === 'ell') {
        const st = [`left:${px(e.x)}`, `top:${px(e.y)}`, `width:${px(e.w)}`, `height:${px(e.h)}`];
        if (e.fill) st.push(`background:${e.alpha != null ? `rgba(${[0, 2, 4].map(i => parseInt(e.fill.slice(i, i + 2), 16)).join(',')},${e.alpha})` : '#' + e.fill}`);
        if (e.line) st.push(`border:${((e.lw || 1) / 72 * 96).toFixed(2)}px ${e.dash === 'dash' ? 'dashed' : 'solid'} #${e.line}`);
        if (e.k === 'ell') st.push('border-radius:50%'); else if (e.r) st.push(`border-radius:${px(e.r)}`);
        if (e.shadow) st.push('box-shadow:0 2px 6px rgba(0,0,0,.14)');
        h += `<div class="e" style="${st.join(';')}"></div>`;
      } else if (e.k === 'line') {
        const wpt = ((e.w || 1.25) / 72 * 96);
        svg += `<line x1="${px(e.x1)}" y1="${px(e.y1)}" x2="${px(e.x2)}" y2="${px(e.y2)}" stroke="#${e.c || '5A6878'}" stroke-width="${wpt}" ${e.dash === 'dash' ? `stroke-dasharray="${wpt * 3} ${wpt * 2}"` : ''} ${e.arrow ? `marker-end="url(#ar${e.c || '5A6878'})"` : ''}/>`;
      } else if (e.k === 'img') {
        h += `<img class="e" src="${esc(path.resolve(e.file))}" style="left:${px(e.x)};top:${px(e.y)};width:${px(e.w)};height:${px(e.h)}" alt="">`;
      } else if (e.k === 'txt') {
        const st = [`left:${px(e.x)}`, `top:${px(e.y)}`, `width:${px(e.w)}`, `height:${px(e.h)}`,
          `justify-content:${{ t: 'flex-start', m: 'center', b: 'flex-end' }[e.va || 't']}`];
        if (e.fill) st.push(`background:#${e.fill}`);
        if (e.nw) st.push('white-space:nowrap');
        let inner = '';
        e.paras.forEach(p => {
          const base = { c: p.c || e.c || '1B2733', b: !!(p.b ?? e.b), i: !!(p.i ?? e.i), linkc: p.linkc };
          const sz = p.sz || e.sz || 12, face = p.f || e.f || 'Arial';
          const bullet = p.bul ?? e.bul, ind = p.ind || e.ind || 12;
          const ps = [`font-family:'${face}',serif`, `font-size:${sz}pt`, `line-height:${(LH * (p.lh || e.lh || 1)).toFixed(3)}`,
            `text-align:${{ left: 'left', center: 'center', right: 'right' }[p.al || e.al || 'left']}`,
            `margin-bottom:${p.sa ?? e.sa ?? 0}pt`, `margin-top:${p.sb ?? 0}pt`];
          if (bullet) ps.push(`padding-left:${ind}pt`);
          inner += `<p class="${bullet ? 'b' : ''}" style="${ps.join(';')}">${runsHtml(parse(p.s, base)) || '&nbsp;'}</p>`;
        });
        h += `<div class="e tx" data-q="1" style="${st.join(';')}">${inner}</div>`;
      }
    }
    const defs = `<defs>${[...new Set([...svg.matchAll(/marker-end="url\(#ar([0-9A-F]{6})\)"/g)].map(m => m[1]))]
      .map(c => `<marker id="ar${c}" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#${c}"/></marker>`).join('')}</defs>`;
    if (svg) h += `<svg class="e" style="left:0;top:0" width="${px(W)}" height="${px(H)}" viewBox="0 0 ${W * 96} ${H * 96}" xmlns="http://www.w3.org/2000/svg">${defs}${svg.replace(/([xy][12]|width|height)="([\d.]+)px"/g, '$1="$2"')}</svg>`;
    body += h + '</section>';
  });
  const qa = `<script>
    if (location.search.includes('qa=1')) window.addEventListener('load', () => {
      const bad = [];
      document.querySelectorAll('.tx').forEach(el => {
        const over = el.scrollHeight - el.clientHeight > 2 || (el.style.whiteSpace === 'nowrap' && el.scrollWidth - el.clientWidth > 2);
        if (over) { el.style.outline = '2px solid red'; bad.push('slide ' + el.closest('.slide').dataset.n + ': ' + el.textContent.trim().slice(0, 50) + ' (' + el.scrollHeight + '>' + el.clientHeight + ')'); }
      });
      const pre = document.createElement('pre'); pre.id = 'qa'; pre.textContent = 'QA_OVERFLOW_COUNT=' + bad.length + '\\n' + bad.join('\\n');
      document.body.appendChild(pre);
    });
  </script>`;
  fs.writeFileSync(outFile, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(meta.title)}</title><style>${css}</style></head><body>${body}${qa}</body></html>`);
}

module.exports = { W, H, parse, rect, ellipse, line, img, text, emitPptx, emitHtml };
