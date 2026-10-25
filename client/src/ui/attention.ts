// Patch IGO: banner "Waiting for you" — việc từ Lacora Tracker (Lark) đang chờ
// người xử lý, do bridge của Agent Office ghi vào attention.json và server
// expose qua GET /api/attention. Poll 30s; không có việc thì ẩn hẳn.

interface AttentionItem {
  record_id: string;
  title: string;
  reason: string;
  pr?: string | null;
  url?: string | null;
}

const POLL_MS = 30_000;

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
    'max-width:min(720px, calc(100vw - 32px))',
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

  const render = (items: AttentionItem[]) => {
    if (!items.length) {
      bar.style.display = 'none';
      bar.replaceChildren();
      return;
    }
    bar.replaceChildren();
    const head = document.createElement('div');
    head.textContent = `✋ Waiting for you · ${items.length}`;
    head.style.cssText = 'font-weight:700;color:#E8A0A8;margin-bottom:2px';
    bar.appendChild(head);
    for (const it of items.slice(0, 5)) {
      const row = document.createElement('div');
      row.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      const title = document.createElement('span');
      title.textContent = it.title;
      title.style.fontWeight = '600';
      row.appendChild(title);
      const reason = document.createElement('span');
      reason.textContent = ` — ${it.reason} `;
      reason.style.opacity = '0.85';
      row.appendChild(reason);
      const mkLink = (href: string, label: string) => {
        const a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noreferrer';
        a.textContent = label;
        a.style.cssText = 'color:#E8A0A8;font-weight:700;text-decoration:none;margin-right:8px';
        row.appendChild(a);
      };
      if (it.url) mkLink(it.url, 'Ticket ↗');
      if (it.pr) mkLink(it.pr, 'PR ↗');
      bar.appendChild(row);
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
