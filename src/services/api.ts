export interface Comment {
  id: string;
  author: string;
  text: string;
  rating: number;
  date: string;
}

export interface Level {
  id: string;
  code: string;
  title: string;
  creator: string;
  genre: string;
  difficulty: string;
  players: string;
  description: string;
  controls?: string;
  likes: number;
  copies: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  createdAt: string;
  comments: Comment[];
}

export interface Stats {
  totalLevels: number;
  totalCopies: number;
  totalLikes: number;
  totalCreators: number;
  genreCounts: Record<string, number>;
}

export interface CreatorStats {
  creator: string;
  levelCount: number;
  totalLikes: number;
  totalCopies: number;
}

export async function getLevels(params?: {
  q?: string;
  genre?: string;
  difficulty?: string;
  sort?: string;
}): Promise<{ total: number; levels: Level[] }> {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.genre) query.set('genre', params.genre);
  if (params?.difficulty) query.set('difficulty', params.difficulty);
  if (params?.sort) query.set('sort', params.sort);

  const res = await fetch(`/api/levels?${query.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar níveis do servidor');
  return res.json();
}

export async function getLevel(id: string): Promise<Level> {
  const res = await fetch(`/api/levels/${id}`);
  if (!res.ok) throw new Error('Nível não encontrado');
  return res.json();
}

export async function getRandomLevel(): Promise<Level> {
  const res = await fetch('/api/random');
  if (!res.ok) throw new Error('Falha ao buscar nível aleatório');
  return res.json();
}

export async function createLevel(data: {
  title: string;
  creator: string;
  code: string;
  genre: string;
  difficulty: string;
  players?: string;
  description?: string;
  controls?: string;
  tags?: string[];
}): Promise<Level> {
  const res = await fetch('/api/levels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao publicar nível');
  }
  return res.json();
}

export async function likeLevel(id: string, delta: number): Promise<{ id: string; likes: number }> {
  const res = await fetch(`/api/levels/${id}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta }),
  });
  if (!res.ok) throw new Error('Erro ao curtir nível');
  return res.json();
}

export async function recordCopy(id: string): Promise<{ id: string; copies: number }> {
  const res = await fetch(`/api/levels/${id}/copy`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Erro ao registrar cópia');
  return res.json();
}

export async function addComment(
  id: string,
  data: { author: string; text: string; rating: number }
): Promise<{ level: Level; comment: Comment }> {
  const res = await fetch(`/api/levels/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao enviar comentário');
  }
  return res.json();
}

export async function getStats(): Promise<Stats> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Erro ao carregar estatísticas');
  return res.json();
}

export async function getCreators(): Promise<CreatorStats[]> {
  const res = await fetch('/api/creators');
  if (!res.ok) throw new Error('Erro ao carregar criadores');
  return res.json();
}
