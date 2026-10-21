import React from 'react';
import { Volume2, VolumeX, Sparkles, PlusCircle, Globe, Users } from 'lucide-react';
import { sfx, setSoundEnabled, getSoundEnabled } from '../utils/audio';
import { LANGUAGES, LanguageKey, Translations } from '../utils/i18n';

interface HeaderProps {
  currentLang: LanguageKey;
  onLanguageChange: (lang: LanguageKey) => void;
  onOpenAddModal: () => void;
  onOpenCreatorsModal: () => void;
  onSurpriseMe: () => void;
  t: Translations;
  isSoundOn: boolean;
  setIsSoundOn: (on: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onOpenAddModal,
  onOpenCreatorsModal,
  onSurpriseMe,
  t,
  isSoundOn,
  setIsSoundOn,
}) => {
  const toggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      sfx.confirmar();
    }
  };

  return (
    <header className="border-b border-[#322588] bg-[#140c4a]/95 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ffd21f] text-[#160e54] flex items-center justify-center font-extrabold text-2xl shadow-md border-2 border-white/20 select-none">
            ★
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                {t.title}
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-[#3d6bff] text-white px-2 py-0.5 rounded-full border border-white/20">
                Switch
              </span>
            </div>
            <p className="text-xs text-[#aba5f5] hidden sm:block">
              {t.credit}
            </p>
          </div>
        </div>

        {/* Actions Zone */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Creator Hall */}
          <button
            onClick={() => {
              sfx.tick();
              onOpenCreatorsModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#221768] hover:bg-[#2e208b] text-xs font-bold text-[#e1deff] transition-colors border border-[#3b2d99]"
            title={t.creatorHall}
          >
            <Users className="w-3.5 h-3.5 text-[#ffd21f]" />
            <span className="hidden md:inline">{t.creatorHall}</span>
          </button>

          {/* Surprise Me / Random */}
          <button
            onClick={() => {
              sfx.tick();
              onSurpriseMe();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2e208b] hover:bg-[#3d2db8] text-xs font-bold text-[#ffd21f] transition-colors border border-[#ffd21f]/40"
            title={t.random}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.random}</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-[#1c135e] border border-[#37289c] rounded-xl px-2 py-1">
            <Globe className="w-3.5 h-3.5 text-[#aba5f5]" />
            <select
              value={currentLang}
              onChange={(e) => {
                sfx.tick();
                onLanguageChange(e.target.value as LanguageKey);
              }}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              aria-label="Language"
            >
              {(Object.keys(LANGUAGES) as LanguageKey[]).map((key) => (
                <option key={key} value={key} className="bg-[#1c135e] text-white">
                  {LANGUAGES[key].name}
                </option>
              ))}
            </select>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              isSoundOn
                ? 'bg-[#221768] border-[#3b2d99] text-[#4be39a]'
                : 'bg-[#18114f] border-[#291e70] text-[#aba5f5]'
            }`}
            title={`${t.snd}: ${isSoundOn ? t.on : t.off}`}
          >
            {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden lg:inline">{isSoundOn ? t.on : t.off}</span>
          </button>

          {/* Add Game Button */}
          <button
            onClick={() => {
              sfx.confirmar();
              onOpenAddModal();
            }}
            className="gbg-btn-yellow flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-extrabold cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.addGame}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
