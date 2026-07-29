# KHAN | Sniper Pro — Trial бүртгэлийн систем (Setup заавар)

Энэ систем 3 хэсэгтэй:
1. **KhanSniperPro_Signup.html** — хэрэглэгч бөглөх форм
2. **KhanSniperPro_AppsScript.gs** — формыг Google Sheet-д бичих backend
3. **Google Sheet** — бүртгэл хадгалагдаж, trial дуусах огноо автомат бодогдоно

---

## АЛХАМ 1 — Google Sheet + Apps Script тохируулах

1. [sheets.new](https://sheets.new) дээр шинэ Google Sheet үүсгэ. Нэр: `KhanSniperPro Signups`.
2. Дээд меню → **Extensions → Apps Script**.
3. Нээгдсэн `Code.gs` доторх бүх кодыг устгаад, **KhanSniperPro_AppsScript.gs**-ийн агуулгыг бүтнээр нь хуулж тавь.
4. (Сонголт) `NOTIFY_EMAIL = ""` хэсэгт өөрийн и-мэйлээ бичвэл шинэ бүртгэл ирэх бүрт мэдэгдэл ирнэ.
5. **Save** (💾) дар.

### Deploy хийх (URL авах)
6. Баруун дээд → **Deploy → New deployment**.
7. ⚙️ (Select type) → **Web app**.
8. Тохиргоо:
   - **Execute as:** `Me` (өөрийн аккаунт)
   - **Who has access:** `Anyone`  ← ЗААВАЛ. Үгүй бол форм ажиллахгүй.
9. **Deploy** → эрх асуувал зөвшөөр (Authorize → өөрийн аккаунт → Advanced → Go to project → Allow).
10. Гарч ирэх **Web app URL**-ийг хуулж ав. Иймэрхүү харагдана:
    `https://script.google.com/macros/s/AKfy....../exec`

> Код өөрчилбөл дахин **Deploy → Manage deployments → Edit → New version** хийх ёстойг санаарай.

---

## АЛХАМ 2 — HTML формд URL залгах

1. **KhanSniperPro_Signup.html** файлыг нээ.
2. Доод талын `<script>` дотроос:
   ```js
   const ENDPOINT = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";
   const USE_NO_CORS = true;
   ```
   `ENDPOINT`-д Алхам 1-д авсан Web app URL-ээ тавь. `USE_NO_CORS` нь Apps Script-д **true** хэвээр.
3. Хадгал. Болоо — форм бэлэн.

### Туршиж үзэх
- HTML файлыг хөтөч дээр нээ (давхар click) → форм бөглө → илгээ.
- Google Sheet рүү буцаж ороход шинэ мөр нэмэгдсэн байх ёстой (Trial дуусах огноо +7 хоногтой).

---

## АЛХАМ 3 — Формыг нийтлэх (hosting)

`signup.html` нь KhanStructureLandingPage repo дотор байгаа бөгөөд энэ repo нь
`CNAME = khanstructure.com`-той, **GitHub Pages**-ээр deploy хийгддэг. Netlify хэрэггүй.

1. Өөрчлөлтийг commit + push хий:
   ```
   git add signup.html index.html KhanSniperPro_AppsScript.gs KhanSniperPro_Signup_SETUP.md
   git commit -m "Add 7-day trial signup page + CTA links"
   git push
   ```
2. 1-2 минутын дараа форм автоматаар амьд болно:
   ```
   https://khanstructure.com/signup.html
   ```

Энэ линкийг Telegram, Facebook, bio-д тавина. Landing page-ийн hero болон
nav дахь **"7 хоног үнэгүй турших"** товч мөн энэ хуудас руу холбогдсон.

---

## ГАР АЖИЛЛАГААНЫ WORKFLOW (өдөр тутам)

TradingView-д автомат trial байхгүй тул дараах урсгалаар гараар хийнэ:

```
1. Шинэ бүртгэл ирнэ        →  Sheet-д мөр нэмэгдэнэ (+ и-мэйл мэдэгдэл)
2. TV username-ийг шалга    →  буруу/хоосон бол холбоо барина
3. TradingView дээр хандалт өг:
   Indicator → Manage access → Add user → username → "Until: +7 хоног"
4. Sheet-д "Хандалтын төлөв" = "Идэвхтэй" болго
5. Хэрэглэгчид мэдэгд (Telegram/имэйл)
6. 7 дахь өдөр:
   • Төлсөн   → хандалтыг сунга, "Төлсөн эсэх" = "Тийм"
   • Төлөөгүй → Manage access-аас username-ийг ХАС
```

### Trial дуусах өдрийг автомат тодруулах (Sheet дотор)
1. Sheet → header мөрийн дараах хоосон баганад (ж: L багана) дараах **conditional formatting** тавь:
   - Range: `I2:I` (Trial дуусах багана)
   - Rule: **Custom formula** → `=AND($I2<>"", $I2<=TODAY()+1)`
   - Format: улаан дэвсгэр.
2. Ингэснээр **маргааш/өнөөдөр дуусах** trial-ууд улаанаар тодрох тул хэн дуусч буйг шууд харна.

> TradingView дээр "Until date" сонгож болдог тул хандалт өгөхдөө шууд 7 хоногийн дараах огноо тавьвал хугацаа дуусахад автоматаар хаагдана — гар ажиллагаа бүр ч багасна. Гэхдээ Sheet-ийн тодруулга нь "хэн төлж сунгах вэ" гэдгийг хянахад тустай.

---

## Formspree (хялбар хувилбар — код хүсэхгүй бол)

Google Sheet оронд хурдан шийдэл хүсвэл:
1. [formspree.io](https://formspree.io) дээр бүртгүүлж шинэ форм үүсгэ → endpoint URL ав.
2. HTML дотор:
   ```js
   const ENDPOINT = "https://formspree.io/f/ТАНЫ_ID";
   const USE_NO_CORS = false;   // Formspree CORS-ийг зөв зохицуулна
   ```
3. Бүртгэл бүр **и-мэйлээр** ирнэ (Sheet-д автомат орохгүй — гараар хөтлөнө).

> Trial огноо автомат бодогдох, нэг дор хянах хэрэгтэй бол **Google Sheet хувилбарыг** сонго.
