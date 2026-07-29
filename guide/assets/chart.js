/* ============================================================
   KHAN SNIPER PRO — candlestick plate renderer

   Each figure in a lesson is declared as data (candles + zones +
   levels + marks + arrows) rather than hand-authored SVG, so the
   geometry can't silently drift away from what the caption claims.

   This engine was byte-identical in four lesson pages; it now lives
   here once. Each page keeps its own SPECS inline (they are page
   content, not shared code) and calls:

       KhanPlate.draw({ 'chart-id': { candles: [...], ... } })

   Colours are read from the CSS custom properties in guide.css, so
   the plates follow the site palette without this file naming a
   single hex value.
   ============================================================ */
(function () {
  /* live declaration — re-reading it always reflects current tokens */
  const CSS = getComputedStyle(document.documentElement);
  const tok = n => CSS.getPropertyValue(n).trim();

  /* Marker ids have to be generated for every colour key a spec might
     reference, since arrows point at url(#ah-<key>). */
  const KEYS = ['ink3', 'blue', 'accent', 'bull', 'bear', 'amber'];

  function palette() {
    const ink    = tok('--ink'),
          ink3   = tok('--ink-3'),
          bull   = tok('--bull'),
          bear   = tok('--bear'),
          accent = tok('--accent'),
          amber  = tok('--amber');
    /* 'blue' is kept as an alias for the accent: the lesson SPECS were
       authored when the accent was draughtsman blue and still say
       color:'blue'. Aliasing here means the palette could move again
       without touching a single spec. */
    return { bull, bear, accent, blue: accent, amber, ink, ink3 };
  }

  function render(svg, spec) {
    const W = spec.w || 700, H = spec.h || 320;
    const padL = 10, padR = spec.padR ?? 104, padT = 22, padB = 30;
    const cs = spec.candles;
    let lo = Infinity, hi = -Infinity;
    cs.forEach(c => { if (c) { hi = Math.max(hi, c[1]); lo = Math.min(lo, c[2]); } });
    (spec.zones || []).forEach(z => { hi = Math.max(hi, z.top); lo = Math.min(lo, z.bot); });
    (spec.levels || []).forEach(l => { hi = Math.max(hi, l.y); lo = Math.min(lo, l.y); });
    const room = (hi - lo) * (spec.yPad ?? 0.14);
    lo -= room; hi += room;

    const n = cs.length;
    const step = (W - padL - padR) / n;
    const cw = Math.min(step * 0.56, 15);
    const X = i => padL + step * (i + 0.5);
    const Y = v => padT + (hi - v) / (hi - lo) * (H - padT - padB);

    const P = palette();
    const { bull, bear } = P;
    const col = k => P[k] || k;
    const mono = tok('--f-mono');
    const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
    let o = '';

    /* zones behind candles */
    (spec.zones || []).forEach(z => {
      const x1 = X(z.from) - step / 2, x2 = X(z.to) + step / 2;
      const c = col(z.color || 'blue');
      o += `<rect x="${x1.toFixed(1)}" y="${Y(z.top).toFixed(1)}" width="${(x2 - x1).toFixed(1)}" height="${(Y(z.bot) - Y(z.top)).toFixed(1)}" fill="${c}" fill-opacity="${z.fill ?? .13}" stroke="${c}" stroke-opacity=".6" stroke-dasharray="${z.dash || '0'}"/>`;
      if (z.ce) {
        const m = (z.top + z.bot) / 2;
        o += `<line x1="${x1.toFixed(1)}" y1="${Y(m).toFixed(1)}" x2="${W - padR + 6}" y2="${Y(m).toFixed(1)}" stroke="${c}" stroke-width="1" stroke-dasharray="2 3" stroke-opacity=".85"/>`;
        o += `<text x="${W - padR + 10}" y="${(Y(m) + 3.6).toFixed(1)}" fill="${c}" font-size="10" font-family="${mono}">CE 50%</text>`;
      }
      if (z.label) {
        o += `<text x="${W - padR + 10}" y="${(Y(z.top) + 10).toFixed(1)}" fill="${c}" font-size="10.5" font-weight="600" font-family="${mono}">${esc(z.label)}</text>`;
      }
    });

    /* horizontal levels */
    (spec.levels || []).forEach(l => {
      const c = col(l.color || 'ink3');
      const x1 = l.from != null ? X(l.from) - step / 2 : padL;
      const x2 = l.to != null ? X(l.to) + step / 2 : W - padR + 4;
      o += `<line x1="${x1.toFixed(1)}" y1="${Y(l.y).toFixed(1)}" x2="${x2.toFixed(1)}" y2="${Y(l.y).toFixed(1)}" stroke="${c}" stroke-width="${l.w || 1}" stroke-dasharray="${l.dash || '4 3'}" stroke-opacity=".9"/>`;
      if (l.label) {
        o += `<text x="${W - padR + 10}" y="${(Y(l.y) + 3.6).toFixed(1)}" fill="${c}" font-size="10.5" font-family="${mono}">${esc(l.label)}</text>`;
      }
    });

    /* candles */
    cs.forEach((c, i) => {
      if (!c) return;
      const [op, hg, lw, cl] = c;
      const up = cl >= op;
      const stroke = up ? bull : bear;
      const x = X(i);
      o += `<line x1="${x.toFixed(1)}" y1="${Y(hg).toFixed(1)}" x2="${x.toFixed(1)}" y2="${Y(lw).toFixed(1)}" stroke="${stroke}" stroke-width="1.2"/>`;
      const top = Y(Math.max(op, cl)), bot = Y(Math.min(op, cl));
      o += `<rect x="${(x - cw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${cw.toFixed(1)}" height="${Math.max(bot - top, 1.4).toFixed(1)}" fill="${up ? bull : bear}" fill-opacity="${up ? .25 : .85}" stroke="${stroke}" stroke-width="1.1"/>`;
    });

    /* markers */
    (spec.marks || []).forEach(m => {
      const c = col(m.color || 'blue');
      const x = X(m.i);
      const cd = cs[m.i];
      const above = m.pos !== 'below';
      const y = above ? Y(cd[1]) - 8 : Y(cd[2]) + 15;
      o += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${c}" font-size="10.5" font-weight="700" text-anchor="middle" font-family="${mono}">${esc(m.text)}</text>`;
    });

    /* arrows (displacement direction etc.) */
    (spec.arrows || []).forEach(a => {
      const c = col(a.color || 'ink3');
      o += `<line x1="${X(a.from).toFixed(1)}" y1="${Y(a.y1).toFixed(1)}" x2="${X(a.to).toFixed(1)}" y2="${Y(a.y2).toFixed(1)}" stroke="${c}" stroke-width="1.3" stroke-opacity=".85" marker-end="url(#ah-${a.color || 'ink3'})"/>`;
      if (a.label) {
        const mx = (X(a.from) + X(a.to)) / 2, my = (Y(a.y1) + Y(a.y2)) / 2;
        o += `<text x="${mx.toFixed(1)}" y="${(my - 6).toFixed(1)}" fill="${c}" font-size="10" text-anchor="middle" font-family="${mono}">${esc(a.label)}</text>`;
      }
    });

    const heads = KEYS.map(k =>
      `<marker id="ah-${k}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${col(k)}"/></marker>`).join('');

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `<defs>${heads}</defs>${o}`;
  }

  /* Draw every <svg data-chart="id"> for which specs has an entry. */
  function draw(specs) {
    document.querySelectorAll('svg[data-chart]').forEach(svg => {
      const s = specs[svg.dataset.chart];
      if (s) render(svg, s);
    });
  }

  window.KhanPlate = { render, draw };
})();
