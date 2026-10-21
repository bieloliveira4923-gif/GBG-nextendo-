import React, { useState } from 'react';
import { Heart, Copy, Check, Star, User, ChevronRight } from 'lucide-react';
import { Level } from '../services/api';
import { sfx } from '../utils/audio';

interface LevelCardProps {
  level: Level;
  index: number;
  onSelect: (level: Level) => void;
  onLike: (id: string, delta: number) => void;
  onCopy: (id: string, code: string) => void;
  copiedId: string | null;
  liked: boolean;
}

const HUES = [
  'from-pink-600 to-purple-800',
  'from-blue-600 to-indigo-900',
  'from-emerald-500 to-teal-800',
  'from-amber-500 to-orange-700',
  'from-violet-600 to-purple-900',
  'from-cyan-500 to-blue-800',
  'from-rose-500 to-red-800',
];

export const LevelCard: React.FC<LevelCardProps> = ({
  level,
  index,
  onSelect,
  onLike,
  onCopy,
  copiedId,
  liked,
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const isCopied = copiedId === level.id;
  const gradient = HUES[index % HUES.length];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.copiar();
    onCopy(level.id, level.code);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    sfx.tick();
    const delta = liked ? -1 : 1;
    onLike(level.id, delta);
    setTimeout(() => setIsLiking(false), 300);
  };

  return (
    <div
      onClick={() => {
        sfx.confirmar();
        onSelect(level);
      }}
      onMouseEnter={() => sfx.hover()}
      className="group bg-[#1a135a] hover:bg-[#201868] border-2 border-[#2b207e] hover:border-[#ffd21f] rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-1"
    >
      {/* Top Banner / Nodon visual representation */}
      <div className={`relative h-28 bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between overflow-hidden select-none`}>
        {/* Subtle grid texture overlay */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider bg-black/40 backdrop-blur-sm text-white px-2 py-0.5 rounded-md border border-white/20">
            {level.genre}
          </span>
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`p-1.5 rounded-full transition-transform active:scale-90 cursor-pointer ${
              liked
                ? 'bg-[#ffd21f] text-[#160e54]'
                : 'bg-black/40 text-white hover:text-[#ffd21f]'
            }`}
            title="Curtir este nível"
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center Initial Character Mascot */}
        <div className="relative z-10 self-center text-4xl font-black text-white/90 drop-shadow-md">
          {level.title.charAt(0).toUpperCase()}
        </div>

        {/* Rating and Difficulty */}
        <div className="relative z-10 flex items-center justify-between text-xs font-bold text-white/90">
          <div className="flex items-center gap-1 bg-black/30 px-1.5 py-0.5 rounded">
            <Star className="w-3 h-3 text-[#ffd21f] fill-[#ffd21f]" />
            <span className="tabular-nums">{level.rating.toFixed(1)}</span>
          </div>
          <span className="bg-black/30 px-1.5 py-0.5 rounded text-[11px]">
            {level.difficulty}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-white group-hover:text-[#ffd21f] transition-colors line-clamp-1">
            {level.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-[#aba5f5] mt-1 font-semibold">
            <User className="w-3.5 h-3.5 text-[#3d6bff]" />
            <span className="truncate">{level.creator || 'Criador Anônimo'}</span>
          </div>

          <p className="text-xs text-[#d1ceff] mt-2 line-clamp-2 leading-relaxed">
            {level.description}
          </p>
        </div>

        {/* Game ID & Copy Bar */}
        <div className="pt-2 border-t border-[#291e70] flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#aba5f5] uppercase tracking-wide">Game ID</span>
            <code className="text-xs font-mono font-bold text-[#ffd21f] bg-[#120c42] px-2 py-0.5 rounded border border-[#2e218b] tracking-wider select-all">
              {level.code}
            </code>
          </div>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
              isCopied
                ? 'bg-[#4be39a] text-[#06331f]'
                : 'gbg-btn-green'
            }`}
            title="Copiar Game ID para a área de transferência"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
