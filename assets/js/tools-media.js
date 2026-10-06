/* ══════════════════════════════════════════════════════════════════════════
   SIGNAL — files, images, compression, steganography
   ══════════════════════════════════════════════════════════════════════════ */
(function (S) {
  'use strict';
  var $ = S.$, $$ = S.$$, esc = S.escapeHtml;
  function setHint(id, text, kind) {
    var el = $(id); if (!el) return;
    el.className = 'hint' + (kind ? ' ' + kind : '');
    el.textContent = text || '';
  }
  function readAsArrayBuffer(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = function () { rej(new Error('Could not read the file.')); };
      r.readAsArrayBuffer(file);
    });
  }
  function wireDrop(dropEl, inputEl, cb) {
    inputEl.addEventListener('change', function (e) { if (e.target.files[0]) cb(e.target.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) {
      dropEl.addEventListener(ev, function (e) { e.preventDefault(); dropEl.classList.add('drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      dropEl.addEventListener(ev, function (e) { e.preventDefault(); dropEl.classList.remove('drag'); });
    });
    dropEl.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) cb(f);
    });
  }

  /* ═══════════════ COMPRESSION ═══════════════ */
  S.customTool({
    id: 'compression', name: 'Compression', group: 'Media', icon: 'layers',
    desc: 'Compress text with gzip or raw deflate and decompress it back — see exactly how many bytes you saved.',
    tags: ['gzip', 'deflate', 'compress', 'zlib', 'zip', 'shrink'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['encode', 'Compress'], ['decode', 'Decompress']], 'encode') +
        '<div class="flex-row"><select id="gz-format" class="field field-xs" style="width:auto;min-height:38px;">' +
        '<option value="gzip" selected>gzip</option><option value="deflate">deflate (raw)</option><option value="deflate-raw">deflate-raw</option></select></div></div>' +
        '<label class="field-label" for="gz-in">Input</label>' +
        '<textarea id="gz-in" class="field" rows="7" placeholder="Text to compress…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-primary" id="gz-go" type="button">' + S.icon('layers') + 'Run</button>' +
        '<button class="btn btn-swap" id="gz-swap" type="button">' + S.icon('swap') + 'Swap</button>' +
        '<button class="btn btn-ghost" id="gz-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="gz-out">Result (Base64)</label>' +
        '<textarea id="gz-out" class="field" rows="7" readonly placeholder="Result…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="gz-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="gz-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>' +
        '<div class="bar-meter"><i id="gz-bar"></i></div>');
    },
    mount: function () {
      var mode = 'encode', busy = false;
      var HAS_CS = (typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined');
      function run() {
        setHint('gz-hint', '');
        $('gz-bar').style.width = '0%';
        if (!HAS_CS) { setHint('gz-hint', 'CompressionStream is not supported in this browser.', 'error'); return; }
        var input = $('gz-in').value;
        if (!input) { $('gz-out').value = ''; return; }
        if (busy) return; busy = true;
        var fmt = $('gz-format').value;
        var stream;
        try {
          if (mode === 'encode') {
            stream = new Blob([S.textToBytes(input)]).stream().pipeThrough(new CompressionStream(fmt));
          } else {
            stream = new Blob([S.base64ToBytes(input.replace(/\s+/g, ''))]).stream().pipeThrough(new DecompressionStream(fmt));
          }
        } catch (e) { setHint('gz-hint', 'Invalid input: ' + e.message, 'error'); busy = false; return; }
        new Response(stream).arrayBuffer().then(function (buf) {
          var arr = new Uint8Array(buf);
          if (mode === 'encode') {
            $('gz-out').value = S.bytesToBase64(arr);
            var orig = S.textToBytes(input).length;
            var pct = orig ? (100 - (arr.length / orig) * 100) : 0;
            $('gz-bar').style.width = Math.max(0, Math.min(100, pct)).toFixed(1) + '%';
            setHint('gz-hint', orig + ' B → ' + arr.length + ' B · ' + (pct > 0 ? pct.toFixed(1) + '% smaller' : 'no gain (too short)') + ' · ' + fmt, pct > 0 ? 'ok' : 'warn');
          } else {
            $('gz-out').value = S.bytesToText(arr);
            setHint('gz-hint', arr.length + ' bytes decompressed · ' + fmt, 'ok');
          }
        }).catch(function (e) {
          $('gz-out').value = '';
          setHint('gz-hint', mode === 'encode' ? 'Compression failed: ' + e.message : 'Not valid ' + fmt + ' data.', 'error');
        }).then(function () { busy = false; });
      }
      $$('.mode-btn', $('panel-compression')).forEach(function (b) {
        b.addEventListener('click', function () {
          mode = b.dataset.mode;
          $$('.mode-btn', $('panel-compression')).forEach(function (x) { x.classList.toggle('active', x === b); });
          $('gz-in').placeholder = mode === 'encode' ? 'Text to compress…' : 'Paste Base64 compressed data…';
          run();
        });
      });
      $('gz-format').addEventListener('change', run);
      $('gz-go').addEventListener('click', run);
      $('gz-swap').addEventListener('click', function () {
        var t = $('gz-in').value; $('gz-in').value = $('gz-out').value; $('gz-out').value = t;
        mode = mode === 'encode' ? 'decode' : 'encode';
        $$('.mode-btn', $('panel-compression')).forEach(function (x) { x.classList.toggle('active', x.dataset.mode === mode); });
        run();
      });
      $('gz-clear').addEventListener('click', function () { $('gz-in').value = ''; $('gz-out').value = ''; setHint('gz-hint', ''); $('gz-bar').style.width = '0%'; });
      $('gz-copy').addEventListener('click', function () { S.copyText($('gz-out').value); });
      $('gz-in').value = 'Signal Console — Signal Console — Signal Console — Signal Console — Signal Console — Signal Console';
      run();
    }
  });

  /* ═══════════════ STEGANOGRAPHY ═══════════════ */
  var STEG_MAGIC = [0x53, 0x47, 0x4C, 0x32]; // "SGL2"
  function stegEmbed(imageData, textBytes) {
    var px = imageData.data;
    var capacity = Math.floor(px.length / 4);
    var header = STEG_MAGIC.concat([
      (textBytes.length >>> 24) & 255, (textBytes.length >>> 16) & 255,
      (textBytes.length >>> 8) & 255, textBytes.length & 255
    ]);
    var payload = header.concat(Array.prototype.slice.call(textBytes));
    var bits = [];
    for (var i = 0; i < payload.length; i++) {
      for (var b = 7; b >= 0; b--) bits.push((payload[i] >> b) & 1);
    }
    if (bits.length > capacity) return { error: 'Message is too large for this image.', need: bits.length, have: capacity };
    for (var j = 0; j < bits.length; j++) px[j * 4] = (px[j * 4] & 0xFE) | bits[j];
    return { ok: true, used: bits.length, capacity: capacity };
  }
  function stegExtract(imageData) {
    var px = imageData.data;
    var limit = Math.floor(px.length / 4);
    var bits = new Uint8Array(Math.min(limit, 8 * 8));
    for (var i = 0; i < bits.length; i++) bits[i] = px[i * 4] & 1;
    var header = [];
    for (var j = 0; j + 8 <= bits.length; j += 8) {
      var code = 0;
      for (var b = 0; b < 8; b++) code = (code << 1) | bits[j + b];
      header.push(code);
    }
    for (var m = 0; m < 4; m++) if (header[m] !== STEG_MAGIC[m]) return { error: 'No Signal payload found in this image.' };
    var len = (header[4] << 24) | (header[5] << 16) | (header[6] << 8) | header[7];
    if (len <= 0 || len > limit - 8) return { error: 'Payload length looks wrong — the image may have been re-encoded.' };
    var total = 8 + len;
    var allBits = new Uint8Array(total * 8);
    for (var k = 0; k < allBits.length; k++) allBits[k] = px[k * 4] & 1;
    var bytes = new Uint8Array(total);
    for (var n = 0; n < total; n++) {
      var c = 0;
      for (var q = 0; q < 8; q++) c = (c << 1) | allBits[n * 8 + q];
      bytes[n] = c;
    }
    return { bytes: bytes.slice(8), used: total * 8, capacity: limit };
  }
  S.customTool({
    id: 'steganography', name: 'Steganography', group: 'Media', icon: 'image',
    desc: 'Hide a secret message inside the pixels of a PNG using least-significant-bit encoding — the picture looks untouched.',
    tags: ['steganography', 'lsb', 'hide', 'png', 'covert', 'image'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['encode', 'Hide'], ['decode', 'Extract']], 'encode') + '</div>' +
        '<div id="steg-hide-pane">' +
        '<label class="file-drop" for="steg-file">' + S.icon('image') + '<span><strong>Drop a PNG</strong> or tap to choose a cover image</span></label>' +
        '<input type="file" id="steg-file" accept="image/png" hidden>' +
        '<div class="file-notice" id="steg-notice" hidden><span id="steg-notice-text"></span>' +
        '<button type="button" id="steg-notice-x" aria-label="Remove image">✕</button></div>' +
        '<label class="field-label" for="steg-msg">Secret message</label>' +
        '<textarea id="steg-msg" class="field" rows="4" placeholder="The message you want to hide…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-primary" id="steg-go" type="button">' + S.icon('lock') + 'Hide &amp; download PNG</button>' +
        '<button class="btn btn-ghost" id="steg-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<div class="stat-strip" id="steg-stats"></div>' +
        '<div class="bar-meter"><i id="steg-bar"></i></div>' +
        '<div class="result-row"><span class="hint" id="steg-hint"></span></div>' +
        '<div class="image-preview" id="steg-preview" hidden><img id="steg-img" alt="Cover image preview"></div>' +
        '</div>' +
        '<div id="steg-extract-pane" hidden>' +
        '<label class="file-drop" for="steg-file2">' + S.icon('image') + '<span><strong>Drop a PNG</strong> that contains a hidden message</span></label>' +
        '<input type="file" id="steg-file2" accept="image/png" hidden>' +
        '<div class="action-row"><button class="btn btn-primary" id="steg-extract" type="button">' + S.icon('search') + 'Extract message</button>' +
        '<button class="btn btn-ghost" id="steg-clear2" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<label class="field-label" for="steg-out">Extracted message</label>' +
        '<textarea id="steg-out" class="field" rows="5" readonly placeholder="Nothing extracted yet…" spellcheck="false"></textarea>' +
        '<div class="result-row"><span class="hint" id="steg-hint2"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="steg-copy" type="button">' + S.icon('copy') + 'Copy</button></div></div>' +
        '</div>' +
        '<div class="mono-block mt-2" style="max-height:none;font-size:12px;border-style:solid;">ℹ️ Save and re-open the output as a <b>PNG</b>. Re-compressing it (e.g. as JPEG, or through a chat app) destroys the hidden bits.</div>');
    },
    mount: function () {
      var coverFile = null;
      function loadImage(file) {
        return new Promise(function (res, rej) {
          var url = URL.createObjectURL(file);
          var img = new Image();
          img.onload = function () { URL.revokeObjectURL(url); res(img); };
          img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Could not read that image.')); };
          img.src = url;
        });
      }
      function ctxOf(img) {
        var cvs = document.createElement('canvas');
        cvs.width = img.width; cvs.height = img.height;
        var ctx = cvs.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        return { cvs: cvs, ctx: ctx };
      }
      $$('.mode-btn', $('panel-steganography')).forEach(function (b) {
        b.addEventListener('click', function () {
          var m = b.dataset.mode;
          $$('.mode-btn', $('panel-steganography')).forEach(function (x) { x.classList.toggle('active', x === b); });
          $('steg-hide-pane').hidden = m !== 'encode';
          $('steg-extract-pane').hidden = m !== 'decode';
        });
      });
      var fileInput = $('steg-file');
      wireDrop($('steg-hide-pane').querySelector('.file-drop'), fileInput, function (f) {
        coverFile = f;
        $('steg-notice').hidden = false;
        $('steg-notice-text').textContent = f.name + ' — ' + S.formatBytes(f.size);
        var url = URL.createObjectURL(f);
        $('steg-img').src = url;
        $('steg-preview').hidden = false;
        loadImage(f).then(function (img) {
          $('steg-stats').innerHTML = '<span>image <b>' + img.width + '×' + img.height + '</b></span>' +
            '<span>capacity <b>' + Math.floor((img.width * img.height) / 8 - 8).toLocaleString() + ' bytes</b></span>';
        });
      });
      $('steg-notice-x').addEventListener('click', function () {
        coverFile = null; fileInput.value = '';
        $('steg-notice').hidden = true; $('steg-preview').hidden = true;
        $('steg-stats').textContent = ''; setHint('steg-hint', '');
      });
      $('steg-go').addEventListener('click', function () {
        setHint('steg-hint', '');
        $('steg-bar').style.width = '0%';
        if (!coverFile) { setHint('steg-hint', 'Choose a PNG cover image first.', 'error'); return; }
        var msg = $('steg-msg').value;
        if (!msg) { setHint('steg-hint', 'Type the message you want to hide.', 'error'); return; }
        var bytes = S.textToBytes(msg);
        loadImage(coverFile).then(function (img) {
          var o = ctxOf(img);
          var data = o.ctx.getImageData(0, 0, o.cvs.width, o.cvs.height);
          var res = stegEmbed(data, bytes);
          if (res.error) {
            setHint('steg-hint', res.error + ' Needs ' + res.need.toLocaleString() + ' px, image has ' + res.have.toLocaleString() + '.', 'error');
            return;
          }
          o.ctx.putImageData(data, 0, 0);
          o.cvs.toBlob(function (blob) {
            if (!blob) { setHint('steg-hint', 'Could not encode the image.', 'error'); return; }
            S.download('signal-hidden.png', blob);
            $('steg-bar').style.width = ((res.used / res.capacity) * 100).toFixed(2) + '%';
            setHint('steg-hint', '✓ Hidden ' + bytes.length + ' bytes — the PNG has been downloaded.', 'ok');
            S.toast('Steganographic PNG downloaded', 'ok');
          }, 'image/png');
        }).catch(function (e) { setHint('steg-hint', e.message, 'error'); });
      });
      $('steg-clear').addEventListener('click', function () {
        coverFile = null; fileInput.value = ''; $('steg-msg').value = '';
        $('steg-notice').hidden = true; $('steg-preview').hidden = true;
        $('steg-stats').textContent = ''; setHint('steg-hint', ''); $('steg-bar').style.width = '0%';
      });
      wireDrop($('steg-extract-pane').querySelector('.file-drop'), $('steg-file2'), function (f) {
        $('steg-hint2').textContent = f.name + ' loaded — press Extract.';
      });
      $('steg-extract').addEventListener('click', function () {
        setHint('steg-hint2', '');
        var f = $('steg-file2').files[0];
        if (!f) { setHint('steg-hint2', 'Choose an image first.', 'error'); return; }
        loadImage(f).then(function (img) {
          var o = ctxOf(img);
          var data = o.ctx.getImageData(0, 0, o.cvs.width, o.cvs.height);
          var res = stegExtract(data);
          if (res.error) { $('steg-out').value = ''; setHint('steg-hint2', res.error, 'error'); return; }
          $('steg-out').value = S.bytesToText(res.bytes);
          setHint('steg-hint2', '✓ Extracted ' + res.bytes.length + ' bytes from ' + res.capacity.toLocaleString() + ' available pixels.', 'ok');
        }).catch(function (e) { setHint('steg-hint2', e.message, 'error'); });
      });
      $('steg-clear2').addEventListener('click', function () {
        $('steg-file2').value = ''; $('steg-out').value = ''; setHint('steg-hint2', '');
      });
      $('steg-copy').addEventListener('click', function () { S.copyText($('steg-out').value); });
    }
  });

  /* ═══════════════ FILE HASH ═══════════════ */
  S.customTool({
    id: 'filehash', name: 'File Hash', group: 'Media', icon: 'file',
    desc: 'Drop any file and get its MD5, SHA-1, SHA-256, SHA-512 and CRC32 fingerprints at once — nothing is uploaded.',
    tags: ['file', 'hash', 'checksum', 'md5', 'sha256', 'crc32', 'integrity', 'verify'],
    build: function () {
      return S.wrapPanel(this,
        '<label class="file-drop" id="fh-drop" for="fh-file">' + S.icon('file') + '<span><strong>Drop a file</strong> or tap to choose one — it never leaves your device</span></label>' +
        '<input type="file" id="fh-file" hidden>' +
        '<div class="file-notice" id="fh-notice" hidden><span id="fh-notice-text"></span>' +
        '<button type="button" id="fh-notice-x" aria-label="Remove file">✕</button></div>' +
        '<div class="bar-meter"><i id="fh-bar"></i></div>' +
        '<div class="result-row"><span class="hint" id="fh-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="fh-copy" type="button">' + S.icon('copy') + 'Copy all</button></div></div>' +
        '<div class="panel-section"><p class="section-label">Digests</p><div class="table-wrap"><table class="data-table"><tbody id="fh-body"></tbody></table></div></div>' +
        '<div id="fh-verify-wrap" hidden><div class="panel-section"><p class="section-label">Verify against</p>' +
        '<input type="text" id="fh-expected" class="field field-sm" placeholder="Paste an expected hash…" spellcheck="false">' +
        '<div id="fh-verify-result" class="mt-1"></div></div></div>');
    },
    mount: function () {
      var last = {};
      function run(file) {
        setHint('fh-hint', 'Reading…');
        $('fh-bar').style.width = '12%';
        $('fh-notice').hidden = false;
        $('fh-notice-text').textContent = file.name + ' — ' + S.formatBytes(file.size);
        if (typeof hashwasm === 'undefined') { setHint('fh-hint', 'hash-wasm failed to load.', 'error'); return; }
        readAsArrayBuffer(file).then(function (buf) {
          var bytes = new Uint8Array(buf);
          $('fh-bar').style.width = '40%';
          var jobs = [['MD5', 'md5'], ['SHA-1', 'sha1'], ['SHA-256', 'sha256'], ['SHA-384', 'sha384'], ['SHA-512', 'sha512'], ['RIPEMD-160', 'ripemd160']];
          return Promise.all(jobs.map(function (j) {
            return Promise.resolve().then(function () { return hashwasm[j[1]](bytes); }).then(function (v) { return [j[0], v]; }).catch(function () { return [j[0], '—']; });
          })).then(function (rows) {
            return Promise.resolve().then(function () { return hashwasm.crc32(bytes); }).then(function (crc) {
              rows.push(['CRC32', (crc >>> 0).toString(16).padStart(8, '0')]);
              return rows;
            }).catch(function () { return rows; });
          });
        }).then(function (rows) {
          last = {};
          rows.forEach(function (r) { last[r[0]] = r[1]; });
          $('fh-body').innerHTML = rows.map(function (r) {
            return '<tr><td style="width:110px;color:var(--muted)">' + r[0] + '</td><td>' + esc(r[1]) + '</td></tr>';
          }).join('');
          $('fh-bar').style.width = '100%';
          setHint('fh-hint', file.size.toLocaleString() + ' bytes hashed locally · ' + rows.length + ' digests', 'ok');
          $('fh-verify-wrap').hidden = false;
          check();
        }).catch(function (e) { setHint('fh-hint', e.message, 'error'); $('fh-bar').style.width = '0%'; });
      }
      function check() {
        var v = $('fh-expected').value.trim().toLowerCase();
        var el = $('fh-verify-result');
        if (!v) { el.innerHTML = ''; return; }
        var hit = Object.keys(last).filter(function (k) { return last[k].toLowerCase() === v; });
        el.innerHTML = hit.length
          ? '<span class="chip ok">✓ Matches ' + hit.join(', ') + '</span>'
          : '<span class="chip bad">✗ Does not match any digest</span>';
      }
      wireDrop($('fh-drop'), $('fh-file'), run);
      $('fh-notice-x').addEventListener('click', function () {
        $('fh-file').value = ''; $('fh-notice').hidden = true;
        $('fh-body').innerHTML = ''; setHint('fh-hint', ''); $('fh-bar').style.width = '0%'; $('fh-verify-wrap').hidden = true;
      });
      $('fh-expected').addEventListener('input', check);
      $('fh-copy').addEventListener('click', function () {
        S.copyText(Object.keys(last).map(function (k) { return k + ': ' + last[k]; }).join('\n'));
      });
    }
  });

  /* ═══════════════ IMAGE ↔ BASE64 ═══════════════ */
  S.customTool({
    id: 'imagedata', name: 'Image ⇄ Data URI', group: 'Media', icon: 'image',
    desc: 'Turn an image into a Base64 data URI for embedding in CSS or HTML — or decode a data URI back into a file.',
    tags: ['image', 'data uri', 'base64', 'inline', 'css', 'embed'],
    build: function () {
      return S.wrapPanel(this,
        '<div class="mode-row">' + S.modeSwitchHtml([['encode', 'Image → Data URI'], ['decode', 'Data URI → Image']], 'encode') + '</div>' +
        '<div id="id-encode-pane">' +
        '<label class="file-drop" for="id-file">' + S.icon('image') + '<span><strong>Drop an image</strong> or tap to choose one</span></label>' +
        '<input type="file" id="id-file" accept="image/*" hidden>' +
        '<div class="file-notice" id="id-notice" hidden><span id="id-notice-text"></span>' +
        '<button type="button" id="id-notice-x" aria-label="Remove">✕</button></div>' +
        '<label class="field-label">Data URI</label>' +
        '<textarea id="id-out" class="field" rows="6" readonly placeholder="data:image/png;base64,…" spellcheck="false"></textarea>' +
        '<div class="stat-strip" id="id-stats"></div>' +
        '<div class="result-row"><span class="hint" id="id-hint"></span><div class="out-tools">' +
        '<button class="btn btn-ghost btn-sm" id="id-copy" type="button">' + S.icon('copy') + 'Copy URI</button>' +
        '<button class="btn btn-ghost btn-sm" id="id-copy-css" type="button">' + S.icon('copy') + 'Copy as CSS</button>' +
        '<button class="btn btn-ghost btn-sm" id="id-copy-html" type="button">' + S.icon('copy') + 'Copy as HTML</button>' +
        '</div></div>' +
        '<div class="image-preview" id="id-preview" hidden><img id="id-img" alt="Image preview"></div>' +
        '</div>' +
        '<div id="id-decode-pane" hidden>' +
        '<label class="field-label" for="id-in">Data URI</label>' +
        '<textarea id="id-in" class="field" rows="6" placeholder="data:image/png;base64,iVBORw0KGgo…" spellcheck="false"></textarea>' +
        '<div class="action-row"><button class="btn btn-primary" id="id-load" type="button">' + S.icon('image') + 'Preview &amp; download</button>' +
        '<button class="btn btn-ghost" id="id-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<div class="result-row"><span class="hint" id="id-hint2"></span></div>' +
        '<div class="image-preview" id="id-preview2" hidden><img id="id-img2" alt="Decoded preview"></div>' +
        '</div>');
    },
    mount: function () {
      var lastMeta = null;
      $$('.mode-btn', $('panel-imagedata')).forEach(function (b) {
        b.addEventListener('click', function () {
          var m = b.dataset.mode;
          $$('.mode-btn', $('panel-imagedata')).forEach(function (x) { x.classList.toggle('active', x === b); });
          $('id-encode-pane').hidden = m !== 'encode';
          $('id-decode-pane').hidden = m !== 'decode';
        });
      });
      function load(f) {
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          var uri = r.result;
          $('id-out').value = uri;
          lastMeta = { name: f.name, size: f.size, type: f.type, uri: uri };
          $('id-notice').hidden = false;
          $('id-notice-text').textContent = f.name + ' — ' + S.formatBytes(f.size);
          $('id-img').src = uri;
          $('id-preview').hidden = false;
          $('id-stats').innerHTML = '<span>original <b>' + S.formatBytes(f.size) + '</b></span>' +
            '<span>data URI <b>' + S.formatBytes(uri.length) + '</b></span>' +
            '<span>overhead <b>+' + (((uri.length - f.size) / f.size) * 100).toFixed(1) + '%</b></span>';
          setHint('id-hint', f.type || 'image');
        };
        r.readAsDataURL(f);
      }
      wireDrop($('id-encode-pane').querySelector('.file-drop'), $('id-file'), load);
      $('id-notice-x').addEventListener('click', function () {
        $('id-file').value = ''; $('id-out').value = ''; $('id-notice').hidden = true;
        $('id-preview').hidden = true; $('id-stats').textContent = ''; setHint('id-hint', '');
      });
      $('id-copy').addEventListener('click', function () { S.copyText($('id-out').value); });
      $('id-copy-css').addEventListener('click', function () { S.copyText('background-image: url("' + $('id-out').value + '");'); });
      $('id-copy-html').addEventListener('click', function () { S.copyText('<img src="' + $('id-out').value + '" alt="">'); });
      $('id-load').addEventListener('click', function () {
        setHint('id-hint2', '');
        var v = $('id-in').value.trim();
        if (!v) { setHint('id-hint2', 'Paste a data URI first.', 'error'); return; }
        var m = v.match(/^data:([\w/+.-]+);base64,(.+)$/s);
        if (!m) { setHint('id-hint2', 'That is not a Base64 data URI.', 'error'); return; }
        $('id-img2').src = v;
        $('id-preview2').hidden = false;
        var bytes;
        try { bytes = S.base64ToBytes(m[2]); } catch (e) { setHint('id-hint2', 'Invalid Base64 payload.', 'error'); return; }
        lastMeta = { type: m[1], bytes: bytes };
        setHint('id-hint2', m[1] + ' · ' + S.formatBytes(bytes.length) + ' — right-click the preview to save, or press Download.', 'ok');
        S.toast('Preview ready', 'ok');
      });
      $('id-clear').addEventListener('click', function () {
        $('id-in').value = ''; $('id-preview2').hidden = true; setHint('id-hint2', '');
      });
    }
  });

  /* ═══════════════ IMAGE CONVERTER ═══════════════ */
  S.customTool({
    id: 'imageconvert', name: 'Image Converter', group: 'Media', icon: 'image',
    desc: 'Resize and re-encode an image to JPEG, PNG or WebP with a quality slider — and see the size difference before you save.',
    tags: ['image', 'convert', 'resize', 'webp', 'jpeg', 'png', 'compress', 'optimize'],
    build: function () {
      return S.wrapPanel(this,
        '<label class="file-drop" id="ic-drop" for="ic-file">' + S.icon('image') + '<span><strong>Drop an image</strong> or tap to choose one</span></label>' +
        '<input type="file" id="ic-file" accept="image/*" hidden>' +
        '<div class="file-notice" id="ic-notice" hidden><span id="ic-notice-text"></span>' +
        '<button type="button" id="ic-notice-x" aria-label="Remove">✕</button></div>' +
        '<div class="grid-3 mt-1">' +
        '<div><label class="field-label" for="ic-format">Format</label><select id="ic-format" class="field field-sm">' +
        '<option value="image/jpeg" selected>JPEG</option><option value="image/webp">WebP</option><option value="image/png">PNG</option></select></div>' +
        '<div><label class="field-label" for="ic-width">Max width (px)</label><input type="number" id="ic-width" class="field field-sm" value="0" min="0" max="8000" step="10"></div>' +
        '<div><label class="field-label" for="ic-quality">Quality</label><input type="range" id="ic-quality" min="10" max="100" value="82"></div>' +
        '</div>' +
        '<div class="check-row"><label class="check"><input type="checkbox" id="ic-keep"> Keep original dimensions</label></div>' +
        '<div class="action-row"><button class="btn btn-primary" id="ic-go" type="button">' + S.icon('wand') + 'Convert</button>' +
        '<button class="btn btn-ghost" id="ic-save" type="button">' + S.icon('download') + 'Download</button>' +
        '<button class="btn btn-ghost" id="ic-clear" type="button">' + S.icon('trash') + 'Clear</button></div>' +
        '<div class="stat-strip" id="ic-stats"></div>' +
        '<div class="result-row"><span class="hint" id="ic-hint"></span></div>' +
        '<div class="image-preview" id="ic-preview" hidden><img id="ic-img" alt="Converted preview"></div>');
    },
    mount: function () {
      var srcFile = null, outBlob = null;
      function load(f) {
        srcFile = f;
        $('ic-notice').hidden = false;
        $('ic-notice-text').textContent = f.name + ' — ' + S.formatBytes(f.size);
        var url = URL.createObjectURL(f);
        var img = new Image();
        img.onload = function () {
          URL.revokeObjectURL(url);
          $('ic-stats').innerHTML = '<span>source <b>' + img.width + '×' + img.height + '</b></span><span>size <b>' + S.formatBytes(f.size) + '</b></span>';
          if (!$('ic-width').value || $('ic-width').value === '0') $('ic-width').value = img.width;
        };
        img.src = url;
        convert();
      }
      function convert() {
        if (!srcFile) return;
        setHint('ic-hint', 'Converting…');
        var url = URL.createObjectURL(srcFile);
        var img = new Image();
        img.onload = function () {
          URL.revokeObjectURL(url);
          var w = $('ic-keep').checked ? img.width : (parseInt($('ic-width').value, 10) || img.width);
          var h = Math.round(img.height * (w / img.width));
          var cvs = document.createElement('canvas');
          cvs.width = Math.max(1, w); cvs.height = Math.max(1, h);
          var ctx = cvs.getContext('2d');
          var fmt = $('ic-format').value;
          if (fmt === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cvs.width, cvs.height); }
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
          cvs.toBlob(function (blob) {
            if (!blob) { setHint('ic-hint', 'Conversion failed.', 'error'); return; }
            outBlob = blob;
            var pct = ((blob.size - srcFile.size) / srcFile.size) * 100;
            $('ic-img').src = URL.createObjectURL(blob);
            $('ic-preview').hidden = false;
            $('ic-stats').innerHTML = '<span>source <b>' + img.width + '×' + img.height + ' · ' + S.formatBytes(srcFile.size) + '</b></span>' +
              '<span>output <b>' + cvs.width + '×' + cvs.height + ' · ' + S.formatBytes(blob.size) + '</b></span>' +
              '<span>' + (pct <= 0 ? '<b style="color:var(--ok)">' + pct.toFixed(1) + '% smaller</b>' : '<b style="color:var(--mark)">+' + pct.toFixed(1) + '% larger</b>') + '</span>';
            setHint('ic-hint', fmt.split('/')[1].toUpperCase() + ' at quality ' + $('ic-quality').value + ' — press Download to save.', 'ok');
          }, fmt, parseInt($('ic-quality').value, 10) / 100);
        };
        img.onerror = function () { URL.revokeObjectURL(url); setHint('ic-hint', 'Could not read that image.', 'error'); };
        img.src = url;
      }
      wireDrop($('ic-drop'), $('ic-file'), load);
      ['ic-format', 'ic-quality', 'ic-width'].forEach(function (id) { $(id).addEventListener('change', S.debounce(convert, 200)); });
      $('ic-quality').addEventListener('input', S.debounce(convert, 260));
      $('ic-keep').addEventListener('change', function () { $('ic-width').disabled = this.checked; convert(); });
      $('ic-go').addEventListener('click', convert);
      $('ic-save').addEventListener('click', function () {
        if (!outBlob) { S.toast('Convert an image first', 'info'); return; }
        var ext = $('ic-format').value.split('/')[1].replace('jpeg', 'jpg');
        S.download('signal-image.' + ext, outBlob);
      });
      $('ic-clear').addEventListener('click', function () {
        srcFile = null; outBlob = null; $('ic-file').value = '';
        $('ic-notice').hidden = true; $('ic-preview').hidden = true;
        $('ic-stats').textContent = ''; setHint('ic-hint', '');
      });
      $('ic-notice-x').addEventListener('click', function () { $('ic-clear').click(); });
    }
  });

})(window.Signal);
