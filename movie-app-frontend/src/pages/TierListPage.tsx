import { useEffect, useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { AlertCircle, Film, GripVertical, Loader2, Plus, RotateCcw, Search, Sparkles, Trash2, X } from 'lucide-react';
import type { MovieTierEntry, TierListMovieOption } from '../types';
import { tierListService, type TierListOrderItem } from '../services/tierListService';
import { getApiErrorMessage } from '../services/api';

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
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);

  const filteredAvailableMovies = useMemo(() => {
    const keyword = movieSearch.trim().toLocaleLowerCase();
    if (!keyword) return availableMovies;
    return availableMovies.filter((movie) => movie.title.toLocaleLowerCase().includes(keyword)
      || (movie.country ?? '').toLocaleLowerCase().includes(keyword)
      || String(movie.releaseYear ?? '').includes(keyword));
  }, [availableMovies, movieSearch]);

  const loadMasterpiece = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await tierListService.getAll();
      setEntries(result.filter((entry) => entry.tier === 'S').sort((a, b) => a.position - b.position));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách Masterpiece.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadMasterpiece(); }, []);

  const persistOrder = async (nextEntries: MovieTierEntry[]) => {
    const previousEntries = entries;
    const ordered = nextEntries.map((entry, index) => ({ ...entry, tier: 'S' as const, position: index }));
    const payload: TierListOrderItem[] = ordered.map(({ id, position }) => ({ id, tier: 'S', position }));
    setEntries(ordered);
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const saved = await tierListService.reorder(payload);
      setEntries(saved.filter((entry) => entry.tier === 'S').sort((a, b) => a.position - b.position));
      setNotice('Đã lưu thứ tự đề xuất.');
    } catch (requestError) {
      setEntries(previousEntries);
      setError(getApiErrorMessage(requestError, 'Không thể lưu thứ tự. Vui lòng thử lại.'));
    } finally {
      setSaving(false);
    }
  };

  const moveEntry = (targetEntryId?: number) => {
    if (draggedEntryId === null || saving) return;
    const next = [...entries];
    const sourceIndex = next.findIndex((entry) => entry.id === draggedEntryId);
    if (sourceIndex < 0) return;
    const [moving] = next.splice(sourceIndex, 1);
    const targetIndex = targetEntryId === undefined ? next.length : next.findIndex((entry) => entry.id === targetEntryId);
    next.splice(targetIndex < 0 ? next.length : targetIndex, 0, moving);
    setDraggedEntryId(null);
    if (next.some((entry, index) => entry.id !== entries[index]?.id)) void persistOrder(next);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, targetEntryId?: number) => {
    event.preventDefault();
    if (targetEntryId !== undefined && targetEntryId === draggedEntryId) {
      setDraggedEntryId(null);
      return;
    }
    moveEntry(targetEntryId);
  };

  const openAddModal = async () => {
    setIsAddOpen(true);
    setMovieSearch('');
    setModalError('');
    setLoadingAvailable(true);
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
    setModalError('');
    setError('');
    setNotice('');
    try {
      const created = await tierListService.add(movie.id, 'S');
      setEntries((current) => [...current, { ...created, tier: 'S', position: current.length }]);
      setAvailableMovies((current) => current.filter((item) => item.id !== movie.id));
      setNotice(`Đã thêm "${movie.title}" vào Masterpiece.`);
    } catch (requestError) {
      setModalError(getApiErrorMessage(requestError, 'Không thể thêm phim vào Masterpiece.'));
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
      setEntries((current) => current.filter((item) => item.id !== entry.id).map((item, index) => ({ ...item, position: index })));
      setNotice(`Đã gỡ "${entry.title}" khỏi Masterpiece. Phim vẫn được giữ trong thư viện.`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể gỡ phim khỏi Masterpiece.'));
    }
  };

  const handleReset = async () => {
    if (entries.length === 0 || saving) return;
    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ danh sách Masterpiece? Các phim vẫn được giữ nguyên trong thư viện.')) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await tierListService.clear();
      setEntries([]);
      setNotice('Đã làm trống Masterpiece. Các phim vẫn được giữ nguyên trong thư viện.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể làm trống Masterpiece.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Masterpiece</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Những bộ phim hay nhất tôi muốn đề xuất</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">Chỉ thêm những bộ phim bạn thực sự yêu thích. Đây là danh sách tuyển chọn cá nhân, không phải bảng xếp hạng tất cả phim đã xem.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void loadMasterpiece()} disabled={loading || saving} className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-sm font-semibold">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tải lại'}</button>
          <button type="button" onClick={() => void handleReset()} disabled={entries.length === 0 || saving || loading} className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 bg-white dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold"><RotateCcw className="w-4 h-4" /> Làm trống</button>
          <button type="button" onClick={() => void openAddModal()} disabled={loading || saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm disabled:opacity-50"><Plus className="w-4 h-4" /> Thêm phim yêu thích</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"><p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Masterpiece đã chọn</p><p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{entries.length}</p></div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"><p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Trạng thái lưu</p><p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : 'Đồng bộ database'}</p></div>
      </div>

      {error && <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span className="whitespace-pre-line flex-1">{error}</span><button type="button" onClick={() => setError('')} aria-label="Đóng thông báo lỗi"><X className="w-4 h-4" /></button></div>}
      {notice && !error && <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</div>}

      {loading ? <div className="py-24 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400"><Loader2 className="w-8 h-8 animate-spin mb-3" /><p className="text-sm">Đang tải Masterpiece...</p></div> : (
        <section onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event)} className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/20 dark:to-gray-900 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-amber-200/70 dark:border-amber-900/70">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white"><Sparkles className="w-7 h-7" /></div>
            <div className="min-w-0 flex-1"><h2 className="text-lg font-black text-amber-800 dark:text-amber-300">Masterpiece</h2><p className="text-xs text-gray-500 dark:text-gray-400">{entries.length} bộ phim được đề xuất · Kéo thả để sắp xếp thứ tự yêu thích</p></div>
          </div>
          <div className="p-4 sm:p-5 min-h-48 flex flex-wrap items-start gap-4">
            {entries.length === 0 ? <div className="w-full min-h-40 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 border border-dashed border-amber-300 dark:border-amber-800 rounded-xl p-6"><Film className="w-10 h-10 mb-3 text-amber-500/70" /><p className="font-semibold text-gray-700 dark:text-gray-200">Chưa có phim nào trong Masterpiece</p><p className="text-sm mt-1">Chỉ thêm những bộ phim thực sự xứng đáng được đề xuất.</p><button type="button" onClick={() => void openAddModal()} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold"><Plus className="w-4 h-4" /> Chọn phim yêu thích</button></div> : entries.map((entry, index) => (
              <div key={entry.id} draggable={!saving} onDragStart={() => setDraggedEntryId(entry.id)} onDragEnd={() => setDraggedEntryId(null)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, entry.id)} className={`group relative w-[132px] sm:w-[150px] rounded-xl border border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-sm cursor-grab active:cursor-grabbing transition-all ${draggedEntryId === entry.id ? 'opacity-40 scale-95' : 'hover:-translate-y-1 hover:shadow-lg'}`}>
                <div className="absolute top-3 left-3 z-10 rounded bg-black/65 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"><GripVertical className="w-3.5 h-3.5" /></div>
                <span className="absolute top-3 right-3 z-10 min-w-6 h-6 px-1 rounded-md bg-amber-500 text-white text-xs font-black flex items-center justify-center">{index + 1}</span>
                <button type="button" onClick={() => void handleRemoveMovie(entry)} disabled={saving} aria-label={`Gỡ ${entry.title} khỏi Masterpiece`} className="absolute top-11 right-3 z-10 p-1.5 rounded-md bg-black/65 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-rose-600 transition-all disabled:opacity-40"><Trash2 className="w-3.5 h-3.5" /></button>
                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">{entry.posterUrl ? <img src={entry.posterUrl} alt={`Poster ${entry.title}`} loading="lazy" className="w-full h-full object-contain bg-gray-950" /> : <Film className="w-8 h-8 text-gray-400" />}</div>
                <p className="mt-2 text-xs font-bold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2 min-h-8" title={entry.title}>{entry.title}</p><p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{entry.releaseYear ?? 'Chưa rõ năm'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {isAddOpen && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsAddOpen(false); }}>
        <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Chọn phim vào Masterpiece</h2><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chỉ hiển thị phim đã xem và chưa nằm trong danh sách đề xuất.</p></div><button type="button" onClick={() => setIsAddOpen(false)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Đóng"><X className="w-5 h-5" /></button></div>
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 space-y-3">{modalError && <div className="flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span className="whitespace-pre-line">{modalError}</span></div>}<div className="relative"><Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" /><input value={movieSearch} onChange={(event) => setMovieSearch(event.target.value)} placeholder="Tìm theo tên phim, quốc gia hoặc năm..." className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500" /></div></div>
          <div className="p-5 overflow-y-auto flex-1">{loadingAvailable ? <div className="py-12 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /> Đang tải phim...</div> : filteredAvailableMovies.length === 0 ? <div className="py-12 text-center text-gray-500 dark:text-gray-400"><Film className="w-9 h-9 mx-auto mb-3 opacity-40" /><p className="font-semibold">Không có phim phù hợp</p><p className="text-sm mt-1">Hãy kiểm tra trạng thái phim hoặc từ khóa tìm kiếm.</p></div> : <div className="space-y-2">{filteredAvailableMovies.map((movie) => <div key={movie.id} className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"><div className="w-12 h-[68px] shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">{movie.posterUrl ? <img src={movie.posterUrl} alt={`Poster ${movie.title}`} className="w-full h-full object-contain bg-gray-950" /> : <Film className="w-5 h-5 text-gray-400" />}</div><div className="min-w-0 flex-1"><p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{movie.title}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{movie.releaseYear ?? 'Chưa rõ năm'}{movie.country ? ` · ${movie.country}` : ''}</p><span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Đã xem</span></div><button type="button" onClick={() => void handleAddMovie(movie)} disabled={addingMovieId !== null} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold disabled:opacity-50 shrink-0">{addingMovieId === movie.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Thêm</button></div>)}</div>}</div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400"><span>{availableMovies.length} phim có thể chọn</span><button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600">Đóng</button></div>
        </div>
      </div>}
    </div>
  );
}
