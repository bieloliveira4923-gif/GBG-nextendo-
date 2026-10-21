import React, { useState } from 'react';
import { X, Plus, Gamepad, Sparkles } from 'lucide-react';
import { sfx } from '../utils/audio';
import { Translations } from '../utils/i18n';

interface AddLevelModalProps {
  onClose: () => void;
  onSave: (data: {
    title: string;
    creator: string;
    code: string;
    genre: string;
    difficulty: string;
    players: string;
    description: string;
    controls: string;
    tags: string[];
  }) => Promise<void>;
  t: Translations;
}

const GENRE_OPTIONS = [
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
  'Outro',
];

const DIFFICULTY_OPTIONS = ['Fácil', 'Médio', 'Difícil', 'Insano'];
const PLAYER_OPTIONS = ['1 Jogador', '1-2 Jogadores', '1-4 Jogadores'];

export const AddLevelModal: React.FC<AddLevelModalProps> = ({ onClose, onSave, t }) => {
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [code, setCode] = useState('G ');
  const [genre, setGenre] = useState('Aventura');
  const [difficulty, setDifficulty] = useState('Médio');
  const [players, setPlayers] = useState('1 Jogador');
  const [description, setDescription] = useState('');
  const [controls, setControls] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-format Game ID as user types: "G 003 4WG NHV"
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!raw.startsWith('G')) {
      raw = 'G' + raw;
    }
    const clean = raw.slice(0, 10);
    const parts = [
      clean.slice(0, 1),
      clean.slice(1, 4),
      clean.slice(4, 7),
      clean.slice(7, 10),
    ].filter(Boolean);

    setCode(parts.join(' '));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim() || code.trim() === 'G') {
      sfx.atras();
      setError(t.need);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const tags = tagsInput
        .split(',')
        .map((s) => s.trim().replace(/^#/, ''))
        .filter(Boolean);

      await onSave({
        title: title.trim(),
        creator: creator.trim() || 'NodonCreator',
        code: code.trim(),
        genre,
        difficulty,
        players,
        description: description.trim() || 'Criado no Game Builder Garage.',
        controls: controls.trim() || 'Analógico + Botões',
        tags: tags.length > 0 ? tags : [genre],
      });

      sfx.confirmar();
      onClose();
    } catch (err: unknown) {
      sfx.atras();
      setError(err instanceof Error ? err.message : 'Erro ao publicar nível');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-[#0e0a3a] border-4 border-[#ffd21f] rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto text-white shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0e0a3a]/95 backdrop-blur-md px-6 py-4 border-b border-[#3d6bff]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ffd21f] text-[#2a1f9e] grid place-items-center font-black text-xl shadow-sm">
              +
            </div>
            <h2 className="text-xl font-extrabold text-[#ffd21f] m-0">{t.add2}</h2>
          </div>

          <button
            onClick={() => {
              sfx.atras();
              onClose();
            }}
            className="p-1 rounded-full hover:bg-white/10 text-[#b9b3ff] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-xs font-bold px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-extrabold text-[#b9b3ff] mb-1">
              {t.nameLabel} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.namePlaceholder}
              maxLength={45}
              required
              className="w-full bg-[#1a1470] border-2 border-[#b9b3ff] focus:border-[#ffd21f] rounded-xl px-3.5 py-2 text-sm font-bold text-white placeholder-[#7f77dc] outline-none"
            />
          </div>

          {/* Creator & Game ID Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#b9b3ff] mb-1">
                {t.creator}
              </label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder={t.creatorPlaceholder}
                maxLength={30}
                className="w-full bg-[#1a1470] border-2 border-[#b9b3ff] focus:border-[#ffd21f] rounded-xl px-3.5 py-2 text-sm font-bold text-white placeholder-[#7f77dc] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#b9b3ff] mb-1">
                {t.gid} *
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder={t.gidPlaceholder}
                maxLength={14}
                required
                className="w-full bg-[#1a1470] border-2 border-[#ffd21f] focus:border-[#ffd21f] rounded-xl px-3.5 py-2 text-sm font-mono font-black text-[#ffd21f] placeholder-[#7f77dc] outline-none tracking-widest"
              />
            </div>
          </div>

          {/* Genre & Difficulty & Players */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-extrabold text-[#b9b3ff] mb-1">
                {t.genre}
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-[#1a1470] border-2 border-[#b9b3ff] focus:border-[#ffd21f] rounded-xl px-2 py-2 text-xs font-bold text-white outline-none cursor-pointer"
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g} className="bg-[#1a1470]">
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#b9b3ff] mb-1">
                {t.difficulty}
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-[#1a1470] border-2 border-[#b9b3ff] focus:border-[#ffd21f] rounded-xl px-2 py-2 text-xs font-bold text-white outline-none cursor-pointer"
              >
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d} className="bg-[#1a1470]">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#b9b3ff] mb-1">
                {t.players}
              </label>
              <select
                value={players}
                onChange={(e) => setPlayers(e.target.value)}
                className="w-full bg-[#1a1470] border-2 border-[#b9b3ff] focus:border-[#ffd21f] rounded-xl px-2 py-2 text-xs font-bold text-white outline-none cursor-pointer"
              >
                {PLAYER_OPTIONS.map((p) => (
                  <option key={p} value={p} className="bg-[#1a1470]">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-extrabold text-[#b9b3ff] mb-1">
              {t.description}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o objetivo do seu jogo, segredos, etc."
              rows={2}
              maxLength={250}
              className="w-full bg-[#1a1470] border-2 border-[#b9b3ff] focus:border-[#ffd21f] rounded-xl px-3.5 py-2 text-xs font-medium text-white placeholder-[#7f77dc] outline-none resize-none"
            />
          </div>

          {/* Controls */}
          <div>
            <label className="block text-xs font-extrabold text-[#b9b3ff] mb-1 flex items-center gap-1">
              <Gamepad className="w-3.5 h-3.5 text-[#4be39a]" />
              <span>{t.controls}</span>
            </label>
            <input
              type="text"
              value={controls}
              onChange={(e) => setControls(e.target.value)}
              placeholder="Ex: Analógico (Andar), Botão A (Pular), ZR (Atirar)"
              maxLength={80}
              className="w-full bg-[#1a1470] border-2 border-[#b9b3ff] focus:border-[#ffd21f] rounded-xl px-3.5 py-2 text-xs font-medium text-white placeholder-[#7f77dc] outline-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-extrabold text-[#b9b3ff] mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#ffd21f]" />
              <span>Tags (separadas por vírgula)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ex: Retro, Boss Fight, Parkour, Desafio"
              maxLength={60}
              className="w-full bg-[#1a1470] border-2 border-[#b9b3ff] focus:border-[#ffd21f] rounded-xl px-3.5 py-2 text-xs font-medium text-white placeholder-[#7f77dc] outline-none"
            />
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 border-t border-[#3d6bff]/30 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                sfx.atras();
                onClose();
              }}
              className="gbg-btn-ghost text-xs py-2 px-4"
            >
              {t.cancel}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="gbg-btn text-sm py-2 px-5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Publicando...' : t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
