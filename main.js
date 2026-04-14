// InstantWeb LivePreviewer v1.1.0 — by TechSetuApps
const PLUGIN_ID   = 'com.techsetuapps.instantweb.livepreviewer';
const AMAZON_LINK = 'https://apkpure.net/instantweb/app.techsetuapps.instantweb';

// Port — user saved port ya default 7090
function getSavedPort() {
  try { return localStorage.getItem('iw_port') || '7090'; } catch(e) { return '7090'; }
}
function savePort(p) {
  try { localStorage.setItem('iw_port', p); } catch(e) {}
}
function getPreviewUrl() {
  return 'http://127.0.0.1:' + getSavedPort();
}

let panel=null, iframe=null, fab=null;
let isVisible=false, isFs=false, resizing=false, resizeTimer;


function getViewportTop() {
  return window.visualViewport ? window.visualViewport.offsetTop : 0;
}
function getViewportHeight() {
  return window.visualViewport ? window.visualViewport.height : window.innerHeight;
}
function applyViewportPosition() {
  if (!panel || isFs) return;
  // Don't shift panel when keyboard opens for address bar
  const addr = document.getElementById('iw-addr');
  if (addr && document.activeElement === addr) return;
  const isLand = window.innerWidth > window.innerHeight;
  if (isLand) {
    panel.style.top    = getViewportTop() + 'px';
    panel.style.height = getViewportHeight() + 'px';
  } else {
    // Portrait: keep bottom:0, adjust height to exclude keyboard bar
    // This way resize (height only) still expands panel upward correctly
    const keyboardH = window.innerHeight - getViewportHeight() - getViewportTop();
    const currentH = panel.offsetHeight;
    // Don't override height if user is resizing
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
  gear:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
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
    ${getSavedPort() !== '7090' ? '<button id="iw-reset-port" style="background:transparent;border:none;color:#475569;font-size:11px;margin-top:8px;cursor:pointer;text-decoration:underline;">Reset to default port (7090)</button>' : ''}
  `;
  // Add to webArea so header stays visible above error
  const webArea = panel.querySelector('#iw-webarea') || panel;
  webArea.appendChild(d);

  document.getElementById('iw-retry').onclick = () => { d.remove(); loadPreview(); };
  const resetBtn = document.getElementById('iw-reset-port');
  if (resetBtn) resetBtn.onclick = () => {
    savePort('7090');
    const addr = document.getElementById('iw-addr');
    if (addr) addr.value = 'localhost:7090';
    d.remove();
    loadPreview();
  };
}

// Eruda local file — bundled inside plugin zip
// ACode stores plugin files at this path on Android


// KEY FIX: onload set BEFORE src — never misses load event
function loadPreview() {
  if (!iframe) return;
  const sb = document.getElementById('iw-sb');
  if (sb) { sb.style.background='#f59e0b'; }
  // Reset srcdoc so src works
  iframe.removeAttribute('srcdoc');
  fetch(getPreviewUrl()+'/__iw_ping?t='+Date.now(), {mode:'no-cors',cache:'no-store'})
    .then(() => {
      // Only request eruda injection when using InstantWeb default port
      const isInstantWeb = getSavedPort() === '7090';
      iframe.src = getPreviewUrl() + (isInstantWeb ? '/?__iw_acode=1&t=' : '/?t=') + Date.now();
      if (sb) { sb.style.background='#22c55e'; }
    })
    .catch(() => {
      showError();
      if (sb) { sb.style.background='#ef4444'; }
    });
}

function showSettings() { return; // address bar handles port editing
  if(false){
  if (!panel) return;
  const old = document.getElementById('iw-settings');
  if (old) { old.remove(); return; }
  const s = document.createElement('div');
  s.id = 'iw-settings';
  s.style.cssText = 'position:absolute;top:50px;right:0;left:0;background:#1e293b;border-bottom:1px solid #1e3a5f;padding:14px 16px;z-index:10;display:flex;flex-direction:column;gap:10px;';

  const title = document.createElement('span');
  title.textContent = 'Settings';
  title.style.cssText = 'color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.05em;';

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:8px;';

  const label = document.createElement('span');
  label.textContent = 'Port';
  label.style.cssText = 'color:#cbd5e1;font-size:12px;font-weight:600;min-width:36px;';

  const inp = document.createElement('input');
  inp.type = 'number';
  inp.value = getSavedPort();
  inp.min = '1024'; inp.max = '65535';
  inp.style.cssText = 'flex:1;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:13px;padding:7px 10px;outline:none;font-family:monospace;';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.style.cssText = 'background:#2563eb;border:none;color:#fff;font-size:12px;font-weight:700;padding:7px 16px;border-radius:8px;cursor:pointer;flex-shrink:0;';
  saveBtn.onclick = () => {
    const p = inp.value.trim();
    if (!p || isNaN(p) || +p < 1024 || +p > 65535) return;
    savePort(p);
    s.remove();
    const sb = document.getElementById('iw-sb');
    if (sb) { sb.style.background='#22c55e'; }
    loadPreview();
  };
  inp.onkeydown = e => { if(e.key==='Enter') saveBtn.click(); };

  row.appendChild(label); row.appendChild(inp); row.appendChild(saveBtn);
  s.appendChild(title); s.appendChild(row);
  panel.appendChild(s);
  setTimeout(() => inp.focus(), 50);
  } // end if(false)
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
  h.onmouseenter=()=>h.style.background='rgba(37,99,235,0.55)';
  h.onmouseleave=()=>{if(!resizing)h.style.background='rgba(255,255,255,0.09)';};
  let s0,sz0;
  const start=(x,y)=>{
    resizing=true; s0=isLand?x:y; sz0=isLand?p.offsetWidth:p.offsetHeight;
    if(!isLand){
      // Lock panel to bottom:0 so height changes expand panel upward
      p.style.bottom='0px';
      p.style.top='auto';
    }
  };
  const move=(x,y)=>{
    if(!resizing)return;
    if(isLand){
      // Landscape: left handle, drag left=grow, drag right=shrink
      const d=s0-x;
      const v=Math.max(180,Math.min(window.innerWidth*0.82,sz0+d));
      p.style.width=v+'px';
    } else {
      // Portrait: top handle, panel bottom-anchored
      // Drag UP (y decreases): s0-y > 0 → height grows → panel expands upward ✓
      // Drag DOWN (y increases): s0-y < 0 → height shrinks ✓
      const d=s0-y;
      const v=Math.max(120,Math.min(window.innerHeight*0.88,sz0+d));
      p.style.height=v+'px';
    }
  };
  h.addEventListener('touchstart',e=>{start(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();},{passive:false});
  document.addEventListener('touchmove',e=>{if(resizing){move(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();}},{passive:false});
  document.addEventListener('touchend',()=>resizing=false);
  h.onmousedown=e=>start(e.clientX,e.clientY);
  document.addEventListener('mousemove',e=>move(e.clientX,e.clientY));
  document.addEventListener('mouseup',()=>resizing=false);
  p.appendChild(h);
}

function buildPanel() {
  if (panel) { panel.remove(); panel=null; iframe=null; }
  destroyViewportListener();
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

  // W Logo — bigger, left side
  const ico = document.createElement('div');
  ico.style.cssText = `width:40px;height:40px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;flex-shrink:0;box-shadow:0 2px 8px rgba(37,99,235,0.4);`;
  ico.textContent = 'W';

  // Address bar — editable, tap to change port
  const addrWrap = document.createElement('div');
  addrWrap.style.cssText = `flex:1;display:flex;align-items:center;background:#1a3a6b;border-radius:10px;padding:0 12px;height:36px;min-width:0;cursor:pointer;`;
  
  const addrText = document.createElement('input');
  addrText.id = 'iw-addr';
  addrText.value = 'localhost:' + getSavedPort();
  addrText.style.cssText = `flex:1;background:none;border:none;color:#e2e8f0;font-size:13px;font-weight:500;outline:none;text-align:center;font-family:-apple-system,sans-serif;cursor:pointer;min-width:0;`;
  addrText.readOnly = true;

  // Tap to edit port
  addrText.addEventListener('click', () => {
    addrText.readOnly = false;
    addrText.style.cursor = 'text';
    // Show just port number for editing
    addrText.value = getSavedPort();
    addrText.select();
  });
  addrText.addEventListener('blur', () => {
    const p = addrText.value.trim().replace('localhost:', '');
    if (p && !isNaN(p) && +p >= 1024 && +p <= 65535) {
      savePort(p);
      loadPreview();
    }
    addrText.value = 'localhost:' + getSavedPort();
    addrText.readOnly = true;
    addrText.style.cursor = 'pointer';
  });
  addrText.addEventListener('keydown', e => {
    if (e.key === 'Enter') addrText.blur();
    if (e.key === 'Escape') {
      addrText.value = getSavedPort();
      addrText.blur();
    }
  });

  addrWrap.appendChild(addrText);

  // Status dot
  const sb = document.createElement('span');
  sb.id = 'iw-sb';
  sb.style.cssText = `width:8px;height:8px;border-radius:50%;background:#475569;flex-shrink:0;margin-left:6px;`;
  addrWrap.appendChild(sb);

  // Refresh button
  const refreshB = mkBtn(ic.refresh,'Refresh','#94a3b8',()=>{const e=document.getElementById('iw-err');if(e)e.remove();loadPreview();});

  // Close button — X circle style
  const closeB = mkBtn(ic.close,'Close','#ef4444',hidePanel);

  // Fullscreen button
  const fsBtn = mkBtn(ic.fullscr,'Fullscreen','#94a3b8',toggleFullscreen);
  fsBtn.id = 'iw-fs-btn';

  hd.appendChild(ico);
  hd.appendChild(addrWrap);
  hd.appendChild(refreshB);
  hd.appendChild(fsBtn);
  hd.appendChild(closeB);

  const webArea = document.createElement('div');
  webArea.id = 'iw-webarea';
  webArea.style.cssText=`flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative;min-height:0;`;

  iframe = document.createElement('iframe');
  iframe.style.cssText=`flex:1;border:none;background:#fff;width:100%;height:100%;display:block;`;
  iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-modals');
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
  isVisible=false; isFs=false; consoleVisible=false;
  destroyViewportListener();
  updateFab();
}

function togglePanel() {
  isVisible && panel ? hidePanel() : buildPanel();
}

function createFab() {
  fab = document.createElement('div');
  fab.id='iw-fab';
  fab.style.cssText=`
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
  fab.textContent='W';
  fab.title='Live Preview (Ctrl+Shift+I)';

  let dragging=false,moved=false,offX=0,offY=0,startT=0;
  fab.addEventListener('touchstart',e=>{
    const t=e.touches[0],r=fab.getBoundingClientRect();
    offX=t.clientX-r.left;offY=t.clientY-r.top;
    dragging=true;moved=false;startT=Date.now();
    e.preventDefault();
  },{passive:false});
  document.addEventListener('touchmove',e=>{
    if(!dragging)return;
    const t=e.touches[0];
    const dx=Math.abs(t.clientX-offX-fab.getBoundingClientRect().left);
    const dy=Math.abs(t.clientY-offY-fab.getBoundingClientRect().top);
    if(dx>5||dy>5)moved=true;
    fab.style.left=Math.max(0,Math.min(window.innerWidth-48,t.clientX-offX))+'px';
    fab.style.top=Math.max(0,Math.min(window.innerHeight-48,t.clientY-offY))+'px';
    fab.style.right='auto';fab.style.bottom='auto';
    e.preventDefault();
  },{passive:false});
  document.addEventListener('touchend',()=>{
    if(!dragging)return;
    dragging=false;
    if(!moved||Date.now()-startT<200)togglePanel();
  });
  document.body.appendChild(fab);
}

function updateFab() {
  if(!fab)return;
  fab.style.background=isVisible
    ?'linear-gradient(135deg,#1d4ed8,#1e3a5f)'
    :'linear-gradient(135deg,#2563eb,#1d4ed8)';
}

let _lastW=window.innerWidth,_lastH=window.innerHeight;
function onResize() {
  const w=window.innerWidth,h=window.innerHeight;
  // Don't rebuild if address bar input is focused (keyboard open)
  const addr=document.getElementById('iw-addr');
  if(addr && document.activeElement===addr) return;
  if(w!==_lastW||h!==_lastH){
    _lastW=w;_lastH=h;
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{if(isVisible&&panel&&!isFs)buildPanel();},320);
  }
}

acode.setPluginInit(PLUGIN_ID, () => {
  // Support both CodeMirror and ACE
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
  window.addEventListener('orientationchange',onResize);
  window.addEventListener('resize',onResize);
  window.toast&&window.toast('InstantWeb LivePreviewer ready!',2500);
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
