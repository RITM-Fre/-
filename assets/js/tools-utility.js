/* ══════════════════════════════════════════════════════════════════════════
   SIGNAL — utilities, generators, formatters, inspectors
   ══════════════════════════════════════════════════════════════════════════ */
(function (S) {
  'use strict';
  var $ = S.$, $$ = S.$$, esc = S.escapeHtml;
  function setHint(id, text, kind) {
    var el = $(id); if (!el) return;
    el.className = 'hint' + (kind ? ' ' + kind : '');
    el.textContent = text || '';
  }

  /* ═══════════════ UUID ═══════════════ */
  function uuidV4() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = S.randomBytes(16);
    b[6] = (b[6] & 0x0F) | 0x40;
    b[8] = (b[8] & 0x3F) | 0x80;
    var h = S.bytesToHex(b, '');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function uuidV7() {
    var ms = Date.now();
    var b = S.randomBytes(16);
    b[0] = Math.floor(ms / 2 ** 40) & 0xFF;
    b[1] = Math.floor(ms / 2 ** 32) & 0xFF;
    b[2] = Math.floor(ms / 2 ** 24) & 0xFF;
    b[3] = Math.floor(ms / 2 ** 16) & 0xFF;
    b[4] = Math.floor(ms / 2 ** 8) & 0xFF;
    b[5] = ms & 0xFF;
    b[6] = (b[6] & 0x0F) | 0x70;
    b[8] = (b[8] & 0x3F) | 0x80;
    var h = S.bytesToHex(b, '');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  S.customTool({
    id: 'uuid', name: 'UUID Generator', group: 'Utility', icon: 'uuid',
    desc: 'Generate RFC 4122 version-4 (random) or version-7 (time-ordered) UUIDs — one at a time or in bulk.',
    tags: ['uuid', 'guid', 'v4', 'v7', 'identifier', 'generator'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="grid-3">' +
        '<div><label class="field-label" for="uuid-ver">Version</label><select id="uuid-ver" class="field field-sm">' +
        '<option value="v4" selected>v4 · random</option><option value="v7">v7 · time-ordered</option></select></div>' +
        '<div><label class="field-label" for="uuid-count">How many</label><input type="number" id="uuid-count" class="field field-sm" value="5" min="1" max="500"></div>' +
        '<div><label class="field-label" for="uuid-case">Case</label><select id="uuid-case" class="field field-sm">' +
        '<option value="lower" selected>lowercase</option><option value="upper">UPPERCASE</option></select></div>' +
        '</div>' +
        '<div class="check-row"><label class="check"><input type="checkbox" id="uuid-braces"> Wrap in {braces}</label>' +
        '<label class="check"><input type="checkbox" id="uuid-nodash"> No dashes</label></div>' +
        '<div class="action-row"><button class="btn btn-primary" id="uuid-go" type="button">' + S.icon('refresh') + 'Generate</button>' +
        '<button class="btn btn-ghost" id="uuid-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="uuid-out">Output</label>' +
        '<textarea id="uuid-out" class="field" rows="8" readonly spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="uuid-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="uuid-copy" type="button">' + S.icon('copy') + 'Copy all</button>' +
        '<button class="btn btn-ghost btn-sm" id="uuid-save" type="button">' + S.icon('download') + 'Save</button></div></div>' +
        '<div class="panel-section"><p class="section-label">Validate</p>' +
        '<input type="text" id="uuid-check" class="field field-sm" placeholder="Paste a UUID to validate…" spellcheck="false">' +
        '<div id="uuid-check-result" class="mt-1"></div></div>');
    },
    mount: function () {
      function gen() {
        var n = Math.max(1, Math.min(500, parseInt($('uuid-count').value, 10) || 1));
        var ver = $('uuid-ver').value;
        var list = [];
        for (var i = 0; i < n; i++) list.push(ver === 'v7' ? uuidV7() : uuidV4());
        if ($('uuid-case').value === 'upper') list = list.map(function (u) { return u.toUpperCase(); });
        if ($('uuid-nodash').checked) list = list.map(function (u) { return u.replace(/-/g, ''); });
        if ($('uuid-braces').checked) list = list.map(function (u) { return '{' + u + '}'; });
        $('uuid-out').value = list.join('\n');
        setHint('uuid-hint', n + ' × UUID ' + ver + (ver === 'v7' ? ' (lexicographically sortable)' : ' (RFC 4122 random)'));
      }
      $('uuid-go').addEventListener('click', gen);
      ['uuid-ver', 'uuid-count', 'uuid-case'].forEach(function (id) { $(id).addEventListener('change', gen); });
      ['uuid-braces', 'uuid-nodash'].forEach(function (id) { $(id).addEventListener('change', gen); });
      $('uuid-clear').addEventListener('click', function () { $('uuid-out').value = ''; setHint('uuid-hint', ''); });
      $('uuid-copy').addEventListener('click', function () { S.copyText($('uuid-out').value); });
      $('uuid-save').addEventListener('click', function () { if ($('uuid-out').value) S.download('uuids.txt', $('uuid-out').value + '\n'); });
      $('uuid-check').addEventListener('input', function () {
        var v = this.value.trim();
        var el = $('uuid-check-result');
        if (!v) { el.innerHTML = ''; return; }
        var m = v.match(/^\{?([0-9a-fA-F]{8})-?([0-9a-fA-F]{4})-?([0-9a-fA-F]{4})-?([0-9a-fA-F]{4})-?([0-9a-fA-F]{12})\}?$/);
        if (!m) { el.innerHTML = '<span class="chip bad">✗ Not a valid UUID</span>'; return; }
        var ver = parseInt(m[3][0], 16);
        var variant = parseInt(m[4][0], 16);
        var variantName = (variant & 0x8) ? ((variant & 0xC) === 0x8 ? 'RFC 4122' : 'reserved') : 'NCS';
        el.innerHTML = '<span class="chip ok">✓ Valid UUID</span> <span class="chip">version ' + ver + '</span> <span class="chip">' + variantName + ' variant</span>';
      });
      gen();
    }
  });

  /* ═══════════════ PASSWORD GENERATOR ═══════════════ */
  S.customTool({
    id: 'password', name: 'Password Generator', group: 'Utility', icon: 'key',
    desc: 'Cryptographically random passwords and passphrases with a live entropy estimate and crack-time guess.',
    tags: ['password', 'generator', 'random', 'entropy', 'passphrase', 'security'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['chars', 'Random characters'], ['words', 'Passphrase']], 'chars') + '</div>' +
        '<div id="pw-chars-opts">' +
        '<label class="field-label" for="gen-len">Length</label>' +
        '<div class="range-row"><input type="range" id="gen-len" min="6" max="128" value="20"><span class="range-val" id="gen-len-val">20</span></div>' +
        '<div class="check-row">' +
        '<label class="check"><input type="checkbox" id="gen-lower" checked> a–z</label>' +
        '<label class="check"><input type="checkbox" id="gen-upper" checked> A–Z</label>' +
        '<label class="check"><input type="checkbox" id="gen-digit" checked> 0–9</label>' +
        '<label class="check"><input type="checkbox" id="gen-symbol" checked> !@#$…</label>' +
        '<label class="check"><input type="checkbox" id="gen-noamb"> Exclude look-alikes (0O1lI)</label>' +
        '</div></div>' +
        '<div id="pw-words-opts" hidden>' +
        '<label class="field-label" for="gen-words">Number of words</label>' +
        '<div class="range-row"><input type="range" id="gen-words" min="3" max="10" value="5"><span class="range-val" id="gen-words-val">5</span></div>' +
        '<label class="field-label" for="gen-sep">Separator</label>' +
        '<select id="gen-sep" class="field field-sm"><option value="-">dash ( - )</option><option value=".">dot ( . )</option><option value=" ">space</option><option value="_">underscore</option></select>' +
        '<label class="check mt-1"><input type="checkbox" id="gen-cap" checked> Capitalise words</label>' +
        '<label class="check"><input type="checkbox" id="gen-num"> Append a number</label></div>' +
        '<div class="action-row"><button class="btn btn-primary" id="gen-go" type="button">' + S.icon('dice') + 'Generate</button>' +
        '<button class="btn btn-ghost" id="gen-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="gen-out">Generated</label>' +
        '<textarea id="gen-out" class="field" rows="3" readonly spellcheck="false" style="font-size:18px;letter-spacing:.04em;"></textarea>' +
        '<div class="bar-meter"><i id="gen-bar"></i></div>' +
        '<div class="result-row"><span class="hint" id="gen-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="gen-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>');
    },
    mount: function () {
      var mode = 'chars';
      var WORDS = ('amber anchor archer atlas aurora autumn badger bamboo beacon bishop bison blaze bloom boulder breeze bridge brook cactus canyon cedar cinder citrus clover cobalt comet compass copper coral cosmos cricket crystal dawn delta dune eagle ember falcon feather fern flint forest fossil fox frost galaxy garnet gecko glacier granite grove harbor harrier hawthorn hazel heron hollow indigo island ivory jasper juniper kettle lagoon lantern lark lava lemon lilac linen lotus lunar maple marble meadow meteor mint mirror mist mosaic moss nectar nimbus north oak oasis obsidian ocean onyx opal orchid otter pebble pelican pepper pine plateau plume polar prairie prism quartz quill raven reef ridge river robin rowan saffron sage salmon sapphire sable shadow shale sierra silver slate solar sparrow spruce sterling stone summit sycamore talon tamarind teal tempest thistle thunder tiger topaz torrent trellis tundra turquoise umber valley velvet vertex vesper violet walnut warbler willow winter wren zephyr zinc').split(' ');
      function strength(bits) {
        if (bits < 40) return { label: 'Weak', cls: 'bad', w: 22 };
        if (bits < 60) return { label: 'Fair', cls: 'mark', w: 45 };
        if (bits < 80) return { label: 'Strong', cls: 'ok', w: 72 };
        if (bits < 110) return { label: 'Very strong', cls: 'ok', w: 90 };
        return { label: 'Excellent', cls: 'ok', w: 100 };
      }
      function crackTime(bits) {
        var guesses = Math.pow(2, bits - 1);
        var perSec = 1e11;
        var secs = guesses / perSec;
        if (secs < 1) return 'instantly';
        var units = [['second', 60], ['minute', 60], ['hour', 24], ['day', 365], ['year', 1000]];
        var v = secs, name = 'second';
        for (var i = 0; i < units.length; i++) {
          if (v < units[i][1]) { name = units[i][0]; break; }
          v /= units[i][1]; name = units[i][0];
        }
        if (name === 'year' && v > 1000) return '~' + Math.round(v / 1000) + ' thousand years';
        return '~' + Math.round(v) + ' ' + name + (Math.round(v) === 1 ? '' : 's');
      }
      function gen() {
        var out = '';
        if (mode === 'chars') {
          var lower = 'abcdefghijklmnopqrstuvwxyz', upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digit = '0123456789', symbol = '!@#$%^&*()-_=+[]{};:,.<>?/~';
          if ($('gen-noamb').checked) {
            lower = lower.replace(/[lo]/g, ''); upper = upper.replace(/[IO]/g, '');
            digit = digit.replace(/[01]/g, ''); symbol = symbol.replace(/[|`'"]/g, '');
          }
          var pool = '';
          if ($('gen-lower').checked) pool += lower;
          if ($('gen-upper').checked) pool += upper;
          if ($('gen-digit').checked) pool += digit;
          if ($('gen-symbol').checked) pool += symbol;
          if (!pool) { setHint('gen-hint', 'Select at least one character set.', 'error'); return; }
          var len = +$('gen-len').value;
          var rb = S.randomBytes(len);
          var chars = [];
          for (var i = 0; i < len; i++) chars.push(pool[rb[i] % pool.length]);
          out = chars.join('');
          var bits = len * Math.log2(pool.length);
          apply(bits, out, pool.length + ' chars/position · ' + len + ' chars');
        } else {
          var n = +$('gen-words').value;
          var sep = $('gen-sep').value;
          var rb2 = S.randomBytes(n * 2);
          var picked = [];
          for (var j = 0; j < n; j++) {
            var w = WORDS[(rb2[j * 2] << 8 | rb2[j * 2 + 1]) % WORDS.length];
            if ($('gen-cap').checked) w = w[0].toUpperCase() + w.slice(1);
            picked.push(w);
          }
          out = picked.join(sep);
          if ($('gen-num').checked) out += sep + (rb2[0] % 90 + 10);
          var bits2 = n * Math.log2(WORDS.length);
          apply(bits2, out, WORDS.length + ' word list · ' + n + ' words');
        }
        $('gen-out').value = out;
      }
      function apply(bits, out, detail) {
        var st = strength(bits);
        $('gen-bar').style.width = st.w + '%';
        $('gen-bar').style.background = st.cls === 'bad' ? 'var(--danger)' : (st.cls === 'mark' ? 'var(--mark)' : 'var(--ok)');
        $('gen-bar').style.background = st.cls === 'bad' ? 'var(--danger)' : (st.cls === 'mark' ? 'var(--mark)' : 'var(--ok)');
        setHint('gen-hint', Math.round(bits) + ' bits of entropy · ' + st.label + ' · offline crack ' + crackTime(bits) + ' · ' + detail);
      }
      $$('.mode-btn', $('panel-password')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-password')).forEach(function (x) { x.classList.toggle('active', x === b); });
          $('pw-chars-opts').hidden = mode !== 'chars';
          $('pw-words-opts').hidden = mode !== 'words';
          gen();
        });
      });
      $('gen-len').addEventListener('input', function () { $('gen-len-val').textContent = this.value; gen(); });
      $('gen-words').addEventListener('input', function () { $('gen-words-val').textContent = this.value; gen(); });
      ['gen-lower', 'gen-upper', 'gen-digit', 'gen-symbol', 'gen-noamb', 'gen-cap', 'gen-num'].forEach(function (id) { $(id).addEventListener('change', gen); });
      $('gen-sep').addEventListener('change', gen);
      $('gen-go').addEventListener('click', gen);
      $('gen-clear').addEventListener('click', function () { $('gen-out').value = ''; $('gen-bar').style.width = '0%'; setHint('gen-hint', ''); });
      $('gen-copy').addEventListener('click', function () { S.copyText($('gen-out').value); });
      gen();
    }
  });

  /* ═══════════════ TIMESTAMP ═══════════════ */
  S.customTool({
    id: 'timestamp', name: 'Timestamp Converter', group: 'Utility', icon: 'clock',
    desc: 'Convert between Unix time, ISO 8601, RFC 2822, local time and relative descriptions — with a live clock.',
    tags: ['timestamp', 'unix', 'epoch', 'iso8601', 'date', 'time', 'clock'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="panel-section"><p class="section-label">Now</p>' +
        '<div class="kv-list">' +
        '<div class="kv-row"><div class="kv-k">Unix (seconds)</div><div class="kv-v" id="ts-now-s">—</div></div>' +
        '<div class="kv-row"><div class="kv-k">Unix (milliseconds)</div><div class="kv-v" id="ts-now-ms">—</div></div>' +
        '<div class="kv-row"><div class="kv-k">ISO 8601 (UTC)</div><div class="kv-v" id="ts-now-iso">—</div></div>' +
        '</div></div>' +
        '<div class="panel-section"><p class="section-label">Convert</p>' +
        '<label class="field-label" for="ts-in">Anything date-like</label>' +
        '<input type="text" id="ts-in" class="field field-sm" placeholder="1700000000  ·  2026-10-04T12:00:00Z  ·  now  ·  +2h" spellcheck="false">' +
        '<div class="flex-row mt-1"><button class="btn btn-soft btn-sm" id="ts-now-btn" type="button">' + S.icon('clock') + 'Use now</button>' +
        '<button class="btn btn-ghost btn-sm" id="ts-utc-btn" type="button">UTC</button>' +
        '<button class="btn btn-ghost btn-sm" id="ts-local-btn" type="button">Local</button></div>' +
        '<div class="kv-list mt-2" id="ts-out"></div>' +
        '<div class="result-row"><span class="hint" id="ts-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="ts-copy" type="button">' + S.icon('copy') + 'Copy JSON</button></div></div></div>' +
        '<div class="panel-section"><p class="section-label">Duration between two times</p>' +
        '<div class="grid-2">' +
        '<div><label class="field-label" for="ts-a">From</label><input type="text" id="ts-a" class="field field-sm" placeholder="2026-01-01" spellcheck="false"></div>' +
        '<div><label class="field-label" for="ts-b">To</label><input type="text" id="ts-b" class="field field-sm" placeholder="now" spellcheck="false"></div></div>' +
        '<div class="mono-block mt-1" id="ts-diff" style="max-height:none;">—</div></div>');
    },
    mount: function () {
      function parseInput(raw) {
        var s = String(raw || '').trim();
        if (!s) return null;
        if (/^now$/i.test(s)) return new Date();
        var rel = s.match(/^([+-])(\d+(?:\.\d+)?)\s*(s|sec|m|min|h|hour|d|day|w|week|mo|month|y|year)s?$/i);
        if (rel) {
          var mult = { s: 1, sec: 1, m: 60, min: 60, h: 3600, hour: 3600, d: 86400, day: 86400, w: 604800, week: 604800, mo: 2592000, month: 2592000, y: 31536000, year: 31536000 };
          var unit = rel[3].toLowerCase();
          return new Date(Date.now() + (rel[1] === '-' ? -1 : 1) * parseFloat(rel[2]) * (mult[unit] || 1) * 1000);
        }
        if (/^-?\d+$/.test(s)) {
          var n = parseInt(s, 10);
          var abs = Math.abs(n);
          if (abs < 1e11) n *= 1000;
          var d = new Date(n);
          return isNaN(d) ? null : d;
        }
        var d2 = new Date(s);
        return isNaN(d2) ? null : d2;
      }
      function row(k, v) { return '<div class="kv-row"><div class="kv-k">' + esc(k) + '</div><div class="kv-v wrap">' + esc(v) + '</div></div>'; }
      function rel(d) {
        var diff = (d.getTime() - Date.now()) / 1000;
        var abs = Math.abs(diff);
        var units = [[31536000, 'year'], [2592000, 'month'], [604800, 'week'], [86400, 'day'], [3600, 'hour'], [60, 'minute'], [1, 'second']];
        for (var i = 0; i < units.length; i++) {
          if (abs >= units[i][0]) {
            var n = Math.round(diff / units[i][0]);
            return Math.abs(n) + ' ' + units[i][1] + (Math.abs(n) === 1 ? '' : 's') + (n < 0 ? ' ago' : ' from now');
          }
        }
        return 'just now';
      }
      function convert() {
        setHint('ts-hint', '');
        var d = parseInput($('ts-in').value);
        if (!d) { $('ts-out').innerHTML = $('ts-in').value ? '<div class="kv-row"><div class="kv-k">Error</div><div class="kv-v" style="color:var(--danger)">Could not parse that value.</div></div>' : ''; return; }
        $('ts-out').innerHTML =
          row('Unix (seconds)', Math.floor(d.getTime() / 1000)) +
          row('Unix (milliseconds)', d.getTime()) +
          row('ISO 8601 (UTC)', d.toISOString()) +
          row('ISO 8601 (local)', d.toISOString().replace('Z', '') + offsetStr(d)) +
          row('RFC 2822', d.toUTCString()) +
          row('Local string', d.toString()) +
          row('Date only', d.toISOString().slice(0, 10)) +
          row('Time only (UTC)', d.toISOString().slice(11, 19)) +
          row('Day of week', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()]) +
          row('Day of year', Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000)) +
          row('Relative', rel(d));
        $('ts-copy')._data = { unix: Math.floor(d.getTime() / 1000), iso: d.toISOString(), ms: d.getTime() };
      }
      function offsetStr(d) {
        var off = -d.getTimezoneOffset(), sign = off >= 0 ? '+' : '-';
        off = Math.abs(off);
        return sign + String(Math.floor(off / 60)).padStart(2, '0') + ':' + String(off % 60).padStart(2, '0');
      }
      function diff() {
        var a = parseInput($('ts-a').value), b = parseInput($('ts-b').value);
        if (!a || !b) { $('ts-diff').textContent = '—'; return; }
        var ms = b.getTime() - a.getTime();
        var sign = ms < 0 ? '-' : '';
        var abs = Math.abs(ms);
        var days = Math.floor(abs / 86400000);
        var hours = Math.floor((abs % 86400000) / 3600000);
        var mins = Math.floor((abs % 3600000) / 60000);
        var secs = Math.floor((abs % 60000) / 1000);
        $('ts-diff').textContent = sign + days + 'd ' + hours + 'h ' + mins + 'm ' + secs + 's' +
          '\n' + sign + (abs / 86400000).toFixed(2) + ' days' +
          '\n' + sign + (abs / 3600000).toFixed(2) + ' hours' +
          '\n' + sign + Math.floor(abs / 1000).toLocaleString() + ' seconds';
      }
      function tickNow() {
        var d = new Date();
        $('ts-now-s').textContent = Math.floor(d.getTime() / 1000);
        $('ts-now-ms').textContent = d.getTime();
        $('ts-now-iso').textContent = d.toISOString();
      }
      $('ts-in').addEventListener('input', S.debounce(convert, 120));
      ['ts-a', 'ts-b'].forEach(function (id) { $(id).addEventListener('input', S.debounce(diff, 140)); });
      $('ts-now-btn').addEventListener('click', function () { $('ts-in').value = Math.floor(Date.now() / 1000); convert(); });
      $('ts-utc-btn').addEventListener('click', function () { $('ts-in').value = new Date().toISOString(); convert(); });
      $('ts-local-btn').addEventListener('click', function () { $('ts-in').value = new Date().toString(); convert(); });
      $('ts-copy').addEventListener('click', function () { S.copyText(JSON.stringify($('ts-copy')._data || {}, null, 2)); });
      tickNow(); setInterval(tickNow, 1000);
      $('ts-in').value = String(Math.floor(Date.now() / 1000));
      $('ts-a').value = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      $('ts-b').value = 'now';
      convert(); diff();
    }
  });

  /* ═══════════════ NUMBER BASE ═══════════════ */
  S.ioTool({
    id: 'number', name: 'Number Base Converter', group: 'Utility', icon: 'hash',
    desc: 'Convert arbitrarily large integers between binary, octal, decimal, hex and any base up to 36.',
    tags: ['number', 'base', 'binary', 'hex', 'octal', 'radix', 'convert'],
    extra: [{ id: 'num-base', type: 'number', label: 'Input base (2–36)', value: '10', min: 2, max: 36 }],
    extraLabel: 'Input',
    inputs: [{ id: 'in', label: 'Number', ph: '255' }],
    output: { id: 'out', label: 'All bases' },
    swap: false,
    sample: { in: '255' },
    run: function (c) {
      var v = c.values;
      var raw = String(v.in).trim().replace(/^0[bxo]/i, '');
      if (!raw) return '';
      var base = Math.max(2, Math.min(36, parseInt(v['num-base'], 10) || 10));
      var digits = '0123456789abcdefghijklmnopqrstuvwxyz';
      var neg = raw[0] === '-';
      var body = (neg ? raw.slice(1) : raw).toLowerCase();
      if (!body.length) return { error: 'Enter a number.' };
      var value = 0n, B = BigInt(base);
      for (var i = 0; i < body.length; i++) {
        var d = digits.indexOf(body[i]);
        if (d < 0 || d >= base) return { error: '"' + body[i] + '" is not a valid digit in base ' + base + '.' };
        value = value * B + BigInt(d);
      }
      if (neg) value = -value;
      var rows = [2, 8, 10, 16, 36].map(function (b) {
        var s = value.toString(b).toUpperCase();
        return '<tr><td style="width:120px;color:var(--muted)">base ' + b + '</td><td>' + esc(s) + '</td></tr>';
      }).join('');
      var bits = value < 0n ? (-value).toString(2).length : value.toString(2).length;
      return {
        text: value.toString(base),
        hint: 'Decimal ' + value.toString(10) + ' · ' + bits + ' bits',
        extraHtml: '<div class="table-wrap"><table class="data-table"><tbody>' + rows + '</tbody></table></div>'
      };
    },
    extraHtml: '<div class="panel-section"><p class="section-label">Conversions</p><div id="number-extra"></div></div>'
  });

  /* ═══════════════ TEXT CASE ═══════════════ */
  function words(s) { return String(s).replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^A-Za-z0-9\u0600-\u06FF]+/).filter(Boolean); }
  S.ioTool({
    id: 'case', name: 'Text Case', group: 'Utility', icon: 'type',
    desc: 'Switch between UPPER, lower, Title, Sentence, camelCase, PascalCase, snake_case, kebab-case and more.',
    tags: ['case', 'camel', 'snake', 'kebab', 'title', 'upper', 'lower', 'text'],
    extra: [{ id: 'case-kind', type: 'select', label: 'Target case', value: 'upper', small: true, options: [
      ['upper', 'UPPERCASE'], ['lower', 'lowercase'], ['title', 'Title Case'], ['sentence', 'Sentence case'],
      ['camel', 'camelCase'], ['pascal', 'PascalCase'], ['snake', 'snake_case'], ['kebab', 'kebab-case'],
      ['constant', 'CONSTANT_CASE'], ['dot', 'dot.case'], ['alternating', 'aLtErNaTiNg'], ['inverse', 'iNVERSE cASE']
    ] }],
    extraLabel: 'Transform',
    inputs: [{ id: 'in', label: 'Input', ph: 'hello world example' }],
    output: { id: 'out', label: 'Result' },
    swap: false,
    sample: { in: 'hello world example' },
    run: function (c) {
      var v = c.values, t = v.in;
      if (!t) return '';
      var ws = words(t);
      var map = {
        upper: function () { return t.toUpperCase(); },
        lower: function () { return t.toLowerCase(); },
        title: function () { return t.replace(/\w\S*/g, function (w) { return w[0].toUpperCase() + w.slice(1).toLowerCase(); }); },
        sentence: function () { var s = t.toLowerCase(); return s.replace(/(^\s*\w|[.!?]\s+\w)/g, function (m) { return m.toUpperCase(); }); },
        camel: function () { return ws.map(function (w, i) { w = w.toLowerCase(); return i ? w[0].toUpperCase() + w.slice(1) : w; }).join(''); },
        pascal: function () { return ws.map(function (w) { w = w.toLowerCase(); return w[0].toUpperCase() + w.slice(1); }).join(''); },
        snake: function () { return ws.map(function (w) { return w.toLowerCase(); }).join('_'); },
        kebab: function () { return ws.map(function (w) { return w.toLowerCase(); }).join('-'); },
        constant: function () { return ws.map(function (w) { return w.toUpperCase(); }).join('_'); },
        dot: function () { return ws.map(function (w) { return w.toLowerCase(); }).join('.'); },
        alternating: function () { return t.split('').map(function (ch, i) { return i % 2 ? ch.toUpperCase() : ch.toLowerCase(); }).join(''); },
        inverse: function () { return t.split('').map(function (ch) { return ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase(); }).join(''); }
      };
      var fn = map[v['case-kind']] || map.upper;
      var res = fn();
      return { text: res, hint: res.length + ' characters · ' + ws.length + ' words' };
    }
  });

  /* ═══════════════ SLUGIFY ═══════════════ */
  var TRANSLIT = { 'à': 'a', 'á': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ç': 'c', 'ñ': 'n', 'ý': 'y', 'ÿ': 'y', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'ø': 'o', 'đ': 'd', 'ş': 's', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'پ': 'p', 'چ': 'ch', 'ژ': 'zh', 'گ': 'g', 'ک': 'k', 'ی': 'y', 'آ': 'a', 'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 's', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v', 'ه': 'h' };
  S.ioTool({
    id: 'slugify', name: 'Slugify', group: 'Utility', icon: 'globe',
    desc: 'Turn any title into a clean, URL-safe slug — with optional transliteration of accented and Persian characters.',
    tags: ['slug', 'url', 'permalink', 'seo', 'transliterate'],
    extra: [
      { id: 'slug-sep', type: 'select', label: 'Separator', value: '-', small: true, options: [['-', 'dash'], ['_', 'underscore'], ['.', 'dot']] },
      { id: 'slug-case', type: 'select', label: 'Case', value: 'lower', small: true, options: [['lower', 'lowercase'], ['keep', 'keep original']] }
    ],
    extraLabel: 'Options',
    inputs: [{ id: 'in', label: 'Title', ph: '۱۰ راه ساده برای امنیت بیشتر — A Guide!' }],
    output: { id: 'out', label: 'Slug' },
    swap: false,
    sample: { in: '۱۰ راه ساده برای امنیت بیشتر — A Guide!' },
    run: function (c) {
      var v = c.values;
      if (!v.in) return '';
      var t = v.in;
      t = t.replace(/[\u06F0-\u06F9]/g, function (d) { return String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 48); });
      t = t.replace(/[\u0660-\u0669]/g, function (d) { return String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48); });
      t = t.split('').map(function (ch) { return TRANSLIT[ch] !== undefined ? TRANSLIT[ch] : (TRANSLIT[ch.toLowerCase()] !== undefined ? TRANSLIT[ch.toLowerCase()] : ch); }).join('');
      if (v['slug-case'] === 'lower') t = t.toLowerCase();
      t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var sep = v['slug-sep'];
      t = t.replace(/[^A-Za-z0-9]+/g, sep).replace(new RegExp('^\\' + sep + '+|\\' + sep + '+$', 'g'), '');
      return { text: t, hint: t.length + ' characters' };
    }
  });

  /* ═══════════════ TEXT UTILITIES ═══════════════ */
  S.customTool({
    id: 'texttools', name: 'Text Utilities', group: 'Utility', icon: 'type',
    desc: 'Count, sort, deduplicate, reverse, shuffle, number and clean up lines of text — one click each.',
    tags: ['text', 'sort', 'dedupe', 'reverse', 'lines', 'count', 'clean'],
    build: function () {
      return S.wrapPanel(this,
        '<label class="field-label" for="tt-in">Input</label>' +
        '<textarea id="tt-in" class="field" rows="8" placeholder="One line per row…" spellcheck="false"></textarea>' +
        '<div class="action-row">' +
        '<button class="btn btn-sm" data-tt="sort" type="button">Sort A→Z</button>' +
        '<button class="btn btn-sm" data-tt="sortdesc" type="button">Sort Z→A</button>' +
        '<button class="btn btn-sm" data-tt="sortlen" type="button">Sort by length</button>' +
        '<button class="btn btn-sm" data-tt="dedupe" type="button">Deduplicate</button>' +
        '<button class="btn btn-sm" data-tt="reverse" type="button">Reverse lines</button>' +
        '<button class="btn btn-sm" data-tt="shuffle" type="button">Shuffle</button>' +
        '<button class="btn btn-sm" data-tt="number" type="button">Number lines</button>' +
        '<button class="btn btn-sm" data-tt="trim" type="button">Trim spaces</button>' +
        '<button class="btn btn-sm" data-tt="noempty" type="button">Drop empty</button>' +
        '<button class="btn btn-sm" data-tt="reverseChars" type="button">Reverse characters</button>' +
        '<button class="btn btn-ghost btn-sm" id="tt-undo" type="button">' + S.icon('refresh') + 'Undo</button>' +
        '</div>' +
        '<div class="stat-strip" id="tt-stats"></div>' +
        '<label class="field-label" for="tt-out">Output</label>' +
        '<textarea id="tt-out" class="field" rows="8" readonly spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="tt-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="tt-copy" type="button">' + S.icon('copy') + 'Copy</button>' +
        '<button class="btn btn-ghost btn-sm" id="tt-save" type="button">' + S.icon('download') + 'Save</button></div></div>');
    },
    mount: function () {
      var history = [];
      var inp = $('tt-in'), out = $('tt-out');
      function stats() {
        var t = inp.value;
        $('tt-stats').innerHTML =
          '<span>chars <b>' + t.length + '</b></span>' +
          '<span>words <b>' + (t.trim() ? t.trim().split(/\s+/).length : 0) + '</b></span>' +
          '<span>lines <b>' + (t ? t.split('\n').length : 0) + '</b></span>' +
          '<span>bytes <b>' + S.textToBytes(t).length + '</b></span>' +
          '<span>sentences <b>' + (t.trim() ? (t.match(/[^.!?]+[.!?]*/g) || []).length : 0) + '</b></span>';
      }
      function push() { history.push(inp.value); if (history.length > 30) history.shift(); }
      function lines() { return inp.value.split('\n'); }
      function apply(fn) {
        push();
        var r = fn(lines());
        inp.value = r.join('\n');
        out.value = inp.value;
        stats();
      }
      var ops = {
        sort: function (l) { return l.slice().sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }); }); },
        sortdesc: function (l) { return l.slice().sort(function (a, b) { return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }); }); },
        sortlen: function (l) { return l.slice().sort(function (a, b) { return a.length - b.length; }); },
        dedupe: function (l) { var seen = {}; return l.filter(function (x) { if (seen[x]) return false; seen[x] = 1; return true; }); },
        reverse: function (l) { return l.slice().reverse(); },
        shuffle: function (l) {
          var a = l.slice(), rb = S.randomBytes(a.length);
          for (var i = a.length - 1; i > 0; i--) { var j = rb[i] % (i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
          return a;
        },
        number: function (l) { return l.map(function (x, i) { return (i + 1) + '. ' + x; }); },
        trim: function (l) { return l.map(function (x) { return x.trim().replace(/\s{2,}/g, ' '); }); },
        noempty: function (l) { return l.filter(function (x) { return x.trim() !== ''; }); },
        reverseChars: function (l) { return l.map(function (x) { return Array.from(x).reverse().join(''); }); }
      };
      $$('[data-tt]', $('panel-texttools')).forEach(function (b) {
        b.addEventListener('click', function () {
          var fn = ops[b.dataset.tt];
          if (!fn) return;
          if (!inp.value) { S.toast('Nothing to transform', 'info'); return; }
          apply(fn);
          setHint('tt-hint', b.textContent.trim() + ' applied.');
        });
      });
      $('tt-undo').addEventListener('click', function () {
        if (!history.length) { S.toast('Nothing to undo', 'info'); return; }
        inp.value = history.pop(); out.value = inp.value; stats(); setHint('tt-hint', 'Undone.');
      });
      inp.addEventListener('input', function () { out.value = inp.value; stats(); setHint('tt-hint', ''); });
      $('tt-copy').addEventListener('click', function () { S.copyText(out.value); });
      $('tt-save').addEventListener('click', function () { if (out.value) S.download('text.txt', out.value); });
      inp.value = 'banana\napple\ncherry\napple\ndate\n\nelderberry';
      out.value = inp.value;
      stats();
    }
  });

  /* ═══════════════ JSON ═══════════════ */
  S.customTool({
    id: 'json', name: 'JSON Formatter', group: 'Utility', icon: 'braces', primary: true,
    desc: 'Format, minify, validate, sort and inspect JSON — with path, size and type statistics.',
    tags: ['json', 'format', 'beautify', 'minify', 'validate', 'pretty'],
    build: function () {
      return S.wrapPanel(this,
        '<label class="field-label" for="json-in">JSON</label>' +
        '<textarea id="json-in" class="field" rows="10" placeholder=\'{"hello": "world"}\' spellcheck="false"></textarea>' +
        '<div class="action-row">' +
        '<button class="btn btn-sm" data-json="format" type="button">Format (2 spaces)</button>' +
        '<button class="btn btn-sm" data-json="format4" type="button">Format (4 spaces)</button>' +
        '<button class="btn btn-sm" data-json="minify" type="button">Minify</button>' +
        '<button class="btn btn-sm" data-json="sort" type="button">Sort keys</button>' +
        '<button class="btn btn-sm" data-json="escape" type="button">Escape string</button>' +
        '<button class="btn btn-sm" data-json="unescape" type="button">Unescape</button>' +
        '<button class="btn btn-ghost btn-sm" id="json-clear" type="button">' + S.icon('trash') + 'Clear</button>' +
        '</div>' +
        '<div id="json-status" class="mt-1"></div>' +
        '<label class="field-label" for="json-out">Output</label>' +
        '<textarea id="json-out" class="field" rows="10" readonly spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="json-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="json-copy" type="button">' + S.icon('copy') + 'Copy</button>' +
        '<button class="btn btn-ghost btn-sm" id="json-save" type="button">' + S.icon('download') + 'Save</button></div></div>' +
        '<div class="panel-section"><p class="section-label">Structure</p><div class="kv-list" id="json-stats"></div></div>');
    },
    mount: function () {
      var inp = $('json-in'), out = $('json-out');
      function parse() {
        try { return { ok: true, val: JSON.parse(inp.value) }; }
        catch (e) {
          var m = e.message.match(/position (\d+)/);
          return { ok: false, err: e.message, pos: m ? +m[1] : null };
        }
      }
      function depth(v, d) {
        d = d || 1;
        if (Array.isArray(v)) return v.length ? Math.max.apply(null, v.map(function (x) { return depth(x, d + 1); })) : d;
        if (v && typeof v === 'object') { var ks = Object.keys(v); return ks.length ? Math.max.apply(null, ks.map(function (k) { return depth(v[k], d + 1); })) : d; }
        return d;
      }
      function count(v) {
        if (Array.isArray(v)) return v.reduce(function (a, x) { return a + count(x); }, 1);
        if (v && typeof v === 'object') return Object.keys(v).reduce(function (a, k) { return a + count(v[k]); }, 1);
        return 0;
      }
      function refresh() {
        var p = parse();
        var st = $('json-status');
        if (!inp.value.trim()) { st.innerHTML = ''; $('json-stats').innerHTML = ''; $('json-hint').textContent = ''; return; }
        if (p.ok) {
          st.innerHTML = '<span class="chip ok">✓ Valid JSON</span>';
          var v = p.val;
          $('json-stats').innerHTML =
            '<div class="kv-row"><div class="kv-k">Root type</div><div class="kv-v">' + (Array.isArray(v) ? 'array (' + v.length + ')' : typeof v) + '</div></div>' +
            '<div class="kv-row"><div class="kv-k">Max depth</div><div class="kv-v">' + depth(v) + '</div></div>' +
            '<div class="kv-row"><div class="kv-k">Nodes</div><div class="kv-v">' + count(v) + '</div></div>' +
            '<div class="kv-row"><div class="kv-k">Size</div><div class="kv-v">' + S.textToBytes(inp.value).length + ' bytes</div></div>' +
            (Array.isArray(v) || (v && typeof v === 'object') ? '<div class="kv-row"><div class="kv-k">Top-level keys</div><div class="kv-v">' + (Array.isArray(v) ? v.length + ' items' : Object.keys(v).join(', ').slice(0, 300) || '(none)') + '</div></div>' : '');
          $('json-hint').textContent = 'Parsed successfully.';
        } else {
          st.innerHTML = '<span class="chip bad">✗ Invalid JSON</span> <span class="text-dim" style="font-size:12.5px;">' + esc(p.err) + '</span>';
          $('json-stats').innerHTML = '';
          $('json-hint').textContent = 'Fix the syntax error above.';
        }
      }
      function sortDeep(v) {
        if (Array.isArray(v)) return v.map(sortDeep);
        if (v && typeof v === 'object') {
          var o = {};
          Object.keys(v).sort().forEach(function (k) { o[k] = sortDeep(v[k]); });
          return o;
        }
        return v;
      }
      $$('[data-json]', $('panel-json')).forEach(function (b) {
        b.addEventListener('click', function () {
          var op = b.dataset.json;
          var p = parse();
          if (op === 'escape') { out.value = JSON.stringify(inp.value); return; }
          if (op === 'unescape') {
            try { out.value = JSON.parse(inp.value); }
            catch (e) { out.value = ''; setHint('json-hint', 'Could not unescape: ' + e.message, 'error'); return; }
            return;
          }
          if (!p.ok) { out.value = ''; setHint('json-hint', 'Fix the JSON before formatting.', 'error'); return; }
          if (op === 'minify') out.value = JSON.stringify(p.val);
          else if (op === 'sort') out.value = JSON.stringify(sortDeep(p.val), null, 2);
          else out.value = JSON.stringify(p.val, null, op === 'format4' ? 4 : 2);
          setHint('json-hint', out.value.length + ' characters output.');
        });
      });
      inp.addEventListener('input', S.debounce(refresh, 200));
      $('json-clear').addEventListener('click', function () { inp.value = ''; out.value = ''; refresh(); setHint('json-hint', ''); });
      $('json-copy').addEventListener('click', function () { S.copyText(out.value); });
      $('json-save').addEventListener('click', function () { if (out.value) S.download('data.json', out.value, 'application/json'); });
      inp.value = '{"name":"Signal","version":"2.0","tools":["base64","aes","jwt"],"meta":{"offline":true,"tracking":false}}';
      refresh();
    }
  });

  /* ═══════════════ REGEX TESTER ═══════════════ */
  S.customTool({
    id: 'regex', name: 'Regex Tester', group: 'Utility', icon: 'regex',
    desc: 'Test a regular expression against sample text — live match highlighting, capture groups and match positions.',
    tags: ['regex', 'regexp', 'pattern', 'match', 'test', 'groups'],
    build: function () {
      return S.wrapPanel(this,
        '<label class="field-label" for="re-pattern">Pattern</label>' +
        '<div class="flex-row"><span class="mono-block" style="max-height:none;padding:0 12px;display:flex;align-items:center;border-style:solid;font-size:16px;">/</span>' +
        '<input type="text" id="re-pattern" class="field field-sm" value="(\\w+)@(\\w+)\\.com" placeholder="pattern" spellcheck="false" style="flex:1;min-width:180px">' +
        '<span class="mono-block" style="max-height:none;padding:0 12px;display:flex;align-items:center;border-style:solid;font-size:16px;">/</span>' +
        '<input type="text" id="re-flags" class="field field-sm" value="gi" placeholder="flags" spellcheck="false" style="max-width:88px"></div>' +
        '<div class="check-row">' +
        '<label class="check"><input type="checkbox" id="re-g" checked> g</label>' +
        '<label class="check"><input type="checkbox" id="re-i" checked> i</label>' +
        '<label class="check"><input type="checkbox" id="re-m"> m</label>' +
        '<label class="check"><input type="checkbox" id="re-s"> s</label>' +
        '<label class="check"><input type="checkbox" id="re-u"> u</label>' +
        '</div>' +
        '<label class="field-label" for="re-text">Test string</label>' +
        '<textarea id="re-text" class="field" rows="6" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="re-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="re-copy" type="button">' + S.icon('copy') + 'Copy matches</button></div></div>' +
        '<div class="panel-section"><p class="section-label">Highlighted</p><div class="mono-block" id="re-highlight"></div></div>' +
        '<div class="panel-section"><p class="section-label">Matches</p><div class="table-wrap" id="re-matches"></div></div>' +
        '<div class="panel-section"><p class="section-label">Cheatsheet</p>' +
        '<div class="table-wrap"><table class="data-table"><tbody>' +
        [['\\d', 'any digit'], ['\\w', 'word character'], ['\\s', 'whitespace'], ['.', 'any character'],
         ['^ $', 'start / end of line'], ['* + ?', 'zero-or-more / one-or-more / optional'],
         ['{2,5}', 'between 2 and 5 times'], ['[abc]', 'character class'], ['(...)', 'capture group'],
         ['(?:...)', 'non-capturing group'], ['(?<n>...)', 'named group'], ['|', 'alternation'],
         ['\\b', 'word boundary'], ['(?=...)', 'lookahead'], ['(?<=...)', 'lookbehind']]
          .map(function (r) { return '<tr><td style="width:130px">' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>');
    },
    mount: function () {
      var pat = $('re-pattern'), txt = $('re-text'), flags = $('re-flags');
      var FLAGMAP = { g: 're-g', i: 're-i', m: 're-m', s: 're-s', u: 're-u' };
      function syncFlagsFromBoxes() {
        var f = '';
        Object.keys(FLAGMAP).forEach(function (k) { if ($(FLAGMAP[k]).checked) f += k; });
        flags.value = f;
        run();
      }
      function syncBoxesFromFlags() {
        Object.keys(FLAGMAP).forEach(function (k) { $(FLAGMAP[k]).checked = flags.value.indexOf(k) !== -1; });
      }
      function run() {
        setHint('re-hint', '');
        var p = pat.value, t = txt.value, f = flags.value;
        if (!p) { $('re-highlight').innerHTML = '<span class="text-dim">Enter a pattern.</span>'; $('re-matches').innerHTML = ''; return; }
        var re;
        try { re = new RegExp(p, f.indexOf('g') === -1 ? f + 'g' : f); }
        catch (e) { setHint('re-hint', 'Invalid pattern: ' + e.message, 'error'); $('re-highlight').innerHTML = ''; $('re-matches').innerHTML = ''; return; }
        var matches = [], m, guard = 0;
        while ((m = re.exec(t)) !== null && guard++ < 5000) {
          matches.push({ index: m.index, value: m[0], groups: m.slice(1), named: m.groups || null });
          if (m[0] === '') re.lastIndex++;
        }
        var hl = '', last = 0;
        matches.forEach(function (mm) {
          hl += esc(t.slice(last, mm.index));
          hl += '<mark style="background:var(--mark-soft);color:var(--mark);border-radius:3px;">' + esc(mm.value || '') + '</mark>';
          last = mm.index + mm.value.length;
        });
        hl += esc(t.slice(last));
        $('re-highlight').innerHTML = hl || '<span class="text-dim">No text.</span>';
        if (!matches.length) {
          $('re-matches').innerHTML = '<div class="palette-empty">No matches found.</div>';
          setHint('re-hint', 'No matches.', 'warn');
          return;
        }
        $('re-matches').innerHTML = '<table class="data-table"><thead><tr><th>#</th><th>Index</th><th>Match</th><th>Groups</th></tr></thead><tbody>' +
          matches.slice(0, 200).map(function (mm, i) {
            var g = mm.groups.map(function (x, j) { return '$' + (j + 1) + '=' + (x === undefined ? '∅' : JSON.stringify(x)); }).join('  ');
            if (mm.named) g += (g ? '  ' : '') + JSON.stringify(mm.named);
            return '<tr><td>' + (i + 1) + '</td><td>' + mm.index + '</td><td>' + esc(mm.value) + '</td><td>' + esc(g || '—') + '</td></tr>';
          }).join('') + '</tbody></table>' + (matches.length > 200 ? '<div class="palette-empty">Showing the first 200 of ' + matches.length + ' matches.</div>' : '');
        setHint('re-hint', matches.length + ' match' + (matches.length === 1 ? '' : 'es') + ' · ' + (matches.length > 200 ? '200' : matches.length) + ' shown');
      }
      Object.keys(FLAGMAP).forEach(function (k) { $(FLAGMAP[k]).addEventListener('change', syncFlagsFromBoxes); });
      flags.addEventListener('input', function () { syncBoxesFromFlags(); run(); });
      pat.addEventListener('input', S.debounce(run, 120));
      txt.addEventListener('input', S.debounce(run, 120));
      $('re-copy').addEventListener('click', function () {
        var re = new RegExp(pat.value, flags.value.indexOf('g') === -1 ? flags.value + 'g' : flags.value);
        var out = [], m;
        while ((m = re.exec(txt.value)) !== null) { out.push(m[0]); if (m[0] === '') re.lastIndex++; }
        S.copyText(out.join('\n'));
      });
      txt.value = 'Contact ali@example.com or sara@acme.com — invalid: bob@site\nAlso: info@signal.dev and admin@test.com';
      run();
    }
  });

  /* ═══════════════ TEXT DIFF ═══════════════ */
  S.customTool({
    id: 'diff', name: 'Text Diff', group: 'Utility', icon: 'diff',
    desc: 'Compare two blocks of text line by line using a longest-common-subsequence diff — see exactly what changed.',
    tags: ['diff', 'compare', 'difference', 'lcs', 'merge'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="grid-2">' +
        '<div><label class="field-label" for="diff-a">Original</label><textarea id="diff-a" class="field" rows="9" spellcheck="false"></textarea></div>' +
        '<div><label class="field-label" for="diff-b">Changed</label><textarea id="diff-b" class="field" rows="9" spellcheck="false"></textarea></div>' +
        '</div>' +
        '<div class="check-row"><label class="check"><input type="checkbox" id="diff-ignorecase"> Ignore case</label>' +
        '<label class="check"><input type="checkbox" id="diff-ignorews"> Ignore whitespace</label>' +
        '<label class="check"><input type="checkbox" id="diff-context"> Context only</label></div>' +
        '<div class="action-row"><button class="btn btn-primary" id="diff-go" type="button">' + S.icon('diff') + 'Compare</button>' +
        '<button class="btn btn-soft" id="diff-swap" type="button">' + S.icon('swap') + 'Swap sides</button>' +
        '<button class="btn btn-ghost" id="diff-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<div id="diff-stats" class="stat-strip"></div>' +
        '<div class="panel-section"><p class="section-label">Differences</p>' +
        '<div class="diff-view" id="diff-out" style="max-height:460px;"></div></div>');
    },
    mount: function () {
      function norm(s) {
        if ($('diff-ignorecase').checked) s = s.toLowerCase();
        if ($('diff-ignorews').checked) s = s.replace(/\s+/g, ' ').trim();
        return s;
      }
      function lcs(a, b) {
        var n = a.length, m = b.length;
        if (n * m > 4000000) return null;
        var dp = [];
        for (var i = 0; i <= n; i++) dp.push(new Int32Array(m + 1));
        for (var i2 = n - 1; i2 >= 0; i2--) {
          for (var j = m - 1; j >= 0; j--) {
            dp[i2][j] = a[i2] === b[j] ? dp[i2 + 1][j + 1] + 1 : Math.max(dp[i2 + 1][j], dp[i2][j + 1]);
          }
        }
        var out = [], x = 0, y = 0;
        while (x < n && y < m) {
          if (a[x] === b[y]) { out.push(['eq', a[x], x + 1, y + 1]); x++; y++; }
          else if (dp[x + 1][y] >= dp[x][y + 1]) { out.push(['del', a[x], x + 1, null]); x++; }
          else { out.push(['add', b[y], null, y + 1]); y++; }
        }
        while (x < n) { out.push(['del', a[x], x + 1, null]); x++; }
        while (y < m) { out.push(['add', b[y], null, y + 1]); y++; }
        return out;
      }
      function run() {
        var A = $('diff-a').value.split('\n'), B = $('diff-b').value.split('\n');
        var na = A.map(norm), nb = B.map(norm);
        var ops = lcs(na, nb);
        if (!ops) { $('diff-out').innerHTML = '<div class="palette-empty">Input is too large to diff in the browser.</div>'; return; }
        var adds = 0, dels = 0, same = 0;
        ops.forEach(function (o) { if (o[0] === 'add') adds++; else if (o[0] === 'del') dels++; else same++; });
        $('diff-stats').innerHTML = '<span>lines A <b>' + A.length + '</b></span><span>lines B <b>' + B.length + '</b></span>' +
          '<span style="color:var(--ok)">added <b>' + adds + '</b></span><span style="color:var(--danger)">removed <b>' + dels + '</b></span><span>unchanged <b>' + same + '</b></span>';
        var ctxOnly = $('diff-context').checked;
        var html = '';
        ops.forEach(function (o, i) {
          if (ctxOnly && o[0] === 'eq') {
            var prev = ops[i - 1], next = ops[i + 1];
            var nearChange = (prev && prev[0] !== 'eq') || (next && next[0] !== 'eq');
            if (!nearChange && i !== 0 && i !== ops.length - 1) {
              if (html.slice(-40).indexOf('diff-gap') === -1) html += '<div class="diff-line" style="opacity:.4"><span class="dl-n">…</span><span class="dl-t">…</span></div>';
              return;
            }
          }
          var cls = o[0] === 'eq' ? '' : o[0];
          var sign = o[0] === 'add' ? '+' : (o[0] === 'del' ? '−' : ' ');
          html += '<div class="diff-line ' + cls + '"><span class="dl-n">' + (o[2] || '') + ' ' + (o[3] || '') +
            '</span><span class="dl-t">' + sign + ' ' + esc(o[1] || '') + '</span></div>';
        });
        $('diff-out').innerHTML = html || '<div class="palette-empty">Both sides are empty.</div>';
      }
      $('diff-go').addEventListener('click', run);
      ['diff-a', 'diff-b'].forEach(function (id) { $(id).addEventListener('input', S.debounce(run, 320)); });
      ['diff-ignorecase', 'diff-ignorews', 'diff-context'].forEach(function (id) { $(id).addEventListener('change', run); });
      $('diff-swap').addEventListener('click', function () {
        var t = $('diff-a').value; $('diff-a').value = $('diff-b').value; $('diff-b').value = t; run();
      });
      $('diff-clear').addEventListener('click', function () { $('diff-a').value = ''; $('diff-b').value = ''; run(); });
      $('diff-a').value = 'Signal Console v1\nBase64, Hex, Morse\nCaesar, Vigenere\nAES, RSA\n26 tools';
      $('diff-b').value = 'Signal Console v2\nBase64, Base32, Base58, Hex, Morse\nCaesar, Vigenere, Hill, Playfair\nAES, ChaCha20, RSA, ECDSA\n50+ tools';
      run();
    }
  });

  /* ═══════════════ URL PARSER ═══════════════ */
  S.customTool({
    id: 'urlparse', name: 'URL Parser', group: 'Utility', icon: 'globe',
    desc: 'Break a URL into protocol, host, port, path, query parameters and fragment — and rebuild it from the parts.',
    tags: ['url', 'uri', 'parse', 'query string', 'params', 'query'],
    build: function () {
      return S.wrapPanel(this,
        '<label class="field-label" for="up-in">URL</label>' +
        '<textarea id="up-in" class="field field-sm" rows="2" placeholder="https://user:pass@example.com:8443/path/page?q=hello&lang=fa#section" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="up-hint"></span></div>' +
        '<div class="panel-section"><p class="section-label">Components</p><div class="kv-list" id="up-parts"></div></div>' +
        '<div class="panel-section"><p class="section-label">Query parameters</p><div class="table-wrap" id="up-query"></div></div>' +
        '<div class="panel-section"><p class="section-label">Add / update a parameter</p>' +
        '<div class="grid-2">' +
        '<div><label class="field-label" for="up-k">Key</label><input type="text" id="up-k" class="field field-sm" placeholder="key" spellcheck="false"></div>' +
        '<div><label class="field-label" for="up-v">Value</label><input type="text" id="up-v" class="field field-sm" placeholder="value" spellcheck="false"></div></div>' +
        '<div class="action-row"><button class="btn btn-soft" id="up-set" type="button">Set parameter</button>' +
        '<button class="btn btn-ghost" id="up-copy" type="button">' + S.icon('copy') + 'Copy URL</button></div></div>');
    },
    mount: function () {
      var cur = null;
      function row(k, v, mono) {
        return '<div class="kv-row"><div class="kv-k">' + esc(k) + '</div><div class="kv-v' + (mono === false ? '' : ' wrap') + '">' + (v === null || v === undefined || v === '' ? '<span class="text-dim">—</span>' : esc(v)) + '</div></div>';
      }
      function parse() {
        var raw = $('up-in').value.trim();
        if (!raw) { $('up-parts').innerHTML = ''; $('up-query').innerHTML = ''; setHint('up-hint', ''); cur = null; return; }
        try { cur = new URL(raw); } catch (e) {
          cur = null;
          $('up-parts').innerHTML = row('Error', 'Not a valid absolute URL.');
          $('up-query').innerHTML = '';
          setHint('up-hint', 'Invalid URL: ' + e.message, 'error');
          return;
        }
        $('up-parts').innerHTML =
          row('Protocol', cur.protocol.replace(':', '')) +
          row('Hostname', cur.hostname) +
          row('Port', cur.port || '(default)') +
          row('Origin', cur.origin) +
          row('Path', cur.pathname) +
          row('Fragment', cur.hash.replace('#', '')) +
          row('Username', cur.username) +
          row('Password', cur.password ? '••••••' : '') +
          row('Is secure', cur.protocol === 'https:' ? 'yes' : 'no');
        var params = Array.from(cur.searchParams.entries());
        $('up-query').innerHTML = params.length
          ? '<table class="data-table"><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>' +
            params.map(function (p) { return '<tr><td>' + esc(p[0]) + '</td><td>' + esc(p[1]) + '</td></tr>'; }).join('') + '</tbody></table>'
          : '<div class="palette-empty">No query parameters.</div>';
        setHint('up-hint', params.length + ' parameter' + (params.length === 1 ? '' : 's') + ' · path depth ' + cur.pathname.split('/').filter(Boolean).length);
      }
      $('up-in').addEventListener('input', S.debounce(parse, 140));
      $('up-set').addEventListener('click', function () {
        if (!cur) { S.toast('Enter a valid URL first', 'err'); return; }
        var k = $('up-k').value.trim();
        if (!k) { S.toast('Enter a key', 'info'); return; }
        cur.searchParams.set(k, $('up-v').value);
        $('up-in').value = cur.toString();
        parse();
        S.toast('Parameter set', 'ok');
      });
      $('up-copy').addEventListener('click', function () { if (cur) S.copyText(cur.toString()); });
      $('up-in').value = 'https://user@example.com:8443/api/v2/search?q=hello%20world&lang=fa&page=3#results';
      parse();
    }
  });

  /* ═══════════════ COLOR ═══════════════ */
  function hexToRgb(hex) {
    var h = String(hex).replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
  function luminance(r, g, b) {
    var a = [r, g, b].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  S.customTool({
    id: 'color', name: 'Color Converter', group: 'Utility', icon: 'palette',
    desc: 'Convert between HEX, RGB, HSL and HSV, check WCAG contrast against black and white, and build tint/shade ramps.',
    tags: ['color', 'hex', 'rgb', 'hsl', 'hsv', 'contrast', 'wcag', 'palette'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="color-swatch" id="col-swatch"></div>' +
        '<div class="grid-2">' +
        '<div><label class="field-label" for="col-hex">HEX</label><input type="text" id="col-hex" class="field field-sm" value="#ffa94d" spellcheck="false"></div>' +
        '<div><label class="field-label" for="col-rgb">RGB</label><input type="text" id="col-rgb" class="field field-sm" value="255, 169, 77" spellcheck="false"></div>' +
        '</div>' +
        '<div class="grid-2 mt-1">' +
        '<div><label class="field-label" for="col-hsl">HSL</label><input type="text" id="col-hsl" class="field field-sm" readonly></div>' +
        '<div><label class="field-label" for="col-hsv">HSV</label><input type="text" id="col-hsv" class="field field-sm" readonly></div>' +
        '</div>' +
        '<div class="action-row"><button class="btn btn-soft" id="col-random" type="button">' + S.icon('dice') + 'Random colour</button>' +
        '<button class="btn btn-ghost" id="col-copy" type="button">' + S.icon('copy') + 'Copy HEX</button></div>' +
        '<div class="panel-section"><p class="section-label">Accessibility</p><div class="kv-list" id="col-contrast"></div></div>' +
        '<div class="panel-section"><p class="section-label">Ramp</p><div id="col-ramp" style="display:grid;grid-template-columns:repeat(11,1fr);gap:4px;"></div></div>');
    },
    mount: function () {
      function setFromHex(hex) {
        var rgb = hexToRgb(hex);
        if (!rgb) { setHint('col-hint', 'Invalid HEX colour.', 'error'); return; }
        var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        var h = hsl.h / 360, s = hsl.s / 100, l = hsl.l / 100;
        var v = l + s * Math.min(l, 1 - l);
        var sv = v ? 2 * (1 - l / v) : 0;
        $('col-hex').value = '#' + [rgb.r, rgb.g, rgb.b].map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
        $('col-rgb').value = rgb.r + ', ' + rgb.g + ', ' + rgb.b;
        $('col-hsl').value = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
        $('col-hsv').value = 'hsv(' + Math.round(h * 360) + ', ' + Math.round(sv * 100) + '%, ' + Math.round(v * 100) + '%)';
        $('col-swatch').style.background = $('col-hex').value;
        var L = luminance(rgb.r, rgb.g, rgb.b);
        var cw = (1.05) / (L + 0.05), cb = (L + 0.05) / 0.05;
        function rate(c) { return c >= 7 ? 'AAA ✓' : c >= 4.5 ? 'AA ✓' : c >= 3 ? 'AA large only' : 'fail ✗'; }
        $('col-contrast').innerHTML =
          '<div class="kv-row"><div class="kv-k">Contrast on black</div><div class="kv-v">' + cw.toFixed(2) + ':1 · ' + rate(cw) + '</div></div>' +
          '<div class="kv-row"><div class="kv-k">Contrast on white</div><div class="kv-v">' + cb.toFixed(2) + ':1 · ' + rate(cb) + '</div></div>' +
          '<div class="kv-row"><div class="kv-k">Relative luminance</div><div class="kv-v">' + L.toFixed(4) + '</div></div>';
        var ramp = '';
        for (var i = 0; i <= 10; i++) {
          var pct = i * 10;
          var mix = pct <= 50 ? (pct / 50) : ((100 - pct) / 50);
          var target = pct <= 50 ? 255 : 0;
          var c = [rgb.r, rgb.g, rgb.b].map(function (ch) { return Math.round(ch + (target - ch) * mix); });
          var hx = '#' + c.map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
          ramp += '<div title="' + hx + '" data-hex="' + hx + '" style="background:' + hx + ';height:38px;border-radius:8px;border:1px solid var(--line);cursor:pointer;"></div>';
        }
        $('col-ramp').innerHTML = ramp;
        $$('#col-ramp [data-hex]').forEach(function (el) {
          el.addEventListener('click', function () { setFromHex(el.dataset.hex); });
        });
        setHint('col-hint', '');
      }
      $('col-hex').addEventListener('input', S.debounce(function () { setFromHex(this.value); }, 160));
      $('col-rgb').addEventListener('input', S.debounce(function () {
        var p = this.value.split(/[,\s]+/).map(Number);
        if (p.length >= 3 && p.slice(0, 3).every(function (n) { return !isNaN(n); })) {
          setFromHex('#' + p.slice(0, 3).map(function (n) { return Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0'); }).join(''));
        }
      }, 200));
      $('col-random').addEventListener('click', function () { setFromHex('#' + S.randomHex(3)); });
      $('col-copy').addEventListener('click', function () { S.copyText($('col-hex').value); });
      setFromHex('#ffa94d');
    }
  });

  /* ═══════════════ IPv4 SUBNET ═══════════════ */
  function ipToInt(ip) {
    var p = String(ip).trim().split('.');
    if (p.length !== 4) return null;
    var n = 0;
    for (var i = 0; i < 4; i++) {
      var o = parseInt(p[i], 10);
      if (isNaN(o) || o < 0 || o > 255 || !/^\d+$/.test(p[i])) return null;
      n = (n * 256) + o;
    }
    return n >>> 0;
  }
  function intToIp(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }
  S.customTool({
    id: 'ipv4', name: 'IPv4 Subnet Calculator', group: 'Utility', icon: 'globe',
    desc: 'Work out the network address, broadcast, usable host range, mask and class for any IPv4 address and CIDR prefix.',
    tags: ['ip', 'ipv4', 'subnet', 'cidr', 'netmask', 'network', 'broadcast'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="grid-2">' +
        '<div><label class="field-label" for="ip-addr">IPv4 address</label><input type="text" id="ip-addr" class="field field-sm" value="192.168.1.10" spellcheck="false"></div>' +
        '<div><label class="field-label" for="ip-cidr">Prefix <span class="opt">/0 – /32</span></label>' +
        '<div class="range-row"><input type="range" id="ip-cidr" min="0" max="32" value="24"><span class="range-val" id="ip-cidr-val">/24</span></div></div>' +
        '</div>' +
        '<div class="panel-section"><p class="section-label">Result</p><div class="kv-list" id="ip-out"></div>' +
        '<div class="result-row"><span class="hint" id="ip-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="ip-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div></div>' +
        '<div class="panel-section"><p class="section-label">Binary</p><div class="mono-block" id="ip-bin"></div></div>');
    },
    mount: function () {
      function compute() {
        var ip = ipToInt($('ip-addr').value);
        var cidr = +$('ip-cidr').value;
        $('ip-cidr-val').textContent = '/' + cidr;
        if (ip === null) { $('ip-out').innerHTML = '<div class="kv-row"><div class="kv-k">Error</div><div class="kv-v" style="color:var(--danger)">Not a valid IPv4 address.</div></div>'; $('ip-bin').textContent = ''; return; }
        var mask = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
        var network = (ip & mask) >>> 0;
        var broadcast = (network | (~mask >>> 0)) >>> 0;
        var total = Math.pow(2, 32 - cidr);
        var usable = cidr >= 31 ? (cidr === 32 ? 1 : 2) : Math.max(0, total - 2);
        var first = cidr >= 31 ? network : (network + 1) >>> 0;
        var last = cidr >= 31 ? broadcast : (broadcast - 1) >>> 0;
        var cls = ip < 0x80000000 ? 'A' : ip < 0xC0000000 ? 'B' : ip < 0xE0000000 ? 'C' : ip < 0xF0000000 ? 'D (multicast)' : 'E (reserved)';
        var priv = (ip >>> 24) === 10 || (ip >>> 20) === 0xAC1 || (ip >>> 16) === 0xC0A8 || (ip >>> 22) === 0x644;
        function row(k, v) { return '<div class="kv-row"><div class="kv-k">' + esc(k) + '</div><div class="kv-v">' + esc(v) + '</div></div>'; }
        $('ip-out').innerHTML =
          row('Network address', intToIp(network) + '/' + cidr) +
          row('Broadcast', intToIp(broadcast)) +
          row('Subnet mask', intToIp(mask)) +
          row('Wildcard mask', intToIp(~mask >>> 0)) +
          row('Usable host range', intToIp(first) + ' – ' + intToIp(last)) +
          row('Usable hosts', usable.toLocaleString()) +
          row('Total addresses', total.toLocaleString()) +
          row('Address class', cls) +
          row('Scope', priv ? 'private (RFC 1918)' : (ip >>> 24) === 127 ? 'loopback' : (ip >>> 24) === 169 && (ip >>> 16) & 255 === 254 ? 'link-local' : 'public');
        $('ip-bin').textContent =
          'address  ' + intToIp(ip).split('.').map(function (o) { return (+o).toString(2).padStart(8, '0'); }).join('.') + '\n' +
          'mask     ' + intToIp(mask).split('.').map(function (o) { return (+o).toString(2).padStart(8, '0'); }).join('.') + '\n' +
          'network  ' + intToIp(network).split('.').map(function (o) { return (+o).toString(2).padStart(8, '0'); }).join('.') + '\n' +
          'wildcard ' + intToIp(~mask >>> 0).split('.').map(function (o) { return (+o).toString(2).padStart(8, '0'); }).join('.');
        $('ip-hint').textContent = total.toLocaleString() + ' addresses · ' + usable.toLocaleString() + ' usable';
        $('ip-copy')._text = 'Network: ' + intToIp(network) + '/' + cidr + '\nMask: ' + intToIp(mask) + '\nRange: ' + intToIp(first) + ' - ' + intToIp(last) + '\nBroadcast: ' + intToIp(broadcast);
      }
      $('ip-addr').addEventListener('input', S.debounce(compute, 160));
      $('ip-cidr').addEventListener('input', compute);
      $('ip-copy').addEventListener('click', function () { S.copyText($('ip-copy')._text); });
      compute();
    }
  });

  /* ═══════════════ QR CODE ═══════════════ */
  S.customTool({
    id: 'qr', name: 'QR Code Generator', group: 'Utility', icon: 'qr',
    desc: 'Turn any text or URL into a downloadable QR code with adjustable size, error correction and colours.',
    tags: ['qr', 'qrcode', 'barcode', 'scan', 'url', 'share'],
    build: function () {
      return S.wrapPanel(this,
        '<label class="field-label" for="qr-text">Text or URL</label>' +
        '<textarea id="qr-text" class="field field-sm" rows="3" placeholder="https://example.com" spellcheck="false"></textarea>' +
        '<div class="grid-3 mt-1">' +
        '<div><label class="field-label" for="qr-ec">Error correction</label><select id="qr-ec" class="field field-sm">' +
        '<option value="L">L · 7%</option><option value="M" selected>M · 15%</option><option value="Q">Q · 25%</option><option value="H">H · 30%</option></select></div>' +
        '<div><label class="field-label" for="qr-size">Size (px)</label><input type="number" id="qr-size" class="field field-sm" value="320" min="120" max="1200" step="20"></div>' +
        '<div><label class="field-label" for="qr-dark">Foreground</label><input type="color" id="qr-dark" class="field field-sm" value="#0f1622" style="padding:5px;"></div>' +
        '</div>' +
        '<div class="action-row"><button class="btn btn-primary" id="qr-go" type="button">' + S.icon('qr') + 'Generate</button>' +
        '<button class="btn btn-ghost" id="qr-png" type="button">' + S.icon('download') + 'Download PNG</button>' +
        '<button class="btn btn-ghost" id="qr-svg" type="button">' + S.icon('download') + 'Download SVG</button></div>' +
        '<div class="result-row"><span class="hint" id="qr-hint"></span></div>' +
        '<div class="panel-section"><div class="qr-out" id="qr-out"><span class="text-dim">Your QR code will appear here.</span></div></div>');
    },
    mount: function () {
      function make() {
        var text = $('qr-text').value;
        if (!text) { $('qr-out').innerHTML = '<span class="text-dim">Enter some text first.</span>'; setHint('qr-hint', ''); return; }
        if (typeof qrcode !== 'function') { $('qr-out').innerHTML = '<span class="text-dim">QR library failed to load — check your connection.</span>'; setHint('qr-hint', 'qrcode-generator is unavailable.', 'error'); return; }
        try {
          var qr = qrcode(0, $('qr-ec').value);
          qr.addData(text);
          qr.make();
          var size = +$('qr-size').value || 320;
          var cell = Math.max(2, Math.round(size / (qr.getModuleCount() + 8)));
          var dark = $('qr-dark').value;
          var svg = qr.createSvgTag({ cellSize: cell, margin: 4, scalable: true });
          svg = svg.replace(/fill="black"/g, 'fill="' + dark + '"').replace(/stroke="black"/g, 'stroke="' + dark + '"');
          $('qr-out').innerHTML = svg;
          setHint('qr-hint', 'Version ' + qr.getModuleCount() + '×' + qr.getModuleCount() + ' modules · EC level ' + $('qr-ec').value + ' · ' + text.length + ' chars');
        } catch (e) {
          $('qr-out').innerHTML = '<span class="text-dim">Could not encode that.</span>';
          setHint('qr-hint', 'Error: ' + e.message, 'error');
        }
      }
      function toCanvas() {
        var svgEl = $('qr-out').querySelector('svg');
        if (!svgEl) return null;
        var svgData = new XMLSerializer().serializeToString(svgEl);
        return new Promise(function (resolve, reject) {
          var img = new Image();
          var blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          var url = URL.createObjectURL(blob);
          img.onload = function () {
            var size = +$('qr-size').value || 320;
            var cvs = document.createElement('canvas');
            cvs.width = cvs.height = size;
            var ctx = cvs.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);
            URL.revokeObjectURL(url);
            resolve(cvs);
          };
          img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('render failed')); };
          img.src = url;
        });
      }
      $('qr-go').addEventListener('click', make);
      $('qr-text').addEventListener('input', S.debounce(make, 350));
      ['qr-ec', 'qr-size', 'qr-dark'].forEach(function (id) { $(id).addEventListener('change', make); });
      $('qr-svg').addEventListener('click', function () {
        var el = $('qr-out').querySelector('svg');
        if (!el) { S.toast('Generate a QR code first', 'info'); return; }
        S.download('qrcode.svg', new XMLSerializer().serializeToString(el), 'image/svg+xml');
      });
      $('qr-png').addEventListener('click', function () {
        toCanvas().then(function (cvs) {
          cvs.toBlob(function (b) { S.download('qrcode.png', b); S.toast('QR code saved', 'ok'); });
        }).catch(function () { S.toast('Could not render the PNG', 'err'); });
      });
      $('qr-text').value = 'https://ritm-fre.github.io/RITM-ppa';
      make();
    }
  });

  /* ═══════════════ ROMAN NUMERALS ═══════════════ */
  var ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  S.ioTool({
    id: 'roman', name: 'Roman Numerals', group: 'Utility', icon: 'type',
    desc: 'Convert between Arabic numbers and Roman numerals, including the subtractive forms.',
    tags: ['roman', 'numerals', 'numbers', 'convert'],
    modes: [['encode', 'Number → Roman'], ['decode', 'Roman → Number']],
    inputs: [{ id: 'in', label: 'Input', ph: '2026' }],
    output: { id: 'out', label: 'Result' },
    sample: { in: '2026' },
    run: function (c) {
      var v = c.values.in.trim();
      if (!v) return '';
      if (c.mode === 'encode') {
        var n = parseInt(v.replace(/[,\s]/g, ''), 10);
        if (isNaN(n) || n < 1 || n > 3999999) return { error: 'Enter a number between 1 and 3 999 999.' };
        var out = '';
        ROMAN.forEach(function (r) { while (n >= r[0]) { out += r[1]; n -= r[0]; } });
        return { text: out, hint: 'Standard subtractive notation' };
      }
      var s = v.toUpperCase().replace(/[^IVXLCDM]/g, '');
      if (!s) return { error: 'No Roman numerals found.' };
      var vals = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      var total = 0;
      for (var i = 0; i < s.length; i++) {
        var cur = vals[s[i]], next = vals[s[i + 1]];
        total += (next && cur < next) ? -cur : cur;
      }
      return { text: String(total), hint: 'Normalised: ' + s };
    }
  });

  /* ═══════════════ LOREM IPSUM ═══════════════ */
  S.customTool({
    id: 'lorem', name: 'Lorem Ipsum', group: 'Utility', icon: 'type',
    desc: 'Generate placeholder text — classic Lorem Ipsum or a themed word bank, by paragraph, sentence or word.',
    tags: ['lorem', 'ipsum', 'placeholder', 'dummy text', 'filler'],
    build: function () {
      var LOREM = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum').split(' ');
      var CYBER = ('signal cipher entropy nonce salt hash vector key stream block digest checksum payload token secret channel packet protocol handshake revocation integrity confidentiality authentication signature entropy lattice prime modulus exponent curve point inverse matrix permutation substitution transposition obfuscation payload ciphertext plaintext').split(' ');
      return S.wrapPanel(this,
        '<div class="grid-2">' +
        '<div><label class="field-label" for="lo-kind">Word bank</label><select id="lo-kind" class="field field-sm">' +
        '<option value="lorem" selected>Classic Latin</option><option value="cyber">Crypto / security</option></select></div>' +
        '<div><label class="field-label" for="lo-unit">Unit</label><select id="lo-unit" class="field field-sm">' +
        '<option value="paragraphs" selected>Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option></select></div>' +
        '</div>' +
        '<label class="field-label" for="lo-count">How many</label>' +
        '<div class="range-row"><input type="range" id="lo-count" min="1" max="20" value="3"><span class="range-val" id="lo-count-val">3</span></div>' +
        '<label class="check mt-1"><input type="checkbox" id="lo-start" checked> Start with “Lorem ipsum dolor sit amet…”</label>' +
        '<div class="action-row"><button class="btn btn-primary" id="lo-go" type="button">' + S.icon('wand') + 'Generate</button>' +
        '<button class="btn btn-ghost" id="lo-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="lo-out">Output</label>' +
        '<textarea id="lo-out" class="field" rows="10" readonly spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="lo-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="lo-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>');
    },
    mount: function () {
      var LOREM = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum').split(' ');
      var CYBER = ('signal cipher entropy nonce salt hash vector key stream block digest checksum payload token secret channel packet protocol handshake revocation integrity confidentiality authentication signature lattice prime modulus exponent curve point inverse matrix permutation substitution transposition obfuscation ciphertext plaintext').split(' ');
      function rand(n) { var b = S.randomBytes(n); var a = []; for (var i = 0; i < n; i++) a.push(b[i] / 256); return a; }
      function sentence(pool, cap) {
        var n = 8 + Math.floor(Math.random() * 12);
        var rs = rand(n), w = [];
        for (var i = 0; i < n; i++) w.push(pool[Math.floor(rs[i] * pool.length)]);
        var s = w.join(' ');
        if (cap) s = s[0].toUpperCase() + s.slice(1);
        return s + '.';
      }
      function gen() {
        var pool = $('lo-kind').value === 'cyber' ? CYBER : LOREM;
        var unit = $('lo-unit').value;
        var count = +$('lo-count').value;
        var out;
        if (unit === 'words') {
          var rs = rand(count), ws = [];
          for (var i = 0; i < count; i++) ws.push(pool[Math.floor(rs[i] * pool.length)]);
          out = ws.join(' ');
          if ($('lo-start').checked) out = 'lorem ipsum dolor sit amet ' + out;
        } else if (unit === 'sentences') {
          var ss = [];
          for (var j = 0; j < count; j++) ss.push(sentence(pool, true));
          out = ss.join(' ');
        } else {
          var ps = [];
          for (var k = 0; k < count; k++) {
            var nS = 3 + Math.floor(Math.random() * 4), ss2 = [];
            for (var m = 0; m < nS; m++) ss2.push(sentence(pool, true));
            ps.push(ss2.join(' '));
          }
          out = ps.join('\n\n');
        }
        if ($('lo-start').checked && unit !== 'words') out = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + out;
        $('lo-out').value = out;
        setHint('lo-hint', count + ' ' + unit + ' · ' + out.split(/\s+/).length + ' words · ' + out.length + ' characters');
      }
      $('lo-count').addEventListener('input', function () { $('lo-count-val').textContent = this.value; gen(); });
      ['lo-kind', 'lo-unit'].forEach(function (id) { $(id).addEventListener('change', gen); });
      $('lo-start').addEventListener('change', gen);
      $('lo-go').addEventListener('click', gen);
      $('lo-clear').addEventListener('click', function () { $('lo-out').value = ''; setHint('lo-hint', ''); });
      $('lo-copy').addEventListener('click', function () { S.copyText($('lo-out').value); });
      gen();
    }
  });

})(window.Signal);
