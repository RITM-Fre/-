/* ══════════════════════════════════════════════════════════════════════════
   SIGNAL CONSOLE — core
   Registry · router · command palette · declarative panel factory · helpers
   ══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ── tiny DOM helpers ─────────────────────────────────────────────── */
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function debounce(fn, ms) {
    var t = null;
    return function () {
      var a = arguments, c = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(c, a); }, ms || 180);
    };
  }
  function throttleRaf(fn) {
    var queued = false, lastArgs = null;
    return function () {
      lastArgs = arguments;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn.apply(null, lastArgs); });
    };
  }

  /* ── bytes / text ─────────────────────────────────────────────────── */
  function bytesToBase64(bytes) {
    var chunk = 0x8000, parts = [];
    for (var i = 0; i < bytes.length; i += chunk) {
      parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + chunk)));
    }
    return btoa(parts.join(''));
  }
  function base64ToBytes(b64) {
    var bin = atob(String(b64).replace(/\s+/g, '')), len = bin.length, out = new Uint8Array(len);
    for (var i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function textToBytes(str) { return new TextEncoder().encode(str); }
  function bytesToText(bytes) { return new TextDecoder('utf-8', { fatal: false }).decode(bytes); }
  function bytesToHex(bytes, sep) {
    var s = sep == null ? ' ' : sep, out = [];
    for (var i = 0; i < bytes.length; i++) out.push(bytes[i].toString(16).padStart(2, '0'));
    return out.join(s);
  }
  function hexToBytes(hex) {
    var c = String(hex).replace(/[\s:,-]/g, '').replace(/^0x/i, '');
    if (c.length % 2) c = '0' + c;
    if (!/^[0-9a-fA-F]*$/.test(c)) return null;
    var out = new Uint8Array(c.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(c.substr(i * 2, 2), 16);
    return out;
  }
  function utf8ToBase64(str) { return bytesToBase64(textToBytes(str)); }
  function base64ToUtf8(b64) { return bytesToText(base64ToBytes(b64)); }
  function formatBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1073741824) return (n / 1048576).toFixed(2) + ' MB';
    return (n / 1073741824).toFixed(2) + ' GB';
  }
  function wrapPem(b64, label) {
    var lines = String(b64).replace(/(.{64})/g, '$1\n').replace(/\n$/, '');
    return '-----BEGIN ' + label + '-----\n' + lines + '\n-----END ' + label + '-----';
  }
  function unwrapPem(pem) {
    return String(pem).replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  }
  function download(filename, data, mime) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function randomBytes(n) {
    var arr = new Uint8Array(n);
    if (global.crypto && crypto.getRandomValues) crypto.getRandomValues(arr);
    else for (var i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  }
  function randomHex(n) { return bytesToHex(randomBytes(n), ''); }

  /* ── clipboard ────────────────────────────────────────────────────── */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;opacity:0;padding:0;border:none;outline:none;background:transparent;font-size:16px;';
    document.body.appendChild(ta);
    var ok = false;
    try { ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); ok = document.execCommand('copy'); }
    catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function copyText(text, silent) {
    if (text == null || text === '') { if (!silent) toast('Nothing to copy yet.', 'info'); return Promise.resolve(false); }
    if (navigator.clipboard && navigator.clipboard.writeText && global.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () {
        if (!silent) toast('Copied to clipboard', 'ok');
        return true;
      }).catch(function () {
        var ok = legacyCopy(text);
        if (!silent) toast(ok ? 'Copied to clipboard' : 'Copy blocked — select and copy manually', ok ? 'ok' : 'err');
        return ok;
      });
    }
    var ok2 = legacyCopy(text);
    if (!silent) toast(ok2 ? 'Copied to clipboard' : 'Copy blocked — select and copy manually', ok2 ? 'ok' : 'err');
    return Promise.resolve(ok2);
  }

  /* ── toasts ───────────────────────────────────────────────────────── */
  var TOAST_ICON = {
    ok: '<svg class="t-ico" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    err: '<svg class="t-ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>',
    info: '<svg class="t-ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/></svg>'
  };
  function toast(msg, kind) {
    var stack = $('toast-stack');
    if (!stack) return;
    kind = kind || 'info';
    var node = document.createElement('div');
    node.className = 'toast ' + kind;
    node.innerHTML = (TOAST_ICON[kind] || TOAST_ICON.info) + '<span></span>';
    node.lastChild.textContent = msg;
    stack.appendChild(node);
    setTimeout(function () {
      node.classList.add('out');
      setTimeout(function () { node.remove(); }, 240);
    }, 2600);
    while (stack.children.length > 3) stack.firstChild.remove();
  }

  /* ── local storage ────────────────────────────────────────────────── */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('signal.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('signal.' + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem('signal.' + k); } catch (e) {} }
  };

  /* ── icons (24×24 stroke) ─────────────────────────────────────────── */
  var P = {
    home: '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.6V20a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9.6"/>',
    code: '<polyline points="9 7 4 12 9 17"/><polyline points="15 7 20 12 15 17"/>',
    radio: '<circle cx="12" cy="12" r="2.2"/><path d="M7.8 7.8a6 6 0 000 8.4M16.2 16.2a6 6 0 000-8.4"/><path d="M4.9 4.9a10 10 0 000 14.2M19.1 19.1a10 10 0 000-14.2"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>',
    lock: '<rect x="4" y="10.5" width="16" height="10.5" rx="2.4"/><path d="M8 10.5V7a4 4 0 018 0v3.5"/><circle cx="12" cy="15.6" r="1.3"/>',
    key: '<circle cx="8" cy="15" r="3.4"/><path d="M10.4 12.6L20 3M17 6l2.2 2.2M14.6 8.4l2.2 2.2"/>',
    shield: '<path d="M12 3l7.5 3v6c0 4.6-3.1 8.2-7.5 9.4C7.6 20.2 4.5 16.6 4.5 12V6L12 3z"/><polyline points="9 12 11.2 14.2 15.2 10.2"/>',
    keypair: '<circle cx="8" cy="8" r="3.6"/><circle cx="16" cy="16" r="3.6"/><path d="M10.6 10.6l2.8 2.8"/>',
    file: '<path d="M13.5 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8.5L13.5 3z"/><polyline points="13.5 3 13.5 8.5 19 8.5"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/><circle cx="9" cy="10" r="1.7"/><polyline points="4.5 17.5 9.5 12.5 13 16 16 13.5 20 17.5"/>',
    clock: '<circle cx="12" cy="12" r="8.6"/><polyline points="12 7.4 12 12 15.4 14"/>',
    palette: '<path d="M12 3.5a8.5 8.5 0 000 17c1.3 0 2-.9 2-1.9 0-1.5-1.4-1.8-1.4-3 0-.9.7-1.6 1.7-1.6h1.6A4.6 4.6 0 0020.5 9C20.5 5.9 16.7 3.5 12 3.5z"/><circle cx="7.8" cy="11" r="1.1"/><circle cx="11" cy="7.6" r="1.1"/><circle cx="15.4" cy="9.4" r="1.1"/>',
    type: '<polyline points="5 6.5 5 5 19 5 19 6.5"/><line x1="12" y1="5" x2="12" y2="19"/><line x1="9" y1="19" x2="15" y2="19"/>',
    braces: '<path d="M9 4.5C6.8 4.5 6.5 6 6.5 8.2c0 2-.5 3-2 3.8 1.5.8 2 1.8 2 3.8 0 2.2.3 3.7 2.5 3.7"/><path d="M15 4.5c2.2 0 2.5 1.5 2.5 3.7 0 2 .5 3 2 3.8-1.5.8-2 1.8-2 3.8 0 2.2-.3 3.7-2.5 3.7"/>',
    regex: '<path d="M4 20V9M4 9V5.5M4 9l3.5-3.5M4 9l3.5 3.5"/><circle cx="15.5" cy="8.5" r="3.6"/><path d="M12.5 17.5h6"/>',
    diff: '<path d="M7 4v16M17 4v16"/><path d="M4.5 9.5L7 7l2.5 2.5M14.5 14.5L17 17l2.5-2.5"/>',
    qr: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"/><path d="M13.5 13.5h3v3h-3zM18.5 18.5h1.5v1.5h-1.5zM13.5 18.5h2v2h-2z"/>',
    uuid: '<rect x="3.5" y="6" width="17" height="12" rx="2.4"/><path d="M7.5 10.5v3M11 10.5v3M14.5 10.5v3M18 10.5v3"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3.2"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="12" cy="12" r="1.2"/>',
    globe: '<circle cx="12" cy="12" r="8.6"/><path d="M3.5 12h17M12 3.4c2.4 2.5 3.6 5.4 3.6 8.6S14.4 18.1 12 20.6c-2.4-2.5-3.6-5.4-3.6-8.6S9.6 5.9 12 3.4z"/>',
    layers: '<path d="M12 3.5l8.5 4.4L12 12.3 3.5 7.9 12 3.5z"/><path d="M3.5 12.2l8.5 4.4 8.5-4.4"/><path d="M3.5 16.3l8.5 4.4 8.5-4.4"/>',
    terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2.2"/><polyline points="7.5 9.5 10.5 12 7.5 14.5"/><line x1="12.5" y1="14.5" x2="16.5" y2="14.5"/>',
    info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.2M12 7.6v.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>',
    download: '<path d="M12 3.5v11M8 11l4 4 4-4"/><path d="M4.5 19.5h15"/>',
    trash: '<path d="M4.5 7h15M9 7V4.8h6V7M6.5 7l1 13h9l1-13"/>',
    play: '<polygon points="7 4.5 19.5 12 7 19.5"/>',
    refresh: '<path d="M20 12a8 8 0 11-2.5-5.8"/><polyline points="20 3.5 20 8.5 15 8.5"/>',
    swap: '<polyline points="7.5 4.5 3.5 8.5 7.5 12.5"/><polyline points="16.5 11.5 20.5 15.5 16.5 19.5"/><line x1="3.5" y1="8.5" x2="20.5" y2="8.5"/><line x1="3.5" y1="15.5" x2="20.5" y2="15.5"/>',
    wand: '<path d="M5 19L16.5 7.5"/><path d="M14.5 5.5l4 4"/><path d="M6 3.5v3M4.5 5h3M18 15v3M16.5 16.5h3"/>',
    scale: '<path d="M12 4v16M7 20h10"/><path d="M4.5 8.5h15"/><path d="M4.5 8.5L2 14h5L4.5 8.5zM19.5 8.5L17 14h5l-2.5-5.5z"/>',
    wave: '<path d="M2.5 12h2.6l2-6 2.8 12 2.6-9 2 5 2-3h5.9"/>'
  };
  function icon(name, cls) {
    var d = P[name] || P.info;
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  }

  /* ── tool registry ────────────────────────────────────────────────── */
  var GROUPS = [
    { id: 'Start', label: 'Start', icon: 'home' },
    { id: 'Encoding', label: 'Encoding & Decoding', icon: 'code' },
    { id: 'Cipher', label: 'Classical Ciphers', icon: 'wave' },
    { id: 'Crypto', label: 'Modern Cryptography', icon: 'lock' },
    { id: 'Hashing', label: 'Hashing & Passwords', icon: 'hash' },
    { id: 'Utility', label: 'Utilities & Generators', icon: 'wand' },
    { id: 'Media', label: 'Files & Media', icon: 'image' },
    { id: 'Info', label: 'Information', icon: 'info' }
  ];
  var tools = [];
  var byId = {};
  var order = 0;

  function define(tool) {
    if (!tool || !tool.id) throw new Error('Tool needs an id');
    if (byId[tool.id]) { console.warn('Duplicate tool id:', tool.id); return; }
    tool.order = order++;
    tool.group = tool.group || 'Utility';
    tool.tags = tool.tags || [];
    tool.desc = tool.desc || '';
    tool.icon = tool.icon || 'wand';
    byId[tool.id] = tool;
    tools.push(tool);
    return tool;
  }
  function get(id) { return byId[id]; }
  function groups() {
    return GROUPS.filter(function (g) {
      return tools.some(function (t) { return t.group === g.id; });
    }).map(function (g) {
      return { id: g.id, label: g.label, icon: g.icon, tools: tools.filter(function (t) { return t.group === g.id; }) };
    });
  }
  function primary() { return tools.filter(function (t) { return t.primary; }); }

  function search(q) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return tools.slice();
    var parts = q.split(/\s+/);
    return tools.map(function (t) {
      var hay = (t.name + ' ' + t.id + ' ' + t.desc + ' ' + t.group + ' ' + t.tags.join(' ')).toLowerCase();
      var score = 0, ok = true;
      parts.forEach(function (p) {
        var i = hay.indexOf(p);
        if (i === -1) { ok = false; return; }
        score += (i === 0 ? 0 : 1) + (t.name.toLowerCase().indexOf(p) === 0 ? -3 : 0);
      });
      if (!ok) return null;
      return { t: t, s: score };
    }).filter(Boolean).sort(function (a, b) { return a.s - b.s || a.t.order - b.t.order; })
      .map(function (r) { return r.t; });
  }

  /* ── markup builders for tools ────────────────────────────────────── */
  function modeSwitchHtml(modes, activeId, cls) {
    if (!modes || !modes.length) return '';
    return '<div class="mode-switch ' + (cls || '') + '" role="tablist" aria-label="Mode">' +
      modes.map(function (m) {
        var id = m[0], label = m[1];
        return '<button class="mode-btn' + (id === activeId ? ' active' : '') + '" data-mode="' + id +
          '" type="button" role="tab" aria-selected="' + (id === activeId) + '">' + escapeHtml(label) + '</button>';
      }).join('') + '</div>';
  }
  function fieldHtml(f) {
    var id = f.id, label = f.label, ph = f.ph || '', val = f.value == null ? '' : f.value;
    var rows = f.rows || 4;
    var head = label ? '<label class="field-label" for="' + id + '">' + escapeHtml(label) +
      (f.optional ? ' <span class="opt">(optional)</span>' : '') + '</label>' : '';
    if (f.type === 'select') {
      return head + '<select id="' + id + '" class="field ' + (f.small ? 'field-sm' : '') + '">' +
        (f.options || []).map(function (o) {
          var v = o[0], l = o[1];
          return '<option value="' + escapeHtml(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + escapeHtml(l) + '</option>';
        }).join('') + '</select>';
    }
    if (f.type === 'number') {
      return head + '<input type="number" id="' + id + '" class="field field-sm" inputmode="numeric" value="' +
        escapeHtml(val) + '"' + (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') +
        (f.step != null ? ' step="' + f.step + '"' : '') + '>';
    }
    if (f.type === 'range') {
      return head + '<div class="range-row"><input type="range" id="' + id + '" min="' + (f.min || 0) + '" max="' + (f.max || 100) +
        '" step="' + (f.step || 1) + '" value="' + escapeHtml(val) + '"><span class="range-val" id="' + id + '-val"></span></div>';
    }
    if (f.type === 'text' || f.type === 'password') {
      return head + '<input type="' + f.type + '" id="' + id + '" class="field field-sm" value="' + escapeHtml(val) +
        '" placeholder="' + escapeHtml(ph) + '" spellcheck="false" autocapitalize="off" autocomplete="' + (f.type === 'password' ? 'new-password' : 'off') + '" autocorrect="off">';
    }
    return head + '<textarea id="' + id + '" class="field" rows="' + rows + '" placeholder="' + escapeHtml(ph) +
      '" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off">' + escapeHtml(val) + '</textarea>';
  }

  /* ── declarative I/O tool factory ─────────────────────────────────── */
  function ioTool(spec) {
    var id = spec.id;
    var modes = spec.modes || null;
    var activeMode = spec.defaultMode || (modes ? modes[0][0] : null);

    // Every DOM id is namespaced with the tool id so that two panels can both
    // declare a field called "in" without colliding in the document.
    function ns(f) {
      var copy = {};
      for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) copy[k] = f[k];
      copy._key = f.id;
      copy.id = id + '-' + f.id;
      return copy;
    }
    var inputs = (spec.inputs || [{ id: 'in', label: 'Input', ph: spec.ph || '' }]).map(ns);
    var extras = (spec.extra || []).map(ns);
    var out = ns(spec.output || { id: 'out', label: 'Result' });
    var state = { mode: activeMode };

    spec.build = function () {
      var html = '<div class="panel-head">' +
        '<div class="panel-icon">' + icon(spec.icon) + '</div>' +
        '<div class="panel-title-wrap"><h2 class="panel-title">' + escapeHtml(spec.name) + '</h2>' +
        '<p class="panel-desc">' + escapeHtml(spec.desc) + '</p></div>' +
        (spec.headActions || '') + '</div>';

      if (modes) html += '<div class="mode-row">' + modeSwitchHtml(modes, activeMode) + (spec.afterModes || '') + '</div>';

      if (extras.length) {
        if (spec.extraLabel) html += '<div class="panel-section"><p class="section-label">' + escapeHtml(spec.extraLabel) + '</p>';
        html += extras.length === 2
          ? '<div class="grid-2">' + extras.map(fieldHtml).join('') + '</div>'
          : extras.map(fieldHtml).join('');
        if (spec.extraLabel) html += '</div>';
      }

      inputs.forEach(function (f) { html += fieldHtml(f); });

      html += '<div class="action-row">';
      if (spec.swap !== false) html += '<button class="btn btn-swap" id="' + id + '-swap" type="button">' + icon('swap') + 'Swap</button>';
      if (spec.sample) html += '<button class="btn btn-soft" id="' + id + '-sample" type="button">' + icon('wand') + 'Sample</button>';
      html += '<button class="btn btn-ghost" id="' + id + '-clear" type="button">' + icon('trash') + 'Clear</button>';
      html += '</div>';

      html += '<label class="field-label" for="' + out.id + '">' + escapeHtml(out.label) + '</label>';
      html += '<textarea id="' + out.id + '" class="field" readonly placeholder="' + escapeHtml(out.ph || 'Your result will appear here…') + '"></textarea>';

      html += '<div class="result-row"><span class="hint" id="' + id + '-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="' + id + '-copy" type="button">' + icon('copy') + 'Copy</button>' +
        (spec.download !== false ? '<button class="btn btn-ghost btn-sm" id="' + id + '-download" type="button">' + icon('download') + 'Save</button>' : '') +
        '</div></div>';

      if (spec.extraHtml) html += spec.extraHtml;
      return html;
    };

    spec.mount = function (root) {
      var hintEl = $(id + '-hint');
      var outEl = $(out.id);

      function collect() {
        var v = {};
        inputs.concat(extras).forEach(function (f) {
          var e = $(f.id);
          v[f._key] = e ? e.value : '';
        });
        return v;
      }
      function setHint(text, kind) {
        if (!hintEl) return;
        hintEl.className = 'hint' + (kind ? ' ' + kind : '');
        hintEl.textContent = text || '';
      }
      function paint(res) {
        if (res == null) { outEl.value = ''; setHint(''); return; }
        if (typeof res === 'string') { outEl.value = res; setHint(''); return; }
        if (res.error) { outEl.value = ''; setHint(res.error, 'error'); return; }
        outEl.value = res.text == null ? '' : res.text;
        setHint(res.hint || '', res.hintKind || (res.ok === false ? 'error' : (res.ok ? 'ok' : '')));
        if (res.extraHtml) { var slot = $('' + id + '-extra'); if (slot) slot.innerHTML = res.extraHtml; }
      }
      var running = false;
      function run() {
        var res;
        try { res = spec.run({ mode: state.mode, values: collect(), id: id }); }
        catch (e) { paint({ error: e && e.message ? e.message : String(e) }); return; }
        if (res && typeof res.then === 'function') {
          if (running) return;
          running = true;
          setHint('Working…');
          res.then(function (r) { running = false; paint(r); }, function (e) {
            running = false; paint({ error: e && e.message ? e.message : String(e) });
          });
        } else paint(res);
      }
      spec.__run = run;

      var live = debounce(run, spec.delay == null ? 90 : spec.delay);
      inputs.concat(extras).forEach(function (f) {
        var e = $(f.id);
        if (!e) return;
        if (f.type === 'range') { var rv = $(f.id + '-val'); if (rv) rv.textContent = e.value; }
        var evt = (e.tagName === 'SELECT') ? 'change' : 'input';
        e.addEventListener(evt, function () {
          if (f.type === 'range') { var v = $(f.id + '-val'); if (v) v.textContent = e.value; }
          live();
        });
      });

      function syncModes() {
        $$('.mode-btn', root).forEach(function (x) {
          var on = x.dataset.mode === state.mode;
          x.classList.toggle('active', on);
          if (x.getAttribute('role') === 'tab') x.setAttribute('aria-selected', on ? 'true' : 'false');
        });
      }

      if (modes) {
        $$('.mode-btn', root).forEach(function (b) {
          b.addEventListener('click', function () {
            state.mode = b.dataset.mode;
            syncModes();
            if (spec.onMode) spec.onMode(state.mode, root);
            run();
          });
        });
      }

      if (spec.swap !== false) {
        var sw = $('' + id + '-swap');
        if (sw) sw.addEventListener('click', function () {
          var first = $(inputs[0].id);
          var t = first.value; first.value = outEl.value; outEl.value = t;
          if (modes) {
            state.mode = state.mode === modes[0][0] ? modes[1][0] : modes[0][0];
            syncModes();
            if (spec.onMode) spec.onMode(state.mode, root);
          }
          run();
        });
      }

      var sm = $('' + id + '-sample');
      if (sm) sm.addEventListener('click', function () {
        var s = spec.sample || {};
        inputs.forEach(function (f) { if (s[f.id] != null && $(f.id)) $(f.id).value = s[f.id]; });
        extras.forEach(function (f) { if (s[f.id] != null && $(f.id)) $(f.id).value = s[f.id]; });
        run();
      });

      var cl = $('' + id + '-clear');
      if (cl) cl.addEventListener('click', function () {
        inputs.forEach(function (f) { if ($(f.id)) $(f.id).value = ''; });
        extras.forEach(function (f) { if (f.type !== 'select' && f.type !== 'range' && $(f.id)) $(f.id).value = ''; });
        run();
      });

      var cp = $('' + id + '-copy');
      if (cp) cp.addEventListener('click', function () { copyText(outEl.value); });

      var dl = $('' + id + '-download');
      if (dl) dl.addEventListener('click', function () {
        if (!outEl.value) { toast('Nothing to save yet', 'info'); return; }
        download(spec.downloadName || (id + '.txt'), outEl.value, spec.downloadMime || 'text/plain;charset=utf-8');
      });

      if (spec.afterMount) spec.afterMount(root, { run: run, paint: paint, collect: collect, state: state });

      if (spec.sample) {
        var s0 = spec.sample;
        inputs.forEach(function (f) { if (s0[f.id] != null && $(f.id)) $(f.id).value = s0[f.id]; });
        extras.forEach(function (f) { if (s0[f.id] != null && $(f.id)) $(f.id).value = s0[f.id]; });
      }
      run();
    };
    return define(spec);
  }

  /* ── custom tool factory (full control) ───────────────────────────── */
  function customTool(spec) {
    spec.custom = true;
    spec.mount = spec.mount || function () {};
    return define(spec);
  }
  function wrapPanel(spec, inner) {
    return '<div class="panel-head">' +
      '<div class="panel-icon">' + icon(spec.icon) + '</div>' +
      '<div class="panel-title-wrap"><h2 class="panel-title">' + escapeHtml(spec.name) + '</h2>' +
      '<p class="panel-desc">' + escapeHtml(spec.desc) + '</p></div>' +
      (spec.headActions || '') + '</div>' + inner;
  }

  /* ── theme ────────────────────────────────────────────────────────── */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    store.set('theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#eef1f6' : '#070b12');
  }
  function toggleTheme() {
    var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    toast(next === 'light' ? 'Light theme' : 'Dark theme', 'info');
  }

  /* ── export ───────────────────────────────────────────────────────── */
  global.Signal = {
    $: $, $$: $$, escapeHtml: escapeHtml, debounce: debounce, throttleRaf: throttleRaf,
    bytesToBase64: bytesToBase64, base64ToBytes: base64ToBytes,
    textToBytes: textToBytes, bytesToText: bytesToText,
    bytesToHex: bytesToHex, hexToBytes: hexToBytes,
    utf8ToBase64: utf8ToBase64, base64ToUtf8: base64ToUtf8,
    formatBytes: formatBytes, wrapPem: wrapPem, unwrapPem: unwrapPem,
    download: download, randomBytes: randomBytes, randomHex: randomHex,
    copyText: copyText, toast: toast, store: store,
    icon: icon, ICONS: P,
    define: define, get: get, tools: tools, groups: groups, primary: primary, search: search, GROUPS: GROUPS,
    ioTool: ioTool, customTool: customTool, wrapPanel: wrapPanel,
    modeSwitchHtml: modeSwitchHtml, fieldHtml: fieldHtml,
    applyTheme: applyTheme, toggleTheme: toggleTheme
  };
})(window);
