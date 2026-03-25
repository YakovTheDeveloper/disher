const API_BASE = `http://${window.location.hostname}:3100`;

interface ShareItem {
  foodId: string;
  name: string;
  quantity: number;
}

interface CreateShareParams {
  items: ShareItem[];
  source: { type: 'dish' | 'day'; name: string };
  senderName?: string;
}

interface SharePayload {
  items: ShareItem[];
  source: { type: 'dish' | 'day'; name: string };
  senderName?: string;
  createdAt: string;
}

export async function createShare(params: CreateShareParams): Promise<{ shareId: string }> {
  const res = await fetch(`${API_BASE}/api/shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchShare(shareId: string): Promise<SharePayload> {
  const res = await fetch(`${API_BASE}/api/shares/${shareId}`);

  if (!res.ok) {
    if (res.status === 404) throw new Error('Ссылка не найдена или истекла');
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}
