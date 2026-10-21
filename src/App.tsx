import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { LevelCard } from './components/LevelCard';
import { LevelDetailModal } from './components/LevelDetailModal';
import { AddLevelModal } from './components/AddLevelModal';
import { CreatorLeaderboardModal } from './components/CreatorLeaderboardModal';
import { Toast } from './components/Toast';
import {
  Level,
  Stats,
  CreatorStats,
  getLevels,
  getStats,
  getCreators,
  likeLevel,
  recordCopy,
  createLevel,
  addComment,
  getRandomLevel,
} from './services/api';
import { LANGUAGES, LanguageKey } from './utils/i18n';
import { sfx, getSoundEnabled } from './utils/audio';
import { copyCode } from './utils/clipboard';
import { Search, X, Sparkles, Trophy, Radio, ArrowUpDown, SlidersHorizontal } from 'lucide-react';

const GENRES = [
  'Todos',
  'Ação',
  'Aventura',
  'Plataforma',
  'Puzzle',
  'Terror',
  'Tiro',
  'Ritmo',
  'Corrida',
  'Arcade',
  'Casual',
  'Minigame',
];

export default function App() {
  const [currentLang, setCurrentLang] = useState<LanguageKey>('pt');
  const [isSoundOn, setIsSoundOn] = useState(true);

  // Data states
  const [levels, setLevels] = useState<Level[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [creators, setCreators] = useState<CreatorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Todas');
  const [selectedSort, setSelectedSort] = useState('popular');

  // Modals & UI states
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreatorsModalOpen, setIsCreatorsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // Initialize lang and sound preference
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('gbg_lang') as LanguageKey;
      if (savedLang && LANGUAGES[savedLang]) {
        setCurrentLang(savedLang);
      }
      const savedLikes = localStorage.getItem('gbg_likes');
      if (savedLikes) {
        setLikedMap(JSON.parse(savedLikes));
      }
    } catch {
      // ignore
    }
    setIsSoundOn(getSoundEnabled());
  }, []);

  const t = LANGUAGES[currentLang] || LANGUAGES.pt;

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 2400);
  }, []);

  // Fetch levels from server
  const loadLevels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLevels({
        q: search,
        genre: selectedGenre,
        difficulty: selectedDifficulty,
        sort: selectedSort,
      });
      setLevels(data.levels);
    } catch (err: unknown) {
      console.error(err);
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedGenre, selectedDifficulty, selectedSort]);

  // Fetch stats & creators
  const loadServerMeta = useCallback(async () => {
    try {
      const [statsData, creatorsData] = await Promise.all([getStats(), getCreators()]);
      setStats(statsData);
      setCreators(creatorsData);
    } catch (err) {
      console.error('Error loading server stats:', err);
    }
  }, []);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  useEffect(() => {
    loadServerMeta();
  }, [loadServerMeta]);

  // Handle Language Change
  const handleLanguageChange = (lang: LanguageKey) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem('gbg_lang', lang);
    } catch {
      // ignore
    }
  };

  // Safe Copy Game ID
  const handleCopy = async (id: string, code: string) => {
    sfx.copiar();
    await copyCode(code);
    setCopiedId(id);
    showToast(`${t.copied}${code}`);

    try {
      const updated = await recordCopy(id);
      setLevels((prev) =>
        prev.map((lvl) => (lvl.id === id ? { ...lvl, copies: updated.copies } : lvl))
      );
      if (selectedLevel?.id === id) {
        setSelectedLevel((prev) => (prev ? { ...prev, copies: updated.copies } : null));
      }
      loadServerMeta();
    } catch {
      // ignore server counter error
    }

    setTimeout(() => {
      setCopiedId((cur) => (cur === id ? null : cur));
    }, 2000);
  };

  // Toggle Like
  const handleLike = async (id: string, delta: number) => {
    try {
      const updated = await likeLevel(id, delta);
      const nextLiked = delta > 0;

      const newMap = { ...likedMap, [id]: nextLiked };
      setLikedMap(newMap);
      try {
        localStorage.setItem('gbg_likes', JSON.stringify(newMap));
      } catch {
        // ignore
      }

      setLevels((prev) =>
        prev.map((lvl) => (lvl.id === id ? { ...lvl, likes: updated.likes } : lvl))
      );

      if (selectedLevel?.id === id) {
        setSelectedLevel((prev) => (prev ? { ...prev, likes: updated.likes } : null));
      }

      loadServerMeta();
    } catch (err) {
      console.error(err);
    }
  };

  // Add New Level
  const handleAddLevel = async (levelData: {
    title: string;
    creator: string;
    code: string;
    genre: string;
    difficulty: string;
    players: string;
    description: string;
    controls: string;
    tags: string[];
  }) => {
    const created = await createLevel(levelData);
    setLevels((prev) => [created, ...prev]);
    showToast(t.saved2);
    loadServerMeta();
  };

  // Add Comment/Review
  const handleAddComment = async (
    id: string,
    commentData: { author: string; text: string; rating: number }
  ) => {
    const res = await addComment(id, commentData);
    setLevels((prev) => prev.map((lvl) => (lvl.id === id ? res.level : lvl)));
    setSelectedLevel(res.level);
    showToast('Avaliação enviada com sucesso!');
  };

  // Surprise Me / Random
  const handleSurpriseMe = async () => {
    try {
      sfx.confirmar();
      const random = await getRandomLevel();
      setSelectedLevel(random);
    } catch (err) {
      console.error(err);
      showToast('Nenhum nível disponível no momento', 'error');
    }
  };

  // Creator selection
  const handleSelectCreator = (creatorName: string) => {
    setSearch(creatorName);
    setSelectedGenre('Todos');
    setSelectedDifficulty('Todas');
  };

  return (
    <div className="max-w-[1100px] mx-auto px-3.5 py-4 min-h-screen flex flex-col justify-between">
      <div>
        {/* Authentic Game Builder Garage Header */}
        <Header
          currentLang={currentLang}
          onLanguageChange={handleLanguageChange}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenCreatorsModal={() => setIsCreatorsModalOpen(true)}
          onSurpriseMe={handleSurpriseMe}
          t={t}
          isSoundOn={isSoundOn}
          setIsSoundOn={setIsSoundOn}
        />

        {/* Authentic 2-Column Game Builder Garage Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[170px_1fr] gap-4 items-start">
          {/* Side Panel */}
          <aside className="flex flex-row md:flex-col gap-3 justify-between md:justify-start items-center md:items-stretch">
            {/* The Famous Circular Yellow Button */}
            <button
              onClick={() => {
                sfx.confirmar();
                setIsAddModalOpen(true);
              }}
              className="gbg-new-btn shrink-0"
              title={t.add2}
            >
              <span>
                <b>+</b>
                <span dangerouslySetInnerHTML={{ __html: t.add }} />
              </span>
            </button>

            {/* Level Counter Box */}
            <div className="bg-[#0e0a3a] border-2 border-[#3d6bff]/40 rounded-2xl p-3.5 text-[#b9b3ff] text-xs font-bold w-full shadow-md">
              <span className="block text-[11px] uppercase tracking-wider">{t.saved}</span>
              <strong className="block text-white text-2xl font-black mt-0.5 tabular-nums">
                {stats?.totalLevels ?? levels.length}
              </strong>

              <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Cópias:</span>
                  <span className="text-[#4be39a] font-extrabold">{stats?.totalCopies ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Criadores:</span>
                  <span className="text-[#ffd21f] font-extrabold">{stats?.totalCreators ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions in Side Panel */}
            <div className="hidden md:flex flex-col gap-2 w-full">
              <button
                onClick={handleSurpriseMe}
                className="gbg-btn-ghost text-xs py-2 px-3 text-center flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#ffd21f]" />
                <span>{t.random}</span>
              </button>

              <button
                onClick={() => {
                  sfx.tick();
                  setIsCreatorsModalOpen(true);
                }}
                className="gbg-btn-ghost text-xs py-2 px-3 text-center flex items-center justify-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-[#ffd21f]" />
                <span>{t.creatorHall}</span>
              </button>

              <div className="bg-[#0e0a3a]/80 border border-[#3d6bff]/20 rounded-xl p-2 text-[10px] text-[#4be39a] font-bold flex items-center gap-1.5 justify-center">
                <Radio className="w-3 h-3 text-[#4be39a] animate-pulse" />
                <span>{t.serverOnline}</span>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="bg-[#0e0a3a] rounded-3xl p-4 sm:p-5 border-3 border-[#3d6bff]/40 shadow-2xl min-h-[460px] flex flex-col justify-between">
            <div>
              {/* Giant Rounded Search Input */}
              <div className="relative mb-3">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    sfx.tick();
                    setSearch(e.target.value);
                  }}
                  placeholder={t.ph}
                  autoComplete="off"
                  className="w-full bg-[#1a1470] border-3 border-[#ffd21f] text-white placeholder-[#b9b3ff] rounded-full px-5 py-2.5 text-base sm:text-lg font-extrabold outline-none focus:ring-4 focus:ring-[#ffd21f]/30 transition-all shadow-inner"
                />
                {search && (
                  <button
                    onClick={() => {
                      sfx.atras();
                      setSearch('');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b9b3ff] hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Filter controls row */}
              <div className="flex items-center justify-between gap-2 flex-wrap mb-4 text-xs">
                {/* Genre chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {GENRES.slice(0, 7).map((g) => {
                    const active = selectedGenre.toLowerCase() === g.toLowerCase();
                    return (
                      <button
                        key={g}
                        onClick={() => {
                          sfx.tick();
                          setSelectedGenre(g);
                        }}
                        className={`px-3 py-1 rounded-full font-extrabold whitespace-nowrap cursor-pointer transition-all ${
                          active
                            ? 'bg-[#ffd21f] text-[#2a1f9e] shadow-sm'
                            : 'bg-[#1a1470] text-[#b9b3ff] hover:text-white border border-[#3d6bff]/30'
                        }`}
                      >
                        {g === 'Todos' ? t.allGenres : g}
                      </button>
                    );
                  })}
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-1.5 bg-[#1a1470] border border-[#3d6bff]/30 rounded-full px-3 py-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#ffd21f]" />
                  <select
                    value={selectedSort}
                    onChange={(e) => {
                      sfx.tick();
                      setSelectedSort(e.target.value);
                    }}
                    className="bg-transparent font-extrabold text-[#b9b3ff] focus:text-white outline-none cursor-pointer text-xs"
                  >
                    <option value="popular" className="bg-[#1a1470] text-white">{t.sortPopular}</option>
                    <option value="copies" className="bg-[#1a1470] text-white">{t.sortCopies}</option>
                    <option value="newest" className="bg-[#1a1470] text-white">{t.sortNewest}</option>
                    <option value="rating" className="bg-[#1a1470] text-white">{t.sortRating}</option>
                    <option value="az" className="bg-[#1a1470] text-white">{t.sortAz}</option>
                  </select>
                </div>
              </div>

              {/* Levels Grid */}
              {loading && levels.length === 0 ? (
                <div className="py-20 text-center text-[#b9b3ff] font-extrabold text-base">
                  Carregando níveis...
                </div>
              ) : levels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
                  {levels.map((level, idx) => (
                    <LevelCard
                      key={level.id}
                      level={level}
                      index={idx}
                      onSelect={(lvl) => setSelectedLevel(lvl)}
                      onLike={handleLike}
                      onCopy={handleCopy}
                      copiedId={copiedId}
                      liked={Boolean(likedMap[level.id])}
                      sharedLabel={t.shared}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-[#b9b3ff] font-bold space-y-3">
                  <div className="text-4xl">🎮</div>
                  <div dangerouslySetInnerHTML={{ __html: t.empty }} />
                  <button
                    onClick={() => {
                      sfx.confirmar();
                      setIsAddModalOpen(true);
                    }}
                    className="gbg-btn text-xs mt-2"
                  >
                    {t.addGame}
                  </button>
                </div>
              )}
            </div>

            {/* Bottom hint text */}
            <p className="text-xs text-[#b9b3ff] mt-4 pt-3 border-t border-white/10 m-0">
              {t.hint}
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-[#b9b3ff] py-4 mt-6">
        {t.credit}
      </footer>

      {/* Modals & Dialogs */}
      {selectedLevel && (
        <LevelDetailModal
          level={selectedLevel}
          onClose={() => setSelectedLevel(null)}
          onLike={handleLike}
          onCopy={handleCopy}
          onAddComment={handleAddComment}
          isCopied={copiedId === selectedLevel.id}
          isLiked={Boolean(likedMap[selectedLevel.id])}
          t={t}
        />
      )}

      {isAddModalOpen && (
        <AddLevelModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddLevel}
          t={t}
        />
      )}

      {isCreatorsModalOpen && (
        <CreatorLeaderboardModal
          creators={creators}
          onClose={() => setIsCreatorsModalOpen(false)}
          onSelectCreator={handleSelectCreator}
          t={t}
        />
      )}

      {/* Floating Toast Notification */}
      <Toast message={toast?.message ?? null} type={toast?.type ?? 'success'} />
    </div>
  );
}
