import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { INITIAL_LEVELS, Level, Comment } from './data/initialLevels';

const app = express();
app.use(express.json());

// Choose writable path for persistence: on Vercel serverless, use /tmp; otherwise data/
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel
  ? '/tmp'
  : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'levels.json');

let levels: Level[] = [];

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        levels = parsed;
        return;
      }
    }
  } catch (err) {
    console.warn('Could not read from levels file, using initial data:', err);
  }
  levels = [...INITIAL_LEVELS];
}

function saveData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(levels, null, 2), 'utf-8');
  } catch (err) {
    // On serverless or read-only filesystem, warning instead of crash
    console.warn('Persistence save warning (kept in-memory):', err);
  }
}

// Initial load
loadData();

function formatGbgCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean.startsWith('G')) {
    const withG = 'G' + clean;
    return formatGbgCode(withG);
  }
  const parts = [clean.slice(0, 1), clean.slice(1, 4), clean.slice(4, 7), clean.slice(7, 10)].filter(Boolean);
  return parts.join(' ');
}

// ----------------- API ROUTES ----------------- //

// GET /api/levels
app.get('/api/levels', (req: Request, res: Response) => {
  const { q, genre, difficulty, sort } = req.query;
  let results = [...levels];

  if (typeof q === 'string' && q.trim()) {
    const query = q.trim().toLowerCase();
    const cleanQuery = query.replace(/\s+/g, '');
    results = results.filter((lvl) => {
      const fullText = `${lvl.title} ${lvl.creator} ${lvl.code} ${lvl.description} ${lvl.tags.join(' ')}`.toLowerCase();
      const codeClean = lvl.code.replace(/\s+/g, '').toLowerCase();
      return fullText.includes(query) || codeClean.includes(cleanQuery);
    });
  }

  if (typeof genre === 'string' && genre && genre !== 'Todos' && genre !== 'All') {
    results = results.filter((lvl) => lvl.genre.toLowerCase() === genre.toLowerCase());
  }

  if (typeof difficulty === 'string' && difficulty && difficulty !== 'Todas' && difficulty !== 'All') {
    results = results.filter((lvl) => lvl.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  switch (sort) {
    case 'popular':
      results.sort((a, b) => b.likes - a.likes);
      break;
    case 'copies':
      results.sort((a, b) => b.copies - a.copies);
      break;
    case 'rating':
      results.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
      break;
    case 'az':
      results.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'newest':
    default:
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  res.json({
    total: results.length,
    levels: results,
  });
});

// GET /api/levels/:id
app.get('/api/levels/:id', (req: Request, res: Response) => {
  const level = levels.find((l) => l.id === req.params.id);
  if (!level) {
    res.status(404).json({ error: 'Nível não encontrado' });
    return;
  }
  res.json(level);
});

// GET /api/random
app.get('/api/random', (_req: Request, res: Response) => {
  if (levels.length === 0) {
    res.status(404).json({ error: 'Nenhum nível cadastrado' });
    return;
  }
  const idx = Math.floor(Math.random() * levels.length);
  res.json(levels[idx]);
});

// POST /api/levels
app.post('/api/levels', (req: Request, res: Response) => {
  const { title, creator, code, genre, difficulty, players, description, controls, tags } = req.body;

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'O nome do nível é obrigatório' });
    return;
  }

  if (!code || !code.trim()) {
    res.status(400).json({ error: 'O código do jogo (Game ID) é obrigatório' });
    return;
  }

  const formattedCode = formatGbgCode(code);
  const newLevel: Level = {
    id: `lvl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: title.trim(),
    creator: creator?.trim() || 'NodonCreator',
    code: formattedCode,
    genre: genre || 'Aventura',
    difficulty: difficulty || 'Médio',
    players: players || '1 Jogador',
    description: description?.trim() || 'Criado no Game Builder Garage!',
    controls: controls?.trim() || 'Analógico + Botões',
    likes: 1,
    copies: 0,
    rating: 5.0,
    ratingCount: 1,
    tags: Array.isArray(tags) && tags.length > 0 ? tags : [genre || 'Comunidade'],
    createdAt: new Date().toISOString(),
    comments: [],
  };

  levels.unshift(newLevel);
  saveData();

  res.status(201).json(newLevel);
});

// POST /api/levels/:id/like
app.post('/api/levels/:id/like', (req: Request, res: Response) => {
  const level = levels.find((l) => l.id === req.params.id);
  if (!level) {
    res.status(404).json({ error: 'Nível não encontrado' });
    return;
  }

  const { delta } = req.body;
  const change = typeof delta === 'number' ? delta : 1;
  level.likes = Math.max(0, level.likes + change);
  saveData();

  res.json({ id: level.id, likes: level.likes });
});

// POST /api/levels/:id/copy
app.post('/api/levels/:id/copy', (req: Request, res: Response) => {
  const level = levels.find((l) => l.id === req.params.id);
  if (!level) {
    res.status(404).json({ error: 'Nível não encontrado' });
    return;
  }

  level.copies += 1;
  saveData();

  res.json({ id: level.id, copies: level.copies });
});

// POST /api/levels/:id/comments
app.post('/api/levels/:id/comments', (req: Request, res: Response) => {
  const level = levels.find((l) => l.id === req.params.id);
  if (!level) {
    res.status(404).json({ error: 'Nível não encontrado' });
    return;
  }

  const { author, text, rating } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: 'O comentário não pode ficar vazio' });
    return;
  }

  const userRating = Math.max(1, Math.min(5, Number(rating) || 5));
  const newComment: Comment = {
    id: `c-${Date.now()}`,
    author: author?.trim() || 'Jogador GBG',
    text: text.trim(),
    rating: userRating,
    date: new Date().toISOString().split('T')[0],
  };

  level.comments.unshift(newComment);
  const totalScore = level.rating * level.ratingCount + userRating;
  level.ratingCount += 1;
  level.rating = Number((totalScore / level.ratingCount).toFixed(1));

  saveData();
  res.status(201).json({ level, comment: newComment });
});

// GET /api/stats
app.get('/api/stats', (_req: Request, res: Response) => {
  const totalLevels = levels.length;
  const totalCopies = levels.reduce((acc, cur) => acc + cur.copies, 0);
  const totalLikes = levels.reduce((acc, cur) => acc + cur.likes, 0);
  const creators = new Set(levels.map((l) => l.creator.toLowerCase())).size;

  const genreCounts: Record<string, number> = {};
  levels.forEach((l) => {
    genreCounts[l.genre] = (genreCounts[l.genre] || 0) + 1;
  });

  res.json({
    totalLevels,
    totalCopies,
    totalLikes,
    totalCreators: creators,
    genreCounts,
  });
});

// GET /api/creators
app.get('/api/creators', (_req: Request, res: Response) => {
  const map: Record<string, { creator: string; levelCount: number; totalLikes: number; totalCopies: number }> = {};

  levels.forEach((l) => {
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

  const list = Object.values(map).sort((a, b) => b.totalLikes - a.totalLikes);
  res.json(list.slice(0, 10));
});

export default app;
