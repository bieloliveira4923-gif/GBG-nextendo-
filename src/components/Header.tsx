import React from 'react';
import { Sparkles, Trophy, Users } from 'lucide-react';
import { sfx, setSoundEnabled } from '../utils/audio';
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
    <header className="flex items-center justify-between gap-3 flex-wrap mb-4 select-none">
      {/* Title with yellow circle star icon */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#ffd21f] text-[#2a1f9e] grid place-items-center text-2xl font-black shadow-md border-2 border-white/20">
          ★
        </div>
        <div>
          <h1 className="m-0 text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{t.title}</span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider bg-[#ffd21f] text-[#2a1f9e] px-2 py-0.5 rounded-full shadow-sm">
              Nintendo Switch
            </span>
          </h1>
        </div>
      </div>

      {/* Action buttons & controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Creator Hall */}
        <button
          onClick={() => {
            sfx.tick();
            onOpenCreatorsModal();
          }}
          className="gbg-btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
          title={t.creatorHall}
        >
          <Trophy className="w-3.5 h-3.5 text-[#ffd21f]" />
          <span className="hidden sm:inline">{t.creatorHall}</span>
        </button>

        {/* Surprise Me / Random */}
        <button
          onClick={() => {
            sfx.tick();
            onSurpriseMe();
          }}
          className="gbg-btn text-xs py-1.5 px-3 flex items-center gap-1.5"
          title={t.random}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.random}</span>
        </button>

        {/* Language select */}
        <select
          value={currentLang}
          onChange={(e) => {
            sfx.tick();
            onLanguageChange(e.target.value as LanguageKey);
          }}
          className="font-extrabold rounded-full border-2 border-[#b9b3ff] bg-[#1a1470] text-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#ffd21f] cursor-pointer"
          aria-label="Language"
        >
          {(Object.keys(LANGUAGES) as LanguageKey[]).map((key) => (
            <option key={key} value={key} className="bg-[#1a1470] text-white">
              {LANGUAGES[key].name}
            </option>
          ))}
        </select>

        {/* Sound toggle button */}
        <button
          onClick={toggleSound}
          className={`gbg-btn-ghost text-xs py-1.5 px-3 transition-colors ${
            isSoundOn ? 'border-[#ffd21f] text-[#ffd21f]' : 'text-[#b9b3ff]'
          }`}
          aria-pressed={isSoundOn}
          title={`${t.snd}: ${isSoundOn ? t.on : t.off}`}
        >
          {t.snd}: {isSoundOn ? t.on : t.off}
        </button>
      </div>
    </header>
  );
};
