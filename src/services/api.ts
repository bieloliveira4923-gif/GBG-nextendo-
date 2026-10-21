import { INITIAL_LEVELS, Level, Comment } from '../data/initialLevels';

export type { Level, Comment };

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

// Client-side local backup storage helpers
const STORAGE_KEY = 'gbg_local_levels_v2';

function getLocalLevels(): Level[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [...INITIAL_LEVELS];
}

function saveLocalLevels(levels: Level[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
  } catch {
    // ignore
  }
}

export async function getLevels(params?: {
  q?: string;
  genre?: string;
  difficulty?: string;
  sort?: string;
}): Promise<{ total: number; levels: Level[] }> {
  try {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.genre) query.set('genre', params.genre);
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    if (params?.sort) query.set('sort', params.sort);

    const res = await fetch(`/api/levels?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.levels)) {
        // Update local backup
        saveLocalLevels(data.levels);
        return data;
      }
    }
  } catch {
    // Network failure or static host fallback
  }

  // Fallback: local processing if API is offline
  let local = getLocalLevels();
  if (params?.q?.trim()) {
    const q = params.q.trim().toLowerCase();
    const cleanQ = q.replace(/\s+/g, '');
    local = local.filter((lvl) => {
      const text = `${lvl.title} ${lvl.creator} ${lvl.code} ${lvl.description} ${lvl.tags.join(' ')}`.toLowerCase();
      return text.includes(q) || lvl.code.replace(/\s+/g, '').toLowerCase().includes(cleanQ);
    });
  }

  if (params?.genre && params.genre !== 'Todos' && params.genre !== 'All') {
    local = local.filter((lvl) => lvl.genre.toLowerCase() === params.genre?.toLowerCase());
  }

  if (params?.difficulty && params.difficulty !== 'Todas' && params.difficulty !== 'All') {
    local = local.filter((lvl) => lvl.difficulty.toLowerCase() === params.difficulty?.toLowerCase());
  }

  switch (params?.sort) {
    case 'popular':
      local.sort((a, b) => b.likes - a.likes);
      break;
    case 'copies':
      local.sort((a, b) => b.copies - a.copies);
      break;
    case 'rating':
      local.sort((a, b) => b.rating - a.rating);
      break;
    case 'az':
      local.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'newest':
    default:
      local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  return { total: local.length, levels: local };
}

export async function getLevel(id: string): Promise<Level> {
  try {
    const res = await fetch(`/api/levels/${id}`);
    if (res.ok) return await res.json();
  } catch {
    // ignore
  }

  const found = getLocalLevels().find((l) => l.id === id);
  if (found) return found;
  throw new Error('Nível não encontrado');
}

export async function getRandomLevel(): Promise<Level> {
  try {
    const res = await fetch('/api/random');
    if (res.ok) return await res.json();
  } catch {
    // ignore
  }

  const local = getLocalLevels();
  if (local.length === 0) throw new Error('Nenhum nível cadastrado');
  const idx = Math.floor(Math.random() * local.length);
  return local[idx];
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
  try {
    const res = await fetch('/api/levels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const created = await res.json();
      const local = getLocalLevels();
      local.unshift(created);
      saveLocalLevels(local);
      return created;
    }
  } catch {
    // ignore
  }

  // Fallback creation
  const cleanCode = data.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const formattedCode = cleanCode.startsWith('G')
    ? [cleanCode.slice(0, 1), cleanCode.slice(1, 4), cleanCode.slice(4, 7), cleanCode.slice(7, 10)].filter(Boolean).join(' ')
    : 'G ' + data.code;

  const fallbackLevel: Level = {
    id: `lvl-${Date.now()}`,
    title: data.title,
    creator: data.creator || 'NodonCreator',
    code: formattedCode,
    genre: data.genre || 'Aventura',
    difficulty: data.difficulty || 'Médio',
    players: data.players || '1 Jogador',
    description: data.description || 'Criado no Game Builder Garage!',
    controls: data.controls || 'Analógico + Botões',
    likes: 1,
    copies: 0,
    rating: 5.0,
    ratingCount: 1,
    tags: data.tags || [data.genre || 'Comunidade'],
    createdAt: new Date().toISOString(),
    comments: [],
  };

  const local = getLocalLevels();
  local.unshift(fallbackLevel);
  saveLocalLevels(local);
  return fallbackLevel;
}

export async function likeLevel(id: string, delta: number): Promise<{ id: string; likes: number }> {
  try {
    const res = await fetch(`/api/levels/${id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
    });
    if (res.ok) return await res.json();
  } catch {
    // ignore
  }

  const local = getLocalLevels();
  const item = local.find((l) => l.id === id);
  if (item) {
    item.likes = Math.max(0, item.likes + delta);
    saveLocalLevels(local);
    return { id, likes: item.likes };
  }
  return { id, likes: 1 };
}

export async function recordCopy(id: string): Promise<{ id: string; copies: number }> {
  try {
    const res = await fetch(`/api/levels/${id}/copy`, {
      method: 'POST',
    });
    if (res.ok) return await res.json();
  } catch {
    // ignore
  }

  const local = getLocalLevels();
  const item = local.find((l) => l.id === id);
  if (item) {
    item.copies += 1;
    saveLocalLevels(local);
    return { id, copies: item.copies };
  }
  return { id, copies: 1 };
}

export async function addComment(
  id: string,
  data: { author: string; text: string; rating: number }
): Promise<{ level: Level; comment: Comment }> {
  try {
    const res = await fetch(`/api/levels/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {
    // ignore
  }

  const local = getLocalLevels();
  const item = local.find((l) => l.id === id);
  if (!item) throw new Error('Nível não encontrado');

  const newComment: Comment = {
    id: `c-${Date.now()}`,
    author: data.author.trim() || 'Jogador GBG',
    text: data.text.trim(),
    rating: data.rating,
    date: new Date().toISOString().split('T')[0],
  };

  item.comments.unshift(newComment);
  const totalScore = item.rating * item.ratingCount + data.rating;
  item.ratingCount += 1;
  item.rating = Number((totalScore / item.ratingCount).toFixed(1));
  saveLocalLevels(local);

  return { level: item, comment: newComment };
}

export async function getStats(): Promise<Stats> {
  try {
    const res = await fetch('/api/stats');
    if (res.ok) return await res.json();
  } catch {
    // ignore
  }

  const local = getLocalLevels();
  const genreCounts: Record<string, number> = {};
  local.forEach((l) => {
    genreCounts[l.genre] = (genreCounts[l.genre] || 0) + 1;
  });

  return {
    totalLevels: local.length,
    totalCopies: local.reduce((acc, c) => acc + c.copies, 0),
    totalLikes: local.reduce((acc, c) => acc + c.likes, 0),
    totalCreators: new Set(local.map((l) => l.creator.toLowerCase())).size,
    genreCounts,
  };
}

export async function getCreators(): Promise<CreatorStats[]> {
  try {
    const res = await fetch('/api/creators');
    if (res.ok) return await res.json();
  } catch {
    // ignore
  }

  const local = getLocalLevels();
  const map: Record<string, CreatorStats> = {};

  local.forEach((l) => {
    const key = l.creator.trim().toLowerCase();
    if (!map[key]) {
      map[key] = {
        creator: l.creator,
        levelCount: 0,
        totalLikes: 0,
        totalCopies: 0,
      };
    }
    map[key].levelCount += 1;
    map[key].totalLikes += l.likes;
    map[key].totalCopies += l.copies;
  });

  return Object.values(map)
    .sort((a, b) => b.totalLikes - a.totalLikes)
    .slice(0, 10);
}
