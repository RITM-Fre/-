/* ══════════════════════════════════════════════════════════════════════════
   SIGNAL — boot: home & about pages, nav, router, command palette, background
   ══════════════════════════════════════════════════════════════════════════ */
(function (S) {
  'use strict';
  var $ = S.$, $$ = S.$$, esc = S.escapeHtml, icon = S.icon;

  /* ═══════════════ HOME ═══════════════ */
  var CATEGORY_BLURB = {
    Encoding: ['Encoding & Decoding', 'Base64, Base32/58/85, hex, binary, URL, HTML entities, Unicode, punycode and Morse.'],
    Cipher: ['Classical Ciphers', 'Caesar, Vigenère, Playfair, Hill, Affine, Atbash, rail fence, Bacon and more — with brute force.'],
    Crypto: ['Modern Cryptography', 'AES-256, ChaCha20, Triple DES, RSA, ECDSA and Diffie–Hellman, all with proper key handling.'],
    Hashing: ['Hashing & Passwords', 'MD5 → SHA-512, RIPEMD, CRC32, HMAC, PBKDF2, bcrypt, scrypt, Argon2id, TOTP and JWT.'],
    Utility: ['Utilities & Generators', 'UUIDs, passwords, timestamps, JSON, regex, diffs, colours, subnets, QR codes and text tools.'],
    Media: ['Files & Media', 'gzip compression, image steganography, file hashing, data URIs and image conversion.']
  };
  S.customTool({
    id: 'home', name: 'Home', group: 'Start', icon: 'home',
    desc: 'Everything in one console.',
    build: function () {
      var gs = S.groups().filter(function (g) { return g.id !== 'Start' && g.id !== 'Info'; });
      var cards = gs.map(function (g) {
        var b = CATEGORY_BLURB[g.id] || [g.label, ''];
        return '<button class="home-card" data-nav="' + g.tools[0].id + '">' +
          '<span class="hc-ico">' + icon(g.icon) + '</span>' +
          '<h4>' + esc(b[0]) + '</h4><p>' + esc(b[1]) + '</p>' +
          '<span class="hc-count">' + g.tools.length + ' tools →</span></button>';
      }).join('');
      return '<div class="home-hero">' +
        '<img class="hero-logo" src="assets/logo.svg" alt="Signal" width="84" height="84">' +
        '<h2>Signal Console</h2>' +
        '<p class="hero-sub">A complete encoder, cipher, hash and inspection workbench that runs <b>entirely inside your browser</b>. No uploads, no accounts, no tracking — it even works offline.</p>' +
        '<div class="home-cta">' +
        '<button class="btn btn-primary" data-nav="base64" type="button">Start with Base64 →</button>' +
        '<button class="btn" id="home-search-btn" type="button">' + icon('search') + 'Search all tools</button>' +
        '</div>' +
        '<div class="home-search" id="home-search" role="button" tabindex="0">' +
        icon('search') + '<span>Search tools, formats and algorithms…</span><kbd>Ctrl</kbd><kbd>K</kbd></div>' +
        '<div class="hero-stats">' +
        '<div class="hero-stat"><b>' + S.tools.length + '</b><span>tools</span></div>' +
        '<div class="hero-stat"><b>0</b><span>uploads</span></div>' +
        '<div class="hero-stat"><b>0</b><span>trackers</span></div>' +
        '<div class="hero-stat"><b>∞</b><span>offline use</span></div>' +
        '</div></div>' +
        '<div class="home-grid">' + cards + '</div>';
    },
    mount: function () {
      var hs = $('home-search'), hb = $('home-search-btn');
      function open() { if (window.__signalOpenPalette) window.__signalOpenPalette(); }
      if (hs) { hs.addEventListener('click', open); hs.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }); }
      if (hb) hb.addEventListener('click', open);
    }
  });

  /* ═══════════════ ABOUT ═══════════════ */
  S.customTool({
    id: 'about', name: 'About & Privacy', group: 'Info', icon: 'info',
    desc: 'How Signal works, what it promises, and how to reach the author.',
    build: function () {
      var groups = S.groups().filter(function (g) { return g.id !== 'Start' && g.id !== 'Info'; });
      return '<div class="about-hero">' +
        '<img src="assets/logo.svg" alt="" width="74" height="74">' +
        '<div><h3>Signal Console <span class="chip mark">v2.0</span></h3>' +
        '<p>by RITM Studio — a privacy-first crypto toolbox</p></div></div>' +
        '<div class="about-block"><h3>What this is</h3>' +
        '<p>Signal is a single-page workbench for encoding, decoding, encrypting, hashing and inspecting data. Every operation is performed by JavaScript running on <strong>your</strong> machine — the page never sends your input anywhere.</p>' +
        '<p>It was built so that a developer debugging a Base64 blob, a student learning the Vigenère cipher, and someone who just needs to hash a password can all reach for the same tool and trust it.</p></div>' +
        '<div class="about-block"><h3>Privacy</h3>' +
        '<p>No analytics. No cookies. No network requests carrying your data. The only external requests are the one-time downloads of the open-source libraries (Three.js, CryptoJS, hash-wasm) and the web fonts — and after the first visit the service worker serves everything from your own cache, so it works with the network completely off.</p></div>' +
        '<div class="about-block"><h3>What is inside</h3><ul class="about-list">' +
        groups.map(function (g) { return '<li><strong>' + esc(g.label) + ' (' + g.tools.length + '):</strong> ' + esc(g.tools.map(function (t) { return t.name; }).join(', ')) + '.</li>'; }).join('') +
        '</ul></div>' +
        '<div class="about-block"><h3>Security notes</h3><ul class="about-list">' +
        '<li><strong>MD5, SHA-1 and Triple DES</strong> are broken or deprecated — they are here for compatibility and learning only.</li>' +
        '<li><strong>AES and ChaCha20</strong> use a key derived from your passphrase with PBKDF2/SHA-256 and a fresh random salt or nonce per message.</li>' +
        '<li><strong>Asymmetric tools</strong> use the browser\'s Web Crypto API, which requires HTTPS or localhost.</li>' +
        '<li><strong>Steganography</strong> is LSB-based and does not survive re-compression — treat it as a curiosity, not a secure channel.</li>' +
        '</ul></div>' +
        '<div class="about-block"><h3>Get in touch</h3><p>Bug reports, feature requests and collaborations are all welcome.</p>' +
        '<div class="contact-links">' +
        '<a class="x-link" href="https://ritm-fre.github.io/RITM-ppa" target="_blank" rel="noopener noreferrer">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>RITM Studio</a>' +
        '<a class="x-link" href="https://x.com/@Dahenavadi26" target="_blank" rel="noopener noreferrer">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>@Dahenavadi26</a>' +
        '<a class="x-link" href="mailto:RITM.FreeLancer@gmail.com">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.236l-8 5.334-8-5.334V6l8 5.334L20 6v2.236z"/></svg>RITM.FreeLancer@gmail.com</a>' +
        '</div></div>' +
        '<div class="about-block"><h3>Keyboard shortcuts</h3><div class="table-wrap"><table class="data-table"><tbody>' +
        [['Ctrl / ⌘ + K', 'Open the tool search palette'], ['/', 'Focus search (when not typing)'],
         ['Esc', 'Close the palette or menu'], ['↑ ↓', 'Move through search results'], ['Enter', 'Open the highlighted tool']]
          .map(function (r) { return '<tr><td style="width:150px">' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>' +
        '<div class="about-block"><h3>Licence</h3><p>Free for personal and educational use. For commercial use, please get in touch.</p></div>';
    }
  });

  /* ═══════════════ PANEL RENDERING ═══════════════ */
  var consoleEl = $('console');
  var mounted = {};
  var current = null;

  function panelEl(tool) {
    var el = document.getElementById('panel-' + tool.id);
    if (el) return el;
    el = document.createElement('section');
    el.className = 'panel is-hidden';
    el.id = 'panel-' + tool.id;
    el.dataset.panel = tool.id;
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', tool.name);
    el.innerHTML = tool.build();
    consoleEl.appendChild(el);
    return el;
  }
  function ensureMounted(tool) {
    if (mounted[tool.id]) return;
    var el = panelEl(tool);
    try { tool.mount(el, S); }
    catch (e) { console.error('Failed to mount "' + tool.id + '":', e); }
    mounted[tool.id] = true;
  }

  /* ═══════════════ NAV ═══════════════ */
  var NAV_IDS = ['base64', 'morse', 'hash', 'json', 'aes'];
  function buildNav() {
    var nav = $('main-nav');
    var home = S.get('home');
    var items = [home].concat(NAV_IDS.map(S.get).filter(Boolean));
    nav.innerHTML = items.map(function (t) {
      return '<button class="nav-btn' + (t.id === 'home' ? ' active' : '') + '" data-nav="' + t.id + '" type="button">' +
        icon(t.icon, 'nav-ico') + '<span>' + esc(t.id === 'home' ? 'Home' : t.name) + '</span></button>';
    }).join('');
  }
  function buildDropdown() {
    var list = $('dd-list');
    list.innerHTML = S.groups().map(function (g) {
      return '<div class="dd-group-label">' + esc(g.label) + '</div>' +
        g.tools.map(function (t) {
          return '<button class="dropdown-item" data-nav="' + t.id + '" type="button" role="menuitem" data-search="' +
            esc((t.name + ' ' + t.tags.join(' ') + ' ' + t.desc).toLowerCase()) + '">' +
            icon(t.icon, 'di-ico') + '<span class="di-label">' + esc(t.name) + '</span>' +
            '<span class="dd-tag">' + esc(t.group) + '</span></button>';
        }).join('');
    }).join('');
  }
  function filterDropdown(q) {
    q = q.trim().toLowerCase();
    var shown = 0;
    $$('#dd-list .dropdown-item').forEach(function (item) {
      var hit = !q || item.dataset.search.indexOf(q) !== -1;
      item.hidden = !hit;
      if (hit) shown++;
    });
    $$('#dd-list .dd-group-label').forEach(function (label) {
      var any = false, n = label.nextElementSibling;
      while (n && !n.classList.contains('dd-group-label')) { if (n.classList.contains('dropdown-item') && !n.hidden) { any = true; break; } n = n.nextElementSibling; }
      label.hidden = !any;
    });
    if (!shown && q) {
      if (!$('dd-none')) list.insertAdjacentHTML('beforeend', '<div class="palette-empty" id="dd-none">No tools match “' + esc(q) + '”.</div>');
    } else if ($('dd-none')) $('dd-none').remove();
  }

  /* ═══════════════ ROUTER ═══════════════ */
  function showPanel(id, opts) {
    opts = opts || {};
    var tool = S.get(id) || S.get('home');
    if (!tool) return;
    ensureMounted(tool);

    $$('#console .panel').forEach(function (p) { p.classList.toggle('is-hidden', p.dataset.panel !== tool.id); });
    $$('.nav-btn[data-nav], .dropdown-item[data-nav]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.nav === tool.id);
    });
    var navIds = NAV_IDS.concat(['home']);
    var toggle = $('other-toggle');
    if (toggle) toggle.classList.toggle('active', navIds.indexOf(tool.id) === -1);

    var el = document.getElementById('panel-' + tool.id);
    if (el && !opts.silent) {
      el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
    }
    if (el) el.scrollTop = 0;
    closeDropdown();
    closePalette();

    if (history.replaceState) history.replaceState(null, '', '#' + tool.id);
    else location.hash = tool.id;

    if (!opts.noScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    current = tool.id;
    document.title = (tool.id === 'home' ? 'Signal — Universal Encoder, Cipher & Hash Console' : tool.name + ' — Signal Console');
  }
  window.addEventListener('hashchange', function () {
    var id = location.hash.replace(/^#/, '');
    if (id && S.get(id) && id !== current) showPanel(id);
  });

  /* ═══════════════ DROPDOWN ═══════════════ */
  var ddToggle = $('other-toggle'), ddPanel = $('other-panel');
  function closeDropdown() {
    if (!ddPanel) return;
    ddPanel.classList.remove('open');
    ddToggle.setAttribute('aria-expanded', 'false');
  }
  ddToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = ddPanel.classList.toggle('open');
    ddToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) setTimeout(function () { var f = $('dd-filter'); if (f && window.innerWidth > 820) f.focus(); }, 60);
  });
  $('dd-filter').addEventListener('input', function () { filterDropdown(this.value); });
  document.addEventListener('click', function (e) {
    if (!ddPanel.contains(e.target) && !ddToggle.contains(e.target)) closeDropdown();
  });

  /* ═══════════════ COMMAND PALETTE ═══════════════ */
  var palette = $('palette'), palInput = $('palette-input'), palResults = $('palette-results');
  var palIndex = 0, palList = [];
  function openPalette() {
    palette.hidden = false;
    palInput.value = '';
    renderPalette('');
    setTimeout(function () { palInput.focus(); }, 30);
    document.body.style.overflow = 'hidden';
  }
  function closePalette() {
    if (palette.hidden) return;
    palette.hidden = true;
    document.body.style.overflow = '';
  }
  function highlight(text, q) {
    if (!q) return esc(text);
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i === -1) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }
  function renderPalette(q) {
    palList = S.search(q);
    if (!palList.length) {
      palResults.innerHTML = '<div class="palette-empty">No tool matches “' + esc(q) + '”.</div>';
      palIndex = 0;
      return;
    }
    palIndex = 0;
    palResults.innerHTML = palList.map(function (t, i) {
      return '<button class="palette-item' + (i === 0 ? ' sel' : '') + '" data-i="' + i + '" type="button">' +
        icon(t.icon, 'pi-ico') + '<span class="pi-text"><span class="pi-name">' + highlight(t.name, q) + '</span>' +
        '<span class="pi-group">' + esc(t.group) + (t.desc ? ' · ' + esc(t.desc.slice(0, 64)) : '') + '</span></span></button>';
    }).join('');
    $$('.palette-item', palResults).forEach(function (b) {
      b.addEventListener('click', function () { openTool(palList[+b.dataset.i]); });
      b.addEventListener('mousemove', function () { setPalIndex(+b.dataset.i); });
    });
  }
  function setPalIndex(i) {
    if (!palList.length) return;
    palIndex = (i + palList.length) % palList.length;
    $$('.palette-item', palResults).forEach(function (b, j) { b.classList.toggle('sel', j === palIndex); });
    var sel = palResults.querySelector('.palette-item.sel');
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
  }
  function openTool(t) {
    if (!t) return;
    closePalette();
    showPanel(t.id);
  }
  palInput.addEventListener('input', function () { renderPalette(this.value); });
  palInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setPalIndex(palIndex + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setPalIndex(palIndex - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); openTool(palList[palIndex]); }
  });
  $$('[data-palette-close]', palette).forEach(function (el) { el.addEventListener('click', closePalette); });
  window.__signalOpenPalette = openPalette;
  $('search-btn').addEventListener('click', openPalette);

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette.hidden ? openPalette() : closePalette(); return; }
    if (e.key === 'Escape') { closePalette(); closeDropdown(); return; }
    if (e.key === '/' && !typing && palette.hidden) { e.preventDefault(); openPalette(); }
    if (e.key === 'Tab' && !palette.hidden) e.preventDefault();
  });

  /* ═══════════════ GLOBAL NAV CLICKS ═══════════════ */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-nav]');
    if (!btn) return;
    e.preventDefault();
    showPanel(btn.dataset.nav);
  });

  /* ═══════════════ HEADER SCROLL STATE ═══════════════ */
  var header = $('site-header');
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      header.classList.toggle('scrolled', window.scrollY > 16);
      ticking = false;
    });
  }, { passive: true });

  /* ═══════════════ THEME ═══════════════ */
  S.applyTheme(S.store.get('theme', (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark'));

  /* ═══════════════ THREE.JS BACKGROUND ═══════════════ */
  (function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isSmall = window.innerWidth < 820;
    var lowPower = isSmall || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    if (!window.THREE || reduce) { document.body.classList.add('no-three'); return; }
    try {
      var canvas = $('bg-canvas');
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !lowPower, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.4 : 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 0, 9);
      var colorA = new THREE.Color(0xffa94d), colorB = new THREE.Color(0x8b7cff);
      var count = lowPower ? 160 : 700;
      var positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
      for (var i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 28;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 17;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
        var c = colorA.clone().lerp(colorB, Math.random());
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      var size = 64, cvs = document.createElement('canvas');
      cvs.width = cvs.height = size;
      var cx = cvs.getContext('2d');
      var g = cx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      cx.fillStyle = g; cx.fillRect(0, 0, size, size);
      var points = new THREE.Points(geo, new THREE.PointsMaterial({
        size: lowPower ? 0.08 : 0.11, map: new THREE.CanvasTexture(cvs), vertexColors: true,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85
      }));
      scene.add(points);
      var nodeGeos = [
        new THREE.IcosahedronGeometry(1.1, 0), new THREE.OctahedronGeometry(0.9, 0),
        new THREE.TorusGeometry(0.8, 0.24, 8, 40), new THREE.IcosahedronGeometry(0.6, 1)
      ];
      var nodes = [];
      nodeGeos.forEach(function (gg, idx) {
        var mesh = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({
          color: idx % 2 === 0 ? 0xffa94d : 0x8b7cff, wireframe: true, transparent: true, opacity: 0.3
        }));
        mesh.position.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 8.5, -4 - Math.random() * 6);
        mesh.userData.sx = (Math.random() * 0.5 + 0.15) * (Math.random() < 0.5 ? -1 : 1);
        mesh.userData.sy = (Math.random() * 0.4 + 0.1) * (Math.random() < 0.5 ? -1 : 1);
        scene.add(mesh); nodes.push(mesh);
      });
      var waveCount = lowPower ? 60 : 140;
      var wavePos = new Float32Array(waveCount * 3);
      for (var w = 0; w < waveCount; w++) {
        wavePos[w * 3] = (w / (waveCount - 1) - 0.5) * 26;
        wavePos[w * 3 + 1] = -5.4; wavePos[w * 3 + 2] = -3;
      }
      var waveGeo = new THREE.BufferGeometry();
      waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePos, 3));
      var wave = new THREE.Line(waveGeo, new THREE.LineBasicMaterial({ color: 0xffa94d, transparent: true, opacity: 0.32 }));
      scene.add(wave);
      var grid = new THREE.GridHelper(44, 36, 0x8b7cff, 0x1b2434);
      grid.position.y = -6.4;
      grid.material.transparent = true; grid.material.opacity = 0.18;
      scene.add(grid);
      var mx = 0, my = 0, tx = 0, ty = 0;
      if (!lowPower) {
        window.addEventListener('pointermove', function (e) {
          mx = (e.clientX / window.innerWidth) - 0.5;
          my = (e.clientY / window.innerHeight) - 0.5;
        }, { passive: true });
      }
      var clock = new THREE.Clock(), running = true, rafId = null, frame = 0, skip = lowPower ? 2 : 1;
      function animate() {
        if (!running) return;
        rafId = requestAnimationFrame(animate);
        if (++frame % skip) return;
        var t = clock.getElapsedTime();
        tx += (mx - tx) * 0.03; ty += (my - ty) * 0.03;
        points.rotation.y = t * 0.02 + tx * 0.4;
        points.rotation.x = ty * 0.2;
        for (var n = 0; n < nodes.length; n++) {
          nodes[n].rotation.x += 0.004 * nodes[n].userData.sy;
          nodes[n].rotation.y += 0.004 * nodes[n].userData.sx;
        }
        camera.position.x += (tx * 1.3 - camera.position.x) * 0.02;
        camera.position.y += (-ty * 1.1 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);
        var pa = waveGeo.attributes.position;
        for (var k = 0; k < waveCount; k++) {
          var x = pa.getX(k);
          pa.setY(k, Math.sin(x * 0.6 + t * 1.6) * 0.6 + Math.sin(x * 0.15 - t * 0.8) * 0.4 - 5.4);
        }
        pa.needsUpdate = true;
        grid.position.z = (t * 0.7) % (44 / 36);
        renderer.render(scene, camera);
      }
      animate();
      var rt;
      function onResize() {
        clearTimeout(rt);
        rt = setTimeout(function () {
          var w2 = window.innerWidth, h2 = window.innerHeight;
          camera.aspect = w2 / h2; camera.updateProjectionMatrix();
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.4 : 2));
          renderer.setSize(w2, h2);
        }, 160);
      }
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onResize);
      document.addEventListener('visibilitychange', function () {
        running = !document.hidden;
        if (running) { clock.getDelta(); animate(); }
        else if (rafId) cancelAnimationFrame(rafId);
      });
    } catch (e) { document.body.classList.add('no-three'); }
  })();

  /* ═══════════════ PWA ═══════════════ */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if ($('install-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'install-btn';
    btn.className = 'btn btn-primary btn-sm';
    btn.type = 'button';
    btn.style.cssText = 'position:fixed;right:16px;bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:90;box-shadow:var(--shadow);';
    btn.innerHTML = S.icon('download') + 'Install app';
    btn.addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (r) {
        if (r.outcome === 'accepted') btn.remove();
        deferredPrompt = null;
      });
    });
    document.body.appendChild(btn);
    if (window.innerWidth > 820) btn.style.bottom = 'calc(20px + env(safe-area-inset-bottom,0px))';
  });
  window.addEventListener('appinstalled', function () { var b = $('install-btn'); if (b) b.remove(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  /* ═══════════════ INIT ═══════════════ */
  function init() {
    buildNav();
    buildDropdown();
    var tc = $('tool-count-chip');
    if (tc) tc.textContent = S.tools.length + ' tools';
    var y = $('year');
    if (y) y.textContent = new Date().getFullYear();
    var loader = $('boot-loader');
    if (loader) loader.remove();

    var start = location.hash.replace(/^#/, '');
    if (!start || !S.get(start)) start = 'home';
    showPanel(start, { noScroll: true, silent: true });

    if (!window.crypto || !crypto.subtle) {
      ['rsa-hint', 'ec-hint', 'dh-hint'].forEach(function (id) {
        var el = $(id);
        if (el && !el.textContent) { el.className = 'hint warn'; el.textContent = 'Web Crypto needs HTTPS or localhost — this page is on ' + location.protocol; }
      });
    }
    console.log('%cSignal Console v2.0', 'color:#ffa94d;font-weight:700;font-size:14px', '— ' + S.tools.length + ' tools loaded, all local.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})(window.Signal);
