import React from 'react';
import { Heart, Check, Copy, Star } from 'lucide-react';
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
  sharedLabel: string;
}

const HUES = [355, 205, 130, 275, 25, 175, 320];

export const LevelCard: React.FC<LevelCardProps> = ({
  level,
  index,
  onSelect,
  onLike,
  onCopy,
  copiedId,
  liked,
  sharedLabel,
}) => {
  const isCopied = copiedId === level.id;
  const h = HUES[index % HUES.length];

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.copiar();
    onCopy(level.id, level.code);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.confirmar();
    const delta = liked ? -1 : 1;
    onLike(level.id, delta);
  };

  return (
    <div
      onClick={() => {
        sfx.confirmar();
        onSelect(level);
      }}
      onMouseEnter={() => sfx.hover()}
      className="gbg-card flex flex-col justify-between"
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
    >
      {/* Thumb 16/10 aspect ratio */}
      <div
        className="relative aspect-[16/10] grid place-items-center select-none overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${h} 80% 55%), hsl(${(h + 50) % 360} 80% 40%))`,
        }}
      >
        {/* Cute subtle blueprint grid lines in background */}
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] bg-[size:16px_16px]" />

        {/* Mascot Initial / Nodon Face */}
        <div className="text-4xl md:text-5xl font-black text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.3)]">
          {level.title.charAt(0).toUpperCase()}
        </div>

        {/* Top Badges (Genre & Like) */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider bg-black/40 text-white px-2 py-0.5 rounded-full border border-white/20">
            {level.genre}
          </span>
        </div>

        <button
          onClick={handleLikeClick}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-transform active:scale-90 cursor-pointer ${
            liked
              ? 'bg-[#ffd21f] text-[#2a1f9e]'
              : 'bg-black/35 text-white hover:text-[#ffd21f]'
          }`}
          title="Curtir nível"
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
        </button>

        {/* Bottom Badge 'compartilhado / GBG' and Rating */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] font-bold text-white bg-black/30 px-1.5 py-0.5 rounded">
          <Star className="w-3 h-3 text-[#ffd21f] fill-[#ffd21f]" />
          <span>{level.rating.toFixed(1)}</span>
        </div>

        <em className="absolute right-2 bottom-2 not-italic text-[11px] font-extrabold bg-white/90 text-[#2a1f9e] px-2 py-0.5 rounded-full shadow-sm">
          {sharedLabel}
        </em>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="m-0 text-base font-extrabold text-[#ffd21f] truncate leading-tight">
            {level.title}
          </h3>
          <p className="m-0 text-xs text-[#b9b3ff] mt-0.5 truncate font-semibold">
            {level.creator || 'Sem criador'}
          </p>
        </div>

        {/* Game ID & Copy Button */}
        <div className="flex justify-between items-center gap-2 mt-3 pt-2 border-t border-white/10">
          <code className="text-xs font-bold font-mono bg-[#0e0a3a] text-white px-2 py-1 rounded-lg border border-[#3d6bff]/30 select-all tracking-wider">
            {level.code}
          </code>

          <button
            onClick={handleCopyClick}
            className={`gbg-btn-ok flex items-center gap-1 font-extrabold text-xs py-1 px-3 cursor-pointer ${
              isCopied ? 'bg-[#ffd21f] text-[#2a1f9e]' : ''
            }`}
            title="Copiar código do jogo"
          >
            {isCopied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
