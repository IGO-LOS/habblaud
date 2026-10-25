// Patch IGO: panel "Manage" — phần quản trị Agent Office (sessions/agents/flows)
// sống NGAY TRONG Habblaud: overlay iframe cùng origin (/office/ sau nginx),
// fallback http://localhost:1420 khi chạy dev local. Đóng panel là về văn phòng.

const VIEWS: { key: string; label: string; path: string }[] = [
  { key: 'sessions', label: 'Sessions', path: '' },
  { key: 'agents', label: 'Agents', path: 'agents' },
  { key: 'flows', label: 'Flows', path: 'flows' },
];

async function officeBase(): Promise<string> {
  // Habblaud SPA-fallback trả 200 cho mọi path, nên phải probe API thật
  // (content-type JSON chỉ có khi nginx đã proxy /office-api → backend).
  try {
    const r = await fetch('/office-api/api/v1/auth/mode');
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) return '/office/';
  } catch {
    // ignore
  }
  return 'http://localhost:1420/';
}

export function mountManage(group: HTMLElement): void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.title = 'Manage agents (Agent Office)';
  btn.textContent = '⚙︎ Manage';
  btn.style.cssText = [
    'margin-right:8px', 'padding:4px 10px', 'border-radius:8px',
    'border:1px solid #8B4A52', 'background:#3A2228', 'color:#F2DEE0',
    'font:inherit', 'font-size:12px', 'font-weight:700', 'cursor:pointer',
  ].join(';');

  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'display:none', 'position:fixed', 'inset:0', 'z-index:80',
    'background:rgba(10,8,12,.72)', 'backdrop-filter:blur(2px)',
  ].join(';');

  const panel = document.createElement('div');
  panel.style.cssText = [
    'position:absolute', 'inset:4% 4% 3% 4%', 'background:#15232F',
    'border:1px solid #2A3A48', 'border-radius:14px', 'overflow:hidden',
    'display:flex', 'flex-direction:column',
    'box-shadow:0 12px 48px rgba(0,0,0,.5)',
  ].join(';');

  const bar = document.createElement('div');
  bar.style.cssText = [
    'display:flex', 'align-items:center', 'gap:6px', 'padding:8px 12px',
    'background:#0E1A26', 'border-bottom:1px solid #2A3A48', 'color:#E8EDF2',
    'font-size:13px', 'font-weight:700',
  ].join(';');

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'flex:1;border:0;width:100%;background:#FBFAF7';
  iframe.title = 'Agent Office';

  let base = '';
  const tabBtns: HTMLButtonElement[] = [];
  const select = (key: string) => {
    for (const b of tabBtns) {
      const active = b.dataset.key === key;
      b.style.background = active ? '#8B000E' : 'transparent';
      b.style.color = active ? '#fff' : '#93A4B5';
    }
    const v = VIEWS.find(x => x.key === key)!;
    iframe.src = base + v.path;
  };

  for (const v of VIEWS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = v.label;
    b.dataset.key = v.key;
    b.style.cssText = 'padding:4px 12px;border-radius:7px;border:0;font:inherit;font-size:12px;font-weight:700;cursor:pointer;background:transparent;color:#93A4B5';
    b.addEventListener('click', () => select(v.key));
    bar.appendChild(b);
    tabBtns.push(b);
  }

  const spacer = document.createElement('div');
  spacer.style.flex = '1';
  bar.appendChild(spacer);

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '✕ Office';
  close.title = 'Back to the office';
  close.style.cssText = 'padding:4px 12px;border-radius:7px;border:1px solid #2A3A48;background:transparent;color:#E8EDF2;font:inherit;font-size:12px;font-weight:700;cursor:pointer';
  close.addEventListener('click', () => { overlay.style.display = 'none'; });
  bar.appendChild(close);

  panel.appendChild(bar);
  panel.appendChild(iframe);
  overlay.appendChild(panel);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });
  document.body.appendChild(overlay);

  btn.addEventListener('click', async () => {
    if (!base) base = await officeBase();
    overlay.style.display = 'block';
    select('sessions');
  });

  group.prepend(btn);
}
