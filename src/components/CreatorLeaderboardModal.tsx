import React from 'react';
import { X, Trophy, Heart, Gamepad2, Copy } from 'lucide-react';
import { CreatorStats } from '../services/api';
import { sfx } from '../utils/audio';
import { Translations } from '../utils/i18n';

interface CreatorLeaderboardModalProps {
  creators: CreatorStats[];
  onClose: () => void;
  onSelectCreator: (creatorName: string) => void;
  t: Translations;
}

export const CreatorLeaderboardModal: React.FC<CreatorLeaderboardModalProps> = ({
  creators,
  onClose,
  onSelectCreator,
  t,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-[#171052] border-3 border-[#ffd21f] rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto text-white shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#171052]/95 backdrop-blur-md px-6 py-4 border-b border-[#2d2087] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#ffd21f]" />
            <h2 className="text-xl font-black text-white">{t.creatorHall}</h2>
          </div>

          <button
            onClick={() => {
              sfx.atras();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-[#aba5f5] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* List of creators */}
        <div className="p-6 space-y-3">
          <p className="text-xs text-[#aba5f5]">
            Clique em qualquer criador para filtrar e ver todas as suas criações:
          </p>

          <div className="space-y-2">
            {creators.map((c, i) => {
              const rankColor =
                i === 0
                  ? 'bg-[#ffd21f] text-[#160e54]'
                  : i === 1
                  ? 'bg-slate-300 text-[#160e54]'
                  : i === 2
                  ? 'bg-amber-700 text-white'
                  : 'bg-[#221768] text-[#aba5f5]';

              return (
                <div
                  key={c.creator}
                  onClick={() => {
                    sfx.confirmar();
                    onSelectCreator(c.creator);
                    onClose();
                  }}
                  className="bg-[#1a125a] hover:bg-[#251b75] border border-[#2e218b] hover:border-[#ffd21f] rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${rankColor}`}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{c.creator}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-[#aba5f5] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Gamepad2 className="w-3 h-3 text-[#3d6bff]" />
                          {c.levelCount} jogos
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-[#ffd21f] fill-current" />
                          {c.totalLikes} curtidas
                        </span>
                        <span className="flex items-center gap-1">
                          <Copy className="w-3 h-3 text-[#4be39a]" />
                          {c.totalCopies} cópias
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#ffd21f] hover:underline">
                    Ver jogos &rarr;
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
