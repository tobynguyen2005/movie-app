import { useEffect, useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import {
  AlertCircle,
  Film,
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import type { MovieTier, MovieTierEntry, TierListMovieOption } from '../types';
import { tierListService, type TierListOrderItem } from '../services/tierListService';
import { getApiErrorMessage } from '../services/api';

const TIERS: Array<{
  value: MovieTier;
  title: string;
  description: string;
  color: string;
  text: string;
  border: string;
  background: string;
}> = [
  { value: 'S', title: 'Masterpiece', description: 'Đỉnh cao', color: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800', background: 'bg-amber-50/70 dark:bg-amber-950/20' },
  { value: 'A', title: 'Excellent', description: 'Xuất sắc', color: 'bg-emerald-600', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800', background: 'bg-emerald-50/70 dark:bg-emerald-950/20' },
  { value: 'B', title: 'Very Good', description: 'Rất tốt', color: 'bg-sky-600', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-800', background: 'bg-sky-50/70 dark:bg-sky-950/20' },
  { value: 'C', title: 'Average', description: 'Trung bình', color: 'bg-violet-600', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-800', background: 'bg-violet-50/70 dark:bg-violet-950/20' },
  { value: 'D', title: 'Below Average', description: 'Dưới trung bình', color: 'bg-orange-600', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-800', background: 'bg-orange-50/70 dark:bg-orange-950/20' },
  { value: 'E', title: 'Poor', description: 'Không khuyến khích', color: 'bg-rose-600', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-800', background: 'bg-rose-50/70 dark:bg-rose-950/20' },
];

function groupEntries(items: MovieTierEntry[]) {
  const groups: Record<MovieTier, MovieTierEntry[]> = {
    S: [], A: [], B: [], C: [], D: [], E: [],
  };
  items.forEach((item) => groups[item.tier].push(item));
  TIERS.forEach(({ value }) => groups[value].sort((a, b) => a.position - b.position));
  return groups;
}

function flattenGroups(groups: Record<MovieTier, MovieTierEntry[]>) {
  return TIERS.flatMap(({ value }) =>
    groups[value].map((entry, index) => ({ ...entry, tier: value, position: index })),
  );
}

export default function TierListPage() {
  const [entries, setEntries] = useState<MovieTierEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draggedEntryId, setDraggedEntryId] = useState<number | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [availableMovies, setAvailableMovies] = useState<TierListMovieOption[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [movieSearch, setMovieSearch] = useState('');
  const [modalError, setModalError] = useState('');
  const [selectedTier, setSelectedTier] = useState<MovieTier>('B');
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);

  const groupedEntries = useMemo(() => groupEntries(entries), [entries]);
  const completedCount = entries.length;
  const filteredAvailableMovies = useMemo(() => {
    const keyword = movieSearch.trim().toLocaleLowerCase();
    if (!keyword) return availableMovies;
    return availableMovies.filter((movie) =>
      movie.title.toLocaleLowerCase().includes(keyword)
      || (movie.country ?? '').toLocaleLowerCase().includes(keyword)
      || String(movie.releaseYear ?? '').includes(keyword),
    );
  }, [availableMovies, movieSearch]);

  const loadTierList = async () => {
    setLoading(true);
    setError('');
    try {
      setEntries(await tierListService.getAll());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải Tier List.'));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    void loadTierList();
  }, []);

  const persistOrder = async (nextEntries: MovieTierEntry[]) => {
    const previousEntries = entries;
    const ordered = flattenGroups(groupEntries(nextEntries));
    const payload: TierListOrderItem[] = ordered.map(({ id, tier, position }) => ({ id, tier, position }));

    setEntries(ordered);
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const saved = await tierListService.reorder(payload);
      setEntries(saved);
      setNotice('Đã lưu thứ hạng Tier List.');
    } catch (requestError) {
      setEntries(previousEntries);
      setError(getApiErrorMessage(requestError, 'Không thể lưu thứ hạng. Vui lòng thử lại.'));
    } finally {
      setSaving(false);
    }
  };

  const moveEntry = (targetTier: MovieTier, targetEntryId?: number) => {
    if (draggedEntryId === null || saving) return;

    const groups = groupEntries(entries);
    const sourceTier = TIERS.find(({ value }) => groups[value].some((entry) => entry.id === draggedEntryId))?.value;
    if (!sourceTier) return;

    const sourceIndex = groups[sourceTier].findIndex((entry) => entry.id === draggedEntryId);
    const [movingEntry] = groups[sourceTier].splice(sourceIndex, 1);
    if (!movingEntry) return;

    movingEntry.tier = targetTier;
    if (targetEntryId !== undefined) {
      const targetIndex = groups[targetTier].findIndex((entry) => entry.id === targetEntryId);
      groups[targetTier].splice(targetIndex < 0 ? groups[targetTier].length : targetIndex, 0, movingEntry);
    } else {
      groups[targetTier].push(movingEntry);
    }

    void persistOrder(flattenGroups(groups));
    setDraggedEntryId(null);
  };

  const handleDropOnTier = (event: DragEvent<HTMLElement>, tier: MovieTier) => {
    event.preventDefault();
    moveEntry(tier);
  };

  const handleDropOnMovie = (event: DragEvent<HTMLElement>, tier: MovieTier, entryId: number) => {
    event.preventDefault();
    event.stopPropagation();
    if (draggedEntryId !== entryId) moveEntry(tier, entryId);
    else setDraggedEntryId(null);
  };

  const openAddModal = async () => {
    setIsAddOpen(true);
    setMovieSearch('');
    setModalError('');
    setLoadingAvailable(true);
    setError('');
    try {
      setAvailableMovies(await tierListService.getAvailableMovies());
    } catch (requestError) {
      setModalError(getApiErrorMessage(requestError, 'Không thể tải danh sách phim đã xem.'));
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleAddMovie = async (movie: TierListMovieOption) => {
    setAddingMovieId(movie.id);
    setError('');
    setModalError('');
    setNotice('');
    try {
      const created = await tierListService.add(movie.id, selectedTier);
      setEntries((current) => flattenGroups({
        ...groupEntries(current),
        [selectedTier]: [...groupEntries(current)[selectedTier], created],
      }));
      setAvailableMovies((current) => current.filter((item) => item.id !== movie.id));
      setNotice(`Đã thêm "${movie.title}" vào tier ${selectedTier}.`);
    } catch (requestError) {
      setModalError(getApiErrorMessage(requestError, 'Không thể thêm phim vào Tier List.'));
    } finally {
      setAddingMovieId(null);
    }
  };

  const handleRemoveMovie = async (entry: MovieTierEntry) => {
    if (saving) return;
    setError('');
    setNotice('');
    try {
      await tierListService.remove(entry.id);
      setEntries((current) => flattenGroups({
        ...groupEntries(current),
        [entry.tier]: groupEntries(current)[entry.tier].filter((item) => item.id !== entry.id),
      }));
      setNotice(`Đã gỡ "${entry.title}" khỏi Tier List.`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể gỡ phim khỏi Tier List.'));
    }
  };

  const handleReset = async () => {
    if (entries.length === 0 || saving) return;
    const confirmed = window.confirm('Bạn có chắc muốn xóa toàn bộ thứ hạng Tier List? Các phim vẫn được giữ nguyên trong thư viện.');
    if (!confirmed) return;

    setSaving(true);
    setError('');
    setNotice('');
    try {
      await tierListService.clear();
      setEntries([]);
      setNotice('Đã đặt lại Tier List. Các phim vẫn được giữ nguyên trong thư viện.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể đặt lại Tier List.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Movie Tier List</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Bảng xếp hạng phim do quản trị viên quản lý</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
            Chỉ những phim có trạng thái <b className="text-emerald-600 dark:text-emerald-400">Đã hoàn thành</b> mới được đưa vào bảng. Kéo thả phim để thay đổi tier hoặc thứ tự.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadTierList()}
            disabled={loading || saving}
            className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-sm font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tải lại'}
          </button>
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={entries.length === 0 || saving || loading}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 bg-white dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold"
          >
            <RotateCcw className="w-4 h-4" /> Đặt lại
          </button>
          <button
            type="button"
            onClick={() => void openAddModal()}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Thêm phim đã xem
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Phim đã xếp hạng</p>
          <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{completedCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Số tier</p>
          <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">6</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Trạng thái lưu</p>
          <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : 'Đồng bộ database'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="whitespace-pre-line flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Đóng thông báo lỗi"><X className="w-4 h-4" /></button>
        </div>
      )}
      {notice && !error && (
        <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">Đang tải Tier List...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {TIERS.map((tier) => {
            const tierMovies = groupedEntries[tier.value];
            return (
              <section
                key={tier.value}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDropOnTier(event, tier.value)}
                className={`rounded-xl border ${tier.border} ${tier.background} overflow-hidden transition-colors`}
              >
                <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-black/5 dark:border-white/5">
                  <div className={`w-11 h-11 shrink-0 rounded-lg ${tier.color} flex items-center justify-center text-white text-2xl font-black shadow-sm`}>
                    {tier.value}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className={`font-bold ${tier.text}`}>{tier.title}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tier.description} · {tierMovies.length} phim</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:block">Thả phim vào đây</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedTier(tier.value); void openAddModal(); }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-900/50 ${tier.text} hover:bg-white dark:hover:bg-gray-900 border ${tier.border} text-xs font-bold shrink-0`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                </div>

                <div className="p-3 min-h-28 flex flex-wrap items-start gap-3">
                  {tierMovies.length === 0 ? (
                    <div className="w-full min-h-20 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500 border border-dashed border-gray-300/80 dark:border-gray-600 rounded-lg">
                      Chưa có phim — kéo phim vào đây hoặc nhấn “Thêm”.
                    </div>
                  ) : tierMovies.map((entry) => (
                    <div
                      key={entry.id}
                      draggable={!saving}
                      onDragStart={() => setDraggedEntryId(entry.id)}
                      onDragEnd={() => setDraggedEntryId(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleDropOnMovie(event, tier.value, entry.id)}
                      className={`group relative w-[112px] sm:w-[124px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-sm cursor-grab active:cursor-grabbing transition-all ${draggedEntryId === entry.id ? 'opacity-40 scale-95' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
                    >
                      <div className="absolute top-2 left-2 z-10 rounded bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-3 h-3" />
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRemoveMovie(entry)}
                        disabled={saving}
                        aria-label={`Gỡ ${entry.title} khỏi Tier List`}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-black/65 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-rose-600 transition-all disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="aspect-[2/3] w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {entry.posterUrl ? (
                          <img src={entry.posterUrl} alt={`Poster ${entry.title}`} loading="lazy" className="w-full h-full object-contain bg-gray-950" />
                        ) : (
                          <Film className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <p className="mt-2 text-xs font-bold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2 min-h-8" title={entry.title}>{entry.title}</p>
                      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{entry.releaseYear ?? 'Chưa rõ năm'}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsAddOpen(false); }}>
          <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thêm phim vào Tier List</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chỉ hiển thị phim có trạng thái “Đã hoàn thành” và chưa được xếp hạng.</p>
              </div>
              <button type="button" onClick={() => setIsAddOpen(false)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Đóng"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 border-b border-gray-200 dark:border-gray-700 space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200" htmlFor="target-tier">Xếp vào tier</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    id={tier.value === selectedTier ? 'target-tier' : undefined}
                    type="button"
                    onClick={() => setSelectedTier(tier.value)}
                    className={`rounded-lg border px-2 py-2 text-sm font-bold transition-all ${selectedTier === tier.value ? `${tier.color} border-transparent text-white shadow-sm` : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    {tier.value} <span className="text-[10px] font-medium opacity-80">{tier.description}</span>
                  </button>
                ))}
              </div>
              {modalError && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="whitespace-pre-line">{modalError}</span>
                </div>
              )}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input value={movieSearch} onChange={(event) => setMovieSearch(event.target.value)} placeholder="Tìm theo tên phim, quốc gia hoặc năm..." className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {loadingAvailable ? (
                <div className="py-12 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /> Đang tải phim...</div>
              ) : filteredAvailableMovies.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <Film className="w-9 h-9 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold">Không có phim phù hợp</p>
                  <p className="text-sm mt-1">Hãy kiểm tra trạng thái phim hoặc từ khóa tìm kiếm.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableMovies.map((movie) => (
                    <div key={movie.id} className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="w-12 h-[68px] shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {movie.posterUrl ? <img src={movie.posterUrl} alt={`Poster ${movie.title}`} className="w-full h-full object-contain bg-gray-950" /> : <Film className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{movie.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{movie.releaseYear ?? 'Chưa rõ năm'}{movie.country ? ` · ${movie.country}` : ''}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Đã hoàn thành</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAddMovie(movie)}
                        disabled={addingMovieId !== null}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50 shrink-0"
                      >
                        {addingMovieId === movie.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Thêm
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{availableMovies.length} phim còn có thể xếp hạng</span>
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
