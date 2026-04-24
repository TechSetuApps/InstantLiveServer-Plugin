// InstantWeb LivePreviewer v1.3.0 — by TechSetuApps
const PLUGIN_ID   = 'com.techsetuapps.instantweb.livepreviewer';
const AMAZON_LINK = 'https://apkpure.net/instantweb/app.techsetuapps.instantweb/';

// Port — user saved port ya default 7090
function getSavedPort() {
  try { return localStorage.getItem('iw_port') || '7090'; } catch(e) { return '7090'; }
}
function savePort(p) {
  try { localStorage.setItem('iw_port', p); } catch(e) {}
}
// Custom path — /data.json, /style.css etc
function getSavedPath() {
  try { return localStorage.getItem('iw_path') || '/'; } catch(e) { return '/'; }
}
function savePath(p) {
  try { localStorage.setItem('iw_path', p || '/'); } catch(e) {}
}
function getPreviewUrl() {
  return 'http://127.0.0.1:' + getSavedPort();
}
function getFullUrl() {
  const path = getSavedPath();
  return getPreviewUrl() + (path.startsWith('/') ? path : '/' + path);
}

// Address bar display:
// Normal mode → shows file/page title (or path if not root)
// Edit mode   → shows "localhost:PORT/path" — fully editable
let panel=null, iframe=null, fab=null;
let isVisible=false, isFs=false, resizing=false, resizeTimer;
let addrEditMode = false; // false = title mode, true = edit mode

function getViewportTop() {
  return window.visualViewport ? window.visualViewport.offsetTop : 0;
}
function getViewportHeight() {
  return window.visualViewport ? window.visualViewport.height : window.innerHeight;
}
function applyViewportPosition() {
  if (!panel || isFs) return;
  const addr = document.getElementById('iw-addr');
  if (addr && document.activeElement === addr) return;
  const isLand = window.innerWidth > window.innerHeight;
  if (isLand) {
    panel.style.top    = getViewportTop() + 'px';
    panel.style.height = getViewportHeight() + 'px';
  } else {
    const keyboardH = window.innerHeight - getViewportHeight() - getViewportTop();
    if (!resizing) {
      panel.style.bottom = keyboardH + 'px';
    }
  }
}
function initViewportListener() {
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', applyViewportPosition);
    window.visualViewport.addEventListener('scroll', applyViewportPosition);
  }
}
function destroyViewportListener() {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', applyViewportPosition);
    window.visualViewport.removeEventListener('scroll', applyViewportPosition);
  }
}

const ic = {
  refresh: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  close:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  fullscr: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  exitfs:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>`,
  dl:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
};

function mkBtn(html, title, color, cb) {
  const b = document.createElement('button');
  b.innerHTML = html; b.title = title;
  b.style.cssText = `display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:transparent;border:none;cursor:pointer;border-radius:8px;color:${color};flex-shrink:0;-webkit-tap-highlight-color:transparent;`;
  let _t = false;
  b.addEventListener('touchstart', () => b.style.background='rgba(255,255,255,0.12)', {passive:true});
  b.addEventListener('touchend', e => { b.style.background='transparent'; _t=true; e.preventDefault(); cb(); }, {passive:false});
  b.addEventListener('click', () => { if(_t){_t=false;return;} cb(); });
  return b;
}

// Update address bar display
// Normal mode: show page title or path
// Edit mode: show "localhost:PORT/path"
function updateAddrDisplay(titleText) {
  const addr = document.getElementById('iw-addr');
  if (!addr) return;
  if (addrEditMode) return; // editing — don't override
  const path = getSavedPath();
  if (titleText) {
    addr.value = titleText;
    addr.title = 'localhost:' + getSavedPort() + path + '';
  } else if (path && path !== '/') {
    addr.value = path; // show path if non-root
    addr.title = 'localhost:' + getSavedPort() + path;
  } else {
    addr.value = 'Live Preview';
    addr.title = 'localhost:' + getSavedPort();
  }
}

function enterAddrEdit() {
  const addr = document.getElementById('iw-addr');
  if (!addr) return;
  addrEditMode = true;
  const path = getSavedPath();
  addr.readOnly = false;
  addr.style.cursor = 'text';
  addr.style.textAlign = 'left';
  // locLabel already shows "localhost:" — so show only PORT/path
  addr.value = getSavedPort() + path;
  addr.select();
}

function exitAddrEdit(save) {
  const addr = document.getElementById('iw-addr');
  if (!addr) return;
  addrEditMode = false;
  addr.readOnly = true;
  addr.style.cursor = 'pointer';
  addr.style.textAlign = 'center';

  if (save) {
    let val = addr.value.trim();
    // Remove "localhost:" prefix if user accidentally typed it
    val = val.replace(/^localhost:/i, '');
    // Split port and path
    const slashIdx = val.indexOf('/');
    let port, path;
    if (slashIdx === -1) {
      port = val;
      path = '/';
    } else {
      port = val.substring(0, slashIdx);
      path = val.substring(slashIdx) || '/';
    }
    // Validate port
    if (port && !isNaN(port) && +port >= 1 && +port <= 65535) {
      savePort(port);
    }
    // Save path
    savePath(path);
    loadPreview();
  }
  updateAddrDisplay(null);
}

function showError() {
  if (!panel) return;
  const old = document.getElementById('iw-err'); if (old) old.remove();
  const d = document.createElement('div');
  d.id = 'iw-err';
  d.style.cssText = `position:absolute;left:0;right:0;bottom:0;top:0;background:#0a1628;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center;z-index:5;`;
  d.innerHTML = `
    <div style="width:68px;height:68px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900;color:#fff;margin-bottom:20px;box-shadow:0 8px 28px rgba(37,99,235,0.45);">W</div>
    <p style="color:#e2e8f0;font-size:15px;font-weight:700;margin-bottom:8px;">InstantWeb is not running</p>
    <p style="color:#64748b;font-size:12px;margin-bottom:22px;line-height:1.7;max-width:230px;">Please download InstantWeb, host any HTML file, then tap Live Preview.</p>
    <a href="${AMAZON_LINK}" style="display:flex;align-items:center;gap:8px;background:#2563eb;color:#fff;padding:11px 22px;border-radius:11px;text-decoration:none;font-size:13px;font-weight:700;margin-bottom:12px;">${ic.dl} Download InstantWeb</a>
    <button id="iw-retry" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;padding:9px 20px;border-radius:9px;cursor:pointer;font-size:12px;">Retry</button>
    ${getSavedPort() !== '7090' ? '<button id="iw-reset-port" style="background:transparent;border:none;color:#475569;font-size:11px;margin-top:8px;cursor:pointer;text-decoration:underline;">Reset to default (localhost:7090)</button>' : ''}
  `;
  const webArea = panel.querySelector('#iw-webarea') || panel;
  webArea.appendChild(d);

  document.getElementById('iw-retry').onclick = () => { d.remove(); loadPreview(); };
  const resetBtn = document.getElementById('iw-reset-port');
  if (resetBtn) resetBtn.onclick = () => {
    savePort('7090');
    savePath('/');
    d.remove();
    loadPreview();
  };
}

// Read <title> from ACode editor session — no cross-origin issues
// ACode WebView is file:// origin, InstantWeb is http:// — contentDocument is always blocked
// So we read the title directly from the open file's editor content instead
function getTitleFromEditor() {
  try {
    const file = editorManager && editorManager.activeFile;
    if (!file) return null;
    const session = file.session;
    if (session) {
      const content = session.getValue();
      const m = content.match(/<title[^>]*>([^<\n]+)<\/title>/i);
      if (m && m[1].trim()) return m[1].trim();
    }
    return file.name || null;
  } catch(e) {
    return null;
  }
}

function loadPreview() {
  if (!iframe) return;
  const sb = document.getElementById('iw-sb');
  if (sb) sb.style.background = '#f59e0b';
  iframe.removeAttribute('srcdoc');

  const baseUrl = getPreviewUrl();
  const path = getSavedPath();

  fetch(baseUrl + '/__iw_ping?t=' + Date.now(), {mode:'no-cors', cache:'no-store'})
    .then(() => {
      const isInstantWeb = getSavedPort() === '7090';
      let finalUrl;
      if (path && path !== '/') {
        finalUrl = baseUrl + path + (path.includes('?') ? '&' : '?') + 't=' + Date.now();
      } else {
        finalUrl = baseUrl + (isInstantWeb ? '/?__iw_acode=1&t=' : '/?t=') + Date.now();
      }
      // onload BEFORE src — never misses the load event
      iframe.onload = () => {
        if (sb) sb.style.background = '#22c55e';
        if (path && path !== '/') {
          updateAddrDisplay(path);
        } else {
          // Read title from ACode editor content (reliable — no cross-origin block)
          const t = getTitleFromEditor();
          updateAddrDisplay(t || 'Live Preview');
        }
      };
      iframe.src = finalUrl;
    })
    .catch(() => {
      showError();
      if (sb) sb.style.background = '#ef4444';
    });
}

function toggleFullscreen() {
  if (!panel) return;
  isFs = !isFs;
  if (isFs) {
    destroyViewportListener();
    panel.style.cssText = `position:fixed;left:0;top:0;width:100%;height:100%;background:#0f172a;z-index:9999;display:flex;flex-direction:column;`;
  } else {
    buildPanel();
  }
  const fsBtn = document.getElementById('iw-fs-btn');
  if (fsBtn) fsBtn.innerHTML = isFs ? ic.exitfs : ic.fullscr;
}

function addResizeHandle(p, isLand) {
  const h = document.createElement('div');
  h.style.cssText = `position:absolute;background:rgba(255,255,255,0.09);border-radius:4px;z-index:2;${isLand?'left:0;top:50%;transform:translateY(-50%);width:6px;height:52px;cursor:ew-resize;':'top:0;left:50%;transform:translateX(-50%);height:6px;width:52px;cursor:ns-resize;'}`;
  h.onmouseenter = () => h.style.background = 'rgba(37,99,235,0.55)';
  h.onmouseleave = () => { if(!resizing) h.style.background='rgba(255,255,255,0.09)'; };
  let s0, sz0;
  const start = (x,y) => {
    resizing=true; s0=isLand?x:y; sz0=isLand?p.offsetWidth:p.offsetHeight;
    if(!isLand){ p.style.bottom='0px'; p.style.top='auto'; }
  };
  const move = (x,y) => {
    if(!resizing) return;
    if(isLand) {
      const v = Math.max(180, Math.min(window.innerWidth*0.82, sz0+(s0-x)));
      p.style.width = v+'px';
    } else {
      const v = Math.max(120, Math.min(window.innerHeight*0.88, sz0+(s0-y)));
      p.style.height = v+'px';
    }
  };
  h.addEventListener('touchstart', e=>{start(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();},{passive:false});
  document.addEventListener('touchmove', e=>{if(resizing){move(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();}},{passive:false});
  document.addEventListener('touchend', ()=>resizing=false);
  h.onmousedown = e => start(e.clientX, e.clientY);
  document.addEventListener('mousemove', e => move(e.clientX, e.clientY));
  document.addEventListener('mouseup', ()=>resizing=false);
  p.appendChild(h);
}

function buildPanel() {
  if (panel) { panel.remove(); panel=null; iframe=null; }
  destroyViewportListener();
  addrEditMode = false;
  const isLand = window.innerWidth > window.innerHeight;
  const vTop   = getViewportTop();
  const vH     = getViewportHeight();
  const panelH = Math.round(window.innerHeight * 0.46);

  panel = document.createElement('div');
  panel.id = 'iw-panel';
  panel.style.cssText = `
    position:fixed;background:#0f172a;z-index:9999;
    display:flex;flex-direction:column;
    ${isLand
      ? `right:0;top:${vTop}px;width:46%;height:${vH}px;border-left:1.5px solid #1e3a5f;box-shadow:-4px 0 32px rgba(0,0,0,0.6);`
      : `left:0;bottom:0;width:100%;height:${panelH}px;border-top:1.5px solid #1e3a5f;border-radius:16px 16px 0 0;box-shadow:0 -4px 32px rgba(0,0,0,0.6);`
    }
  `;

  const hd = document.createElement('div');
  hd.style.cssText = `display:flex;align-items:center;padding:0 10px;background:#0f1f3d;gap:8px;flex-shrink:0;height:58px;${!isLand?'border-radius:16px 16px 0 0;':''}`;

  // W Logo
  const ico = document.createElement('div');
  ico.style.cssText = `width:40px;height:40px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;flex-shrink:0;box-shadow:0 2px 8px rgba(37,99,235,0.4);`;
  ico.textContent = 'W';

  // Address bar wrap
  const addrWrap = document.createElement('div');
  addrWrap.style.cssText = `flex:1;display:flex;align-items:center;background:#1a3a6b;border-radius:10px;padding:0 10px;height:36px;min-width:0;`;

  // "localhost:" fixed prefix label
  const locLabel = document.createElement('span');
  locLabel.textContent = 'localhost:';
  locLabel.style.cssText = `color:#60A5FA;font-size:12px;font-weight:600;flex-shrink:0;font-family:monospace;opacity:0.85;display:none;`;
  locLabel.id = 'iw-loc-label';

  // Address input — shows title normally, full url when editing
  const addrText = document.createElement('input');
  addrText.id = 'iw-addr';
  addrText.type = 'text';
  addrText.value = 'Live Preview';
  addrText.readOnly = true;
  addrText.style.cssText = `flex:1;background:none;border:none;color:#e2e8f0;font-size:13px;font-weight:500;outline:none;text-align:center;font-family:-apple-system,sans-serif;cursor:pointer;min-width:0;`;

  // Tap → enter edit mode
  addrText.addEventListener('click', () => {
    if (!addrEditMode) {
      enterAddrEdit();
      // Show localhost: prefix
      locLabel.style.display = 'block';
      addrText.style.textAlign = 'left';
    }
  });
  addrText.addEventListener('touchend', e => {
    if (!addrEditMode) {
      e.preventDefault();
      enterAddrEdit();
      locLabel.style.display = 'block';
      addrText.style.textAlign = 'left';
      setTimeout(() => addrText.focus(), 50);
    }
  }, {passive:false});

  addrText.addEventListener('blur', () => {
    exitAddrEdit(true);
    locLabel.style.display = 'none';
    addrText.style.textAlign = 'center';
  });

  addrText.addEventListener('keydown', e => {
    if (e.key === 'Enter') addrText.blur();
    if (e.key === 'Escape') {
      addrEditMode = false;
      exitAddrEdit(false);
      locLabel.style.display = 'none';
      addrText.style.textAlign = 'center';
    }
  });

  // Status dot
  const sb = document.createElement('span');
  sb.id = 'iw-sb';
  sb.style.cssText = `width:8px;height:8px;border-radius:50%;background:#475569;flex-shrink:0;margin-left:4px;`;

  addrWrap.appendChild(locLabel);
  addrWrap.appendChild(addrText);
  addrWrap.appendChild(sb);

  const refreshB = mkBtn(ic.refresh, 'Refresh', '#94a3b8', () => {
    const e = document.getElementById('iw-err');
    if (e) e.remove();
    loadPreview();
  });

  const closeB = mkBtn(ic.close, 'Close', '#ef4444', hidePanel);

  const fsBtn = mkBtn(ic.fullscr, 'Fullscreen', '#94a3b8', toggleFullscreen);
  fsBtn.id = 'iw-fs-btn';

  hd.appendChild(ico);
  hd.appendChild(addrWrap);
  hd.appendChild(refreshB);
  hd.appendChild(fsBtn);
  hd.appendChild(closeB);

  const webArea = document.createElement('div');
  webArea.id = 'iw-webarea';
  webArea.style.cssText = `flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative;min-height:0;`;

  iframe = document.createElement('iframe');
  iframe.style.cssText = `flex:1;border:none;background:#fff;width:100%;height:100%;display:block;`;
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals');
  webArea.appendChild(iframe);

  panel.appendChild(hd);
  panel.appendChild(webArea);
  addResizeHandle(panel, isLand);
  document.body.appendChild(panel);

  isVisible = true;
  initViewportListener();
  updateFab();
  loadPreview();
}

function hidePanel() {
  if (panel) { panel.remove(); panel=null; iframe=null; }
  isVisible=false; isFs=false; addrEditMode=false;
  destroyViewportListener();
  updateFab();
}

function togglePanel() {
  isVisible && panel ? hidePanel() : buildPanel();
}

function createFab() {
  fab = document.createElement('div');
  fab.id = 'iw-fab';
  fab.style.cssText = `
    position:fixed;top:64px;right:14px;
    width:48px;height:48px;
    background:linear-gradient(135deg,#2563eb,#1d4ed8);
    border-radius:14px;
    display:flex;align-items:center;justify-content:center;
    font-size:22px;font-weight:900;color:#fff;
    z-index:99998;
    box-shadow:0 4px 20px rgba(37,99,235,0.5);
    user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;
  `;
  fab.textContent = 'W';
  fab.title = 'InstantWeb LivePreviewer (Ctrl+Shift+W)';

  let dragging=false, moved=false, offX=0, offY=0, startT=0;
  fab.addEventListener('touchstart', e => {
    const t=e.touches[0], r=fab.getBoundingClientRect();
    offX=t.clientX-r.left; offY=t.clientY-r.top;
    dragging=true; moved=false; startT=Date.now();
    e.preventDefault();
  }, {passive:false});
  document.addEventListener('touchmove', e => {
    if(!dragging) return;
    const t=e.touches[0];
    const dx=Math.abs(t.clientX-offX-fab.getBoundingClientRect().left);
    const dy=Math.abs(t.clientY-offY-fab.getBoundingClientRect().top);
    if(dx>5||dy>5) moved=true;
    fab.style.left = Math.max(0, Math.min(window.innerWidth-48, t.clientX-offX))+'px';
    fab.style.top  = Math.max(0, Math.min(window.innerHeight-48, t.clientY-offY))+'px';
    fab.style.right='auto'; fab.style.bottom='auto';
    e.preventDefault();
  }, {passive:false});
  document.addEventListener('touchend', () => {
    if(!dragging) return;
    dragging=false;
    if(!moved || Date.now()-startT<200) togglePanel();
  });
  document.body.appendChild(fab);
}

function updateFab() {
  if(!fab) return;
  fab.style.background = isVisible
    ? 'linear-gradient(135deg,#1d4ed8,#1e3a5f)'
    : 'linear-gradient(135deg,#2563eb,#1d4ed8)';
}

let _lastW=window.innerWidth, _lastH=window.innerHeight;
function onResize() {
  const w=window.innerWidth, h=window.innerHeight;
  const addr=document.getElementById('iw-addr');
  if(addr && document.activeElement===addr) return;
  if(w!==_lastW||h!==_lastH){
    _lastW=w; _lastH=h;
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{ if(isVisible&&panel&&!isFs) buildPanel(); }, 320);
  }
}

acode.setPluginInit(PLUGIN_ID, () => {
  try {
    const commands = acode.require('commands');
    if (commands && commands.addCommand) {
      commands.addCommand({
        name:'iw-preview',
        description:'Toggle InstantWeb Live Preview',
        bindKey:{win:'Ctrl-Shift-W',mac:'Ctrl-Shift-W'},
        exec:togglePanel,
      });
    } else {
      editorManager.editor.commands.addCommand({
        name:'iw-preview',
        bindKey:{win:'Ctrl-Shift-W',mac:'Ctrl-Shift-W'},
        exec:togglePanel,
      });
    }
  } catch(e) {
    try {
      editorManager.editor.commands.addCommand({
        name:'iw-preview',
        bindKey:{win:'Ctrl-Shift-W',mac:'Ctrl-Shift-W'},
        exec:togglePanel,
      });
    } catch(e2) {}
  }
  createFab();
  window.addEventListener('orientationchange', onResize);
  window.addEventListener('resize', onResize);
  window.toast && window.toast('InstantWeb LivePreviewer ready!', 2500);
});

acode.setPluginUnmount(PLUGIN_ID, () => {
  hidePanel();
  if(fab) fab.remove();
  window.removeEventListener('orientationchange', onResize);
  window.removeEventListener('resize', onResize);
  try {
    const commands = acode.require('commands');
    if (commands && commands.removeCommand) {
      commands.removeCommand('iw-preview');
    } else {
      editorManager.editor.commands.removeCommand('iw-preview');
    }
  } catch(e) {
    try { editorManager.editor.commands.removeCommand('iw-preview'); } catch(e2) {}
  }
});
