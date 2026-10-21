import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { FilterBar } from './components/FilterBar';
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
import { Sparkles, RefreshCw } from 'lucide-react';

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
    }, 2800);
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

  // Copy Game ID to clipboard
  const handleCopy = async (id: string, code: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback for older browsers
        const el = document.createElement('textarea');
        el.value = code;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }

      setCopiedId(id);
      showToast(`${t.copied}${code}`);

      // Notify server to increment copy count
      const updated = await recordCopy(id);
      setLevels((prev) =>
        prev.map((lvl) => (lvl.id === id ? { ...lvl, copies: updated.copies } : lvl))
      );
      if (selectedLevel?.id === id) {
        setSelectedLevel((prev) => (prev ? { ...prev, copies: updated.copies } : null));
      }
      loadServerMeta();

      setTimeout(() => {
        setCopiedId((cur) => (cur === id ? null : cur));
      }, 2500);
    } catch (err) {
      console.error(err);
      showToast('Erro ao copiar código', 'error');
    }
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
      showToast('Erro ao atualizar curtida', 'error');
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
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        {/* Main Header */}
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

        {/* Global Server Stats Strip */}
        <StatsBar stats={stats} t={t} loading={loading && !stats} />

        {/* Search, Filter & Sort Controls */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={setSelectedDifficulty}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          t={t}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
          {/* Active filter summary if searching */}
          {(search || selectedGenre !== 'Todos' || selectedDifficulty !== 'Todas') && (
            <div className="flex items-center justify-between pb-3 text-xs text-[#aba5f5] font-semibold">
              <span>
                Mostrando {levels.length} de {stats?.totalLevels ?? levels.length} níveis
                {search && <> para &quot;<strong className="text-white">{search}</strong>&quot;</>}
              </span>
              <button
                onClick={() => {
                  sfx.atras();
                  setSearch('');
                  setSelectedGenre('Todos');
                  setSelectedDifficulty('Todas');
                }}
                className="text-[#ffd21f] hover:underline cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && levels.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-[#aba5f5] space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#ffd21f]" />
              <p className="font-bold">Carregando níveis do servidor...</p>
            </div>
          )}

          {/* Error State */}
          {error && levels.length === 0 && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 text-center text-white space-y-3 my-8">
              <p className="font-bold">{error}</p>
              <button
                onClick={() => loadLevels()}
                className="gbg-btn-yellow px-4 py-2 rounded-xl text-xs font-black cursor-pointer inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tentar novamente
              </button>
            </div>
          )}

          {/* Levels Grid */}
          {!loading && levels.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                />
              ))}
            </div>
          )}

          {/* Empty Search Result */}
          {!loading && levels.length === 0 && !error && (
            <div className="bg-[#171052] border-2 border-dashed border-[#342698] rounded-3xl p-12 text-center my-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#ffd21f]/10 border border-[#ffd21f]/30 mx-auto flex items-center justify-center text-3xl">
                🎮
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-extrabold text-white mb-2">
                  Nenhum nível encontrado
                </h3>
                <p className="text-sm text-[#aba5f5] leading-relaxed">
                  Não encontramos nenhum jogo correspondente aos filtros selecionados. Que tal publicar um jogo novo?
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    sfx.confirmar();
                    setIsAddModalOpen(true);
                  }}
                  className="gbg-btn-yellow px-5 py-2.5 rounded-xl text-sm font-black cursor-pointer inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {t.addGame}
                </button>
                <button
                  onClick={() => {
                    sfx.atras();
                    setSearch('');
                    setSelectedGenre('Todos');
                    setSelectedDifficulty('Todas');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#aba5f5] hover:text-white bg-[#221868] border border-[#342698] cursor-pointer"
                >
                  Ver todos os níveis
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#291e70] bg-[#0f0838] py-6 px-4 mt-12 text-center text-xs text-[#aba5f5] space-y-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-semibold">
          <div>
            GBG Next Level Hub · Game Builder Garage™ Nintendo Switch Community
          </div>
          <div className="flex items-center gap-4 text-white">
            <button
              onClick={() => {
                sfx.tick();
                setIsCreatorsModalOpen(true);
              }}
              className="hover:text-[#ffd21f] transition-colors cursor-pointer"
            >
              {t.creatorHall}
            </button>
            <span>·</span>
            <button
              onClick={handleSurpriseMe}
              className="hover:text-[#ffd21f] transition-colors cursor-pointer"
            >
              {t.random}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
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
