# 🛰️ Signal Console

**A privacy-first encoder, cipher, hash and inspection workbench — 61 tools, running entirely in your browser.**

No uploads. No accounts. No tracking. No build step. Works offline after the first visit.

> ساخته‌شده توسط **RITM Studio** · [@Dahenavati26](https://x.com/@Dahenavadi26) · RITM.FreeLancer@gmail.com

---

## Table of contents

- [What's new in v2](#whats-new-in-v2)
- [The tool set](#the-tool-set)
- [Project layout](#project-layout)
- [Running locally](#running-locally)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [Security model](#security-model)
- [Design notes](#design-notes)
- [فارسی](#فارسی)

---

## What's new in v2

v1 was a single 3 238-line HTML file with 26 tools. v2 is a proper application:

| | v1 | v2 |
|---|---|---|
| Tools | 26 | **61** |
| Structure | one 160 KB HTML file | `index.html` + CSS + 6 JS modules |
| Header | 3 islands, fixed top | 3 islands, **floating bottom bar on mobile** |
| Themes | dark only | dark + light, follows the OS, toggleable |
| Navigation | dropdown only | header nav + filterable dropdown + **⌘K command palette** + hash deep-links |
| Layout | single column | responsive, safe-area aware, print stylesheet |
| Hosting | — | plain static files, deployable anywhere |

### Bugs fixed from v1

1. **`sw.js` / `manifest.json` pointed at a non-existent `index.html`.** The app file was called `deepseek_html_20261002_026fa3.html`, so the PWA never installed and offline mode never worked. The app is now genuinely `index.html`.
2. **`manifest.json` referenced a screenshot that did not exist** — removed.
3. **The ECC panel was a stub.** It printed *"ECDH is a key-exchange algorithm"* and did nothing. It is now a working **ECDSA sign/verify** tool on P-256.
4. **XOR and ChaCha20 silently corrupted non-Latin text.** Both used `charCodeAt()` and truncated every code unit to 8 bits, so Persian, Chinese and emoji were destroyed. Both now operate on real UTF-8 bytes — verified by round-tripping `رمز 世界 🚀 secret`.
5. **ChaCha20 was not ChaCha20.** It XORed against a hex-string keystream derived from `SHA256(key + ':' + counter)` — only 4 bits of entropy per byte and the same keystream reused across messages. It is now a real RFC 8439 ChaCha20 core with a fresh 96-bit nonce per message.
6. **AES used CryptoJS's default OpenSSL KDF** (a single MD5 pass, no salt control). It is now AES-256-CBC with **PBKDF2-HMAC-SHA256 at 50 000 iterations** and a random salt + IV embedded in the output.
7. **RSA could not encrypt more than ~190 bytes** and had no signing. It now chunks long messages across blocks and supports **RSA-OAEP encrypt/decrypt and RSA-PSS sign/verify**, plus PEM import and export.
8. **Affine accepted non-coprime multipliers** and produced unbreakable output silently. It now only offers valid values.
9. **Playfair decryption left padding in the output** and mis-paired repeated letters.
10. **The marketing copy promised Base32/Base58/Base85 and a Hill cipher that did not exist.** They exist now.
11. **A 1.2 MB unused `logo.png`** was shipped in every deploy.
12. **Field IDs collided across panels** (`#in`, `#out`…) which broke event wiring — now namespaced per tool.
13. **The dropdown was never filtered** even though it had a search box.
14. **No duplicate-ID or accessibility pass** — panels now carry `role="region"` and labels, and a skip link was added.

### Bugs fixed in v2 during testing

- Unescaped apostrophe in the DH panel broke the whole cipher module.
- `hash-wasm`'s UMD build has a different API than its docs: `hmac()` doesn't exist (must use `createHMAC()`), `pbkdf2()` needs `hashFunction: createSHA256()`, `bcrypt()` needs an object with an **exact 16-byte salt**, and `scrypt()` uses `costFactor`, not `cost`. All verified against RFC test vectors.
- The Base64 file picker disappeared in Decode mode, and choosing a binary file there read it as text and produced garbage. The direction is now decided from the file itself.

---

## The tool set

**61 tools across 7 categories.** Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> to search them all.

### Encoding & Decoding (14)
Base64 (text, **files, drag & drop, clipboard paste**, URL-safe, image preview) · Base32 · Base58 · Base85/Ascii85 · Hex · Binary · URL encoding · HTML entities · Unicode escapes · Punycode/IDN · Morse (with Persian → Fingilish transliteration and audio playback) · NATO phonetic · Character inspector · ASCII/byte table

### Classical Ciphers (11)
Caesar (with brute force) · ROT13 / ROT5 / ROT18 / ROT47 · A1Z26 · Atbash · Vigenère · Affine · Playfair · Hill (2×2) · Rail Fence · Bacon

### Modern Cryptography (6)
AES-256-CBC + PBKDF2 · ChaCha20 (RFC 8439) · Triple DES · RSA (OAEP + PSS + PEM) · ECDSA P-256 · Diffie–Hellman (ECDH)

### Hashing & Passwords (7)
MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512 / RIPEMD-160 (with compare mode) · HMAC · PBKDF2 · CRC32 · bcrypt / scrypt / Argon2id · TOTP (RFC 6238) · JWT workbench (decode, verify, create)

### Utilities & Generators (17)
UUID v4 + v7 · Password/passphrase generator with entropy meter · Timestamp converter · Number base converter (BigInt, bases 2–36) · Text case · Slugify · Text utilities (sort/dedupe/shuffle/…) · JSON formatter · Regex tester · Text diff · URL parser · Colour converter (WCAG contrast) · IPv4 subnet calculator · QR code generator · Roman numerals · Lorem Ipsum

### Files & Media (6)
gzip / deflate compression · Image steganography (LSB) · File hashing · Image ⇄ data URI · Image converter (resize, JPEG/PNG/WebP)

### Information (1)
About, privacy policy, keyboard shortcuts

---

## Project layout

Everything is at the repository root — no build step, no dependencies, no bundler.

```
.
├── index.html            app shell (header, footer, command palette)
├── manifest.json         PWA manifest
├── sw.js                 service worker (offline support)
├── .nojekyll             tells GitHub Pages not to run Jekyll
├── .gitignore
├── package.json          convenience scripts only (nothing is installed)
├── README.md
└── assets/
    ├── css/app.css       the whole design system
    ├── js/
    │   ├── core.js           registry, router, palette, panel factory, helpers
    │   ├── tools-encoding.js
    │   ├── tools-cipher.js
    │   ├── tools-hash.js
    │   ├── tools-utility.js
    │   ├── tools-media.js
    │   └── boot.js           home/about pages, nav, background, init
    ├── logo.svg
    └── icon-192.png, icon-512.png
```

All asset paths are **relative**, so the app works at a domain root *and* at a
project subpath such as `https://user.github.io/Signal-Console/`.

### How a tool is defined

Tools are **declarative**. Most are ten lines:

```js
Signal.ioTool({
  id: 'base32', name: 'Base32', group: 'Encoding', icon: 'layers',
  desc: 'RFC 4648 Base32 — the alphabet that survives being read aloud.',
  tags: ['base32', 'rfc4648'],
  modes: [['encode', 'Encode'], ['decode', 'Decode']],
  inputs: [{ id: 'in', label: 'Input', ph: 'Hello, world' }],
  output: { id: 'out', label: 'Result' },
  sample: { in: 'Hello, world' },
  run: function (c) {
    if (c.mode === 'encode') return { text: b32encode(S.textToBytes(c.values.in)) };
    return { text: S.bytesToText(b32decode(c.values.in)) };
  }
});
```

The factory generates the markup (header, mode switch, fields, buttons, hint,
copy/save actions), wires every event, debounces live input, handles async
`run()` results, and namespaces all DOM ids automatically. `Signal.customTool()`
is there for the handful of tools that need bespoke UI.

Panels are **built lazily** — only the tool you open is rendered and mounted.

---

## Running locally

No build step, no dependencies.

```bash
# option 1 — open it directly
open index.html

# option 2 — a local server (needed for Web Crypto + the service worker)
npm run serve          # → http://localhost:8080
```

> **Note:** `file://` works for most tools, but RSA/ECDSA/Diffie–Hellman need
> `crypto.subtle`, which browsers only expose on HTTPS or `localhost`.

---

## Deploying to GitHub Pages

The project is already laid out for it: `index.html` sits at the repository
root, every path is relative, and `.nojekyll` is present so GitHub does not run
Jekyll over the files.

### Step 1 — push the repository

```bash
git init
git add .
git commit -m "Signal Console v2"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

> `.gitignore` already excludes the agent's working folder (`.workbuddy-ai/`) and
> editor/OS noise, so only the app itself gets pushed.

### Step 2 — switch Pages on

On GitHub: **Settings → Pages → Build and deployment**

- **Source:** `Deploy from a branch`
- **Branch:** `main` and folder `/ (root)`
- **Save**

Your app appears at:

```
https://<you>.github.io/<repo>/
```

No workflow file, no Actions, no build minutes. The first deploy takes a minute
or two; after that, every `git push` to `main` republishes automatically.

### Step 3 — verify

Open the link, then check that offline mode works: load the page once, then
switch the network off in DevTools and reload. It should still come up — that is
the service worker doing its job.

### Optional — a custom domain

Add a file named `CNAME` at the repository root containing just your domain:

```
signal.example.com
```

Then point a `CNAME` DNS record at `<you>.github.io`. See GitHub's docs for the
full walkthrough.

### Hosting somewhere else?

The whole thing is static, so it also drops straight into Netlify, Vercel,
Cloudflare Pages, S3, or any web server — just serve the repository root.

---

## Security model

- **Everything is local.** No tool transmits its input anywhere. The only
  network requests the page makes are one-time downloads of pinned libraries
  and web fonts — after which the service worker serves them from cache.
- **Content-Security-Policy.** GitHub Pages cannot send HTTP headers, so the CSP
  is declared with a `<meta http-equiv>` tag at the top of `index.html`.
  `script-src` is limited to `'self'` plus the two pinned CDNs, with
  `'wasm-unsafe-eval'` required by hash-wasm. `object-src` and `base-uri` are
  locked down and `connect-src` is `'self'`. (The one directive a meta tag
  cannot enforce is `frame-ancestors` — it is ignored by design.)
- **Passwords.** Never stored, never logged. PBKDF2 runs at 50 000 iterations;
  bcrypt at cost 10; Argon2id at 3 passes / 4 MB.
- **Honest about weaknesses.** MD5, SHA-1 and 3DES are labelled as broken or
  legacy. LSB steganography is labelled as non-survivable and educational.

### One feature was removed for this reason

v2 briefly had a **"What is my IP?"** button in the IPv4 subnet tool, backed by
a tiny serverless endpoint. On a pure static host there is no endpoint to call,
and reaching for a third-party IP API would have meant breaking the app's core
promise — *no network requests carrying your data*. The button is gone; the
subnet calculator works entirely offline from the address you type.

---

## Design notes

- **Tokens, not magic numbers.** Every colour, radius, shadow and easing curve
  lives in CSS custom properties, with a full light-theme override.
- **Mobile is a different layout, not a squeezed one.** Below 820 px the header
  detaches and becomes a floating bottom bar with three pill-shaped islands,
  safe-area aware, with the dropdown opening upward.
- **Motion respects the user.** `prefers-reduced-motion` disables the WebGL
  background, panel sweeps and the floating logo.
- **The background degrades.** Three.js renders a particle field, wireframe
  solids, an animated wave and a grid — but on low-core or small devices it
  drops the particle count and halves the frame rate, and if WebGL is
  unavailable it falls back to a CSS gradient.

---

## فارسی

### این چیه؟

**Signal Console** یه جعبه‌ابزار کامل برای Encode / Decode / Encrypt / Decrypt / Hash و بررسی داده‌هاست که **کامل داخل مرورگر خودت** اجرا می‌شه. هیچ داده‌ای آپلود نمی‌شه، هیچ اکانتی لازم نیست، هیچ ردیابی‌ای وجود نداره — و بعد از اولین بازدید، حتی آفلاین هم کار می‌کنه.

**۶۱ ابزار** در ۷ دسته. با <kbd>Ctrl</kbd>+<kbd>K</kbd> همه‌شون رو جست‌وجو کن.

### تغییرات نسخه ۲

- از ۲۶ ابزار به **۶۱ ابزار** رسید
- از یک فایل HTML غول‌پیکر به ساختار ماژولار (`index.html` + CSS + ۶ ماژول JS)
- **در موبایل، هدر شناور می‌ره پایین صفحه** (سه جزیره‌ی قرصی‌شکل)
- تم روشن و تیره، با تشخیص خودکار از سیستم
- پالت فرمان (⌘K)، لینک‌دهی عمیق با `#`، و منوی فیلترشونده
- دو باگ امنیتی جدی رفع شد: **ChaCha20 واقعی** جای پیاده‌سازی قلابی، و **AES با PBKDF2** جای KDF پیش‌فرض ضعیف CryptoJS
- **متن فارسی/غیرلاتین در XOR و ChaCha20 دیگه خراب نمی‌شه** (قبلاً هر کاراکتر به ۸ بیت بریده می‌شد)
- پنل ECC که فقط یه متن نمایش می‌داد، حالا **ECDSA واقعی** با امضا و تأیید امضاست
- ابزارهایی که تو مستندات وعده داده شده بود ولی وجود نداشت (Base32/58/85 و رمز Hill) ساخته شدن

### اجرا

```bash
open index.html            # اجرای مستقیم
npm run serve              # یا سرور محلی روی پورت ۸۰۸۰
```

> برای RSA / ECDSA / Diffie-Hellman باید روی `https` یا `localhost` باشی، چون مرورگر Web Crypto رو فقط در این حالت‌ها فعال می‌کنه.

### انتشار روی GitHub Pages

```bash
git init
git add .
git commit -m "Signal Console v2"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

بعد توی گیت‌هاب برو به **Settings → Pages**، بخش Source رو بذار روی `Deploy from a branch`، برنچ `main` و پوشه‌ی `/ (root)`. تمام.

آدرس اپ می‌شه:

```
https://<you>.github.io/<repo>/
```

نه workflow لازمه، نه Actions، نه بیلد. از این به بعد هر `git push` خودش آپدیت می‌شه.

فایل `.nojekyll` هم گذاشته شده تا گیت‌هاب فایل‌ها رو دست‌کاری نکنه، و `.gitignore` هم پوشه‌ی کاری دستیار رو از مخزن بیرون نگه می‌داره.

### یه نکته درباره‌ی حریم خصوصی

قبلاً یه دکمه‌ی «IP من چیه؟» توی ابزار IPv4 بود که به یه اندپوینت سروری وصل می‌شد. روی هاست استاتیک چنین چیزی وجود نداره و اگه می‌خواستیم به یه API بیرونی وصلش کنیم، با وعده‌ی اصلی اپ (**هیچ داده‌ای از دستگاهت خارج نمی‌شه**) در تضاد بود. برای همین حذف شد — ماشین‌حساب سابنت کاملاً آفلاین از روی آدرسی که خودت وارد می‌کنی کار می‌کنه.

---

## License

Free for personal and educational use. For commercial use, please get in touch.

<div align="center">

**Signal Console** — ساخته‌شده با ❤️ برای حریم خصوصی

`··− ··· ·−·· ··−· −· ·−·−· · `

</div>
