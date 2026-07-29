# Scroll Snap Storytelling Pattern

Spotify Wrapped, Apple Keynote-тэй төстэй — дэлгэц бүтэн дүүрсэн хэсгүүдийг нэг нэгээр "хуудас шиг" гүйлгэдэг загвар.

---

## Үндсэн 5 техник

### 1. Full-screen scroll snap

```css
/* Wrapper — гүйлгэлт эндээс */
#wrap {
  height: 100dvh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;  /* шаардлагатай */
  -webkit-overflow-scrolling: touch;
}
#wrap::-webkit-scrollbar { display: none; }

/* Тус бүр дэлгэц дүүрнэ */
.slide {
  height: 100dvh;
  scroll-snap-align: start;       /* энд "зогсоно" */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Яагаад `100dvh`?** — `100vh` нь гар утасны browser-ийн address bar-ийг оролцуулдаг тул агуулга огтлогдоно. `dvh` (dynamic viewport height) нь зөв.

---

### 2. Reveal on scroll — IntersectionObserver

Хэсэг дэлгэцэнд орох үед элементүүд animate хийгдэнэ.

```css
/* Анхны байдал — нуугдсан */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity .6s cubic-bezier(.16,1,.3,1),
              transform .6s cubic-bezier(.16,1,.3,1);
}
/* JS .in нэмэхэд — харагдана */
.reveal.in {
  opacity: 1;
  transform: none;
}
```

```javascript
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.done) {
      entry.target.dataset.done = '1';   // зөвхөн нэг удаа
      trigger(entry.target);
    }
  });
}, { root: wrap, threshold: 0.42 });    // 42% харагдахад дэлгэх

slides.forEach(s => io.observe(s));
```

**Стagger эффект** — элемент бүрт `transition-delay` нэмнэ:
```html
<p class="reveal" style="transition-delay: 0s">Эхлэл</p>
<p class="reveal" style="transition-delay: .15s">Дараах</p>
<p class="reveal" style="transition-delay: .3s">Сүүлийн</p>
```

---

### 3. Count-up number animation

```javascript
function countUp(el, target, decimals = 0) {
  const duration = 1400;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);  // cubic ease-out
    const value = target * eased;
    el.textContent = decimals
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
```

HTML дээр `data-target` attribute-аар утгыг дамжуулна:
```html
<span class="bignum count" data-target="158">0</span>
<span class="bignum count" data-target="2.7" data-dec="1">0</span>
```

```javascript
function trigger(section) {
  section.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  section.querySelectorAll('[data-target]').forEach(el => {
    const t = parseFloat(el.dataset.target);
    const dec = el.dataset.dec ? parseInt(el.dataset.dec) : 0;
    countUp(el, t, dec);
  });
}
```

---

### 4. Radial gradient background — хэсэг бүрийн өнгөн дүр

```css
.s1 { background: radial-gradient(ellipse at 42% 52%, #1e1b4b 0%, #050016 72%); }
.s2 { background: radial-gradient(ellipse at 58% 42%, #064e3b 0%, #001a12 72%); }
.s3 { background: radial-gradient(ellipse at 50% 58%, #92400e 0%, #1a0800 72%); }
```

**Зөвлөмж:** Гол өнгийг 30–40% saturation-тай харанхуй хувилбарыг ашиглана. `radial-gradient` нь center-т тод, захад харанхуй болдог тул depth мэдрэмж өгнө.

**Floating blob** — ambient гэрэл шиг харагдах анимейшн:
```css
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(88px);
  pointer-events: none;
  animation: float 8s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { opacity: .35; transform: scale(1) translate(0, 0); }
  50%       { opacity: .55; transform: scale(1.2) translate(-4%, 6%); }
}
```

```html
<div class="blob" style="width:500px;height:500px;background:#7c3aed;opacity:.22;top:-12%;left:-12%"></div>
```

---

### 5. Progress bar + Navigation dots

```css
/* Дээд хэсгийн progress */
#prog {
  position: fixed; top: 0; left: 0;
  height: 3px; width: 0; z-index: 100;
  background: linear-gradient(90deg, #a78bfa, #e879f9);
  pointer-events: none;
}

/* Баруун талын цэгүүд */
#dots {
  position: fixed; right: 14px; top: 50%;
  transform: translateY(-50%);
  display: flex; flex-direction: column; gap: 10px;
}
.dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: rgba(255,255,255,.25);
  border: none; cursor: pointer;
  transition: .25s;
}
.dot.a { background: #fff; transform: scale(1.4); } /* идэвхтэй */
```

```javascript
function onScroll() {
  const st = wrap.scrollTop;
  const sh = wrap.scrollHeight - wrap.clientHeight;
  prog.style.width = (sh > 0 ? st / sh * 100 : 0) + '%';

  const idx = Math.round(st / wrap.clientHeight);
  dots.forEach((d, i) => d.classList.toggle('a', i === idx));
}
wrap.addEventListener('scroll', onScroll, { passive: true });

// Товч дарахад шилжих
dots.forEach(d => d.addEventListener('click', () => {
  wrap.scrollTo({ top: parseInt(d.dataset.i) * wrap.clientHeight, behavior: 'smooth' });
}));

// Гарын товч
document.addEventListener('keydown', e => {
  const cur = Math.round(wrap.scrollTop / wrap.clientHeight);
  if (e.key === 'ArrowDown') wrap.scrollTo({ top: (cur+1) * wrap.clientHeight, behavior: 'smooth' });
  if (e.key === 'ArrowUp')   wrap.scrollTo({ top: (cur-1) * wrap.clientHeight, behavior: 'smooth' });
});
```

---

## Бүтэн загвар (HTML хэлбэр)

```html
<!doctype html>
<html lang="mn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Та нэр</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; background: #000; color: #fff;
  font-family: "Segoe UI", system-ui, sans-serif; }

#wrap { height: 100dvh; overflow-y: scroll; scroll-snap-type: y mandatory; }
#wrap::-webkit-scrollbar { display: none; }

.slide { height: 100dvh; scroll-snap-align: start;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; padding: 40px 28px; }

.s-inner { position: relative; z-index: 2;
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; text-align: center; max-width: 700px; width: 100%; }

.reveal { opacity: 0; transform: translateY(20px);
  transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1); }
.reveal.in { opacity: 1; transform: none; }

.bignum { font-size: clamp(96px, 22vw, 210px); font-weight: 900;
  line-height: .82; letter-spacing: -.04em; }

#prog { position: fixed; top: 0; left: 0; height: 3px; width: 0;
  background: linear-gradient(90deg, #a78bfa, #e879f9); z-index: 100; pointer-events: none; }
</style>
</head>
<body>
<div id="prog"></div>

<div id="wrap">
  <section class="slide" style="background: radial-gradient(ellipse at 50% 60%, #1c0a3f, #09090b)">
    <div class="s-inner">
      <h1 class="bignum reveal" style="color: #c084fc">KHANSTRUCTURE</h1>
      <p class="reveal" style="transition-delay:.15s; color: rgba(255,255,255,.5)">Таны слоган энд</p>
    </div>
  </section>

  <section class="slide" style="background: radial-gradient(ellipse at 42% 52%, #1e1b4b, #050016)">
    <div class="s-inner">
      <p style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.4)" class="reveal">Статистик нэр</p>
      <span class="bignum count reveal" data-target="158" style="color:#a5b4fc;transition-delay:.1s">0</span>
      <p class="reveal" style="transition-delay:.2s; font-size: 28px; font-weight: 700">Тайлбар текст</p>
    </div>
  </section>
</div>

<script>
const wrap = document.getElementById('wrap');
const prog = document.getElementById('prog');
const slides = Array.from(document.querySelectorAll('.slide'));

function countUp(el, target, dec = 0) {
  const dur = 1400, start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = dec ? (target * e).toFixed(dec) : Math.round(target * e).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function trigger(s) {
  s.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  s.querySelectorAll('[data-target]').forEach(el =>
    countUp(el, parseFloat(el.dataset.target), el.dataset.dec ? +el.dataset.dec : 0));
}

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.dataset.done) {
      e.target.dataset.done = '1';
      trigger(e.target);
    }
  });
}, { root: wrap, threshold: 0.42 });

slides.forEach(s => io.observe(s));

wrap.addEventListener('scroll', () => {
  const p = wrap.scrollTop / (wrap.scrollHeight - wrap.clientHeight);
  prog.style.width = (p * 100) + '%';
}, { passive: true });

trigger(slides[0]);
</script>
</body>
</html>
```

---

## Хэсэг бүрийн ойлгомжтой бүтэц

```
Нүүр хуудас     → Нэр, слоган, ↓ дохио
Статистик 1      → Том дугаар + тайлбар нэг өгүүлбэр
Статистик 2      → Том дугаар + timeline / диаграм
...
Дүгнэлт хуудас  → 3×3 grid бүх тоонуудыг нэгтгэн
```

## Khanstructure сайтад хэрэглэх зөвлөмж

- **Өнгөн дүр**: Тус бүр хэсэгт өөр өнгийн `radial-gradient` өг — уншигч "шинэ хэсэгт орлоо" гэж мэдрэнэ
- **Нэг хэсэг = нэг санаа**: Хэт их текст биш, нэг том тоо + нэг өгүүлбэр тайлбар
- **`clamp()`**: `font-size: clamp(72px, 18vw, 160px)` — гар утас, дэлгэц хоёуланд автоматаар тохирно
- **Эхний хэсэг**: `trigger(slides[0])` — хуудас нээгдэхэд шууд animate хийнэ (scroll хүлээхгүй)
- **Self-contained**: Гадны CDN ашиглахгүй бол офлайн ч ажиллана
