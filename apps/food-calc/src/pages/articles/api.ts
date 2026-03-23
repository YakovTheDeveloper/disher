const API_BASE = `http://${window.location.hostname}:3100`;

export interface NutrientArticleEntry {
  folder: string;
  nutrientId: string;
  nutrientName: string;
}

export async function fetchNutrientArticles(): Promise<NutrientArticleEntry[]> {
  const res = await fetch(`${API_BASE}/articles/nutrients`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchNutrientArticle(folder: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/articles/nutrients/${folder}`);
  if (!res.ok) return null;
  return res.text();
}
