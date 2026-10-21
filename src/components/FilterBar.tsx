import React from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { sfx } from '../utils/audio';
import { Translations } from '../utils/i18n';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (diff: string) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
  t: Translations;
}

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

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedSort,
  onSortChange,
  t,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3">
      {/* Search Input and Selectors */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#aba5f5]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              sfx.tick();
              onSearchChange(e.target.value);
            }}
            placeholder={t.ph}
            className="w-full bg-[#1b135e] border-2 border-[#ffd21f]/70 focus:border-[#ffd21f] text-white placeholder-[#aba5f5] rounded-2xl pl-11 pr-10 py-3 text-base font-bold outline-none shadow-inner transition-colors"
          />
          {search && (
            <button
              onClick={() => {
                sfx.atras();
                onSearchChange('');
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#aba5f5] hover:text-white"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 bg-[#1b135e] border border-[#2e218b] rounded-2xl px-3 py-2 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-[#ffd21f]" />
          <span className="text-xs font-bold text-[#aba5f5] hidden md:inline">{t.sort}:</span>
          <select
            value={selectedSort}
            onChange={(e) => {
              sfx.tick();
              onSortChange(e.target.value);
            }}
            className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="newest" className="bg-[#1b135e]">{t.sortNewest}</option>
            <option value="popular" className="bg-[#1b135e]">{t.sortPopular}</option>
            <option value="copies" className="bg-[#1b135e]">{t.sortCopies}</option>
            <option value="rating" className="bg-[#1b135e]">{t.sortRating}</option>
            <option value="az" className="bg-[#1b135e]">{t.sortAz}</option>
          </select>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-2 bg-[#1b135e] border border-[#2e218b] rounded-2xl px-3 py-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-[#4be39a]" />
          <span className="text-xs font-bold text-[#aba5f5] hidden md:inline">{t.difficulty}:</span>
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              sfx.tick();
              onDifficultyChange(e.target.value);
            }}
            className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="Todas" className="bg-[#1b135e]">{t.allDifficulties}</option>
            <option value="Fácil" className="bg-[#1b135e]">{t.easy}</option>
            <option value="Médio" className="bg-[#1b135e]">{t.medium}</option>
            <option value="Difícil" className="bg-[#1b135e]">{t.hard}</option>
            <option value="Insano" className="bg-[#1b135e]">{t.insane}</option>
          </select>
        </div>
      </div>

      {/* Genre Filter Scroll Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
        {GENRES.map((g) => {
          const isActive = selectedGenre.toLowerCase() === g.toLowerCase();
          return (
            <button
              key={g}
              onClick={() => {
                sfx.tick();
                onGenreChange(g);
              }}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#ffd21f] text-[#160e54] font-extrabold shadow-sm'
                  : 'bg-[#1b135e] text-[#aba5f5] hover:text-white hover:bg-[#251b75] border border-[#2c2084]'
              }`}
            >
              {g === 'Todos' ? t.allGenres : g}
            </button>
          );
        })}
      </div>
    </section>
  );
};
