/* ══════════════════════════════════════════════════════════════════════════
   SIGNAL — encoding & decoding tools
   ══════════════════════════════════════════════════════════════════════════ */
(function (S) {
  'use strict';
  var $ = S.$, $$ = S.$$, esc = S.escapeHtml;

  /* ───────────────────────── BASE64 ───────────────────────── */
  S.customTool({
    id: 'base64', name: 'Base64', group: 'Encoding', icon: 'code', primary: true,
    desc: 'Encode text or files to Base64 and decode it back. Handles UTF-8, URL-safe alphabet and image previews.',
    tags: ['base64', 'b64', 'encode', 'decode', 'file', 'url-safe'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['encode', 'Encode'], ['decode', 'Decode']], 'encode') +
        '<div class="flex-row">' +
        '<label class="check"><input type="checkbox" id="b64-urlsafe"> URL-safe</label>' +
        '<label class="check"><input type="checkbox" id="b64-nowrap"> No padding</label>' +
        '</div></div>' +
        '<div id="b64-file-row">' +
        '<label class="file-drop file-drop-lg" id="b64-drop" for="b64-file">' +
        S.icon('image') +
        '<span class="fd-text"><strong id="b64-drop-title">Choose a file to encode</strong>' +
        '<em id="b64-drop-sub">or drag &amp; drop it anywhere on this panel — images, PDFs, audio, any file</em></span>' +
        '<span class="btn btn-soft btn-sm">Browse…</span>' +
        '</label>' +
        '<input type="file" id="b64-file" hidden>' +
        '<div class="file-notice" id="b64-notice" hidden><span id="b64-notice-text"></span>' +
        '<button type="button" id="b64-notice-x" aria-label="Remove file">✕</button></div>' +
        '<p class="paste-hint">Tip: paste an image straight from the clipboard with <kbd>Ctrl</kbd>+<kbd>V</kbd> (or <kbd>⌘</kbd>+<kbd>V</kbd>) — no need to save it first.</p>' +
        '</div>' +
        '<label class="field-label" for="b64-in">Input</label>' +
        '<textarea id="b64-in" class="field" rows="5" placeholder="Type or paste anything to encode…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-swap" id="b64-swap" type="button">' + S.icon('swap') + 'Swap</button>' +
        '<button class="btn btn-ghost" id="b64-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="b64-out">Result</label>' +
        '<textarea id="b64-out" class="field" rows="5" readonly placeholder="Your result will appear here…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="b64-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="b64-copy" type="button">' + S.icon('copy') + 'Copy</button>' +
        '<button class="btn btn-ghost btn-sm" id="b64-save" type="button">' + S.icon('download') + 'Save</button>' +
        '</div></div>' +
        '<div class="image-preview" id="b64-preview" hidden><img id="b64-img" alt="Decoded image preview"></div>' +
        '<div class="stat-strip" id="b64-stats"></div>');
    },
    mount: function () {
      var mode = 'encode', fileLoaded = false, fileMeta = null;
      var inp = $('b64-in'), out = $('b64-out'), hint = $('b64-hint'), stats = $('b64-stats');

      function opts() { return { urlSafe: $('b64-urlsafe').checked, noPad: $('b64-nowrap').checked }; }
      function encode(str) {
        var b = S.utf8ToBase64(str), o = opts();
        if (o.urlSafe) b = b.replace(/\+/g, '-').replace(/\//g, '_');
        if (o.noPad) b = b.replace(/=+$/, '');
        return b;
      }
      function setHint(t, k) { hint.className = 'hint' + (k ? ' ' + k : ''); hint.textContent = t || ''; }
      function hidePreview() { $('b64-preview').hidden = true; $('b64-img').src = ''; }
      function detectMime(b) {
        if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'image/png';
        if (b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
        if (b.length >= 3 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
        if (b.length >= 12 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
        if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4D) return 'image/bmp';
        if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
        return null;
      }
      function update() {
        setHint('');
        if (mode === 'encode') {
          if (fileLoaded) { stats.textContent = ''; return; }
          hidePreview();
          var raw = inp.value;
          out.value = raw ? encode(raw) : '';
          stats.textContent = raw ? (raw.length + ' chars → ' + out.value.length + ' chars') : '';
          return;
        }
        var cleaned = inp.value.trim().replace(/\s+/g, '');
        if (!cleaned) { out.value = ''; hidePreview(); stats.textContent = ''; return; }
        if (!/^[A-Za-z0-9+/_\-]*={0,2}$/.test(cleaned)) { out.value = ''; hidePreview(); setHint("That doesn't look like valid Base64.", 'error'); return; }
        try {
          var norm = cleaned.replace(/-/g, '+').replace(/_/g, '/');
          while (norm.length % 4) norm += '=';
          var bytes = S.base64ToBytes(norm);
          var mime = detectMime(bytes);
          if (mime && mime.indexOf('image/') === 0) {
            out.value = '[' + mime + ' image — ' + S.formatBytes(bytes.length) + ' — preview below]';
            $('b64-img').src = 'data:' + mime + ';base64,' + norm;
            $('b64-preview').hidden = false;
          } else {
            hidePreview();
            out.value = S.bytesToText(bytes);
          }
          stats.textContent = bytes.length + ' bytes decoded';
        } catch (e) { out.value = ''; hidePreview(); setHint("That doesn't look like valid Base64.", 'error'); }
      }
      function resetFile() {
        fileLoaded = false; fileMeta = null;
        inp.disabled = false; inp.value = '';
        inp.placeholder = mode === 'decode' ? 'Paste a Base64 string to decode…' : 'Type or paste anything to encode…';
        $('b64-notice').hidden = true; hidePreview();
      }
      /* The file picker stays available in BOTH directions — in decode mode it
         reads a .txt holding Base64 instead of encoding a binary. */
      function syncFileRow() {
        $('b64-file-row').hidden = false;
        $('b64-drop-title').textContent = mode === 'encode' ? 'Choose a file to encode' : 'Choose a Base64 text file to decode';
        $('b64-drop-sub').textContent = mode === 'encode'
          ? 'or drag & drop it anywhere on this panel — images, PDFs, audio, any file'
          : 'or drag & drop a .txt file holding Base64 — it will be decoded below';
      }
      $$('.mode-btn', $('panel-base64')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-base64')).forEach(function (x) { x.classList.toggle('active', x === b); });
          resetFile();
          syncFileRow();
          update();
        });
      });
      $('b64-in').addEventListener('input', update);
      $('b64-urlsafe').addEventListener('change', update);
      $('b64-nowrap').addEventListener('change', update);
      $('b64-swap').addEventListener('click', function () {
        if (fileLoaded) { S.toast('Remove the loaded file first', 'info'); return; }
        var t = inp.value; inp.value = out.value; out.value = t;
        mode = mode === 'encode' ? 'decode' : 'encode';
        $$('.mode-btn', $('panel-base64')).forEach(function (x) { x.classList.toggle('active', x.dataset.mode === mode); });
        syncFileRow();
        update();
      });
      $('b64-clear').addEventListener('click', function () { resetFile(); out.value = ''; update(); });
      $('b64-copy').addEventListener('click', function () { S.copyText(out.value); });
      $('b64-save').addEventListener('click', function () {
        if (!out.value) { S.toast('Nothing to save yet', 'info'); return; }
        if (mode === 'decode' && fileMeta) { S.download(fileMeta.name.replace(/\.[^.]+$/, '') + '.bin', S.base64ToBytes(out.value.replace(/\s+/g, '')), 'application/octet-stream'); return; }
        S.download('base64.txt', out.value);
      });
      var fileEl = $('b64-file'), drop = $('b64-drop'), panel = $('panel-base64');
      function forceEncodeMode() {
        if (mode === 'encode') return;
        mode = 'encode';
        $$('.mode-btn', panel).forEach(function (x) { x.classList.toggle('active', x.dataset.mode === 'encode'); });
        syncFileRow();
      }
      /* Decides the direction from the file itself, so every entry point
         (picker, drag & drop, paste) behaves the same way: a text file in
         Decode mode is treated as Base64; anything binary is encoded. */
      function loadFile(f) {
        if (!f) return;
        var looksText = /^text\//.test(f.type || '') || /\.(txt|b64|base64|json|pem|asc|md)$/i.test(f.name || '');
        if (mode === 'decode' && !looksText) forceEncodeMode();
        if (mode === 'decode') {
          var tr = new FileReader();
          tr.onload = function () {
            inp.value = String(tr.result).trim();
            $('b64-notice').hidden = false;
            $('b64-notice-text').textContent = f.name + ' — ' + S.formatBytes(f.size) + ' · read as text';
            update();
            S.toast('Loaded Base64 text from ' + f.name, 'ok');
          };
          tr.onerror = function () { setHint('Could not read that file.', 'error'); };
          tr.readAsText(f);
          return;
        }
        var r = new FileReader();
        r.onload = function () {
          var b64 = String(r.result).split(',')[1] || '';
          out.value = b64;
          fileLoaded = true; fileMeta = f;
          inp.value = ''; inp.disabled = true;
          inp.placeholder = 'Loaded: ' + f.name + ' (' + S.formatBytes(f.size) + ')';
          $('b64-notice').hidden = false;
          $('b64-notice-text').textContent = f.name + ' — ' + S.formatBytes(f.size);
          stats.textContent = f.size + ' bytes → ' + b64.length + ' chars';
          if (f.type && f.type.indexOf('image/') === 0) { $('b64-img').src = r.result; $('b64-preview').hidden = false; } else hidePreview();
          setHint('Encoded. Press Copy or Save to take the Base64 out.', 'ok');
        };
        r.onerror = function () { setHint('Could not read that file.', 'error'); };
        r.readAsDataURL(f);
      }
      fileEl.addEventListener('change', function (e) {
        loadFile(e.target.files[0]);
        fileEl.value = '';
      });

      /* Drag & drop anywhere on the panel, not just the dashed box. */
      panel.addEventListener('dragenter', function (e) { e.preventDefault(); drop.classList.add('drag'); });
      panel.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('drag'); });
      panel.addEventListener('dragleave', function (e) {
        if (!panel.contains(e.relatedTarget)) drop.classList.remove('drag');
      });
      panel.addEventListener('drop', function (e) {
        e.preventDefault();
        drop.classList.remove('drag');
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) { loadFile(f); return; }
        var txt = e.dataTransfer && e.dataTransfer.getData('text');
        if (txt) { inp.value = txt; update(); }
      });

      /* Paste an image (or a Base64 string) straight from the clipboard. */
      panel.addEventListener('paste', function (e) {
        var items = (e.clipboardData && e.clipboardData.items) || [];
        for (var i = 0; i < items.length; i++) {
          if (items[i].type && items[i].type.indexOf('image/') === 0) {
            var f = items[i].getAsFile();
            if (f) {
              e.preventDefault();
              forceEncodeMode();
              loadFile(f);
              S.toast('Image pasted and encoded', 'ok');
              return;
            }
          }
        }
      });

      $('b64-notice-x').addEventListener('click', function () { resetFile(); update(); });
      syncFileRow();
      update();
    }
  });

  /* ───────────────────────── BASE32 ───────────────────────── */
  var B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  function b32encode(bytes) {
    var bits = 0, val = 0, out = '';
    for (var i = 0; i < bytes.length; i++) {
      val = (val << 8) | bytes[i]; bits += 8;
      while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) out += B32[(val << (5 - bits)) & 31];
    while (out.length % 8) out += '=';
    return out;
  }
  function b32decode(str) {
    var c = String(str).toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
    var bits = 0, val = 0, out = [];
    for (var i = 0; i < c.length; i++) {
      var idx = B32.indexOf(c[i]);
      if (idx === -1) throw new Error('Invalid Base32 character: ' + c[i]);
      val = (val << 5) | idx; bits += 5;
      if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xFF); bits -= 8; }
    }
    return new Uint8Array(out);
  }
  S.ioTool({
    id: 'base32', name: 'Base32', group: 'Encoding', icon: 'layers',
    desc: 'RFC 4648 Base32 — the alphabet that survives being read aloud or typed by hand.',
    tags: ['base32', 'rfc4648', 'encode'],
    modes: [['encode', 'Encode'], ['decode', 'Decode']],
    inputs: [{ id: 'in', label: 'Input', ph: 'Hello, world' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'Hello, world' },
    run: function (c) {
      if (!c.values.in) return '';
      if (c.mode === 'encode') return { text: b32encode(S.textToBytes(c.values.in)) };
      try { return { text: S.bytesToText(b32decode(c.values.in)) }; }
      catch (e) { return { error: e.message }; }
    }
  });

  /* ───────────────────────── BASE58 ───────────────────────── */
  var B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function b58encode(bytes) {
    var zeros = 0;
    while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
    var digits = [0];
    for (var i = zeros; i < bytes.length; i++) {
      var carry = bytes[i];
      for (var j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = (carry / 58) | 0;
      }
      while (carry > 0) { digits.push(carry % 58); carry = (carry / 58) | 0; }
    }
    var out = '';
    for (var k = 0; k < zeros; k++) out += '1';
    for (var m = digits.length - 1; m >= 0; m--) out += B58[digits[m]];
    return out;
  }
  function b58decode(str) {
    var c = String(str).replace(/\s+/g, ''), zeros = 0;
    while (zeros < c.length && c[zeros] === '1') zeros++;
    var bytes = [0];
    for (var i = zeros; i < c.length; i++) {
      var idx = B58.indexOf(c[i]);
      if (idx === -1) throw new Error('Invalid Base58 character: ' + c[i]);
      var carry = idx;
      for (var j = 0; j < bytes.length; j++) {
        carry += bytes[j] * 58;
        bytes[j] = carry & 0xFF;
        carry >>= 8;
      }
      while (carry > 0) { bytes.push(carry & 0xFF); carry >>= 8; }
    }
    var out = new Uint8Array(zeros + bytes.length);
    for (var k = 0; k < bytes.length; k++) out[zeros + k] = bytes[bytes.length - 1 - k];
    return out;
  }
  S.ioTool({
    id: 'base58', name: 'Base58', group: 'Encoding', icon: 'layers',
    desc: 'Bitcoin-style Base58 — no 0, O, I or l, so it never gets misread.',
    tags: ['base58', 'bitcoin', 'encode'],
    modes: [['encode', 'Encode'], ['decode', 'Decode']],
    inputs: [{ id: 'in', label: 'Input', ph: 'Hello, world' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'Hello, world' },
    run: function (c) {
      if (!c.values.in) return '';
      if (c.mode === 'encode') return { text: b58encode(S.textToBytes(c.values.in)) };
      try { return { text: S.bytesToText(b58decode(c.values.in)) }; }
      catch (e) { return { error: e.message }; }
    }
  });

  /* ───────────────────────── BASE85 / Ascii85 ───────────────────────── */
  function b85encode(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; i += 4) {
      var chunk = bytes.subarray(i, i + 4), pad = 4 - chunk.length;
      var v = 0;
      for (var j = 0; j < 4; j++) v = v * 256 + (chunk[j] || 0);
      if (v === 0 && pad === 0) { out += 'z'; continue; }
      var enc = '';
      for (var k = 0; k < 5; k++) { enc = String.fromCharCode((v % 85) + 33) + enc; v = Math.floor(v / 85); }
      out += pad ? enc.slice(0, 5 - pad) : enc;
    }
    return out;
  }
  function b85decode(str) {
    var c = String(str).replace(/\s+/g, '').replace(/^<~/, '').replace(/~>$/, '');
    var out = [], i = 0;
    while (i < c.length) {
      if (c[i] === 'z') { out.push(0, 0, 0, 0); i++; continue; }
      var group = c.substr(i, 5);
      if (!group.length) break;
      var pad = 5 - group.length;
      group = group + 'uuuu'.slice(0, pad);
      var v = 0;
      for (var j = 0; j < 5; j++) {
        var d = group.charCodeAt(j) - 33;
        if (d < 0 || d > 84) throw new Error('Invalid Ascii85 character');
        v = v * 85 + d;
      }
      var b = [(v >>> 24) & 0xFF, (v >>> 16) & 0xFF, (v >>> 8) & 0xFF, v & 0xFF];
      for (var k = 0; k < 4 - pad; k++) out.push(b[k]);
      i += 5;
    }
    return new Uint8Array(out);
  }
  S.ioTool({
    id: 'base85', name: 'Base85 (Ascii85)', group: 'Encoding', icon: 'layers',
    desc: 'Adobe Ascii85 — ~25% smaller than Base64, used inside PDF and PostScript files.',
    tags: ['base85', 'ascii85', 'z85', 'encode'],
    modes: [['encode', 'Encode'], ['decode', 'Decode']],
    inputs: [{ id: 'in', label: 'Input', ph: 'Hello, world' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'Hello, world' },
    run: function (c) {
      if (!c.values.in) return '';
      if (c.mode === 'encode') return { text: b85encode(S.textToBytes(c.values.in)) };
      try { return { text: S.bytesToText(b85decode(c.values.in)) }; }
      catch (e) { return { error: e.message }; }
    }
  });

  /* ───────────────────────── HEX ───────────────────────── */
  S.ioTool({
    id: 'hex', name: 'Hex', group: 'Encoding', icon: 'hash', primary: true,
    desc: 'Convert text to hexadecimal bytes and back. Choose your separator and case.',
    tags: ['hex', 'hexadecimal', 'bytes', 'encode'],
    modes: [['encode', 'Encode'], ['decode', 'Decode']],
    extra: [
      { id: 'hex-sep', type: 'select', label: 'Separator', value: ' ', small: true, options: [[' ', 'Space'], ['', 'None'], [':', 'Colon'], ['-', 'Dash'], [',', 'Comma']] },
      { id: 'hex-case', type: 'select', label: 'Case', value: 'lower', small: true, options: [['lower', 'lowercase'], ['upper', 'UPPERCASE']] }
    ],
    extraLabel: 'Format',
    inputs: [{ id: 'in', label: 'Input', ph: 'Hello' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'Hello' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      if (c.mode === 'encode') {
        var h = S.bytesToHex(S.textToBytes(v.in), v['hex-sep']);
        if (v['hex-case'] === 'upper') h = h.toUpperCase();
        return { text: h, hint: S.textToBytes(v.in).length + ' bytes' };
      }
      var bytes = S.hexToBytes(v.in);
      if (!bytes) return { error: 'Invalid hex — needs an even number of hex digits.' };
      return { text: S.bytesToText(bytes), hint: bytes.length + ' bytes decoded' };
    }
  });

  /* ───────────────────────── BINARY ───────────────────────── */
  S.ioTool({
    id: 'binary', name: 'Binary', group: 'Encoding', icon: 'terminal',
    desc: 'Turn text into 8-bit binary groups and read it back. Add spaces or zero-width separators.',
    tags: ['binary', 'bits', 'encode'],
    modes: [['encode', 'Encode'], ['decode', 'Decode']],
    extra: [{ id: 'bin-sep', type: 'select', label: 'Separator', value: ' ', small: true, options: [[' ', 'Space'], ['', 'None'], ['-', 'Dash'], [',', 'Comma']] }],
    extraLabel: 'Format',
    inputs: [{ id: 'in', label: 'Input', ph: 'Hello' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'Hello' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      if (c.mode === 'encode') {
        var bytes = S.textToBytes(v.in), parts = [];
        for (var i = 0; i < bytes.length; i++) parts.push(bytes[i].toString(2).padStart(8, '0'));
        return { text: parts.join(v['bin-sep']), hint: bytes.length + ' bytes' };
      }
      var cleaned = v.in.replace(/\s+/g, '');
      if (!/^[01]*$/.test(cleaned)) return { error: 'Binary can only contain 0 and 1.' };
      if (cleaned.length % 8) return { error: 'Needs groups of 8 bits — got ' + cleaned.length + '.' };
      var out = new Uint8Array(cleaned.length / 8);
      for (var j = 0; j < out.length; j++) out[j] = parseInt(cleaned.substr(j * 8, 8), 2);
      return { text: S.bytesToText(out), hint: out.length + ' bytes decoded' };
    }
  });

  /* ───────────────────────── URL ───────────────────────── */
  S.ioTool({
    id: 'url', name: 'URL Encoding', group: 'Encoding', icon: 'globe',
    desc: 'Percent-encode a string for URLs, or decode one back. Switch between component and full-URI mode.',
    tags: ['url', 'percent', 'uri', 'encode', 'escape'],
    modes: [['encode', 'Encode'], ['decode', 'Decode']],
    extra: [{ id: 'url-scope', type: 'select', label: 'Scope', value: 'component', small: true, options: [['component', 'Component (encode everything)'], ['uri', 'Full URI (keep :/?#&)']] }],
    extraLabel: 'Options',
    inputs: [{ id: 'in', label: 'Input', ph: 'https://example.com/search?q=hello world' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'https://example.com/search?q=hello world&lang=fa' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      if (c.mode === 'encode') {
        return { text: v['url-scope'] === 'uri' ? encodeURI(v.in) : encodeURIComponent(v.in) };
      }
      try { return { text: decodeURIComponent(v.in.replace(/\+/g, ' ')) }; }
      catch (e) { return { error: 'Invalid percent-encoded string.' }; }
    }
  });

  /* ───────────────────────── HTML ENTITIES ───────────────────────── */
  S.ioTool({
    id: 'html', name: 'HTML Entities', group: 'Encoding', icon: 'code',
    desc: 'Escape HTML special characters into entities, or turn entities back into text.',
    tags: ['html', 'entity', 'escape', 'xss'],
    modes: [['encode', 'Escape'], ['decode', 'Unescape']],
    extra: [{ id: 'html-style', type: 'select', label: 'Style', value: 'named', small: true, options: [['named', 'Named where possible (&amp;, &lt;)'], ['numeric', 'Numeric (&#38;)'], ['hex', 'Hex (&#x26;)']] }],
    extraLabel: 'Options',
    inputs: [{ id: 'in', label: 'Input', ph: '<div class="box">Hello & welcome</div>' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: '<div class="box">Hello & welcome</div>' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      if (c.mode === 'encode') {
        var named = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return {
          text: v.in.replace(/[&<>"']/g, function (ch) {
            if (v['html-style'] === 'named') return named[ch];
            if (v['html-style'] === 'hex') return '&#x' + ch.charCodeAt(0).toString(16) + ';';
            return '&#' + ch.charCodeAt(0) + ';';
          })
        };
      }
      var ta = document.createElement('textarea');
      ta.innerHTML = v.in;
      return { text: ta.value };
    }
  });

  /* ───────────────────────── UNICODE ESCAPES ───────────────────────── */
  S.ioTool({
    id: 'unicode', name: 'Unicode Escapes', group: 'Encoding', icon: 'type',
    desc: 'Convert characters to \\uXXXX escapes (full surrogate-pair support) and back.',
    tags: ['unicode', 'escape', 'codepoint', 'utf-16'],
    modes: [['encode', 'Encode'], ['decode', 'Decode']],
    inputs: [{ id: 'in', label: 'Input', ph: 'Hello 世界 🚀' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'Hello 世界 🚀' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      if (c.mode === 'encode') {
        var chars = Array.from(v.in);
        return {
          text: chars.map(function (ch) {
            var cp = ch.codePointAt(0);
            if (cp > 0xFFFF) {
              var hi = Math.floor((cp - 0x10000) / 0x400) + 0xD800;
              var lo = ((cp - 0x10000) % 0x400) + 0xDC00;
              return '\\u' + hi.toString(16).padStart(4, '0') + '\\u' + lo.toString(16).padStart(4, '0');
            }
            return '\\u' + cp.toString(16).padStart(4, '0');
          }).join(''),
          hint: chars.length + ' characters'
        };
      }
      try {
        return { text: v.in.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})/g, function (_, braced, plain, hex2) {
          return String.fromCodePoint(parseInt(braced || plain || hex2, 16));
        }) };
      } catch (e) { return { error: 'Malformed escape sequence.' }; }
    }
  });

  /* ───────────────────────── PUNYCODE / IDN ───────────────────────── */
  var PBASE = 36, TMIN = 1, TMAX = 26, SKEW = 38, DAMP = 700, INITIAL_BIAS = 72, INITIAL_N = 128;
  function adapt(delta, numPoints, firstTime) {
    delta = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
    delta += Math.floor(delta / numPoints);
    var k = 0;
    while (delta > ((PBASE - TMIN) * TMAX) >> 1) { delta = Math.floor(delta / (PBASE - TMIN)); k += PBASE; }
    return k + Math.floor(((PBASE - TMIN + 1) * delta) / (delta + SKEW));
  }
  function digitToBasic(d) { return String.fromCharCode(d + 22 + (d < 26 ? 75 : 0)); }
  function basicToDigit(ch) {
    var c = ch.charCodeAt(0);
    if (c >= 48 && c <= 57) return c - 22;
    if (c >= 65 && c <= 90) return c - 65;
    if (c >= 97 && c <= 122) return c - 97;
    return PBASE;
  }
  function punycodeEncode(input) {
    var codePoints = Array.from(input).map(function (c) { return c.codePointAt(0); });
    var output = [], n = INITIAL_N, delta = 0, bias = INITIAL_BIAS;
    var basic = codePoints.filter(function (c) { return c < 0x80; });
    var handled = basic.length;
    basic.forEach(function (c) { output.push(String.fromCharCode(c)); });
    if (handled) output.push('-');
    while (handled < codePoints.length) {
      var m = Infinity;
      codePoints.forEach(function (c) { if (c >= n && c < m) m = c; });
      if (m === Infinity) break;
      delta += (m - n) * (handled + 1);
      n = m;
      codePoints.forEach(function (c) {
        if (c < n) delta++;
        if (c === n) {
          var q = delta;
          for (var k = PBASE; ; k += PBASE) {
            var t = k <= bias ? TMIN : (k >= bias + TMAX ? TMAX : k - bias);
            if (q < t) break;
            output.push(digitToBasic(t + ((q - t) % (PBASE - t))));
            q = Math.floor((q - t) / (PBASE - t));
          }
          output.push(digitToBasic(q));
          bias = adapt(delta, handled + 1, handled === basic.length);
          delta = 0; handled++;
        }
      });
      delta++; n++;
    }
    return output.join('');
  }
  function punycodeDecode(input) {
    var output = [], n = INITIAL_N, i = 0, bias = INITIAL_BIAS;
    var basicEnd = input.lastIndexOf('-');
    var basic = basicEnd < 0 ? [] : input.slice(0, basicEnd).split('');
    var idx = basicEnd < 0 ? 0 : basicEnd + 1;
    basic.forEach(function (c) { output.push(c.codePointAt(0)); });
    while (idx < input.length) {
      var oldi = i, w = 1;
      for (var k = PBASE; ; k += PBASE) {
        if (idx >= input.length) throw new Error('Malformed punycode');
        var digit = basicToDigit(input.charAt(idx++));
        if (digit >= PBASE) throw new Error('Invalid punycode digit');
        i += digit * w;
        var t = k <= bias ? TMIN : (k >= bias + TMAX ? TMAX : k - bias);
        if (digit < t) break;
        w *= PBASE - t;
      }
      bias = adapt(i - oldi, output.length + 1, oldi === 0);
      n += Math.floor(i / (output.length + 1));
      i = i % (output.length + 1);
      output.splice(i, 0, n);
      i++;
    }
    return output.map(function (c) { return String.fromCodePoint(c); }).join('');
  }
  S.ioTool({
    id: 'punycode', name: 'Punycode / IDN', group: 'Encoding', icon: 'globe',
    desc: 'Convert internationalised domain names to and from their ASCII-compatible (xn--) form.',
    tags: ['punycode', 'idn', 'domain', 'xn--'],
    modes: [['encode', 'To ASCII (xn--)'], ['decode', 'To Unicode']],
    inputs: [{ id: 'in', label: 'Domain or label', ph: 'مثال.ایران  ·  bücher.example' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'مثال.ایران' },
    run: function (c) {
      var v = c.values.in.trim();
      if (!v) return '';
      var labels = v.split('.');
      try {
        if (c.mode === 'encode') {
          var enc = labels.map(function (l) {
            if (/^[\x00-\x7F]*$/.test(l)) return l;
            return 'xn--' + punycodeEncode(l);
          });
          var res = enc.join('.');
          return { text: res, hint: res === v ? 'Already ASCII — nothing to convert.' : 'Punycode domain' };
        }
        var dec = labels.map(function (l) {
          return /^xn--/i.test(l) ? punycodeDecode(l.slice(4).toLowerCase()) : l;
        });
        return { text: dec.join('.'), hint: 'Unicode domain' };
      } catch (e) { return { error: 'Punycode error: ' + e.message }; }
    }
  });

  /* ───────────────────────── MORSE ───────────────────────── */
  var MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
    I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
    Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....',
    6: '-....', 7: '--...', 8: '---..', 9: '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
    '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
    ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
    '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
  };
  var MORSE_REV = {};
  Object.keys(MORSE).forEach(function (k) { MORSE_REV[MORSE[k]] = k; });

  var FA_CHARS = {
    'آ': 'aa', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k', 'ك': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'ی': 'i', 'ي': 'i', 'ى': 'i', 'ئ': 'y', 'ء': '', 'ة': 'h', 'ؤ': 'o', 'إ': 'e', 'أ': 'a', 'ٱ': 'a',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '\u064E': 'a', '\u0650': 'e', '\u064F': 'o', '\u0651': '', '\u0652': '',
    '\u064B': 'an', '\u064D': 'en', '\u064C': 'on', '\u0654': '', '\u0655': '', '\u0670': 'a'
  };
  var FA_WORDS = {
    'و': 'o', 'به': 'beh', 'با': 'ba', 'از': 'az', 'که': 'ke', 'این': 'in', 'آن': 'oon', 'را': 'ro', 'رو': 'ro',
    'در': 'dar', 'برای': 'baraye', 'تا': 'ta', 'بر': 'bar', 'هم': 'ham', 'یا': 'ya', 'اگر': 'agar', 'اما': 'amma',
    'چون': 'chon', 'پس': 'pas', 'نیز': 'niz', 'هر': 'har', 'چه': 'che', 'چی': 'chi', 'وقتی': 'vaghti',
    'من': 'man', 'تو': 'to', 'شما': 'shoma', 'ما': 'ma', 'او': 'oo', 'اونا': 'oona', 'آنها': 'oonha',
    'منم': 'manam', 'خودم': 'khodam', 'خودت': 'khodet', 'خودش': 'khodesh', 'خودمون': 'khodemoon',
    'اینو': 'ino', 'اونو': 'oono', 'اینجا': 'inja', 'اونجا': 'oonja', 'اون': 'oon',
    'هستم': 'hastam', 'هستی': 'hasti', 'هست': 'hast', 'هستیم': 'hastim', 'هستید': 'hastid', 'هستند': 'hastand',
    'است': 'ast', 'نیست': 'nist', 'بود': 'bood', 'بودم': 'boodam', 'بودی': 'boodi', 'شد': 'shod', 'شدم': 'shodam',
    'دارم': 'daram', 'داری': 'dari', 'دارد': 'dare', 'داریم': 'darim', 'دارید': 'darid', 'دارند': 'daran',
    'میکنم': 'mikonam', 'میکنی': 'mikoni', 'میکنه': 'mikone', 'میکنیم': 'mikonim', 'میکنن': 'mikonan',
    'میروم': 'miram', 'میرم': 'miram', 'میری': 'miri', 'میره': 'mire', 'میریم': 'mirim', 'میرن': 'miran',
    'میخوام': 'mikham', 'میخواهم': 'mikham', 'میخوای': 'mikhay', 'میخواد': 'mikhad', 'میخوایم': 'mikhaym',
    'میدونم': 'midoonam', 'نمیدونم': 'nemidoonam', 'میدونی': 'midooni', 'میدونه': 'midoone',
    'میتونم': 'mitoonam', 'نمیتونم': 'namitoonam', 'میتونی': 'mitooni', 'میتونه': 'mitoone',
    'بگو': 'begu', 'برو': 'boro', 'بیا': 'bia', 'باشه': 'bashe', 'باشد': 'bashe', 'بده': 'bede', 'بگیر': 'begir',
    'سلام': 'salam', 'درود': 'dorood', 'ممنون': 'mamnoon', 'مرسی': 'mersi', 'سپاس': 'sepas',
    'خداحافظ': 'khodahafez', 'بدرود': 'bedrood', 'بله': 'baleh', 'آره': 'are', 'نه': 'na', 'نخیر': 'nakheyr',
    'چطوری': 'chetori', 'چطور': 'chetor', 'چگونه': 'chegune', 'کجا': 'koja', 'چرا': 'chera', 'کی': 'ki',
    'چند': 'chand', 'چقدر': 'cheghadr', 'الان': 'alan', 'حالا': 'hala', 'هنوز': 'hanooz', 'دیگه': 'dige',
    'امروز': 'emrooz', 'دیروز': 'dirooz', 'فردا': 'farda', 'امشب': 'emshab', 'دیشب': 'dishab',
    'خیلی': 'kheili', 'بسیار': 'besyar', 'فقط': 'faghat', 'اصلا': 'aslan', 'همیشه': 'hamishe', 'هرگز': 'hargez',
    'لطفا': 'lotfan', 'ببخشید': 'bebakhshid', 'متشکرم': 'motashakkeram', 'معذرت': 'mazerat',
    'خوب': 'khoob', 'خوبی': 'khoobi', 'خوبم': 'khoobam', 'خوبه': 'khoobe', 'خوبیم': 'khoobim',
    'بد': 'bad', 'بزرگ': 'bozorg', 'کوچک': 'koochak', 'زیاد': 'ziad', 'کم': 'kam', 'قشنگ': 'ghashang',
    'خانه': 'khuneh', 'خونه': 'khoone', 'دوست': 'doost', 'دوستت': 'doostet', 'عشق': 'eshgh', 'عاشق': 'ashegh',
    'دل': 'del', 'قلب': 'ghalb', 'جان': 'joon', 'عزیز': 'aziz', 'عزیزم': 'azizam',
    'ایران': 'iran', 'فارسی': 'farsi', 'زبان': 'zaban', 'کتاب': 'ketab', 'آب': 'ab', 'نان': 'nan', 'چای': 'chay',
    'مادر': 'madar', 'پدر': 'pedar', 'برادر': 'baradar', 'خواهر': 'khahar', 'خانواده': 'khanevade',
    'اسم': 'esm', 'اسمم': 'esmam', 'اسمت': 'esmet', 'نام': 'nam', 'کار': 'kar', 'مدرسه': 'madrese',
    'شهر': 'shahr', 'روز': 'rooz', 'شب': 'shab', 'صبح': 'sobh', 'سال': 'sal', 'ماه': 'mah', 'هفته': 'hafte',
    'ساعت': 'saat', 'وقت': 'vaght', 'زمان': 'zaman', 'مردم': 'mardom', 'بچه': 'bache', 'بچهها': 'bacheha',
    'یک': 'yek', 'دو': 'do', 'سه': 'se', 'چهار': 'chahar', 'پنج': 'panj', 'شش': 'shesh', 'هفت': 'haft',
    'هشت': 'hasht', 'ده': 'dah', 'صد': 'sad', 'هزار': 'hezar', 'میلیون': 'milion',
    'مثل': 'mesl', 'واقعا': 'vaghean', 'حتما': 'hatman', 'شاید': 'shayad', 'معلوم': 'maloom',
    'چشم': 'cheshm', 'گوش': 'goosh', 'دست': 'dast', 'پا': 'pa', 'سر': 'sar', 'هوا': 'hava', 'کوه': 'kooh'
  };
  var FA_RE = /[\u0600-\u06FF]/;
  var FA_JOIN = /[\u0600-\u06FF\u200c]/;
  var FING_SET = new Set(('salam khoob khoobi khoobam chetori mamnoon mersi khodahafez baleh are na man shoma ma oo hastam hasti hast daram dari dare mikham mikoni mikone miram miri mire baraye lotfan bebakhshid kheili faghat alan emrooz farda khuneh khoone doost eshgh aziz iran farsi zaban ketab madar pedar baradar khahar bache yek do se chahar panj shesh haft hasht dah begu boro bia bashe').split(' '));
  var ENG_SET = new Set(('the is are am you he she it we they have has do does did will would can could should this that these those and or but not my your his her our their hello hi how what when where why who good bad yes no please thanks sorry name from with for on at in to of a an be was were very just now here there more most other people time year way day man thing woman life world school state family student country problem hand part place week work number night point home water room mother money story fact month book eye job word business side kind head house service friend father power hour game line end member law car city team minute idea body information').split(' '));
  function translitWord(w) {
    if (FA_WORDS[w] !== undefined) return FA_WORDS[w];
    var out = '', len = w.length;
    for (var i = 0; i < len; i++) {
      var ch = w.charAt(i);
      if (ch === 'ه' && i === len - 1 && len > 1 && w.charAt(len - 2) !== 'ا') { out += 'eh'; continue; }
      if (ch === 'و') { out += (i === 0 && len > 1) ? 'v' : 'oo'; continue; }
      if (FA_CHARS[ch] !== undefined) out += FA_CHARS[ch];
    }
    return out;
  }
  function toFingilish(text) {
    if (!FA_RE.test(text)) return text;
    var out = '', buf = '';
    function flush() { if (buf) { out += translitWord(buf); buf = ''; } }
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === '\u200c' || ch === '\u200e' || ch === '\u200f') continue;
      if (FA_JOIN.test(ch)) buf += ch; else { flush(); out += ch; }
    }
    flush(); return out;
  }
  function detectLang(text) {
    var toks = (text.toLowerCase().match(/[a-z]+/g)) || [];
    if (!toks.length) return 'empty';
    var f = 0, e = 0;
    toks.forEach(function (t) {
      if (FING_SET.has(t)) f += 1;
      if (ENG_SET.has(t)) e += 1;
      if (/^(kh|gh)/.test(t)) f += 0.5;
      if (t.length <= 8 && /(oo|aa)/.test(t)) f += 0.25;
    });
    if (!f && !e) return 'unknown';
    if (f > e) return 'fingilish';
    if (e > f) return 'english';
    return 'mixed';
  }

  S.customTool({
    id: 'morse', name: 'Morse Code', group: 'Encoding', icon: 'radio', primary: true,
    desc: 'Translate to and from Morse, with automatic Persian → Fingilish transliteration and audible playback.',
    tags: ['morse', 'dot', 'dash', 'telegraph', 'persian', 'fingilish', 'audio'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['encode', 'Text → Morse'], ['decode', 'Morse → Text']], 'encode') +
        '<span class="chip" id="morse-lang">type something…</span></div>' +
        '<label class="field-label" for="morse-in">Input</label>' +
        '<textarea id="morse-in" class="field" rows="4" placeholder="Man khoob hastam   ·   or «من خوب هستم»" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-swap" id="morse-swap" type="button">' + S.icon('swap') + 'Swap</button>' +
        '<button class="btn btn-soft" id="morse-sample" type="button">' + S.icon('wand') + 'Sample</button>' +
        '<button class="btn btn-ghost" id="morse-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<div id="morse-norm-wrap" hidden><label class="field-label">Normalised text</label>' +
        '<div class="mono-block mark" id="morse-norm"></div></div>' +
        '<label class="field-label" for="morse-out">Result</label>' +
        '<textarea id="morse-out" class="field" rows="4" readonly placeholder="· − ·· ·· will appear here…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="morse-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="morse-play" type="button"><span class="lamp" id="morse-lamp"></span>Play</button>' +
        '<button class="btn btn-ghost btn-sm" id="morse-copy" type="button">' + S.icon('copy') + 'Copy</button>' +
        '</div></div>' +
        '<div class="panel-section"><p class="section-label">Playback</p>' +
        '<div class="range-row"><input type="range" id="morse-wpm" min="5" max="30" value="15"><span class="range-val" id="morse-wpm-val">15 WPM</span></div>' +
        '<div class="range-row mt-1"><input type="range" id="morse-tone" min="300" max="1200" step="20" value="620"><span class="range-val" id="morse-tone-val">620 Hz</span></div></div>');
    },
    mount: function () {
      var mode = 'encode';
      var inp = $('morse-in'), out = $('morse-out'), hint = $('morse-hint'), lang = $('morse-lang');
      function setHint(t, k) { hint.className = 'hint' + (k ? ' ' + k : ''); hint.textContent = t || ''; }
      function setLang(kind) {
        var map = {
          fingilish: ['mark', 'Fingilish detected'], english: ['', 'English detected'],
          mixed: ['', 'Mixed signal'], unknown: ['', 'Not enough signal'], persian: ['ok', 'Persian → Fingilish (auto)'], empty: ['', 'type something…']
        };
        var m = map[kind] || map.empty;
        lang.className = 'chip' + (m[0] ? ' ' + m[0] : '');
        lang.textContent = m[1];
      }
      function update() {
        setHint('');
        if (mode === 'encode') {
          var raw = inp.value;
          if (!raw.trim()) { out.value = ''; $('morse-norm-wrap').hidden = true; setLang('empty'); return; }
          var hadFa = FA_RE.test(raw);
          var latin = toFingilish(raw);
          setLang(hadFa ? 'persian' : detectLang(latin));
          var upper = latin.toUpperCase().replace(/\s+/g, ' ').trim();
          $('morse-norm-wrap').hidden = !hadFa;
          $('morse-norm').textContent = upper;
          var skipped = new Set();
          out.value = upper.split(' ').map(function (w) {
            return w.split('').map(function (ch) {
              if (MORSE[ch]) return MORSE[ch];
              skipped.add(ch); return '';
            }).filter(Boolean).join(' ');
          }).filter(Boolean).join(' / ');
          var notes = [];
          if (hadFa) notes.push('Persian transliterated to Fingilish.');
          if (skipped.size) notes.push('Skipped: ' + Array.from(skipped).join(' '));
          setHint(notes.join(' '), skipped.size ? 'warn' : '');
        } else {
          $('morse-norm-wrap').hidden = true;
          var t = inp.value.trim();
          if (!t) { out.value = ''; setLang('empty'); return; }
          if (!/^[.\-\/\s·−]+$/.test(t)) { out.value = ''; setHint('Only dots, dashes, spaces and / are allowed.', 'error'); return; }
          var unknown = 0;
          var decoded = t.replace(/[·−]/g, function (c) { return c === '·' ? '.' : '-'; })
            .split(/\s*\/\s*/).filter(Boolean).map(function (w) {
              return w.trim().split(/\s+/).filter(Boolean).map(function (code) {
                var ch = MORSE_REV[code];
                if (!ch) { unknown++; return ''; }
                return ch;
              }).join('');
            }).join(' ');
          out.value = decoded;
          setHint(unknown ? unknown + ' unknown group(s) ignored.' : '', unknown ? 'warn' : '');
          setLang(detectLang(decoded));
        }
      }
      $$('.mode-btn', $('panel-morse')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-morse')).forEach(function (x) { x.classList.toggle('active', x === b); });
          inp.placeholder = mode === 'encode' ? 'Man khoob hastam   ·   or «من خوب هستم»' : '-- .- -. / -.- .... --- --- -...';
          update();
        });
      });
      inp.addEventListener('input', update);
      $('morse-swap').addEventListener('click', function () {
        var t = inp.value; inp.value = out.value; out.value = t;
        mode = mode === 'encode' ? 'decode' : 'encode';
        $$('.mode-btn', $('panel-morse')).forEach(function (x) { x.classList.toggle('active', x.dataset.mode === mode); });
        update();
      });
      $('morse-sample').addEventListener('click', function () {
        inp.value = mode === 'encode' ? 'من خوب هستم' : '-- .- -. / -.- .... --- --- -... / .... .- ... - .- --';
        update();
      });
      $('morse-clear').addEventListener('click', function () { inp.value = ''; update(); });
      $('morse-copy').addEventListener('click', function () { S.copyText(out.value); });
      $('morse-wpm').addEventListener('input', function () { $('morse-wpm-val').textContent = this.value + ' WPM'; });
      $('morse-tone').addEventListener('input', function () { $('morse-tone-val').textContent = this.value + ' Hz'; });

      var ctx = null;
      function ensureAudio() {
        if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
      }
      $('morse-play').addEventListener('click', function () {
        var src = (mode === 'encode' ? out.value : inp.value).trim();
        if (!src) { S.toast('Nothing to play yet', 'info'); return; }
        if (!/^[.\-\/\s]+$/.test(src)) { S.toast('Only a dot-dash signal can be played', 'err'); return; }
        var ac = ensureAudio();
        if (!ac) { S.toast('Audio is not supported here', 'err'); return; }
        var unit = 1.2 / parseInt($('morse-wpm').value, 10);
        var freq = parseInt($('morse-tone').value, 10);
        var t = ac.currentTime + 0.12;
        var osc = ac.createOscillator(), gain = ac.createGain();
        osc.type = 'sine'; osc.frequency.value = freq; gain.gain.value = 0.0001;
        osc.connect(gain).connect(ac.destination); osc.start();
        var events = [];
        src.trim().split(/\s*\/\s*/).filter(Boolean).forEach(function (word) {
          word.trim().split(/\s+/).filter(Boolean).forEach(function (letter) {
            for (var i = 0; i < letter.length; i++) {
              var dur = letter[i] === '-' ? unit * 3 : unit;
              gain.gain.setValueAtTime(0.0001, t);
              gain.gain.exponentialRampToValueAtTime(0.32, t + 0.005);
              gain.gain.setValueAtTime(0.32, t + dur - 0.005);
              gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
              events.push({ s: t, e: t + dur });
              t += dur + unit;
            }
            t += unit * 2;
          });
          t += unit * 4;
        });
        osc.stop(t + 0.1);
        osc.onended = function () { try { osc.disconnect(); gain.disconnect(); } catch (e) {} };
        var lamp = $('morse-lamp'), base = ac.currentTime;
        events.forEach(function (ev) {
          setTimeout(function () { lamp.classList.add('lit'); }, Math.max(0, (ev.s - base) * 1000));
          setTimeout(function () { lamp.classList.remove('lit'); }, Math.max(0, (ev.e - base) * 1000));
        });
      });
      update();
    }
  });

  /* ───────────────────────── NATO ALPHABET ───────────────────────── */
  var NATO = { A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'Xray', Y: 'Yankee', Z: 'Zulu', 0: 'Zero', 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Niner' };
  S.ioTool({
    id: 'nato', name: 'NATO Phonetic', group: 'Encoding', icon: 'radio',
    desc: 'Spell anything out using the NATO/ICAO phonetic alphabet — the one used on the radio.',
    tags: ['nato', 'phonetic', 'spelling', 'radio'],
    inputs: [{ id: 'in', label: 'Input', ph: 'Signal' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'Signal' },
    run: function (c) {
      if (!c.values.in) return '';
      var skipped = new Set();
      var words = c.values.in.toUpperCase().split('').map(function (ch) {
        if (NATO[ch]) return NATO[ch];
        if (/\s/.test(ch)) return '/';
        skipped.add(ch); return null;
      }).filter(Boolean);
      return { text: words.join(' '), hint: skipped.size ? 'Skipped: ' + Array.from(skipped).join(' ') : '' };
    }
  });

  /* ───────────────────────── CHARACTER INSPECTOR ───────────────────────── */
  S.customTool({
    id: 'chars', name: 'Character Inspector', group: 'Encoding', icon: 'type',
    desc: 'Break any text down character by character: code point, UTF-8 bytes, UTF-16 units and HTML entity.',
    tags: ['unicode', 'codepoint', 'character', 'inspect', 'utf8'],
    build: function () {
      return S.wrapPanel(this,
        '<label class="field-label" for="ch-in">Text</label>' +
        '<textarea id="ci-in" class="field field-sm" rows="2" placeholder="Hello 世界 🚀" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="ci-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="ci-copy" type="button">' + S.icon('copy') + 'Copy table</button></div></div>' +
        '<div class="char-grid mt-2" id="ci-grid"></div>' +
        '<div class="panel-section"><p class="section-label">Detail</p><div id="ci-detail" class="text-dim" style="font-size:13px;">Tap a character above.</div></div>');
    },
    mount: function () {
      var inp = $('ci-in'), grid = $('ci-grid'), hint = $('ci-hint'), detail = $('ci-detail');
      function render() {
        var chars = Array.from(inp.value);
        hint.textContent = chars.length + ' characters · ' + S.textToBytes(inp.value).length + ' UTF-8 bytes';
        if (!chars.length) { grid.innerHTML = '<span class="text-dim">Nothing to inspect.</span>'; detail.textContent = 'Tap a character above.'; return; }
        grid.innerHTML = chars.slice(0, 400).map(function (ch, i) {
          var cp = ch.codePointAt(0);
          return '<div class="char-cell" data-i="' + i + '" title="U+' + cp.toString(16).toUpperCase().padStart(4, '0') + '">' +
            '<div class="cc-g">' + esc(ch === ' ' ? '␠' : ch === '\n' ? '⏎' : ch) + '</div>' +
            '<div class="cc-c">' + cp.toString(16).toUpperCase().padStart(4, '0') + '</div></div>';
        }).join('');
        $$('.char-cell', grid).forEach(function (cell) {
          cell.addEventListener('click', function () { showDetail(chars[+cell.dataset.i]); });
        });
      }
      function showDetail(ch) {
        var cp = ch.codePointAt(0);
        var utf8 = Array.from(S.textToBytes(ch)).map(function (b) { return b.toString(16).toUpperCase().padStart(2, '0'); }).join(' ');
        var u16 = [];
        for (var i = 0; i < ch.length; i++) u16.push('U+' + ch.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'));
        var names = { ' ': 'SPACE', '\n': 'LINE FEED', '\t': 'TAB', '\r': 'CARRIAGE RETURN' };
        detail.innerHTML = '<div class="kv-list">' +
          '<div class="kv-row"><div class="kv-k">Character</div><div class="kv-v">' + esc(ch === ' ' ? '(space)' : ch) + '</div></div>' +
          '<div class="kv-row"><div class="kv-k">Code point</div><div class="kv-v">U+' + cp.toString(16).toUpperCase().padStart(4, '0') + ' (' + cp + ')</div></div>' +
          '<div class="kv-row"><div class="kv-k">UTF-8 bytes</div><div class="kv-v">' + utf8 + '</div></div>' +
          '<div class="kv-row"><div class="kv-k">UTF-16</div><div class="kv-v">' + u16.join(' ') + '</div></div>' +
          '<div class="kv-row"><div class="kv-k">HTML entity</div><div class="kv-v">&amp;#' + cp + '; &nbsp;/&nbsp; &amp;#x' + cp.toString(16) + ';</div></div>' +
          '<div class="kv-row"><div class="kv-k">JS escape</div><div class="kv-v">\\u' + cp.toString(16).padStart(4, '0') + '</div></div>' +
          (names[ch] ? '<div class="kv-row"><div class="kv-k">Name</div><div class="kv-v">' + names[ch] + '</div></div>' : '') +
          '</div>';
      }
      inp.addEventListener('input', S.debounce(render, 80));
      $('ci-copy').addEventListener('click', function () {
        var lines = Array.from(inp.value).map(function (ch) {
          return ch + '\tU+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + '\t' + ch.codePointAt(0);
        });
        S.copyText(lines.join('\n'));
      });
      inp.value = 'Hello 世界 🚀';
      render();
    }
  });

  /* ───────────────────────── ASCII TABLE ───────────────────────── */
  S.customTool({
    id: 'ascii', name: 'ASCII / Byte Table', group: 'Encoding', icon: 'terminal',
    desc: 'A complete reference of the printable ASCII range with decimal, hex, binary and HTML forms.',
    tags: ['ascii', 'table', 'reference', 'bytes'],
    build: function () {
      var rows = '';
      for (var i = 32; i < 127; i++) {
        var ch = String.fromCharCode(i);
        rows += '<tr><td>' + esc(ch === '<' ? '&lt;' : ch) + '</td><td>' + i + '</td><td>' + i.toString(16).toUpperCase().padStart(2, '0') +
          '</td><td>' + i.toString(2).padStart(8, '0') + '</td><td>&amp;#' + i + ';</td></tr>';
      }
      return S.wrapPanel(this,
        '<div class="table-wrap" style="max-height:460px;overflow:auto;">' +
        '<table class="data-table"><thead><tr><th>Chr</th><th>Dec</th><th>Hex</th><th>Bin</th><th>HTML</th></tr></thead><tbody>' + rows + '</tbody></table></div>');
    }
  });

})(window.Signal);
