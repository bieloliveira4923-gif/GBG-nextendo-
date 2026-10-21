import React from 'react';
import { Gamepad2, Copy, Users, Radio } from 'lucide-react';
import { Stats } from '../services/api';
import { Translations } from '../utils/i18n';

interface StatsBarProps {
  stats: Stats | null;
  t: Translations;
  loading: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, t, loading }) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Levels */}
        <div className="bg-[#1b135e] border border-[#2e218b] rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffd21f]/15 border border-[#ffd21f]/30 flex items-center justify-center shrink-0">
            <Gamepad2 className="w-5 h-5 text-[#ffd21f]" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
              {loading ? '...' : (stats?.totalLevels ?? 0)}
            </div>
            <div className="text-xs text-[#aba5f5] font-semibold">{t.saved}</div>
          </div>
        </div>

        {/* Total Copies */}
        <div className="bg-[#1b135e] border border-[#2e218b] rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4be39a]/15 border border-[#4be39a]/30 flex items-center justify-center shrink-0">
            <Copy className="w-5 h-5 text-[#4be39a]" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
              {loading ? '...' : (stats?.totalCopies ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-[#aba5f5] font-semibold">{t.totalCopies}</div>
          </div>
        </div>

        {/* Active Creators */}
        <div className="bg-[#1b135e] border border-[#2e218b] rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3d6bff]/15 border border-[#3d6bff]/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#3d6bff]" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
              {loading ? '...' : (stats?.totalCreators ?? 0)}
            </div>
            <div className="text-xs text-[#aba5f5] font-semibold">{t.activeCreators}</div>
          </div>
        </div>

        {/* Server Status */}
        <div className="bg-[#1b135e] border border-[#2e218b] rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4be39a]/15 border border-[#4be39a]/30 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-[#4be39a]" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-black text-[#4be39a] flex items-center gap-1.5">
              <span>{t.serverOnline}</span>
            </div>
            <div className="text-xs text-[#aba5f5] font-semibold">Port 3000 · REST API</div>
          </div>
        </div>
      </div>
    </section>
  );
};
