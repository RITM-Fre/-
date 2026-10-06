/* ══════════════════════════════════════════════════════════════════════════
   SIGNAL — hashing, key derivation, passwords, TOTP, JWT
   ══════════════════════════════════════════════════════════════════════════ */
(function (S) {
  'use strict';
  var $ = S.$, $$ = S.$$, esc = S.escapeHtml;
  var HW = function () { return (typeof hashwasm !== 'undefined') ? hashwasm : null; };

  /* hash-wasm's UMD build does not expose a plain `hmac()` helper — HMAC has
     to be built from a hasher instance via createHMAC(). Verified against the
     RFC 2202 test vectors. */
  var HASHER = { sha1: 'createSHA1', sha256: 'createSHA256', sha384: 'createSHA384', sha512: 'createSHA512' };
  function hmacHex(algo, keyBytes, msgBytes) {
    var h = HW();
    if (!h || !h.createHMAC) return Promise.reject(new Error('HMAC is unavailable.'));
    var factory = HASHER[algo];
    if (!factory || typeof h[factory] !== 'function') return Promise.reject(new Error('Unsupported hash: ' + algo));
    return h.createHMAC(h[factory](), keyBytes).then(function (mac) {
      mac.init();
      mac.update(msgBytes);
      return mac.digest('hex');
    });
  }

  function setHint(id, text, kind) {
    var el = $(id); if (!el) return;
    el.className = 'hint' + (kind ? ' ' + kind : '');
    el.textContent = text || '';
  }

  /* ═══════════════ HASH ═══════════════ */
  var HASHES = [
    ['MD5', 'md5', 128], ['SHA-1', 'sha1', 160], ['SHA-256', 'sha256', 256],
    ['SHA-384', 'sha384', 384], ['SHA-512', 'sha512', 512], ['RIPEMD-160', 'ripemd160', 160]
  ];
  S.customTool({
    id: 'hash', name: 'Hash Generator', group: 'Hashing', icon: 'hash', primary: true,
    desc: 'MD5, SHA-1, SHA-256/384/512 and RIPEMD-160 — computed locally, instantly, with an optional comparison mode.',
    tags: ['hash', 'md5', 'sha1', 'sha256', 'sha512', 'ripemd', 'checksum', 'digest'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['hash', 'Hash'], ['compare', 'Compare']], 'hash') +
        '<div class="flex-row"><label class="check"><input type="checkbox" id="hash-all"> Show all algorithms</label></div></div>' +
        '<label class="field-label" for="hash-algo">Algorithm</label>' +
        '<select id="hash-algo" class="field field-sm">' +
        HASHES.map(function (h) { return '<option value="' + h[1] + '"' + (h[1] === 'sha256' ? ' selected' : '') + '>' + h[0] + ' · ' + h[2] + '-bit</option>'; }).join('') +
        '</select>' +
        '<label class="field-label" for="hash-in">Input</label>' +
        '<textarea id="hash-in" class="field" rows="5" placeholder="Text to hash…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-soft" id="hash-sample" type="button">' + S.icon('wand') + 'Sample</button>' +
        '<button class="btn btn-ghost" id="hash-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="hash-out">Digest (hex)</label>' +
        '<textarea id="hash-out" class="field" rows="3" readonly placeholder="Hash result…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="hash-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="hash-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>' +
        '<div id="hash-compare-wrap" hidden><label class="field-label" for="hash-expected">Expected digest</label>' +
        '<input type="text" id="hash-expected" class="field field-sm" placeholder="Paste the expected hash…" spellcheck="false">' +
        '<div id="hash-cmp-result" class="mt-1"></div></div>' +
        '<div id="hash-all-wrap" hidden><div class="panel-section"><p class="section-label">All algorithms</p>' +
        '<div class="table-wrap"><table class="data-table"><tbody id="hash-all-body"></tbody></table></div></div></div>');
    },
    mount: function () {
      var mode = 'hash';
      var inp = $('hash-in'), out = $('hash-out');
      function fn(name) { var h = HW(); return h ? h[name] : null; }
      function compute() {
        setHint('hash-hint', '');
        if (!HW()) { setHint('hash-hint', 'hash-wasm failed to load.', 'error'); return; }
        if (!inp.value) { out.value = ''; $('hash-all-body').innerHTML = ''; $('hash-cmp-result').innerHTML = ''; return; }
        var algo = $('hash-algo').value;
        var bytes = S.textToBytes(inp.value);
        Promise.resolve().then(function () { return fn(algo)(bytes); }).then(function (hex) {
          out.value = hex;
          setHint('hash-hint', bytes.length + ' bytes · ' + algo.toUpperCase() + ' · ' + (hex.length * 4) + '-bit digest');
          if (mode === 'compare') compare(hex);
        }).catch(function (e) { setHint('hash-hint', 'Hashing failed: ' + e.message, 'error'); });

        if ($('hash-all').checked) {
          Promise.all(HASHES.map(function (h) {
            return Promise.resolve().then(function () { return fn(h[1])(bytes); }).then(function (v) { return [h[0], v]; }).catch(function () { return [h[0], '—']; });
          })).then(function (rows) {
            $('hash-all-body').innerHTML = rows.map(function (r) {
              return '<tr><td style="width:110px;color:var(--muted)">' + r[0] + '</td><td>' + esc(r[1]) + '</td></tr>';
            }).join('');
          });
        } else $('hash-all-body').innerHTML = '';
      }
      function compare(hex) {
        var expected = $('hash-expected').value.trim().toLowerCase();
        var el = $('hash-cmp-result');
        if (!expected) { el.innerHTML = ''; return; }
        var match = expected === hex.toLowerCase();
        el.innerHTML = '<span class="chip ' + (match ? 'ok' : 'bad') + '">' + (match ? '✓ Match — digests are identical' : '✗ No match') + '</span>';
      }
      $$('.mode-btn', $('panel-hash')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-hash')).forEach(function (x) { x.classList.toggle('active', x === b); });
          $('hash-compare-wrap').hidden = mode !== 'compare';
          compute();
        });
      });
      inp.addEventListener('input', S.debounce(compute, 120));
      $('hash-algo').addEventListener('change', compute);
      $('hash-expected').addEventListener('input', function () { if (out.value) compare(out.value); });
      $('hash-all').addEventListener('change', compute);
      $('hash-sample').addEventListener('click', function () { inp.value = 'The quick brown fox jumps over the lazy dog'; compute(); });
      $('hash-clear').addEventListener('click', function () { inp.value = ''; $('hash-expected').value = ''; compute(); });
      $('hash-copy').addEventListener('click', function () { S.copyText(out.value); });
      inp.value = 'The quick brown fox jumps over the lazy dog';
      compute();
    }
  });

  /* ═══════════════ HMAC ═══════════════ */
  S.customTool({
    id: 'hmac', name: 'HMAC', group: 'Hashing', icon: 'shield',
    desc: 'Keyed message authentication (HMAC) with SHA-1, SHA-256, SHA-384 or SHA-512 — the standard way to prove a message was not tampered with.',
    tags: ['hmac', 'mac', 'authentication', 'signature', 'sha256'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row"><span class="chip">HMAC-SHA</span></div>' +
        '<div class="grid-2">' +
        '<div><label class="field-label" for="hmac-algo">Hash function</label><select id="hmac-algo" class="field field-sm">' +
        '<option value="sha256" selected>SHA-256</option><option value="sha1">SHA-1</option><option value="sha384">SHA-384</option><option value="sha512">SHA-512</option></select></div>' +
        '<div><label class="field-label" for="hmac-key">Secret key</label><input type="text" id="hmac-key" class="field field-sm" value="secret" placeholder="secret" spellcheck="false"></div>' +
        '</div>' +
        '<label class="field-label" for="hmac-in">Message</label>' +
        '<textarea id="hmac-in" class="field" rows="4" placeholder="Message to authenticate…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-soft" id="hmac-sample" type="button">' + S.icon('wand') + 'Sample</button>' +
        '<button class="btn btn-ghost" id="hmac-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="hmac-out">HMAC (hex)</label>' +
        '<textarea id="hmac-out" class="field" rows="3" readonly placeholder="Authentication tag…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="hmac-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="hmac-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>' +
        '<div id="hmac-cmp-wrap"><label class="field-label" for="hmac-expected">Expected tag <span class="opt">— to verify</span></label>' +
        '<input type="text" id="hmac-expected" class="field field-sm" placeholder="Paste an expected HMAC…" spellcheck="false">' +
        '<div id="hmac-cmp" class="mt-1"></div></div>');
    },
    mount: function () {
      var inp = $('hmac-in'), out = $('hmac-out');
      function compute() {
        setHint('hmac-hint', '');
        if (!HW()) { setHint('hmac-hint', 'hash-wasm failed to load.', 'error'); return; }
        if (!inp.value) { out.value = ''; $('hmac-cmp').innerHTML = ''; return; }
        var algo = $('hmac-algo').value;
        var key = S.textToBytes($('hmac-key').value);
        if (!key.length) { out.value = ''; setHint('hmac-hint', 'Enter a secret key.', 'error'); return; }
        hmacHex(algo, key, S.textToBytes(inp.value)).then(function (hex) {
          out.value = hex;
          setHint('hmac-hint', 'HMAC-' + algo.toUpperCase().replace('SHA', 'SHA-') + ' · ' + (hex.length * 4) + '-bit tag');
          var exp = $('hmac-expected').value.trim().toLowerCase();
          $('hmac-cmp').innerHTML = exp ? '<span class="chip ' + (exp === hex.toLowerCase() ? 'ok' : 'bad') + '">' + (exp === hex.toLowerCase() ? '✓ Match' : '✗ No match') + '</span>' : '';
        }).catch(function (e) { setHint('hmac-hint', 'HMAC failed: ' + e.message, 'error'); });
      }
      inp.addEventListener('input', S.debounce(compute, 120));
      ['hmac-key', 'hmac-algo', 'hmac-expected'].forEach(function (id) {
        var el = $(id);
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', compute);
      });
      $('hmac-sample').addEventListener('click', function () { inp.value = 'The quick brown fox jumps over the lazy dog'; compute(); });
      $('hmac-clear').addEventListener('click', function () { inp.value = ''; $('hmac-expected').value = ''; compute(); });
      $('hmac-copy').addEventListener('click', function () { S.copyText(out.value); });
      inp.value = 'The quick brown fox jumps over the lazy dog';
      compute();
    }
  });

  /* ═══════════════ PBKDF2 ═══════════════ */
  S.customTool({
    id: 'pbkdf2', name: 'PBKDF2', group: 'Hashing', icon: 'key',
    desc: 'Stretch a password into a key with PBKDF2-HMAC. Choose the iteration count, salt and output length.',
    tags: ['pbkdf2', 'kdf', 'key derivation', 'password', 'salt'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row"><span class="chip">PBKDF2-HMAC</span></div>' +
        '<label class="field-label" for="pb-pass">Password</label>' +
        '<input type="text" id="pb-pass" class="field field-sm" value="correct horse battery staple" placeholder="password" spellcheck="false">' +
        '<div class="grid-2">' +
        '<div><label class="field-label" for="pb-hash">Hash</label><select id="pb-hash" class="field field-sm">' +
        '<option value="sha256" selected>SHA-256</option><option value="sha1">SHA-1</option><option value="sha512">SHA-512</option></select></div>' +
        '<div><label class="field-label" for="pb-len">Derived key length (bytes)</label><input type="number" id="pb-len" class="field field-sm" value="32" min="16" max="64"></div>' +
        '</div>' +
        '<label class="field-label" for="pb-salt">Salt <span class="opt">(hex or plain text)</span></label>' +
        '<div class="flex-row"><input type="text" id="pb-salt" class="field field-sm" value="signal-console-salt" placeholder="salt" spellcheck="false" style="flex:1;min-width:180px">' +
        '<button class="btn btn-ghost btn-sm" id="pb-randsalt" type="button">' + S.icon('refresh') + 'Random</button></div>' +
        '<label class="field-label" for="pb-iter">Iterations</label>' +
        '<div class="range-row"><input type="range" id="pb-iter" min="1000" max="500000" step="1000" value="100000"><span class="range-val" id="pb-iter-val">100000</span></div>' +
        '<div class="action-row"><button class="btn btn-primary" id="pb-go" type="button">' + S.icon('key') + 'Derive key</button>' +
        '<button class="btn btn-ghost" id="pb-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="pb-out">Derived key (hex)</label>' +
        '<textarea id="pb-out" class="field" rows="3" readonly placeholder="Derived key…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="pb-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="pb-copy" type="button">' + S.icon('copy') + 'Copy hex</button>' +
        '<button class="btn btn-ghost btn-sm" id="pb-copy-b64" type="button">' + S.icon('copy') + 'Copy Base64</button></div></div>');
    },
    mount: function () {
      var busy = false;
      $('pb-iter').addEventListener('input', function () { $('pb-iter-val').textContent = (+this.value).toLocaleString(); });
      $('pb-randsalt').addEventListener('click', function () { $('pb-salt').value = S.randomHex(16); });
      $('pb-go').addEventListener('click', function () {
        setHint('pb-hint', '');
        if (!HW()) { setHint('pb-hint', 'hash-wasm failed to load.', 'error'); return; }
        if (!S.$('pb-pass').value) { setHint('pb-hint', 'Enter a password.', 'error'); return; }
        if (busy) return; busy = true;
        var iter = +$('pb-iter').value;
        setHint('pb-hint', 'Running ' + iter.toLocaleString() + ' iterations…');
        setTimeout(function () {
          var t0 = performance.now();
          Promise.resolve().then(function () {
            return hashwasm.pbkdf2({
              password: $('pb-pass').value,
              salt: $('pb-salt').value,
              iterations: iter,
              hashLength: +$('pb-len').value || 32,
              hashFunction: hashwasm[HASHER[$('pb-hash').value]]()
            });
          }).then(function (hex) {
            $('pb-out').value = hex;
            setHint('pb-hint', 'Derived ' + (hex.length / 2) + ' bytes in ' + Math.round(performance.now() - t0) + ' ms', 'ok');
          }).catch(function (e) { setHint('pb-hint', 'PBKDF2 failed: ' + e.message, 'error'); })
            .then(function () { busy = false; });
        }, 20);
      });
      $('pb-clear').addEventListener('click', function () { $('pb-out').value = ''; setHint('pb-hint', ''); });
      $('pb-copy').addEventListener('click', function () { S.copyText($('pb-out').value); });
      $('pb-copy-b64').addEventListener('click', function () {
        var b = S.hexToBytes($('pb-out').value);
        if (!b) { S.toast('Derive a key first', 'info'); return; }
        S.copyText(S.bytesToBase64(b));
      });
    }
  });

  /* ═══════════════ CRC32 ═══════════════ */
  S.customTool({
    id: 'crc32', name: 'CRC32', group: 'Hashing', icon: 'hash',
    desc: 'Fast 32-bit cyclic redundancy check used for integrity verification in ZIP, PNG and network frames.',
    tags: ['crc32', 'checksum', 'integrity', 'zip', 'png'],
    build: function () {
      return S.wrapPanel(this,
        '<label class="field-label" for="crc-in">Input</label>' +
        '<textarea id="crc-in" class="field" rows="4" placeholder="Text to checksum…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-soft" id="crc-sample" type="button">' + S.icon('wand') + 'Sample</button>' +
        '<button class="btn btn-ghost" id="crc-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<div class="panel-section"><p class="section-label">Checksum</p>' +
        '<div class="kv-list">' +
        '<div class="kv-row"><div class="kv-k">Hex</div><div class="kv-v" id="crc-hex">—</div></div>' +
        '<div class="kv-row"><div class="kv-k">Decimal</div><div class="kv-v" id="crc-dec">—</div></div>' +
        '</div>' +
        '<div class="result-row"><span class="hint" id="crc-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="crc-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div></div>');
    },
    mount: function () {
      var inp = $('crc-in');
      function compute() {
        setHint('crc-hint', '');
        if (!HW()) { setHint('crc-hint', 'hash-wasm failed to load.', 'error'); return; }
        if (!inp.value) { $('crc-hex').textContent = '—'; $('crc-dec').textContent = '—'; return; }
        Promise.resolve().then(function () { return hashwasm.crc32(S.textToBytes(inp.value)); }).then(function (v) {
          var hex = (v >>> 0).toString(16).padStart(8, '0');
          $('crc-hex').textContent = hex;
          $('crc-dec').textContent = v >>> 0;
          setHint('crc-hint', S.textToBytes(inp.value).length + ' bytes · CRC-32/ISO-HDLC');
        }).catch(function (e) { setHint('crc-hint', 'Failed: ' + e.message, 'error'); });
      }
      inp.addEventListener('input', S.debounce(compute, 120));
      $('crc-sample').addEventListener('click', function () { inp.value = 'The quick brown fox jumps over the lazy dog'; compute(); });
      $('crc-clear').addEventListener('click', function () { inp.value = ''; compute(); });
      $('crc-copy').addEventListener('click', function () { S.copyText($('crc-hex').textContent); });
      inp.value = 'The quick brown fox jumps over the lazy dog';
      compute();
    }
  });

  /* ═══════════════ PASSWORD HASHING ═══════════════ */
  S.customTool({
    id: 'bcrypt', name: 'Password Hashing', group: 'Hashing', icon: 'lock',
    desc: 'bcrypt, scrypt and Argon2id with automatic salt generation — the algorithms you should actually store passwords with.',
    tags: ['bcrypt', 'scrypt', 'argon2', 'password', 'hash', 'salt'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['hash', 'Hash'], ['verify', 'Verify']], 'hash') +
        '<span class="chip" id="pw-chip">hash-wasm</span></div>' +
        '<label class="field-label" for="pw-algo">Algorithm</label>' +
        '<select id="pw-algo" class="field field-sm">' +
        '<option value="bcrypt" selected>bcrypt · cost 10</option>' +
        '<option value="scrypt">scrypt · N=16384 r=8 p=1</option>' +
        '<option value="argon2id">Argon2id · 3 passes, 4 MB</option>' +
        '</select>' +
        '<label class="field-label" for="pw-input">Password</label>' +
        '<input type="password" id="pw-input" class="field field-sm" placeholder="Enter a password…" autocomplete="new-password">' +
        '<label class="check mt-1"><input type="checkbox" id="pw-show"> Show password</label>' +
        '<label class="field-label" for="pw-salt">Salt <span class="opt">— leave empty for a random one</span></label>' +
        '<input type="text" id="pw-salt" class="field field-sm" placeholder="auto-generated if empty" spellcheck="false">' +
        '<div class="action-row"><button class="btn btn-primary" id="pw-go" type="button">' + S.icon('hash') + '<span id="pw-go-label">Hash</span></button>' +
        '<button class="btn btn-ghost" id="pw-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="pw-out">Result</label>' +
        '<textarea id="pw-out" class="field" rows="3" readonly placeholder="The hash will appear here…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="pw-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="pw-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>' +
        '<div id="pw-verify-wrap" hidden>' +
        '<label class="field-label" for="pw-expected">Hash to verify against</label>' +
        '<input type="text" id="pw-expected" class="field field-sm" placeholder="Paste a stored hash…" spellcheck="false">' +
        '<label class="field-label" for="pw-verify-salt">Salt used <span class="opt">(for scrypt / Argon2)</span></label>' +
        '<input type="text" id="pw-verify-salt" class="field field-sm" placeholder="salt" spellcheck="false">' +
        '<div id="pw-verify-result" class="mt-1"></div></div>');
    },
    mount: function () {
      var mode = 'hash', busy = false;
      $('pw-show').addEventListener('change', function () { $('pw-input').type = this.checked ? 'text' : 'password'; });
      $('pw-chip').className = 'chip' + (HW() ? ' ok' : ' bad');
      $('pw-chip').textContent = HW() ? 'hash-wasm ready' : 'hash-wasm missing';
      $$('.mode-btn', $('panel-bcrypt')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-bcrypt')).forEach(function (x) { x.classList.toggle('active', x === b); });
          $('pw-go-label').textContent = mode === 'hash' ? 'Hash' : 'Verify';
          $('pw-verify-wrap').hidden = mode !== 'verify';
          setHint('pw-hint', '');
        });
      });
      /* hash-wasm wants an exact-length byte salt: bcrypt requires precisely
         16 bytes, while scrypt and Argon2id require at least 8. We normalise
         whatever the user typed (or our random hex) into that shape. */
      function fixedSalt(text, len) {
        var bytes = S.textToBytes(text || '');
        var out = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
          out[i] = i < bytes.length ? bytes[i] : ((i * 31 + 7) & 0xFF);
        }
        return out;
      }
      function work(pw, algo, salt) {
        if (algo === 'bcrypt') {
          return hashwasm.bcrypt({ password: pw, salt: fixedSalt(salt, 16), costFactor: 10 });
        }
        if (algo === 'scrypt') {
          return hashwasm.scrypt({ password: pw, salt: fixedSalt(salt, 16), costFactor: 16384, blockSize: 8, parallelism: 1, hashLength: 32 });
        }
        return hashwasm.argon2id({ password: pw, salt: fixedSalt(salt, 16), parallelism: 1, iterations: 3, memorySize: 4096, hashLength: 32 });
      }
      $('pw-go').addEventListener('click', function () {
        setHint('pw-hint', '');
        if (!HW()) { setHint('pw-hint', 'hash-wasm failed to load.', 'error'); return; }
        var pw = $('pw-input').value;
        if (!pw) { setHint('pw-hint', 'Enter a password.', 'error'); return; }
        var algo = $('pw-algo').value;
        var expected = $('pw-expected').value.trim();
        var resultEl = $('pw-verify-result');
        if (busy) return; busy = true;
        $('pw-out').value = '';
        var t0 = performance.now();

        // bcrypt embeds its own salt and cost, so verification goes through
        // bcryptVerify() rather than re-hashing.
        if (mode === 'verify' && algo === 'bcrypt') {
          if (!expected) { busy = false; setHint('pw-hint', 'Paste the stored bcrypt hash to verify against.', 'error'); return; }
          setHint('pw-hint', 'Verifying…');
          setTimeout(function () {
            Promise.resolve().then(function () { return hashwasm.bcryptVerify({ password: pw, hash: expected }); })
              .then(function (ok) {
                $('pw-out').value = expected;
                resultEl.innerHTML = '<span class="chip ' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✓ Password matches the stored hash' : '✗ Does not match') + '</span>';
                setHint('pw-hint', 'bcrypt verified in ' + Math.round(performance.now() - t0) + ' ms', ok ? 'ok' : 'error');
              })
              .catch(function (e) {
                resultEl.innerHTML = '<span class="chip bad">✗ ' + esc(e && e.message || 'error') + '</span>';
                setHint('pw-hint', 'Verification failed.', 'error');
              })
              .then(function () { busy = false; });
          }, 20);
          return;
        }

        var salt = mode === 'verify' ? $('pw-verify-salt').value.trim() : $('pw-salt').value.trim();
        if (!salt) {
          salt = S.randomHex(16);
          if (mode === 'hash') $('pw-salt').value = salt;
        }
        setHint('pw-hint', 'Hashing — this is deliberately slow…');
        setTimeout(function () {
          Promise.resolve().then(function () { return work(pw, algo, salt); }).then(function (hash) {
            $('pw-out').value = hash;
            setHint('pw-hint', algo + ' · ' + Math.round(performance.now() - t0) + ' ms · salt ' + salt, 'ok');
            if (mode === 'verify') {
              if (!expected) resultEl.innerHTML = '';
              else resultEl.innerHTML = '<span class="chip ' + (expected === hash ? 'ok' : 'bad') + '">' + (expected === hash ? '✓ Match' : '✗ No match') + '</span>';
            }
          }).catch(function (e) { setHint('pw-hint', 'Hashing failed: ' + (e && e.message || e), 'error'); })
            .then(function () { busy = false; });
        }, 20);
      });
      $('pw-algo').addEventListener('change', function () {
        $('pw-salt').value = ''; $('pw-out').value = ''; $('pw-verify-result').innerHTML = ''; setHint('pw-hint', '');
      });
      $('pw-expected').addEventListener('input', function () {
        var el = $('pw-verify-result');
        if (!$('pw-out').value) return;
        el.innerHTML = '<span class="chip ' + (this.value.trim() === $('pw-out').value ? 'ok' : 'bad') + '">' + (this.value.trim() === $('pw-out').value ? '✓ Match' : '✗ No match') + '</span>';
      });
      $('pw-clear').addEventListener('click', function () {
        $('pw-input').value = ''; $('pw-salt').value = ''; $('pw-out').value = '';
        $('pw-expected').value = ''; $('pw-verify-salt').value = '';
        $('pw-verify-result').innerHTML = ''; setHint('pw-hint', '');
      });
      $('pw-copy').addEventListener('click', function () { S.copyText($('pw-out').value); });
    }
  });

  /* ═══════════════ TOTP ═══════════════ */
  function b32ToBytes(str) {
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    var c = String(str).toUpperCase().replace(/=+$/, '').replace(/[\s-]/g, '');
    var bits = 0, val = 0, out = [];
    for (var i = 0; i < c.length; i++) {
      var idx = A.indexOf(c[i]);
      if (idx === -1) throw new Error('Invalid Base32 character: ' + c[i]);
      val = (val << 5) | idx; bits += 5;
      if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xFF); bits -= 8; }
    }
    return new Uint8Array(out);
  }
  S.customTool({
    id: 'totp', name: 'TOTP / 2FA Codes', group: 'Hashing', icon: 'clock',
    desc: 'Generate time-based one-time passwords (RFC 6238) from a Base32 secret — the codes authenticator apps show you.',
    tags: ['totp', 'otp', '2fa', 'authenticator', 'rfc6238', 'google authenticator'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="grid-2">' +
        '<div><label class="field-label" for="totp-secret">Secret (Base32)</label>' +
        '<input type="text" id="totp-secret" class="field field-sm" value="JBSWY3DPEHPK3PXP" placeholder="JBSWY3DPEHPK3PXP" spellcheck="false"></div>' +
        '<div><label class="field-label" for="totp-algo">Algorithm</label><select id="totp-algo" class="field field-sm">' +
        '<option value="sha1" selected>SHA-1 (standard)</option><option value="sha256">SHA-256</option><option value="sha512">SHA-512</option></select></div>' +
        '</div>' +
        '<div class="grid-3 mt-1">' +
        '<div><label class="field-label" for="totp-digits">Digits</label><select id="totp-digits" class="field field-sm">' +
        '<option value="6" selected>6</option><option value="8">8</option></select></div>' +
        '<div><label class="field-label" for="totp-period">Period (s)</label><input type="number" id="totp-period" class="field field-sm" value="30" min="10" max="120"></div>' +
        '<div><label class="field-label" for="totp-time">Unix time <span class="opt">(0 = now)</span></label><input type="number" id="totp-time" class="field field-sm" value="0"></div>' +
        '</div>' +
        '<div class="panel-section"><p class="section-label">Current code</p>' +
        '<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;">' +
        '<div class="mono-block mark" id="totp-code" style="font-size:34px;letter-spacing:.16em;max-height:none;flex:1;min-width:200px;text-align:center;border-style:solid;">——————</div>' +
        '<div style="flex:0 0 auto;text-align:center;"><div class="mono-block" id="totp-left" style="font-size:20px;max-height:none;border-style:solid;min-width:74px;">30</div>' +
        '<div class="text-dim" style="font-size:11px;margin-top:5px;">seconds left</div></div></div>' +
        '<div class="bar-meter"><i id="totp-bar"></i></div>' +
        '<div class="result-row"><span class="hint" id="totp-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="totp-copy" type="button">' + S.icon('copy') + 'Copy code</button></div></div></div>' +
        '<div class="panel-section"><p class="section-label">otpauth:// URI</p>' +
        '<div class="mono-block" id="totp-uri" style="font-size:11.5px;"></div></div>');
    },
    mount: function () {
      var tick = null;
      function compute() {
        setHint('totp-hint', '');
        if (!HW()) { setHint('totp-hint', 'hash-wasm failed to load.', 'error'); return; }
        var secret = $('totp-secret').value.trim();
        if (!secret) { $('totp-code').textContent = '——————'; $('totp-uri').textContent = ''; return; }
        var key;
        try { key = b32ToBytes(secret); } catch (e) { setHint('totp-hint', e.message, 'error'); $('totp-code').textContent = '——————'; return; }
        if (!key.length) { setHint('totp-hint', 'Secret is empty.', 'error'); return; }
        var period = Math.max(10, parseInt($('totp-period').value, 10) || 30);
        var digits = parseInt($('totp-digits').value, 10) || 6;
        var algo = $('totp-algo').value;
        var forced = parseInt($('totp-time').value, 10) || 0;
        var now = forced || Math.floor(Date.now() / 1000);
        var counter = Math.floor(now / period);
        var msg = new Uint8Array(8);
        var tmp = counter;
        for (var i = 7; i >= 0; i--) { msg[i] = tmp & 0xFF; tmp = Math.floor(tmp / 256); }
        hmacHex(algo, key, msg).then(function (hex) {
          var h = S.hexToBytes(hex);
          var off = h[h.length - 1] & 0x0F;
          var bin = ((h[off] & 0x7F) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
          var code = (bin % Math.pow(10, digits)).toString().padStart(digits, '0');
          $('totp-code').textContent = code.slice(0, digits / 2) + ' ' + code.slice(digits / 2);
          $('totp-uri').textContent = 'otpauth://totp/Signal?secret=' + secret.toUpperCase().replace(/\s/g, '') +
            '&issuer=Signal&algorithm=' + algo.toUpperCase() + '&digits=' + digits + '&period=' + period;
          setHint('totp-hint', algo.toUpperCase() + ' · ' + digits + ' digits · ' + period + 's window' + (forced ? ' · at ' + new Date(forced * 1000).toISOString() : ''), 'ok');
        }).catch(function (e) { setHint('totp-hint', 'Failed: ' + e.message, 'error'); });
      }
      function countdown() {
        var period = Math.max(10, parseInt($('totp-period').value, 10) || 30);
        if (parseInt($('totp-time').value, 10)) { $('totp-left').textContent = '—'; $('totp-bar').style.width = '0%'; return; }
        var left = period - (Math.floor(Date.now() / 1000) % period);
        $('totp-left').textContent = left;
        $('totp-bar').style.width = ((left / period) * 100).toFixed(1) + '%';
        if (left === period) compute();
      }
      ['totp-secret', 'totp-algo', 'totp-digits', 'totp-period', 'totp-time'].forEach(function (id) {
        var el = $(id);
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', S.debounce(compute, 150));
      });
      $('totp-copy').addEventListener('click', function () { S.copyText($('totp-code').textContent.replace(/\s/g, '')); });
      compute(); countdown();
      tick = setInterval(countdown, 1000);
      if (window.Signal) { window.Signal.__cleanup = window.Signal.__cleanup || []; }
    }
  });

  /* ═══════════════ JWT ═══════════════ */
  function b64urlDecode(str) {
    var s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function b64urlEncode(bytes) {
    return S.bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  S.customTool({
    id: 'jwt', name: 'JWT Workbench', group: 'Hashing', icon: 'shield',
    desc: 'Decode a JSON Web Token, inspect its claims and expiry, and verify or create HS256/384/512 signatures.',
    tags: ['jwt', 'token', 'jose', 'json web token', 'bearer', 'auth'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['decode', 'Decode'], ['sign', 'Create']], 'decode') +
        '<span class="chip" id="jwt-status">waiting for a token</span></div>' +
        '<label class="field-label" for="jwt-in">Token</label>' +
        '<textarea id="jwt-in" class="field" rows="4" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…" spellcheck="false"></textarea>' +
        '<div id="jwt-sign-wrap" hidden>' +
        '<div class="grid-2">' +
        '<div><label class="field-label" for="jwt-alg">Algorithm</label><select id="jwt-alg" class="field field-sm">' +
        '<option value="HS256" selected>HS256</option><option value="HS384">HS384</option><option value="HS512">HS512</option><option value="none">none (unsigned)</option></select></div>' +
        '<div><label class="field-label" for="jwt-ttl">Expires in (minutes)</label><input type="number" id="jwt-ttl" class="field field-sm" value="60"></div>' +
        '</div>' +
        '<label class="field-label" for="jwt-payload">Payload (JSON)</label>' +
        '<textarea id="jwt-payload" class="field" rows="5" spellcheck="false">{\n  "sub": "1234567890",\n  "name": "RITM",\n  "admin": true\n}</textarea>' +
        '<div class="action-row"><button class="btn btn-primary" id="jwt-build" type="button">' + S.icon('shield') + 'Build token</button></div></div>' +
        '<div id="jwt-verify-wrap">' +
        '<label class="field-label" for="jwt-secret">HMAC secret <span class="opt">— to verify or sign</span></label>' +
        '<div class="flex-row"><input type="text" id="jwt-secret" class="field field-sm" placeholder="your-256-bit-secret" spellcheck="false" style="flex:1;min-width:180px">' +
        '<button class="btn btn-soft btn-sm" id="jwt-verify" type="button">' + S.icon('shield') + 'Verify signature</button></div>' +
        '<div id="jwt-verify-result" class="mt-1"></div></div>' +
        '<div class="panel-section"><p class="section-label">Header</p><div class="mono-block" id="jwt-header">—</div></div>' +
        '<div class="panel-section"><p class="section-label">Payload</p><div class="mono-block" id="jwt-body">—</div></div>' +
        '<div class="panel-section" id="jwt-claims-wrap"><p class="section-label">Registered claims</p><div class="kv-list" id="jwt-claims"></div></div>' +
        '<div class="result-row"><span class="hint" id="jwt-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="jwt-copy" type="button">' + S.icon('copy') + 'Copy payload</button></div></div>');
    },
    mount: function () {
      var mode = 'decode', parts = null;
      function status(text, cls) { $('jwt-status').className = 'chip' + (cls ? ' ' + cls : ''); $('jwt-status').textContent = text; }
      function relTime(sec) {
        var d = new Date(sec * 1000);
        return d.toISOString().replace('T', ' ').replace('.000Z', ' UTC');
      }
      function decode() {
        setHint('jwt-hint', '');
        $('jwt-verify-result').innerHTML = '';
        var raw = $('jwt-in').value.trim();
        if (!raw) {
          $('jwt-header').textContent = '—'; $('jwt-body').textContent = '—';
          $('jwt-claims').innerHTML = ''; status('waiting for a token'); parts = null; return;
        }
        parts = raw.split('.');
        if (parts.length < 2) { status('not a JWT', 'bad'); $('jwt-header').textContent = '—'; $('jwt-body').textContent = '—'; setHint('jwt-hint', 'A JWT needs at least two dot-separated parts.', 'error'); return; }
        try {
          var header = JSON.parse(S.bytesToText(b64urlDecode(parts[0])));
          var payload = JSON.parse(S.bytesToText(b64urlDecode(parts[1])));
          $('jwt-header').textContent = JSON.stringify(header, null, 2);
          $('jwt-body').textContent = JSON.stringify(payload, null, 2);
          var alg = header.alg || '?';
          status(alg + (parts.length === 3 ? ' · signed' : ' · unsigned'), parts.length === 3 ? 'ok' : 'bad');
          var claims = [];
          if (payload.iss) claims.push(['Issuer (iss)', payload.iss]);
          if (payload.sub) claims.push(['Subject (sub)', payload.sub]);
          if (payload.aud) claims.push(['Audience (aud)', JSON.stringify(payload.aud)]);
          if (payload.exp) {
            var expired = payload.exp * 1000 < Date.now();
            claims.push(['Expires (exp)', relTime(payload.exp) + (expired ? ' — EXPIRED' : ' — valid')]);
          }
          if (payload.nbf) claims.push(['Not before (nbf)', relTime(payload.nbf)]);
          if (payload.iat) claims.push(['Issued at (iat)', relTime(payload.iat)]);
          if (payload.jti) claims.push(['JWT ID (jti)', payload.jti]);
          $('jwt-claims').innerHTML = claims.length ? claims.map(function (c) {
            return '<div class="kv-row"><div class="kv-k">' + esc(c[0]) + '</div><div class="kv-v wrap">' + esc(c[1]) + '</div></div>';
          }).join('') : '<div class="kv-row"><div class="kv-k">—</div><div class="kv-v">No registered claims</div></div>';
          $('jwt-claims-wrap').hidden = false;
        } catch (e) {
          status('malformed', 'bad');
          $('jwt-header').textContent = '—'; $('jwt-body').textContent = '—';
          $('jwt-claims').innerHTML = '';
          setHint('jwt-hint', 'Could not decode: ' + e.message, 'error');
        }
      }
      $$('.mode-btn', $('panel-jwt')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-jwt')).forEach(function (x) { x.classList.toggle('active', x === b); });
          $('jwt-sign-wrap').hidden = mode !== 'sign';
          $('jwt-verify-wrap').hidden = mode === 'sign' && $('jwt-alg').value === 'none';
          if (mode === 'sign') { $('jwt-in').readOnly = false; }
        });
      });
      $('jwt-in').addEventListener('input', S.debounce(decode, 140));
      $('jwt-verify').addEventListener('click', function () {
        setHint('jwt-hint', '');
        var el = $('jwt-verify-result');
        if (!parts || parts.length !== 3) { el.innerHTML = '<span class="chip bad">✗ Not a signed 3-part token</span>'; return; }
        var secret = $('jwt-secret').value;
        if (!secret) { el.innerHTML = '<span class="chip bad">✗ Enter the HMAC secret</span>'; return; }
        if (!HW()) { setHint('jwt-hint', 'hash-wasm failed to load.', 'error'); return; }
        var header;
        try { header = JSON.parse(S.bytesToText(b64urlDecode(parts[0]))); } catch (e) { el.innerHTML = '<span class="chip bad">✗ Bad header</span>'; return; }
        var map = { HS256: 'sha256', HS384: 'sha384', HS512: 'sha512' };
        var algo = map[header.alg];
        if (!algo) { el.innerHTML = '<span class="chip bad">✗ Unsupported algorithm: ' + esc(header.alg || '?') + '</span>'; return; }
        hmacHex(algo, S.textToBytes(secret), S.textToBytes(parts[0] + '.' + parts[1])).then(function (hex) {
          var expected = b64urlEncode(S.hexToBytes(hex));
          var ok = expected === parts[2];
          el.innerHTML = '<span class="chip ' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✓ Signature is VALID' : '✗ Signature does NOT match') + '</span>';
        }).catch(function (e) { setHint('jwt-hint', 'Verification failed: ' + e.message, 'error'); });
      });
      $('jwt-build').addEventListener('click', function () {
        setHint('jwt-hint', '');
        var alg = $('jwt-alg').value;
        var header = { alg: alg, typ: 'JWT' };
        var payload;
        try { payload = JSON.parse($('jwt-payload').value); } catch (e) { setHint('jwt-hint', 'Payload is not valid JSON: ' + e.message, 'error'); return; }
        var ttl = parseInt($('jwt-ttl').value, 10) || 60;
        payload.iat = Math.floor(Date.now() / 1000);
        payload.exp = payload.iat + ttl * 60;
        var p1 = b64urlEncode(S.textToBytes(JSON.stringify(header)));
        var p2 = b64urlEncode(S.textToBytes(JSON.stringify(payload)));
        var unsigned = p1 + '.' + p2;
        if (alg === 'none') {
          $('jwt-in').value = unsigned + '.';
          decode();
          setHint('jwt-hint', 'Built an unsigned token (alg: none) — insecure by design.', 'warn');
          return;
        }
        var secret = $('jwt-secret').value;
        if (!secret) { setHint('jwt-hint', 'Enter the HMAC secret to sign with.', 'error'); return; }
        if (!HW()) { setHint('jwt-hint', 'hash-wasm failed to load.', 'error'); return; }
        var map = { HS256: 'sha256', HS384: 'sha384', HS512: 'sha512' };
        hmacHex(map[alg], S.textToBytes(secret), S.textToBytes(unsigned)).then(function (hex) {
          $('jwt-in').value = unsigned + '.' + b64urlEncode(S.hexToBytes(hex));
          decode();
          setHint('jwt-hint', 'Signed with ' + alg + '. Expires in ' + ttl + ' minutes.', 'ok');
        }).catch(function (e) { setHint('jwt-hint', 'Signing failed: ' + e.message, 'error'); });
      });
      $('jwt-copy').addEventListener('click', function () { S.copyText($('jwt-body').textContent); });
      var demo = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlJJVE0iLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9.4pXQ0h0mZ0k';
      $('jwt-in').value = demo;
      decode();
    }
  });

})(window.Signal);
