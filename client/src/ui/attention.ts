// Patch IGO: banner "Waiting for you" — việc từ Lacora Tracker (Lark) đang chờ
// người xử lý, do bridge của Agent Office ghi vào attention.json và server
// expose qua GET /api/attention. Poll 30s; không có việc thì ẩn hẳn.
//
// Layout: mỗi dòng là flex — tiêu đề co giãn (ellipsis), link Ticket/PR ghim
// bên phải nên KHÔNG bao giờ bị cắt dù tiêu đề dài. Nhiều việc: danh sách cuộn
// (max 40vh), header có nút thu gọn về đúng một dòng đếm (nhớ qua localStorage).

interface AttentionItem {
  record_id: string;
  title: string;
  reason: string;
  pr?: string | null;
  url?: string | null;
}

const POLL_MS = 30_000;
const COLLAPSE_KEY = 'igo-attention:collapsed';

export function mountAttention(): void {
  const bar = document.createElement('div');
  bar.id = 'igo-attention';
  bar.style.cssText = [
    'display:none',
    'position:fixed',
    'left:50%',
    'transform:translateX(-50%)',
    'top:64px',
    'z-index:60',
    'width:min(760px, calc(100vw - 32px))',
    'background:#3A2228',
    'border:1px solid #8B4A52',
    'color:#F2DEE0',
    'border-radius:10px',
    'padding:8px 14px',
    'font-size:13px',
    'line-height:1.5',
    'box-shadow:0 4px 16px rgba(0,0,0,.35)',
  ].join(';');
  document.body.appendChild(bar);

  let collapsed = false;
  try {
    collapsed = localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    // storage bị chặn thì luôn mở
  }
  let lastItems: AttentionItem[] = [];

  const setCollapsed = (v: boolean) => {
    collapsed = v;
    try {
      localStorage.setItem(COLLAPSE_KEY, v ? '1' : '0');
    } catch {
      // ignore
    }
    render(lastItems);
  };

  const render = (items: AttentionItem[]) => {
    lastItems = items;
    if (!items.length) {
      bar.style.display = 'none';
      bar.replaceChildren();
      return;
    }
    bar.replaceChildren();

    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none';
    head.title = collapsed ? 'Expand' : 'Collapse';
    const headText = document.createElement('span');
    headText.textContent = `✋ Waiting for you · ${items.length}`;
    headText.style.cssText = 'font-weight:700;color:#E8A0A8';
    head.appendChild(headText);
    if (collapsed) {
      // Thu gọn: một dòng đếm + tiêu đề việc đầu cho đỡ mù thông tin
      const hint = document.createElement('span');
      hint.textContent = items[0].title;
      hint.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.75';
      head.appendChild(hint);
    } else {
      const spacer = document.createElement('span');
      spacer.style.flex = '1';
      head.appendChild(spacer);
    }
    const toggle = document.createElement('span');
    toggle.textContent = collapsed ? '▸' : '▾';
    toggle.style.cssText = 'color:#E8A0A8;font-weight:700';
    head.appendChild(toggle);
    head.addEventListener('click', () => setCollapsed(!collapsed));
    bar.appendChild(head);

    if (!collapsed) {
      const list = document.createElement('div');
      list.style.cssText = 'margin-top:4px;max-height:40vh;overflow-y:auto;display:flex;flex-direction:column;gap:4px';
      for (const it of items) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:baseline;gap:6px';

        const text = document.createElement('span');
        text.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
        text.title = `${it.title} — ${it.reason}`;
        const title = document.createElement('span');
        title.textContent = it.title;
        title.style.fontWeight = '600';
        text.appendChild(title);
        const reason = document.createElement('span');
        reason.textContent = ` — ${it.reason}`;
        reason.style.opacity = '0.85';
        text.appendChild(reason);
        row.appendChild(text);

        // Link ghim bên phải, ngoài vùng ellipsis — không bao giờ bị cắt
        const links = document.createElement('span');
        links.style.cssText = 'flex:none;white-space:nowrap';
        const mkLink = (href: string, label: string) => {
          const a = document.createElement('a');
          a.href = href;
          a.target = '_blank';
          a.rel = 'noreferrer';
          a.textContent = label;
          a.style.cssText = 'color:#E8A0A8;font-weight:700;text-decoration:none;margin-left:8px';
          links.appendChild(a);
        };
        if (it.url) mkLink(it.url, 'Ticket ↗');
        if (it.pr) mkLink(it.pr, 'PR ↗');
        row.appendChild(links);

        list.appendChild(row);
      }
      bar.appendChild(list);
    }
    bar.style.display = 'block';
  };

  const poll = () => {
    fetch('/api/attention')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: AttentionItem[] }) => render(d.items ?? []))
      .catch(() => render([]));
  };
  poll();
  setInterval(poll, POLL_MS);
}
