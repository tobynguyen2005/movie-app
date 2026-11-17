import { useEffect } from 'react';
import {
  X,
  Film,
  Calendar,
  Globe2,
  Clapperboard,
  Tags,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Movie, MovieStatus } from '../types';

interface MovieDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie | null;
  movies: Movie[];
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

const statusLabel: Record<MovieStatus, string> = {
  PLAN_TO_WATCH: 'Dự định xem',
  WATCHING: 'Đang xem',
  COMPLETED: 'Đã hoàn thành',
  DROPPED: 'Đã bỏ dở',
};

const statusColor: Record<MovieStatus, string> = {
  PLAN_TO_WATCH: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  WATCHING: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  DROPPED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function MovieDetailModal({
  isOpen,
  onClose,
  movie,
  movies,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: MovieDetailModalProps) {
  useEffect(() => {
    if (!isOpen || !movie) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if (isTyping) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (hasPrevious) onPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (hasNext) onNext();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, movie, hasPrevious, hasNext, onPrevious, onNext, onClose]);

  if (!isOpen || !movie) return null;

  const currentIndex = movies.findIndex((item) => item.id === movie.id);
  const positionText = currentIndex >= 0 ? `${currentIndex + 1} / ${movies.length}` : '';

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-gray-900/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900 z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row md:items-stretch">
          {/* Poster and navigation controls */}
          <div className="relative w-full md:w-[320px] aspect-[2/3] md:shrink-0 bg-gray-950 flex items-center justify-center overflow-hidden">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={`Poster phim ${movie.title}`}
                className="w-full h-full object-cover block"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-gray-300 dark:text-gray-500">
                {movie.title.charAt(0)}
              </div>
            )}

            <button
              type="button"
              onClick={onPrevious}
              disabled={!hasPrevious}
              aria-label="Phim trước"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/75 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/55"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              aria-label="Phim tiếp theo"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/75 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/55"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {positionText && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                {positionText}
              </div>
            )}
          </div>

          {/* Movie information */}
          <div className="p-6 md:p-7 flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 min-w-0">
                <Film className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <span>{movie.title}</span>
              </h2>
              <span className={`flex-shrink-0 inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColor[movie.status]}`}>
                {statusLabel[movie.status] ?? movie.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span>Năm phát hành: <b>{movie.releaseYear || 'N/A'}</b></span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Clapperboard className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span>Số tập: <b>{movie.totalEpisodes ?? 'N/A'}</b></span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Globe2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span>Quốc gia: <b>{movie.country || 'N/A'}</b></span>
              </div>
            </div>

            {movie.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Mô tả</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">{movie.description}</p>
              </div>
            )}

            {movie.genres?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Tags className="w-4 h-4 text-indigo-500" /> Thể loại
                </h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map(genre => (
                    <span key={genre.id} className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {movie.actors?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" /> Diễn viên
                </h3>
                <div className="flex flex-wrap gap-3">
                  {movie.actors.map(actor => (
                    <div key={actor.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-full pr-3 pl-1 py-1">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-200 flex-shrink-0">
                        {actor.avatarUrl ? (
                          <img src={actor.avatarUrl} alt={actor.fullName} className="w-full h-full object-cover" />
                        ) : (
                          actor.fullName.charAt(0)
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{actor.fullName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
