/* ══════════════════════════════════════════════════════════════════════════
   SIGNAL — classical ciphers, modern ciphers, asymmetric crypto
   ══════════════════════════════════════════════════════════════════════════ */
(function (S) {
  'use strict';
  var $ = S.$, $$ = S.$$, esc = S.escapeHtml;
  var HAS_SUBTLE = !!(window.crypto && crypto.subtle && crypto.subtle.generateKey);
  var HAS_CRYPTOJS = (typeof CryptoJS !== 'undefined');

  function setHint(id, text, kind) {
    var el = $(id);
    if (!el) return;
    el.className = 'hint' + (kind ? ' ' + kind : '');
    el.textContent = text || '';
  }

  /* ═══════════════ CAESAR (+ brute force) ═══════════════ */
  function caesarShift(text, shift, decrypt) {
    var s = decrypt ? (26 - (((shift % 26) + 26) % 26)) % 26 : ((shift % 26) + 26) % 26;
    return text.replace(/[a-zA-Z]/g, function (ch) {
      var base = ch <= 'Z' ? 65 : 97;
      return String.fromCharCode(((ch.charCodeAt(0) - base + s) % 26) + base);
    });
  }
  S.customTool({
    id: 'caesar', name: 'Caesar Cipher', group: 'Cipher', icon: 'wave', primary: true,
    desc: 'The classic shift cipher — plus a brute-force view that shows every one of the 25 possible shifts at once.',
    tags: ['caesar', 'shift', 'rot', 'brute force', 'classical'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['encode', 'Encrypt'], ['decode', 'Decrypt'], ['brute', 'Brute force']], 'encode') + '</div>' +
        '<div id="caesar-shift-wrap">' +
        '<label class="field-label" for="caesar-shift">Shift</label>' +
        '<div class="range-row"><input type="range" id="caesar-shift" min="1" max="25" value="3"><span class="range-val" id="caesar-shift-val">3</span></div></div>' +
        '<label class="field-label" for="caesar-in">Input</label>' +
        '<textarea id="caesar-in" class="field" rows="4" placeholder="ATTACK AT DAWN" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-swap" id="caesar-swap" type="button">' + S.icon('swap') + 'Swap</button>' +
        '<button class="btn btn-soft" id="caesar-sample" type="button">' + S.icon('wand') + 'Sample</button>' +
        '<button class="btn btn-ghost" id="caesar-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="caesar-out">Result</label>' +
        '<textarea id="caesar-out" class="field" rows="4" readonly placeholder="Result…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="caesar-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="caesar-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>' +
        '<div id="caesar-brute" hidden><div class="panel-section"><p class="section-label">All 25 shifts</p>' +
        '<div class="table-wrap"><table class="data-table"><tbody id="caesar-brute-body"></tbody></table></div></div></div>');
    },
    mount: function () {
      var mode = 'encode';
      var inp = $('caesar-in'), out = $('caesar-out');
      function run() {
        var shift = parseInt($('caesar-shift').value, 10) || 0;
        $('caesar-shift-val').textContent = shift;
        $('caesar-shift-wrap').hidden = mode === 'brute';
        $('caesar-brute').hidden = mode !== 'brute';
        if (mode === 'brute') {
          out.value = '';
          var src = inp.value;
          if (!src) { $('caesar-brute-body').innerHTML = '<tr><td class="text-dim">Type something to brute force.</td></tr>'; setHint(''); return; }
          $('caesar-brute-body').innerHTML = Array.from({ length: 25 }, function (_, i) {
            return '<tr><td style="width:52px;color:var(--dim)">' + (i + 1) + '</td><td>' + esc(caesarShift(src, i + 1, false)) + '</td></tr>';
          }).join('');
          setHint('25 candidate shifts');
          return;
        }
        out.value = caesarShift(inp.value, shift, mode === 'decode');
        setHint('');
      }
      $$('.mode-btn', $('panel-caesar')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-caesar')).forEach(function (x) { x.classList.toggle('active', x === b); });
          run();
        });
      });
      $('caesar-shift').addEventListener('input', run);
      inp.addEventListener('input', run);
      $('caesar-swap').addEventListener('click', function () {
        if (mode === 'brute') { S.toast('Switch off brute force first', 'info'); return; }
        var t = inp.value; inp.value = out.value; out.value = t;
        mode = mode === 'encode' ? 'decode' : 'encode';
        $$('.mode-btn', $('panel-caesar')).forEach(function (x) { x.classList.toggle('active', x.dataset.mode === mode); });
        run();
      });
      $('caesar-sample').addEventListener('click', function () {
        inp.value = mode === 'brute' ? 'WKH TXLFN EURZQ IRA MXPSV RYHU WKH ODCB GRJ' : 'ATTACK AT DAWN';
        run();
      });
      $('caesar-clear').addEventListener('click', function () { inp.value = ''; run(); });
      $('caesar-copy').addEventListener('click', function () { S.copyText(out.value); });
      inp.value = 'ATTACK AT DAWN';
      run();
    }
  });

  /* ═══════════════ ROT FAMILY ═══════════════ */
  function rot13(t) { return t.replace(/[a-zA-Z]/g, function (c) { var b = c <= 'Z' ? 65 : 97; return String.fromCharCode(((c.charCodeAt(0) - b + 13) % 26) + b); }); }
  function rot5(t) { return t.replace(/[0-9]/g, function (c) { return String.fromCharCode(((c.charCodeAt(0) - 48 + 5) % 10) + 48); }); }
  function rot18(t) { return rot5(rot13(t)); }
  function rot47(t) { return t.replace(/[!-~]/g, function (c) { return String.fromCharCode(33 + ((c.charCodeAt(0) - 33 + 47) % 94)); }); }
  S.ioTool({
    id: 'rot13', name: 'ROT-N Family', group: 'Cipher', icon: 'refresh',
    desc: 'ROT13, ROT5, ROT18 and ROT47 — self-inverse rotation ciphers. Applying them twice returns the original.',
    tags: ['rot13', 'rot5', 'rot18', 'rot47', 'rotation'],
    extra: [{ id: 'rot-kind', type: 'select', label: 'Variant', value: 'rot13', small: true, options: [['rot13', 'ROT13 — letters A–Z'], ['rot5', 'ROT5 — digits 0–9'], ['rot18', 'ROT18 — letters + digits'], ['rot47', 'ROT47 — all printable ASCII']] }],
    extraLabel: 'Variant',
    inputs: [{ id: 'in', label: 'Input', ph: 'Hello World 2026' }],
    output: { id: 'out', label: 'Result' },
    swap: false,
    sample: { in: 'Hello World 2026' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      var fn = { rot13: rot13, rot5: rot5, rot18: rot18, rot47: rot47 }[v['rot-kind']] || rot13;
      return { text: fn(v.in), hint: 'Self-inverse — run it again to undo.' };
    }
  });

  /* ═══════════════ A1Z26 ═══════════════ */
  S.ioTool({
    id: 'a1z26', name: 'A1Z26', group: 'Cipher', icon: 'hash',
    desc: 'Replace every letter with its position in the alphabet (A=1 … Z=26) and back again.',
    tags: ['a1z26', 'alphabet', 'numbers', 'classical'],
    modes: [['encode', 'Letters → Numbers'], ['decode', 'Numbers → Letters']],
    extra: [{ id: 'a1-sep', type: 'select', label: 'Separator', value: '-', small: true, options: [['-', 'Dash'], [' ', 'Space'], [',', 'Comma'], ['.', 'Dot']] }],
    extraLabel: 'Format',
    inputs: [{ id: 'in', label: 'Input', ph: 'Hello World' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'Hello World' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      var sep = v['a1-sep'];
      if (c.mode === 'encode') {
        var skipped = new Set();
        var parts = v.in.toUpperCase().split('').map(function (ch) {
          if (/[A-Z]/.test(ch)) return String(ch.charCodeAt(0) - 64);
          if (/\s/.test(ch)) return '/';
          skipped.add(ch); return null;
        }).filter(Boolean);
        return { text: parts.join(sep), hint: skipped.size ? 'Skipped: ' + Array.from(skipped).join(' ') : '' };
      }
      var toks = v.in.trim().split(new RegExp('[' + sep.replace(/[\\^\]]/g, '\\$&') + '\\s/]+')).filter(Boolean);
      var bad = false;
      var text = toks.map(function (t) {
        var n = parseInt(t, 10);
        if (isNaN(n) || n < 1 || n > 26) { bad = true; return '?'; }
        return String.fromCharCode(64 + n);
      }).join('');
      return { text: text, hint: bad ? 'Some values were outside 1–26.' : '', hintKind: bad ? 'warn' : '' };
    }
  });

  /* ═══════════════ ATBASH ═══════════════ */
  function atbash(t) {
    return t.replace(/[a-zA-Z]/g, function (c) {
      var b = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(b + (25 - (c.charCodeAt(0) - b)));
    });
  }
  S.ioTool({
    id: 'atbash', name: 'Atbash', group: 'Cipher', icon: 'refresh',
    desc: 'The ancient Hebrew mirror cipher — A becomes Z, B becomes Y, and so on.',
    tags: ['atbash', 'mirror', 'hebrew', 'classical'],
    inputs: [{ id: 'in', label: 'Input', ph: 'HELLO' }],
    output: { id: 'out', label: 'Result' },
    swap: false,
    sample: { in: 'HELLO' },
    run: function (c) { return c.values.in ? { text: atbash(c.values.in), hint: 'Self-inverse.' } : ''; }
  });

  /* ═══════════════ VIGENÈRE ═══════════════ */
  function vigenere(text, key, decrypt) {
    key = String(key).toUpperCase().replace(/[^A-Z]/g, '');
    if (!key) return text;
    var out = '', ki = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (/[a-zA-Z]/.test(ch)) {
        var base = ch <= 'Z' ? 65 : 97;
        var k = key.charCodeAt(ki % key.length) - 65;
        out += String.fromCharCode(((ch.charCodeAt(0) - base + (decrypt ? 26 - k : k)) % 26) + base);
        ki++;
      } else out += ch;
    }
    return out;
  }
  S.ioTool({
    id: 'vigenere', name: 'Vigenère', group: 'Cipher', icon: 'key',
    desc: 'A polyalphabetic cipher driven by a keyword — far stronger than a plain Caesar shift.',
    tags: ['vigenere', 'keyword', 'polyalphabetic', 'classical'],
    modes: [['encode', 'Encrypt'], ['decode', 'Decrypt']],
    extra: [{ id: 'vig-key', type: 'text', label: 'Key', value: 'LEMON', ph: 'LEMON' }],
    extraLabel: 'Key',
    inputs: [{ id: 'in', label: 'Input', ph: 'ATTACKATDAWN' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'ATTACKATDAWN', 'vig-key': 'LEMON' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      var key = String(v['vig-key'] || '').replace(/[^a-zA-Z]/g, '');
      if (!key) return { error: 'Enter a key (letters only).' };
      return { text: vigenere(v.in, key, c.mode === 'decode'), hint: 'Key length ' + key.length };
    }
  });

  /* ═══════════════ AFFINE ═══════════════ */
  var COPRIME = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
  function modInverse(a, m) {
    a = ((a % m) + m) % m;
    for (var x = 1; x < m; x++) if ((a * x) % m === 1) return x;
    return null;
  }
  S.ioTool({
    id: 'affine', name: 'Affine Cipher', group: 'Cipher', icon: 'key',
    desc: 'A mathematical substitution: each letter becomes (a·x + b) mod 26. The multiplier must be coprime with 26.',
    tags: ['affine', 'math', 'substitution', 'classical'],
    modes: [['encode', 'Encrypt'], ['decode', 'Decrypt']],
    extra: [
      { id: 'aff-a', type: 'select', label: 'Multiplier a', value: '5', small: true, options: COPRIME.map(function (n) { return [String(n), n + (n === 1 ? ' (identity)' : '')]; }) },
      { id: 'aff-b', type: 'number', label: 'Shift b', value: '8' }
    ],
    extraLabel: 'Key',
    inputs: [{ id: 'in', label: 'Input', ph: 'AFFINE CIPHER' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'AFFINE CIPHER', 'aff-a': '5', 'aff-b': '8' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      var a = parseInt(v['aff-a'], 10) || 1, b = parseInt(v['aff-b'], 10) || 0;
      var inv = null;
      if (c.mode === 'decode') {
        inv = modInverse(a, 26);
        if (inv === null) return { error: 'a=' + a + ' is not coprime with 26 — pick another multiplier.' };
      }
      return {
        text: v.in.replace(/[a-zA-Z]/g, function (ch) {
          var base = ch <= 'Z' ? 65 : 97;
          var x = ch.charCodeAt(0) - base, y;
          y = c.mode === 'decode' ? ((inv * (x - b)) % 26 + 26) % 26 : ((a * x + b) % 26 + 26) % 26;
          return String.fromCharCode(base + y);
        }),
        hint: 'a=' + a + '  b=' + b + (inv ? '  a⁻¹=' + inv : '')
      };
    }
  });

  /* ═══════════════ PLAYFAIR ═══════════════ */
  function playfairSquare(key) {
    key = String(key).toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
    var seen = {}, sq = [];
    for (var i = 0; i < key.length; i++) if (!seen[key[i]]) { seen[key[i]] = 1; sq.push(key[i]); }
    for (var j = 65; j <= 90; j++) {
      var ch = String.fromCharCode(j);
      if (ch === 'J') continue;
      if (!seen[ch]) { seen[ch] = 1; sq.push(ch); }
    }
    var grid = [];
    for (var r = 0; r < 5; r++) grid.push(sq.slice(r * 5, r * 5 + 5));
    return grid;
  }
  function playfair(text, key, decrypt) {
    var grid = playfairSquare(key), pos = {};
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) pos[grid[r][c]] = { r: r, c: c };
    var clean = String(text).toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
    var pairs = [];
    if (decrypt) {
      for (var k = 0; k + 1 < clean.length; k += 2) pairs.push([clean[k], clean[k + 1]]);
    } else {
      for (var i = 0; i < clean.length;) {
        var a = clean[i], b = clean[i + 1];
        if (!b) { pairs.push([a, 'X']); i += 1; }
        else if (a === b) { pairs.push([a, 'X']); i += 1; }
        else { pairs.push([a, b]); i += 2; }
      }
    }
    var out = '';
    pairs.forEach(function (p) {
      var p1 = pos[p[0]], p2 = pos[p[1]];
      if (!p1 || !p2) { out += p[0] + p[1]; return; }
      if (p1.r === p2.r) out += grid[p1.r][(p1.c + (decrypt ? 4 : 1)) % 5] + grid[p2.r][(p2.c + (decrypt ? 4 : 1)) % 5];
      else if (p1.c === p2.c) out += grid[(p1.r + (decrypt ? 4 : 1)) % 5][p1.c] + grid[(p2.r + (decrypt ? 4 : 1)) % 5][p2.c];
      else out += grid[p1.r][p2.c] + grid[p2.r][p1.c];
    });
    return out;
  }
  S.ioTool({
    id: 'playfair', name: 'Playfair', group: 'Cipher', icon: 'layers',
    desc: 'Digraph substitution on a 5×5 square built from a keyword — the first practical polyalphabetic cipher.',
    tags: ['playfair', 'digraph', 'keyword', 'classical'],
    modes: [['encode', 'Encrypt'], ['decode', 'Decrypt']],
    extra: [{ id: 'pf-key', type: 'text', label: 'Key', value: 'PLAYFAIR', ph: 'PLAYFAIR' }],
    extraLabel: 'Key',
    inputs: [{ id: 'in', label: 'Input (letters only)', ph: 'HIDETHEGOLDINTHETREE' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'HIDETHEGOLDINTHETREE', 'pf-key': 'PLAYFAIR' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      if (!String(v['pf-key']).replace(/[^a-zA-Z]/g, '')) return { error: 'Enter a key.' };
      var res = playfair(v.in, v['pf-key'], c.mode === 'decode');
      return {
        text: res,
        hint: 'Note: J is folded into I and X pads the last pair, so decrypt output may contain padding.'
      };
    }
  });

  /* ═══════════════ HILL (2×2) ═══════════════ */
  function hill(text, k11, k12, k21, k22, decrypt) {
    var det = (k11 * k22 - k12 * k21) % 26;
    det = ((det % 26) + 26) % 26;
    var detInv = modInverse(det, 26);
    if (detInv === null) return { error: 'Matrix is not invertible mod 26 (determinant ' + det + ' shares a factor with 26). Pick another key.' };
    var clean = String(text).toUpperCase().replace(/[^A-Z]/g, '');
    if (!clean.length) return { text: '' };
    if (clean.length % 2) clean += 'X';
    var a = k11, b = k12, c = k21, d = k22;
    if (decrypt) {
      var ia = detInv * k22, ib = detInv * -k12, ic = detInv * -k21, id = detInv * k11;
      a = ((ia % 26) + 26) % 26; b = ((ib % 26) + 26) % 26;
      c = ((ic % 26) + 26) % 26; d = ((id % 26) + 26) % 26;
    }
    var out = '';
    for (var i = 0; i < clean.length; i += 2) {
      var x = clean.charCodeAt(i) - 65, y = clean.charCodeAt(i + 1) - 65;
      out += String.fromCharCode(65 + (((a * x + b * y) % 26) + 26) % 26);
      out += String.fromCharCode(65 + (((c * x + d * y) % 26) + 26) % 26);
    }
    return { text: out, hint: 'Determinant ' + det + ', inverse ' + detInv };
  }
  S.ioTool({
    id: 'hill', name: 'Hill Cipher', group: 'Cipher', icon: 'scale',
    desc: 'A 2×2 matrix cipher from linear algebra. The key matrix must be invertible modulo 26.',
    tags: ['hill', 'matrix', 'linear algebra', 'classical'],
    modes: [['encode', 'Encrypt'], ['decode', 'Decrypt']],
    extra: [
      { id: 'h11', type: 'number', label: 'k₁₁', value: '3', small: true },
      { id: 'h12', type: 'number', label: 'k₁₂', value: '3', small: true },
      { id: 'h21', type: 'number', label: 'k₂₁', value: '2', small: true },
      { id: 'h22', type: 'number', label: 'k₂₂', value: '5', small: true }
    ],
    extraLabel: 'Key matrix',
    inputs: [{ id: 'in', label: 'Input (letters only)', ph: 'HELP' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'HELP' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      return hill(v.in, +v.h11 || 0, +v.h12 || 0, +v.h21 || 0, +v.h22 || 0, c.mode === 'decode');
    }
  });

  /* ═══════════════ RAIL FENCE ═══════════════ */
  function railFence(text, rails, decrypt) {
    rails = Math.max(2, Math.min(20, rails | 0));
    var chars = String(text).split('');
    var pattern = [], r = 0, dir = 1;
    for (var i = 0; i < chars.length; i++) {
      pattern.push(r);
      if (r === 0) dir = 1; else if (r === rails - 1) dir = -1;
      r += dir;
    }
    if (!decrypt) {
      var rows = Array.from({ length: rails }, function () { return []; });
      chars.forEach(function (ch, i) { rows[pattern[i]].push(ch); });
      return rows.map(function (row) { return row.join(''); }).join('');
    }
    var counts = new Array(rails).fill(0);
    pattern.forEach(function (p) { counts[p]++; });
    var idx = 0, railData = counts.map(function (n) { var s = chars.slice(idx, idx + n); idx += n; return s; });
    var cursor = new Array(rails).fill(0), out = '';
    pattern.forEach(function (p) { out += railData[p][cursor[p]++]; });
    return out;
  }
  S.ioTool({
    id: 'railfence', name: 'Rail Fence', group: 'Cipher', icon: 'wave',
    desc: 'A transposition cipher that writes the message in a zig-zag across several rails, then reads row by row.',
    tags: ['rail fence', 'zigzag', 'transposition', 'classical'],
    modes: [['encode', 'Encrypt'], ['decode', 'Decrypt']],
    extra: [{ id: 'rf-rails', type: 'number', label: 'Rails', value: '3', min: 2, max: 20 }],
    extraLabel: 'Settings',
    inputs: [{ id: 'in', label: 'Input', ph: 'WE ARE DISCOVERED FLEE AT ONCE' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'WE ARE DISCOVERED FLEE AT ONCE', 'rf-rails': '3' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      return { text: railFence(v.in, parseInt(v['rf-rails'], 10) || 3, c.mode === 'decode') };
    }
  });

  /* ═══════════════ BACON ═══════════════ */
  var BACON_MAP = {};
  'ABCDEFGHIKLMNOPQRSTUVWXYZ'.split('').forEach(function (ch, i) { BACON_MAP[ch] = i.toString(2).padStart(5, '0').replace(/0/g, 'A').replace(/1/g, 'B'); });
  var BACON_REV = {};
  Object.keys(BACON_MAP).forEach(function (k) { BACON_REV[BACON_MAP[k]] = k; });
  S.ioTool({
    id: 'bacon', name: 'Bacon Cipher', group: 'Cipher', icon: 'type',
    desc: 'Encodes each letter as a five-symbol pattern of A/B — famously hideable inside innocent-looking text.',
    tags: ['bacon', 'binary', 'steganography', 'classical'],
    modes: [['encode', 'Text → AB'], ['decode', 'AB → Text']],
    inputs: [{ id: 'in', label: 'Input', ph: 'HELLO' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: 'HELLO' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      if (c.mode === 'encode') {
        var skipped = new Set();
        var parts = v.in.toUpperCase().replace(/J/g, 'I').split('').map(function (ch) {
          if (BACON_MAP[ch]) return BACON_MAP[ch];
          if (/\s/.test(ch)) return '/';
          skipped.add(ch); return null;
        }).filter(Boolean);
        return { text: parts.join(' '), hint: skipped.size ? 'Skipped: ' + Array.from(skipped).join(' ') : 'J is folded into I.' };
      }
      var groups = v.in.toUpperCase().replace(/[^AB\s]/g, ' ').split(/\s+/).filter(Boolean);
      var bad = 0;
      var text = groups.map(function (g) {
        if (g.length !== 5) { bad++; return ''; }
        return BACON_REV[g] || (bad++, '');
      }).join('');
      return { text: text, hint: bad ? bad + ' malformed group(s) skipped.' : '', hintKind: bad ? 'warn' : '' };
    }
  });

  /* ═══════════════ XOR (UTF-8 safe) ═══════════════ */
  function xorBytes(bytes, keyBytes) {
    var out = new Uint8Array(bytes.length);
    for (var i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    return out;
  }
  S.customTool({
    id: 'xor', name: 'XOR Cipher', group: 'Cipher', icon: 'lock',
    desc: 'Byte-wise XOR against a repeating key. Operates on real UTF-8 bytes, so any language round-trips correctly.',
    tags: ['xor', 'stream', 'key', 'bytes'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['encode', 'Encrypt'], ['decode', 'Decrypt']], 'encode') +
        '<div class="flex-row"><label class="check"><input type="checkbox" id="xor-hexout" checked> Hex output</label></div></div>' +
        '<label class="field-label" for="xor-key">Key</label>' +
        '<input type="text" id="xor-key" class="field field-sm" value="secret" placeholder="secret" spellcheck="false">' +
        '<label class="field-label" for="xor-in">Input</label>' +
        '<textarea id="xor-in" class="field" rows="4" placeholder="Message…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-swap" id="xor-swap" type="button">' + S.icon('swap') + 'Swap</button>' +
        '<button class="btn btn-ghost" id="xor-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="xor-out">Result</label>' +
        '<textarea id="xor-out" class="field" rows="4" readonly placeholder="Result…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="xor-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="xor-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>' +
        '<div class="stat-strip" id="xor-stats"></div>');
    },
    mount: function () {
      var mode = 'encode';
      var inp = $('xor-in'), out = $('xor-out'), key = $('xor-key');
      function run() {
        setHint('xor-hint', '');
        var kb = S.textToBytes(key.value);
        $('xor-stats').textContent = '';
        if (!inp.value) { out.value = ''; return; }
        if (!kb.length) { out.value = ''; setHint('xor-hint', 'Enter a key first.', 'error'); return; }
        var hexOut = $('xor-hexout').checked;
        if (mode === 'encode') {
          var ct = xorBytes(S.textToBytes(inp.value), kb);
          out.value = hexOut ? S.bytesToHex(ct, '') : S.bytesToBase64(ct);
          $('xor-stats').innerHTML = '<span>plaintext <b>' + S.textToBytes(inp.value).length + ' B</b></span><span>key <b>' + kb.length + ' B</b></span><span>cipher <b>' + ct.length + ' B</b></span>';
        } else {
          var bytes = hexOut ? S.hexToBytes(inp.value) : (function () { try { return S.base64ToBytes(inp.value); } catch (e) { return null; } })();
          if (!bytes) { out.value = ''; setHint('xor-hint', 'Input is not valid ' + (hexOut ? 'hex' : 'Base64') + '.', 'error'); return; }
          var pt = xorBytes(bytes, kb);
          out.value = S.bytesToText(pt);
          $('xor-stats').innerHTML = '<span>cipher <b>' + bytes.length + ' B</b></span><span>plaintext <b>' + pt.length + ' B</b></span>';
        }
      }
      $$('.mode-btn', $('panel-xor')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-xor')).forEach(function (x) { x.classList.toggle('active', x === b); });
          run();
        });
      });
      [inp, key].forEach(function (el) { el.addEventListener('input', run); });
      $('xor-hexout').addEventListener('change', run);
      $('xor-swap').addEventListener('click', function () {
        var t = inp.value; inp.value = out.value; out.value = t;
        mode = mode === 'encode' ? 'decode' : 'encode';
        $$('.mode-btn', $('panel-xor')).forEach(function (x) { x.classList.toggle('active', x.dataset.mode === mode); });
        run();
      });
      $('xor-clear').addEventListener('click', function () { inp.value = ''; run(); });
      $('xor-copy').addEventListener('click', function () { S.copyText(out.value); });
      inp.value = 'Message 🚀 فارسی';
      run();
    }
  });

  /* ═══════════════ AES (PBKDF2 + CBC) ═══════════════ */
  var PBKDF2_ITER = 50000;
  function aesEncrypt(plain, pass, iter) {
    var salt = S.randomBytes(16);
    var key = CryptoJS.PBKDF2(pass, CryptoJS.lib.WordArray.create(salt), { keySize: 256 / 32, iterations: iter, hasher: CryptoJS.algo.SHA256 });
    var iv = CryptoJS.lib.WordArray.random(16);
    var ct = CryptoJS.AES.encrypt(plain, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    var out = new Uint8Array(16 + 16 + ct.ciphertext.sigBytes);
    out.set(salt, 0);
    out.set(new Uint8Array(iv.words.length * 4).map(function (_, i) { return (iv.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xFF; }), 16);
    out.set(new Uint8Array(ct.ciphertext.sigBytes).map(function (_, i) { return (ct.ciphertext.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xFF; }), 32);
    return S.bytesToBase64(out);
  }
  function aesDecrypt(b64, pass, iter) {
    var raw = S.base64ToBytes(b64);
    if (raw.length < 33) throw new Error('Ciphertext is too short.');
    var salt = raw.slice(0, 16), ivBytes = raw.slice(16, 32), ctBytes = raw.slice(32);
    var key = CryptoJS.PBKDF2(pass, CryptoJS.lib.WordArray.create(salt), { keySize: 256 / 32, iterations: iter, hasher: CryptoJS.algo.SHA256 });
    var iv = CryptoJS.lib.WordArray.create(ivBytes);
    var ctWA = CryptoJS.lib.WordArray.create(ctBytes);
    var dec = CryptoJS.AES.decrypt({ ciphertext: ctWA }, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    var text = dec.toString(CryptoJS.enc.Utf8);
    if (!text) throw new Error('Wrong passphrase or corrupted ciphertext.');
    return text;
  }
  S.customTool({
    id: 'aes', name: 'AES-256', group: 'Crypto', icon: 'lock', primary: true,
    desc: 'Authenticated-strength AES-256-CBC with PBKDF2-SHA256 key derivation (50 000 iterations) and a fresh random salt + IV every time.',
    tags: ['aes', 'aes-256', 'pbkdf2', 'cbc', 'symmetric', 'encrypt'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['encode', 'Encrypt'], ['decode', 'Decrypt']], 'encode') +
        '<span class="chip">AES-256-CBC · PBKDF2</span></div>' +
        '<label class="field-label" for="aes-key">Passphrase</label>' +
        '<input type="password" id="aes-key" class="field field-sm" placeholder="my secret key" autocomplete="new-password">' +
        '<label class="check mt-1"><input type="checkbox" id="aes-show"> Show passphrase</label>' +
        '<label class="field-label" for="aes-in">Input</label>' +
        '<textarea id="aes-in" class="field" rows="5" placeholder="Message to encrypt…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-primary" id="aes-go" type="button">' + S.icon('lock') + '<span id="aes-go-label">Encrypt</span></button>' +
        '<button class="btn btn-swap" id="aes-swap" type="button">' + S.icon('swap') + 'Swap</button>' +
        '<button class="btn btn-ghost" id="aes-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="aes-out">Result (Base64 · salt‖iv‖ciphertext)</label>' +
        '<textarea id="aes-out" class="field" rows="5" readonly placeholder="Result…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="aes-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="aes-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>' +
        '<div class="stat-strip" id="aes-stats"></div>');
    },
    mount: function () {
      var mode = 'encode', busy = false;
      var inp = $('aes-in'), out = $('aes-out'), key = $('aes-key');
      $('aes-show').addEventListener('change', function () { key.type = this.checked ? 'text' : 'password'; });
      $$('.mode-btn', $('panel-aes')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-aes')).forEach(function (x) { x.classList.toggle('active', x === b); });
          $('aes-go-label').textContent = mode === 'encode' ? 'Encrypt' : 'Decrypt';
          inp.placeholder = mode === 'encode' ? 'Message to encrypt…' : 'Paste Base64 ciphertext…';
          setHint('aes-hint', '');
        });
      });
      function go() {
        setHint('aes-hint', '');
        $('aes-stats').textContent = '';
        if (!HAS_CRYPTOJS) { setHint('aes-hint', 'CryptoJS failed to load.', 'error'); return; }
        if (!key.value) { setHint('aes-hint', 'Enter a passphrase.', 'error'); return; }
        if (!inp.value) { setHint('aes-hint', 'Enter some input.', 'error'); return; }
        if (busy) return;
        busy = true;
        setHint('aes-hint', 'Deriving key…');
        setTimeout(function () {
          try {
            if (mode === 'encode') {
              var t0 = performance.now();
              out.value = aesEncrypt(inp.value, key.value, PBKDF2_ITER);
              $('aes-stats').innerHTML = '<span>PBKDF2-SHA256 <b>' + PBKDF2_ITER.toLocaleString() + '</b> iterations</span><span><b>' + Math.round(performance.now() - t0) + ' ms</b></span>';
              setHint('aes-hint', 'Encrypted. Salt and IV are embedded in the output.', 'ok');
            } else {
              out.value = aesDecrypt(inp.value.replace(/\s+/g, ''), key.value, PBKDF2_ITER);
              setHint('aes-hint', 'Decrypted successfully.', 'ok');
            }
          } catch (e) {
            out.value = '';
            setHint('aes-hint', e.message || 'AES error.', 'error');
          }
          busy = false;
        }, 20);
      }
      $('aes-go').addEventListener('click', go);
      $('aes-swap').addEventListener('click', function () {
        var t = inp.value; inp.value = out.value; out.value = t;
        mode = mode === 'encode' ? 'decode' : 'encode';
        $$('.mode-btn', $('panel-aes')).forEach(function (x) { x.classList.toggle('active', x.dataset.mode === mode); });
        $('aes-go-label').textContent = mode === 'encode' ? 'Encrypt' : 'Decrypt';
        setHint('aes-hint', '');
      });
      $('aes-clear').addEventListener('click', function () { inp.value = ''; out.value = ''; setHint('aes-hint', ''); $('aes-stats').textContent = ''; });
      $('aes-copy').addEventListener('click', function () { S.copyText(out.value); });
      key.value = 'my secret key';
    }
  });

  /* ═══════════════ 3DES ═══════════════ */
  function desEncrypt(plain, pass) {
    var salt = S.randomBytes(16);
    var key = CryptoJS.PBKDF2(pass, CryptoJS.lib.WordArray.create(salt), { keySize: 192 / 32, iterations: 10000, hasher: CryptoJS.algo.SHA256 });
    var iv = CryptoJS.lib.WordArray.random(8);
    var ct = CryptoJS.TripleDES.encrypt(plain, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    var out = new Uint8Array(16 + 8 + ct.ciphertext.sigBytes);
    out.set(salt, 0);
    out.set(new Uint8Array(8).map(function (_, i) { return (iv.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xFF; }), 16);
    out.set(new Uint8Array(ct.ciphertext.sigBytes).map(function (_, i) { return (ct.ciphertext.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xFF; }), 24);
    return S.bytesToBase64(out);
  }
  function desDecrypt(b64, pass) {
    var raw = S.base64ToBytes(b64);
    if (raw.length < 25) throw new Error('Ciphertext is too short.');
    var salt = raw.slice(0, 16), ivBytes = raw.slice(16, 24), ctBytes = raw.slice(24);
    var key = CryptoJS.PBKDF2(pass, CryptoJS.lib.WordArray.create(salt), { keySize: 192 / 32, iterations: 10000, hasher: CryptoJS.algo.SHA256 });
    var dec = CryptoJS.TripleDES.decrypt({ ciphertext: CryptoJS.lib.WordArray.create(ctBytes) }, key, { iv: CryptoJS.lib.WordArray.create(ivBytes), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    var text = dec.toString(CryptoJS.enc.Utf8);
    if (!text) throw new Error('Wrong passphrase or corrupted ciphertext.');
    return text;
  }
  S.customTool({
    id: 'des', name: 'Triple DES', group: 'Crypto', icon: 'lock',
    desc: 'Legacy 3DES in CBC mode with PBKDF2 key derivation. Kept for interoperability with old systems — not recommended for new work.',
    tags: ['des', '3des', 'tripledes', 'legacy', 'symmetric'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['encode', 'Encrypt'], ['decode', 'Decrypt']], 'encode') +
        '<span class="chip">3DES-CBC · legacy</span></div>' +
        '<div class="mono-block" style="max-height:none;margin-bottom:14px;font-size:12px;color:var(--mark);border-style:solid;">⚠ 3DES is deprecated. Prefer AES or ChaCha20 for anything that matters.</div>' +
        '<label class="field-label" for="des-key">Passphrase</label>' +
        '<input type="password" id="des-key" class="field field-sm" placeholder="secret key" autocomplete="new-password">' +
        '<label class="field-label" for="des-in">Input</label>' +
        '<textarea id="des-in" class="field" rows="4" placeholder="Message…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-primary" id="des-go" type="button">' + S.icon('lock') + '<span id="des-go-label">Encrypt</span></button>' +
        '<button class="btn btn-swap" id="des-swap" type="button">' + S.icon('swap') + 'Swap</button>' +
        '<button class="btn btn-ghost" id="des-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="des-out">Result (Base64)</label>' +
        '<textarea id="des-out" class="field" rows="4" readonly placeholder="Result…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="des-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="des-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>');
    },
    mount: function () {
      var mode = 'encode', busy = false;
      var inp = $('des-in'), out = $('des-out'), key = $('des-key');
      $$('.mode-btn', $('panel-des')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-des')).forEach(function (x) { x.classList.toggle('active', x === b); });
          $('des-go-label').textContent = mode === 'encode' ? 'Encrypt' : 'Decrypt';
          setHint('des-hint', '');
        });
      });
      function go() {
        setHint('des-hint', '');
        if (!HAS_CRYPTOJS) { setHint('des-hint', 'CryptoJS failed to load.', 'error'); return; }
        if (!key.value) { setHint('des-hint', 'Enter a passphrase.', 'error'); return; }
        if (!inp.value) { setHint('des-hint', 'Enter some input.', 'error'); return; }
        if (busy) return; busy = true;
        setHint('des-hint', 'Deriving key…');
        setTimeout(function () {
          try {
            out.value = mode === 'encode' ? desEncrypt(inp.value, key.value) : desDecrypt(inp.value.replace(/\s+/g, ''), key.value);
            setHint('des-hint', mode === 'encode' ? 'Encrypted.' : 'Decrypted successfully.', 'ok');
          } catch (e) { out.value = ''; setHint('des-hint', e.message, 'error'); }
          busy = false;
        }, 20);
      }
      $('des-go').addEventListener('click', go);
      $('des-swap').addEventListener('click', function () {
        var t = inp.value; inp.value = out.value; out.value = t;
        mode = mode === 'encode' ? 'decode' : 'encode';
        $$('.mode-btn', $('panel-des')).forEach(function (x) { x.classList.toggle('active', x.dataset.mode === mode); });
        $('des-go-label').textContent = mode === 'encode' ? 'Encrypt' : 'Decrypt';
      });
      $('des-clear').addEventListener('click', function () { inp.value = ''; out.value = ''; setHint('des-hint', ''); });
      $('des-copy').addEventListener('click', function () { S.copyText(out.value); });
      key.value = 'secret key';
    }
  });

  /* ═══════════════ CHACHA20 (real) ═══════════════ */
  function rotl32(v, c) { return (v << c) | (v >>> (32 - c)); }
  function qr(s, a, b, c, d) {
    s[a] = (s[a] + s[b]) | 0; s[d] = rotl32(s[d] ^ s[a], 16);
    s[c] = (s[c] + s[d]) | 0; s[b] = rotl32(s[b] ^ s[c], 12);
    s[a] = (s[a] + s[b]) | 0; s[d] = rotl32(s[d] ^ s[a], 8);
    s[c] = (s[c] + s[d]) | 0; s[b] = rotl32(s[b] ^ s[c], 7);
  }
  function chachaBlock(key, counter, nonce) {
    var st = new Uint32Array(16);
    st[0] = 0x61707865; st[1] = 0x3320646e; st[2] = 0x79622d32; st[3] = 0x6b206574;
    for (var i = 0; i < 8; i++) st[4 + i] = (key[i * 4] | (key[i * 4 + 1] << 8) | (key[i * 4 + 2] << 16) | (key[i * 4 + 3] << 24)) >>> 0;
    st[12] = counter >>> 0;
    for (var j = 0; j < 3; j++) st[13 + j] = (nonce[j * 4] | (nonce[j * 4 + 1] << 8) | (nonce[j * 4 + 2] << 16) | (nonce[j * 4 + 3] << 24)) >>> 0;
    var w = st.slice();
    for (var r = 0; r < 10; r++) {
      qr(w, 0, 4, 8, 12); qr(w, 1, 5, 9, 13); qr(w, 2, 6, 10, 14); qr(w, 3, 7, 11, 15);
      qr(w, 0, 5, 10, 15); qr(w, 1, 6, 11, 12); qr(w, 2, 7, 8, 13); qr(w, 3, 4, 9, 14);
    }
    var out = new Uint8Array(64);
    for (var k = 0; k < 16; k++) {
      var v = (w[k] + st[k]) >>> 0;
      out[k * 4] = v & 0xFF; out[k * 4 + 1] = (v >>> 8) & 0xFF; out[k * 4 + 2] = (v >>> 16) & 0xFF; out[k * 4 + 3] = (v >>> 24) & 0xFF;
    }
    return out;
  }
  function chacha20(data, key32, nonce12) {
    var out = new Uint8Array(data.length);
    for (var off = 0, ctr = 1; off < data.length; off += 64, ctr++) {
      var ks = chachaBlock(key32, ctr, nonce12);
      for (var i = 0; i < 64 && off + i < data.length; i++) out[off + i] = data[off + i] ^ ks[i];
    }
    return out;
  }
  function deriveKey32(pass) {
    var wa = CryptoJS.SHA256('signal-chacha20:' + pass);
    var out = new Uint8Array(32);
    for (var i = 0; i < 32; i++) out[i] = (wa.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xFF;
    return out;
  }
  S.customTool({
    id: 'chacha', name: 'ChaCha20', group: 'Crypto', icon: 'wave',
    desc: 'A real ChaCha20 stream cipher (RFC 8439 core) with a SHA-256 derived key and a fresh random nonce on every message.',
    tags: ['chacha20', 'chacha', 'stream', 'rfc8439', 'symmetric'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['encode', 'Encrypt'], ['decode', 'Decrypt']], 'encode') +
        '<span class="chip">ChaCha20 · 20 rounds</span></div>' +
        '<label class="field-label" for="ch-key">Passphrase</label>' +
        '<input type="password" id="ch-key" class="field field-sm" placeholder="my passphrase" autocomplete="new-password">' +
        '<label class="field-label" for="ch-in">Input</label>' +
        '<textarea id="ch-in" class="field" rows="4" placeholder="Message…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-primary" id="ch-go" type="button">' + S.icon('lock') + '<span id="ch-go-label">Encrypt</span></button>' +
        '<button class="btn btn-swap" id="ch-swap" type="button">' + S.icon('swap') + 'Swap</button>' +
        '<button class="btn btn-ghost" id="ch-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="ch-out">Result (Base64 · nonce‖ciphertext)</label>' +
        '<textarea id="ch-out" class="field" rows="4" readonly placeholder="Result…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="ch-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="ch-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>');
    },
    mount: function () {
      var mode = 'encode';
      var inp = $('ch-in'), out = $('ch-out'), key = $('ch-key');
      $$('.mode-btn', $('panel-chacha')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-chacha')).forEach(function (x) { x.classList.toggle('active', x === b); });
          $('ch-go-label').textContent = mode === 'encode' ? 'Encrypt' : 'Decrypt';
          setHint('ch-hint', '');
        });
      });
      function go() {
        setHint('ch-hint', '');
        if (!HAS_CRYPTOJS) { setHint('ch-hint', 'CryptoJS failed to load.', 'error'); return; }
        if (!key.value) { setHint('ch-hint', 'Enter a passphrase.', 'error'); return; }
        if (!inp.value) { setHint('ch-hint', 'Enter some input.', 'error'); return; }
        try {
          var k32 = deriveKey32(key.value);
          if (mode === 'encode') {
            var nonce = S.randomBytes(12);
            var ct = chacha20(S.textToBytes(inp.value), k32, nonce);
            var buf = new Uint8Array(12 + ct.length);
            buf.set(nonce, 0); buf.set(ct, 12);
            out.value = S.bytesToBase64(buf);
            setHint('ch-hint', 'Encrypted with a fresh 96-bit nonce.', 'ok');
          } else {
            var raw = S.base64ToBytes(inp.value.replace(/\s+/g, ''));
            if (raw.length < 13) throw new Error('Ciphertext is too short.');
            var pt = chacha20(raw.slice(12), k32, raw.slice(0, 12));
            out.value = S.bytesToText(pt);
            setHint('ch-hint', 'Decrypted successfully.', 'ok');
          }
        } catch (e) { out.value = ''; setHint('ch-hint', e.message || 'ChaCha20 error.', 'error'); }
      }
      $('ch-go').addEventListener('click', go);
      $('ch-swap').addEventListener('click', function () {
        var t = inp.value; inp.value = out.value; out.value = t;
        mode = mode === 'encode' ? 'decode' : 'encode';
        $$('.mode-btn', $('panel-chacha')).forEach(function (x) { x.classList.toggle('active', x.dataset.mode === mode); });
        $('ch-go-label').textContent = mode === 'encode' ? 'Encrypt' : 'Decrypt';
      });
      $('ch-clear').addEventListener('click', function () { inp.value = ''; out.value = ''; setHint('ch-hint', ''); });
      $('ch-copy').addEventListener('click', function () { S.copyText(out.value); });
      key.value = 'my passphrase';
    }
  });

  /* ═══════════════ RSA ═══════════════ */
  var RSA_MODES = [['encrypt', 'Encrypt'], ['decrypt', 'Decrypt'], ['sign', 'Sign'], ['verify', 'Verify']];
  var rsaState = { mode: 'encrypt', pair: null, pairKind: null };
  function rsaKind(mode) { return (mode === 'encrypt' || mode === 'decrypt') ? 'oaep' : 'pss'; }
  function rsaAlgo(kind) {
    return kind === 'oaep'
      ? { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }
      : { name: 'RSA-PSS', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
  }
  S.customTool({
    id: 'rsa', name: 'RSA', group: 'Crypto', icon: 'keypair',
    desc: 'Generate a 2048-bit RSA keypair, then encrypt/decrypt with OAEP or sign/verify with PSS. Keys can be exported and re-imported as PEM.',
    tags: ['rsa', 'oaep', 'pss', 'asymmetric', 'sign', 'keypair', 'pem'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml(RSA_MODES, 'encrypt') + '<span class="chip" id="rsa-chip">no keypair</span></div>' +
        '<div class="action-row"><button class="btn btn-primary" id="rsa-gen" type="button">' + S.icon('keypair') + 'Generate keypair</button>' +
        '<button class="btn" id="rsa-export" type="button">' + S.icon('download') + 'Export PEM</button>' +
        '<button class="btn btn-ghost" id="rsa-import-toggle" type="button">' + S.icon('file') + 'Import PEM</button></div>' +
        '<div id="rsa-import" hidden><label class="field-label" for="rsa-pem">Paste a PEM key <span class="opt">(public for encrypt/verify, private for decrypt/sign)</span></label>' +
        '<textarea id="rsa-pem" class="field field-sm" rows="4" placeholder="-----BEGIN PUBLIC KEY-----" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-soft" id="rsa-pem-load" type="button">Load key</button></div></div>' +
        '<div class="grid-2 mt-2">' +
        '<div><label class="field-label">Public key (PEM)</label><textarea id="rsa-pub" class="field field-sm" rows="4" readonly placeholder="Generate or import…" spellcheck="false"></textarea></div>' +
        '<div><label class="field-label">Private key (PEM)</label><textarea id="rsa-priv" class="field field-sm" rows="4" readonly placeholder="Generate or import…" spellcheck="false"></textarea></div>' +
        '</div>' +
        '<label class="field-label" for="rsa-in" id="rsa-in-label">Message</label>' +
        '<textarea id="rsa-in" class="field" rows="4" placeholder="Message to encrypt…" spellcheck="false"></textarea>' +
        '<div id="rsa-sig-wrap" hidden>' +
        '<label class="field-label" for="rsa-sig">Signature (Base64) — needed to verify</label>' +
        '<textarea id="rsa-sig" class="field field-sm" rows="3" placeholder="Paste a signature…" spellcheck="false"></textarea></div>' +
        '<div class="action-row"><button class="btn btn-primary" id="rsa-go" type="button">' + S.icon('lock') + '<span id="rsa-go-label">Encrypt</span></button>' +
        '<button class="btn btn-ghost" id="rsa-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="rsa-out">Result</label>' +
        '<textarea id="rsa-out" class="field" rows="4" readonly placeholder="Result…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="rsa-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="rsa-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>');
    },
    mount: function () {
      var st = rsaState;
      var inp = $('rsa-in'), out = $('rsa-out');
      function chip() {
        $('rsa-chip').className = 'chip' + (st.pair ? ' ok' : '');
        $('rsa-chip').textContent = st.pair ? ('2048-bit ' + st.pairKind.toUpperCase() + ' keypair ready') : 'no keypair';
      }
      function needSubtle() {
        if (!HAS_SUBTLE) { setHint('rsa-hint', 'Web Crypto is unavailable. Serve the page over HTTPS or localhost.', 'error'); return false; }
        return true;
      }
      $$('.mode-btn', $('panel-rsa')).forEach(function (b) {
        b.addEventListener('click', function () {
          st.mode = b.dataset.mode;
          $$('.mode-btn', $('panel-rsa')).forEach(function (x) { x.classList.toggle('active', x === b); });
          var labels = { encrypt: 'Encrypt', decrypt: 'Decrypt', sign: 'Sign', verify: 'Verify' };
          $('rsa-go-label').textContent = labels[st.mode];
          var ph = { encrypt: 'Message to encrypt…', decrypt: 'Base64 ciphertext…', sign: 'Text to sign…', verify: 'The original message…' };
          inp.placeholder = ph[st.mode];
          $('rsa-sig-wrap').hidden = st.mode !== 'verify';
          $('rsa-in-label').textContent = st.mode === 'decrypt' ? 'Ciphertext (Base64)' : 'Message';
          if (st.pair && st.pairKind !== rsaKind(st.mode)) {
            setHint('rsa-hint', 'Keypair is for ' + st.pairKind.toUpperCase() + ' — generate a new one for ' + rsaKind(st.mode).toUpperCase() + '.', 'warn');
          } else setHint('rsa-hint', '');
        });
      });
      $('rsa-import-toggle').addEventListener('click', function () { var el = $('rsa-import'); el.hidden = !el.hidden; });
      $('rsa-gen').addEventListener('click', function () {
        if (!needSubtle()) return;
        var kind = rsaKind(st.mode);
        setHint('rsa-hint', 'Generating a 2048-bit keypair…');
        crypto.subtle.generateKey(rsaAlgo(kind), true, kind === 'oaep' ? ['encrypt', 'decrypt'] : ['sign', 'verify'])
          .then(function (pair) {
            st.pair = pair; st.pairKind = kind;
            return Promise.all([crypto.subtle.exportKey('spki', pair.publicKey), crypto.subtle.exportKey('pkcs8', pair.privateKey)]);
          })
          .then(function (ex) {
            $('rsa-pub').value = S.wrapPem(S.bytesToBase64(new Uint8Array(ex[0])), 'PUBLIC KEY');
            $('rsa-priv').value = S.wrapPem(S.bytesToBase64(new Uint8Array(ex[1])), 'PRIVATE KEY');
            chip();
            setHint('rsa-hint', 'Keypair generated (' + kind.toUpperCase() + ').', 'ok');
            S.toast('RSA keypair generated', 'ok');
          })
          .catch(function (e) { setHint('rsa-hint', 'Key generation failed: ' + e.message, 'error'); });
      });
      $('rsa-export').addEventListener('click', function () {
        if (!$('rsa-pub').value) { S.toast('Nothing to export yet', 'info'); return; }
        S.download('rsa-public.pem', $('rsa-pub').value + '\n', 'application/x-pem-file');
        S.download('rsa-private.pem', $('rsa-priv').value + '\n', 'application/x-pem-file');
      });
      $('rsa-pem-load').addEventListener('click', function () {
        if (!needSubtle()) return;
        var pem = $('rsa-pem').value;
        if (!/-----BEGIN/.test(pem)) { setHint('rsa-hint', 'That does not look like a PEM block.', 'error'); return; }
        var isPrivate = /PRIVATE KEY/.test(pem);
        var kind = rsaKind(st.mode);
        var bytes;
        try { bytes = S.base64ToBytes(S.unwrapPem(pem)); } catch (e) { setHint('rsa-hint', 'Could not decode the PEM body.', 'error'); return; }
        var usages = kind === 'oaep' ? ['encrypt', 'decrypt'] : ['sign', 'verify'];
        crypto.subtle.importKey(isPrivate ? 'pkcs8' : 'spki', bytes, rsaAlgo(kind), true, usages)
          .then(function (key) {
            st.pair = isPrivate ? { privateKey: key } : { publicKey: key };
            st.pairKind = kind;
            if (isPrivate) $('rsa-priv').value = pem; else $('rsa-pub').value = pem;
            chip();
            setHint('rsa-hint', 'Imported ' + (isPrivate ? 'private' : 'public') + ' key.', 'ok');
          })
          .catch(function (e) { setHint('rsa-hint', 'Import failed: ' + e.message + ' (check the key type matches the mode)', 'error'); });
      });
      function go() {
        if (!needSubtle()) return;
        setHint('rsa-hint', '');
        if (!st.pair) { setHint('rsa-hint', 'Generate or import a keypair first.', 'error'); return; }
        if (!inp.value) { setHint('rsa-hint', 'Enter some input.', 'error'); return; }
        var m = st.mode;
        if (rsaKind(m) !== st.pairKind) { setHint('rsa-hint', 'This keypair is for ' + st.pairKind.toUpperCase() + ', not ' + rsaKind(m).toUpperCase() + '.', 'error'); return; }
        var enc = new TextEncoder();
        if (m === 'encrypt') {
          var data = enc.encode(inp.value);
          var max = 190, chunks = [];
          for (var i = 0; i < data.length; i += max) chunks.push(data.slice(i, i + max));
          Promise.all(chunks.map(function (c) { return crypto.subtle.encrypt({ name: 'RSA-OAEP' }, st.pair.publicKey, c); }))
            .then(function (bufs) {
              var total = bufs.reduce(function (a, b) { return a + b.byteLength; }, 0);
              var merged = new Uint8Array(total), off = 0;
              bufs.forEach(function (b) { merged.set(new Uint8Array(b), off); off += b.byteLength; });
              out.value = S.bytesToBase64(merged);
              setHint('rsa-hint', 'Encrypted ' + data.length + ' bytes across ' + chunks.length + ' block(s).', 'ok');
            })
            .catch(function (e) { setHint('rsa-hint', 'Encryption failed: ' + e.message, 'error'); });
          return;
        }
        if (m === 'decrypt') {
          var raw;
          try { raw = S.base64ToBytes(inp.value.replace(/\s+/g, '')); } catch (e) { setHint('rsa-hint', 'Invalid Base64 input.', 'error'); return; }
          if (raw.length % 256) { setHint('rsa-hint', 'Ciphertext length is not a multiple of 256 bytes.', 'error'); return; }
          var parts = [];
          for (var j = 0; j < raw.length; j += 256) parts.push(raw.slice(j, j + 256));
          Promise.all(parts.map(function (p) { return crypto.subtle.decrypt({ name: 'RSA-OAEP' }, st.pair.privateKey, p); }))
            .then(function (bufs) {
              var total = bufs.reduce(function (a, b) { return a + b.byteLength; }, 0);
              var merged = new Uint8Array(total), off = 0;
              bufs.forEach(function (b) { merged.set(new Uint8Array(b), off); off += b.byteLength; });
              out.value = S.bytesToText(merged);
              setHint('rsa-hint', 'Decrypted successfully.', 'ok');
            })
            .catch(function () { out.value = ''; setHint('rsa-hint', 'Decryption failed — wrong key or corrupted data.', 'error'); });
          return;
        }
        if (m === 'sign') {
          crypto.subtle.sign({ name: 'RSA-PSS', saltLength: 32 }, st.pair.privateKey, enc.encode(inp.value))
            .then(function (sig) {
              var b64 = S.bytesToBase64(new Uint8Array(sig));
              out.value = b64;
              $('rsa-sig').value = b64;
              setHint('rsa-hint', 'Signature created (RSA-PSS, SHA-256, 32-byte salt). Switch to Verify to check it.', 'ok');
            })
            .catch(function (e) { setHint('rsa-hint', 'Signing failed: ' + e.message, 'error'); });
          return;
        }
        var sig2;
        try { sig2 = S.base64ToBytes($('rsa-sig').value.replace(/\s+/g, '')); } catch (e) { setHint('rsa-hint', 'Invalid Base64 signature.', 'error'); return; }
        if (!sig2.length) { setHint('rsa-hint', 'Paste a signature to verify.', 'error'); return; }
        crypto.subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, st.pair.publicKey, sig2, enc.encode(inp.value))
          .then(function (ok) {
            out.value = ok ? '✓ Signature is VALID for this message' : '✗ Signature is NOT valid';
            setHint('rsa-hint', 'Checked against the public key.', ok ? 'ok' : 'error');
          })
          .catch(function (e) { setHint('rsa-hint', 'Verification error: ' + e.message, 'error'); });
      }
      $('rsa-go').addEventListener('click', go);
      $('rsa-clear').addEventListener('click', function () { inp.value = ''; out.value = ''; setHint('rsa-hint', ''); });
      $('rsa-copy').addEventListener('click', function () { S.copyText(out.value); });
      chip();
    }
  });

  /* ═══════════════ ECDSA ═══════════════ */
  var ecdsaPair = null;
  S.customTool({
    id: 'ecc', name: 'ECDSA (ECC)', group: 'Crypto', icon: 'shield',
    desc: 'Elliptic-curve signing and verification on P-256. Produce compact signatures and check them against a public key.',
    tags: ['ecc', 'ecdsa', 'p-256', 'sign', 'verify', 'asymmetric'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['sign', 'Sign'], ['verify', 'Verify']], 'sign') +
        '<span class="chip" id="ec-chip">P-256 · ECDSA</span></div>' +
        '<div class="action-row"><button class="btn btn-primary" id="ec-gen" type="button">' + S.icon('keypair') + 'Generate keypair</button>' +
        '<button class="btn" id="ec-export" type="button">' + S.icon('download') + 'Export PEM</button></div>' +
        '<div class="grid-2 mt-2">' +
        '<div><label class="field-label">Public key (PEM)</label><textarea id="ec-pub" class="field field-sm" rows="4" readonly placeholder="Generate a keypair…" spellcheck="false"></textarea></div>' +
        '<div><label class="field-label">Private key (PEM)</label><textarea id="ec-priv" class="field field-sm" rows="4" readonly placeholder="Generate a keypair…" spellcheck="false"></textarea></div>' +
        '</div>' +
        '<label class="field-label" for="ec-msg">Message</label>' +
        '<textarea id="ec-msg" class="field" rows="3" placeholder="Text to sign…" spellcheck="false"></textarea>' +
        '<label class="field-label" for="ec-sig">Signature (Base64) <span class="opt">— for verification</span></label>' +
        '<textarea id="ec-sig" class="field field-sm" rows="3" placeholder="Paste a signature to verify…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-primary" id="ec-go" type="button">' + S.icon('shield') + '<span id="ec-go-label">Sign</span></button>' +
        '<button class="btn btn-ghost" id="ec-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<div class="result-row"><span class="hint" id="ec-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="ec-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>');
    },
    mount: function () {
      var mode = 'sign';
      function chip(text, ok) { $('ec-chip').className = 'chip' + (ok ? ' ok' : ''); $('ec-chip').textContent = text; }
      function needSubtle() {
        if (!HAS_SUBTLE) { setHint('ec-hint', 'Web Crypto is unavailable. Serve over HTTPS or localhost.', 'error'); return false; }
        return true;
      }
      $$('.mode-btn', $('panel-ecc')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-ecc')).forEach(function (x) { x.classList.toggle('active', x === b); });
          $('ec-go-label').textContent = mode === 'sign' ? 'Sign' : 'Verify';
          setHint('ec-hint', '');
        });
      });
      $('ec-gen').addEventListener('click', function () {
        if (!needSubtle()) return;
        setHint('ec-hint', 'Generating P-256 keypair…');
        crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
          .then(function (pair) {
            ecdsaPair = pair;
            return Promise.all([crypto.subtle.exportKey('spki', pair.publicKey), crypto.subtle.exportKey('pkcs8', pair.privateKey)]);
          })
          .then(function (ex) {
            $('ec-pub').value = S.wrapPem(S.bytesToBase64(new Uint8Array(ex[0])), 'PUBLIC KEY');
            $('ec-priv').value = S.wrapPem(S.bytesToBase64(new Uint8Array(ex[1])), 'PRIVATE KEY');
            chip('P-256 keypair ready', true);
            setHint('ec-hint', 'ECDSA P-256 keypair generated.', 'ok');
            S.toast('ECDSA keypair generated', 'ok');
          })
          .catch(function (e) { setHint('ec-hint', 'Key generation failed: ' + e.message, 'error'); });
      });
      $('ec-export').addEventListener('click', function () {
        if (!$('ec-pub').value) { S.toast('Nothing to export yet', 'info'); return; }
        S.download('ec-public.pem', $('ec-pub').value + '\n', 'application/x-pem-file');
        S.download('ec-private.pem', $('ec-priv').value + '\n', 'application/x-pem-file');
      });
      $('ec-go').addEventListener('click', function () {
        if (!needSubtle()) return;
        setHint('ec-hint', '');
        var msg = $('ec-msg').value;
        if (!ecdsaPair) { setHint('ec-hint', 'Generate a keypair first.', 'error'); return; }
        if (!msg) { setHint('ec-hint', 'Enter a message.', 'error'); return; }
        var data = new TextEncoder().encode(msg);
        if (mode === 'sign') {
          crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, ecdsaPair.privateKey, data)
            .then(function (sig) {
              var b64 = S.bytesToBase64(new Uint8Array(sig));
              $('ec-sig').value = b64;
              setHint('ec-hint', 'Signature written to the field below — ' + b64.length + ' chars.', 'ok');
            })
            .catch(function (e) { setHint('ec-hint', 'Signing failed: ' + e.message, 'error'); });
        } else {
          var sig;
          try { sig = S.base64ToBytes($('ec-sig').value.replace(/\s+/g, '')); } catch (e) { setHint('ec-hint', 'Invalid Base64 signature.', 'error'); return; }
          crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, ecdsaPair.publicKey, sig, data)
            .then(function (ok) { setHint('ec-hint', ok ? '✓ Signature is VALID' : '✗ Signature is NOT valid', ok ? 'ok' : 'error'); })
            .catch(function (e) { setHint('ec-hint', 'Verification error: ' + e.message, 'error'); });
        }
      });
      $('ec-clear').addEventListener('click', function () { $('ec-msg').value = ''; $('ec-sig').value = ''; setHint('ec-hint', ''); });
      $('ec-copy').addEventListener('click', function () { S.copyText($('ec-sig').value); });
    }
  });

  /* ═══════════════ ECDH ═══════════════ */
  var dhKeys = null;
  S.customTool({
    id: 'dh', name: 'Diffie–Hellman', group: 'Crypto', icon: 'key',
    desc: 'Elliptic-curve Diffie–Hellman key agreement on P-256. Derive the same shared secret from two keypairs without ever sending it.',
    tags: ['diffie', 'hellman', 'dh', 'ecdh', 'key exchange', 'shared secret'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="action-row"><button class="btn btn-primary" id="dh-gen" type="button">' + S.icon('keypair') + 'Generate my keypair</button>' +
        '<button class="btn btn-soft" id="dh-demo" type="button">' + S.icon('wand') + 'Run two-party demo</button></div>' +
        '<div class="grid-2 mt-2">' +
        '<div><label class="field-label">My public key (Base64)</label><textarea id="dh-pub" class="field field-sm" rows="4" readonly placeholder="Generate a keypair…" spellcheck="false"></textarea></div>' +
        '<div><label class="field-label">My private key <span class="opt">(keep secret)</span></label><textarea id="dh-priv" class="field field-sm" rows="4" readonly placeholder="Generate a keypair…" spellcheck="false"></textarea></div>' +
        '</div>' +
        '<label class="field-label" for="dh-peer">Peer public key (Base64)</label>' +
        '<textarea id="dh-peer" class="field field-sm" rows="3" placeholder="Paste the peer public key…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-primary" id="dh-go" type="button">' + S.icon('key') + 'Derive shared secret</button>' +
        '<button class="btn btn-ghost" id="dh-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="dh-out">Shared secret</label>' +
        '<textarea id="dh-out" class="field" rows="3" readonly placeholder="The shared secret will appear here…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="dh-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="dh-copy" type="button">' + S.icon('copy') + 'Copy hex</button>' +
        '<button class="btn btn-ghost btn-sm" id="dh-hash" type="button">' + S.icon('hash') + 'SHA-256 it</button></div></div>');
    },
    mount: function () {
      function needSubtle() {
        if (!HAS_SUBTLE) { setHint('dh-hint', 'Web Crypto is unavailable. Serve over HTTPS or localhost.', 'error'); return false; }
        return true;
      }
      function genPair() {
        return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']);
      }
      function exportPub(pair) { return crypto.subtle.exportKey('spki', pair.publicKey).then(function (b) { return S.bytesToBase64(new Uint8Array(b)); }); }
      function exportPriv(pair) { return crypto.subtle.exportKey('pkcs8', pair.privateKey).then(function (b) { return S.bytesToBase64(new Uint8Array(b)); }); }
      $('dh-gen').addEventListener('click', function () {
        if (!needSubtle()) return;
        setHint('dh-hint', 'Generating P-256 keypair…');
        genPair().then(function (pair) {
          dhKeys = pair;
          return Promise.all([exportPub(pair), exportPriv(pair)]);
        }).then(function (k) {
          $('dh-pub').value = k[0]; $('dh-priv').value = k[1];
          setHint('dh-hint', 'Keypair ready. Paste a peer public key to derive the shared secret.', 'ok');
        }).catch(function (e) { setHint('dh-hint', 'Key generation failed: ' + e.message, 'error'); });
      });
      $('dh-demo').addEventListener('click', function () {
        if (!needSubtle()) return;
        setHint('dh-hint', 'Running a full two-party exchange…');
        var A, B;
        Promise.all([genPair(), genPair()]).then(function (pairs) {
          A = pairs[0]; B = pairs[1];
          return Promise.all([exportPub(A), exportPub(B), exportPriv(A)]);
        }).then(function (k) {
          $('dh-pub').value = k[0]; $('dh-priv').value = k[2]; $('dh-peer').value = k[1];
          return Promise.all([
            crypto.subtle.importKey('spki', S.base64ToBytes(k[1]), { name: 'ECDH', namedCurve: 'P-256' }, false, []),
            crypto.subtle.importKey('spki', S.base64ToBytes(k[0]), { name: 'ECDH', namedCurve: 'P-256' }, false, [])
          ]);
        }).then(function (imported) {
          return Promise.all([
            crypto.subtle.deriveBits({ name: 'ECDH', public: imported[0] }, A.privateKey, 256),
            crypto.subtle.deriveBits({ name: 'ECDH', public: imported[1] }, B.privateKey, 256)
          ]);
        }).then(function (bits) {
          var h1 = S.bytesToHex(new Uint8Array(bits[0]), '');
          var h2 = S.bytesToHex(new Uint8Array(bits[1]), '');
          $('dh-out').value = h1;
          setHint('dh-hint', h1 === h2 ? '✓ Both sides derived the identical secret — key agreement works.' : '✗ Secrets differ (unexpected).', h1 === h2 ? 'ok' : 'error');
        }).catch(function (e) { setHint('dh-hint', 'Demo failed: ' + e.message, 'error'); });
      });
      $('dh-go').addEventListener('click', function () {
        if (!needSubtle()) return;
        setHint('dh-hint', '');
        if (!dhKeys) { setHint('dh-hint', 'Generate your keypair first.', 'error'); return; }
        var peer = $('dh-peer').value.replace(/\s+/g, '');
        if (!peer) { setHint('dh-hint', 'Paste the peer public key.', 'error'); return; }
        var bytes;
        try { bytes = S.base64ToBytes(peer); } catch (e) { setHint('dh-hint', 'Peer key is not valid Base64.', 'error'); return; }
        crypto.subtle.importKey('spki', bytes, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
          .then(function (pk) { return crypto.subtle.deriveBits({ name: 'ECDH', public: pk }, dhKeys.privateKey, 256); })
          .then(function (bits) {
            $('dh-out').value = S.bytesToHex(new Uint8Array(bits), '');
            setHint('dh-hint', 'Shared secret derived (256 bits).', 'ok');
          })
          .catch(function () { setHint('dh-hint', 'Could not derive — check the peer key.', 'error'); });
      });
      $('dh-clear').addEventListener('click', function () { $('dh-peer').value = ''; $('dh-out').value = ''; setHint('dh-hint', ''); });
      $('dh-copy').addEventListener('click', function () { S.copyText($('dh-out').value); });
      $('dh-hash').addEventListener('click', function () {
        if (!$('dh-out').value) { S.toast('Derive a secret first', 'info'); return; }
        var bytes = S.hexToBytes($('dh-out').value);
        if (window.hashwasm) hashwasm.sha256(bytes).then(function (h) { $('dh-out').value = h; setHint('dh-hint', 'Replaced with the SHA-256 of the secret.', 'ok'); });
      });
    }
  });

})(window.Signal);
