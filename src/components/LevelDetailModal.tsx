import React, { useState } from 'react';
import { X, Copy, Check, Star, Heart, User, Gamepad, HelpCircle, Send } from 'lucide-react';
import { Level } from '../services/api';
import { sfx } from '../utils/audio';
import { copyCode } from '../utils/clipboard';
import { Translations } from '../utils/i18n';

interface LevelDetailModalProps {
  level: Level;
  onClose: () => void;
  onLike: (id: string, delta: number) => void;
  onCopy: (id: string, code: string) => void;
  onAddComment: (id: string, data: { author: string; text: string; rating: number }) => Promise<void>;
  isCopied: boolean;
  isLiked: boolean;
  t: Translations;
}

export const LevelDetailModal: React.FC<LevelDetailModalProps> = ({
  level,
  onClose,
  onLike,
  onCopy,
  onAddComment,
  isCopied,
  isLiked,
  t,
}) => {
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = () => {
    sfx.copiar();
    onCopy(level.id, level.code);
  };

  const handleLike = () => {
    sfx.confirmar();
    const delta = isLiked ? -1 : 1;
    onLike(level.id, delta);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      await onAddComment(level.id, {
        author: commentAuthor.trim() || 'Jogador GBG',
        text: commentText.trim(),
        rating: commentRating,
      });
      sfx.confirmar();
      setCommentText('');
      setCommentAuthor('');
    } catch (err) {
      console.error(err);
      sfx.atras();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-[#0e0a3a] border-4 border-[#ffd21f] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-[#0e0a3a]/95 backdrop-blur-md px-6 py-4 border-b border-[#3d6bff]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider bg-[#3d6bff] text-white px-2.5 py-1 rounded-full shadow-sm">
              {level.genre}
            </span>
            <span className="text-xs font-bold text-[#b9b3ff] bg-[#1a1470] px-2.5 py-1 rounded-full border border-[#3d6bff]/30">
              {level.difficulty}
            </span>
            <span className="text-xs font-bold text-[#b9b3ff] bg-[#1a1470] px-2.5 py-1 rounded-full border border-[#3d6bff]/30">
              {level.players}
            </span>
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

        <div className="p-6 space-y-5">
          {/* Title and Creator */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#ffd21f] leading-tight m-0">
              {level.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-[#b9b3ff] font-semibold flex-wrap">
              <User className="w-4 h-4 text-[#ffd21f]" />
              <span>Criado por: <strong className="text-white">{level.creator}</strong></span>
              <span className="mx-1">·</span>
              <div className="flex items-center gap-1 text-[#ffd21f]">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-extrabold tabular-nums">{level.rating.toFixed(1)}</span>
                <span className="text-[#b9b3ff] text-xs">({level.ratingCount} avaliações)</span>
              </div>
            </div>
          </div>

          {/* Big Game ID Box */}
          <div className="bg-[#1a1470] border-3 border-[#3d6bff] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
            <div className="text-center sm:text-left">
              <div className="text-xs font-extrabold uppercase tracking-widest text-[#b9b3ff]">
                Game Builder Garage Code
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-black text-[#ffd21f] tracking-widest mt-1 select-all">
                {level.code}
              </div>
              <div className="text-xs text-[#b9b3ff] mt-1">
                {level.copies} cópias realizadas no servidor
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleCopy}
                className={`gbg-btn-ok flex-1 sm:flex-initial flex items-center justify-center gap-2 py-3 px-6 text-sm font-black transition-all cursor-pointer ${
                  isCopied ? 'bg-[#ffd21f] text-[#2a1f9e]' : ''
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>

              <button
                onClick={handleLike}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isLiked
                    ? 'bg-[#ffd21f] text-[#2a1f9e] border-[#ffd21f]'
                    : 'bg-[#0e0a3a] text-white border-[#3d6bff]/40 hover:bg-[#1f1580]'
                }`}
                title="Curtir jogo"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* How to Enter Guide */}
          <div className="bg-[#150f5c] border border-[#3d6bff]/40 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-extrabold text-[#ffd21f] text-sm">
              <HelpCircle className="w-4 h-4" />
              <span>{t.howToEnter}</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[#d8d3ff] leading-relaxed">
              <li>{t.howToStep1}</li>
              <li>{t.howToStep2}</li>
              <li>{t.howToStep3}</li>
            </ol>
          </div>

          {/* Description & Controls */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#b9b3ff] mb-1">
                {t.description}
              </h3>
              <p className="text-sm text-white leading-relaxed bg-[#1a1470] p-3.5 rounded-xl border border-[#3d6bff]/30">
                {level.description}
              </p>
            </div>

            {level.controls && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#b9b3ff] mb-1 flex items-center gap-1.5">
                  <Gamepad className="w-4 h-4 text-[#4be39a]" />
                  <span>{t.controls}</span>
                </h3>
                <p className="text-xs text-[#d8d3ff] font-semibold bg-[#1a1470] p-3 rounded-xl border border-[#3d6bff]/30">
                  {level.controls}
                </p>
              </div>
            )}

            {level.tags && level.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#b9b3ff] font-bold">Tags:</span>
                {level.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-bold text-[#ffd21f] bg-[#1a1470] px-2.5 py-0.5 rounded-full border border-[#3d6bff]/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="border-t border-white/10 pt-4 space-y-4">
            <h3 className="text-base font-extrabold text-[#ffd21f] flex items-center justify-between">
              <span>{t.reviews}</span>
              <span className="text-xs font-semibold text-[#b9b3ff]">
                {level.comments?.length || 0} comentários
              </span>
            </h3>

            {/* Submit Comment Form */}
            <form onSubmit={handleSubmitComment} className="bg-[#1a1470] border border-[#3d6bff]/30 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-extrabold text-[#ffd21f]">{t.writeReview}</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  placeholder={t.yourName}
                  maxLength={25}
                  className="bg-[#0e0a3a] border border-[#3d6bff]/40 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-[#7f77dc] outline-none focus:border-[#ffd21f]"
                />

                <div className="flex items-center gap-1 bg-[#0e0a3a] border border-[#3d6bff]/40 rounded-xl px-3 py-1.5">
                  <span className="text-xs font-bold text-[#b9b3ff] mr-2">Nota:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        sfx.tick();
                        setCommentRating(star);
                      }}
                      className="p-0.5 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= commentRating
                            ? 'text-[#ffd21f] fill-[#ffd21f]'
                            : 'text-[#44369e]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t.yourComment}
                rows={2}
                maxLength={200}
                className="w-full bg-[#0e0a3a] border border-[#3d6bff]/40 rounded-xl px-3 py-2 text-xs font-medium text-white placeholder-[#7f77dc] outline-none focus:border-[#ffd21f] resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="gbg-btn text-xs py-1.5 px-4 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Enviando...' : t.sendReview}</span>
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {level.comments && level.comments.length > 0 ? (
                level.comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[#150f5c] border border-[#3d6bff]/20 rounded-xl p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-[#ffd21f] font-extrabold">{c.author}</strong>
                      <div className="flex items-center gap-1 text-[#ffd21f]">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="font-bold">{c.rating}</span>
                        <span className="text-[#b9b3ff] text-[10px] ml-1">· {c.date}</span>
                      </div>
                    </div>
                    <p className="text-[#d8d3ff] m-0">{c.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#b9b3ff] text-center py-3 m-0">
                  Nenhum comentário ainda. Seja o primeiro a avaliar!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
