import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'levels.json');

app.use(express.json());

interface Comment {
  id: string;
  author: string;
  text: string;
  rating: number;
  date: string;
}

interface Level {
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

let levels: Level[] = [];

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      levels = JSON.parse(raw);
    } else {
      levels = [];
    }
  } catch (err) {
    console.error('Error loading levels data:', err);
    levels = [];
  }
}

function saveData() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(levels, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving levels data:', err);
  }
}

loadData();

// Format GBG game ID (e.g. "G0034WGNHV" -> "G 003 4WG NHV")
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

// GET /api/levels - List levels with search & filters
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

  // Sorting
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

// GET /api/levels/:id - Single level
app.get('/api/levels/:id', (req: Request, res: Response) => {
  const level = levels.find((l) => l.id === req.params.id);
  if (!level) {
    res.status(404).json({ error: 'Nível não encontrado' });
    return;
  }
  res.json(level);
});

// GET /api/random - Pick a random level
app.get('/api/random', (_req: Request, res: Response) => {
  if (levels.length === 0) {
    res.status(404).json({ error: 'Nenhum nível cadastrado' });
    return;
  }
  const idx = Math.floor(Math.random() * levels.length);
  res.json(levels[idx]);
});

// POST /api/levels - Submit a new level
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
    description: description?.trim() || 'Criado e compartilhado pela comunidade Game Builder Garage!',
    controls: controls?.trim() || 'Padrão Game Builder Garage (Analógico + Botões)',
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

// POST /api/levels/:id/like - Like a level
app.post('/api/levels/:id/like', (req: Request, res: Response) => {
  const level = levels.find((l) => l.id === req.params.id);
  if (!level) {
    res.status(404).json({ error: 'Nível não encontrado' });
    return;
  }

  const { delta } = req.body; // +1 or -1
  const change = typeof delta === 'number' ? delta : 1;
  level.likes = Math.max(0, level.likes + change);
  saveData();

  res.json({ id: level.id, likes: level.likes });
});

// POST /api/levels/:id/copy - Record a copy event
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

// POST /api/levels/:id/comments - Add review / comment
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

  // Recalculate average rating
  const totalScore = level.rating * level.ratingCount + userRating;
  level.ratingCount += 1;
  level.rating = Number((totalScore / level.ratingCount).toFixed(1));

  saveData();
  res.status(201).json({ level, comment: newComment });
});

// GET /api/stats - Global statistics
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

// GET /api/creators - Creators leaderboard
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

// ----------------- VITE INTEGRATION ----------------- //
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In dev: mount Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In prod: serve built static files
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GBG Next Level Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
