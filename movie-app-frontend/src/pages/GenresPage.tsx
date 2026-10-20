import { useEffect, useState } from 'react';
import { Loader2, Plus, Tags, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { genreService } from '../services/genreService';
import { getApiErrorMessage } from '../services/api';
import type { Genre } from '../types';
import GenreModal from '../components/GenreModal';
import ActionPopup, { type PopupType } from '../components/ActionPopup';

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInput, setPageInput] = useState("1");
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(genres.length / pageSize));
  const visibleGenres = genres.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);

  type PopupState = {
    type: PopupType;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm?: () => void | Promise<void>;
  };
  const [popup, setPopup] = useState<PopupState | null>(null);

  useEffect(() => { fetchGenres(); }, []);

  const fetchGenres = async () => {
    try { 
      setLoading(true); 
      setGenres(await genreService.getAll());
      setCurrentPage(0);
      setPageInput("1"); 
    } catch (err) { 
      console.error(err);
      setPopup({
        type: 'error',
        title: 'Không thể tải danh sách thể loại',
        message: getApiErrorMessage(err, 'Không thể kết nối tới máy chủ. Vui lòng thử lại.'),
      });
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = (id: number) => {
    const genre = genres.find(item => item.id === id);
    setPopup({
      type: 'confirm',
      title: 'Xác nhận xóa thể loại',
      message: `Xóa \"${genre?.name || 'thể loại này'}\" có thể ảnh hưởng đến các phim đang sử dụng thể loại. Bạn chắc chắn muốn tiếp tục?`,
      confirmText: 'Xóa thể loại',
      onConfirm: async () => {
        try {
          await genreService.delete(id);
          const nextGenres = genres.filter(g => g.id !== id);
          const nextTotalPages = Math.max(1, Math.ceil(nextGenres.length / pageSize));
          const nextPage = Math.min(currentPage, nextTotalPages - 1);
          setGenres(nextGenres);
          setCurrentPage(nextPage);
          setPageInput(String(nextPage + 1));
          setPopup(null);
        } catch (err) {
          setPopup({
            type: 'error',
            title: 'Không thể xóa thể loại',
            message: getApiErrorMessage(err, 'Đã xảy ra lỗi khi xóa thể loại.'),
          });
        }
      },
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Tags className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          Quản lý Thể loại
        </h1>
        <button onClick={() => { setEditingGenre(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          <Plus className="w-5 h-5" /> Thêm thể loại
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleGenres.map(genre => (
            <div key={genre.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
              <span className="font-medium text-gray-900 dark:text-white truncate pr-2">
                {genre.name}
              </span>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => { setEditingGenre(genre); setIsModalOpen(true); }} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(genre.id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {genres.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              Chưa có thể loại nào.
            </div>
          )}
        </div>
      )}

      {!loading && genres.length > 0 && (
        <div className="flex flex-wrap justify-center items-center gap-3 mt-8">
          <button
            disabled={currentPage === 0}
            onClick={() => { const page = Math.max(0, currentPage - 1); setCurrentPage(page); setPageInput(String(page + 1)); }}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
            aria-label="Trang trước"
          >
            <ChevronLeft className="w-5 h-5 dark:text-white" />
          </button>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Trang</span>
          <input
            aria-label="Đi đến trang thể loại"
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={() => {
              const requested = Number(pageInput);
              const page = Math.max(1, Math.min(Number.isFinite(requested) && pageInput.trim() !== '' ? Math.trunc(requested) : 1, totalPages));
              setPageInput(String(page));
              setCurrentPage(page - 1);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-20 text-center outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <span className="text-gray-700 dark:text-gray-300 font-medium">/ {totalPages}</span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => { const page = Math.min(totalPages - 1, currentPage + 1); setCurrentPage(page); setPageInput(String(page + 1)); }}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
            aria-label="Trang tiếp"
          >
            <ChevronRight className="w-5 h-5 dark:text-white" />
          </button>
        </div>
      )}
      
      <GenreModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchGenres} initialData={editingGenre} />

      <ActionPopup
        isOpen={!!popup}
        type={popup?.type}
        title={popup?.title ?? ''}
        message={popup?.message ?? ''}
        confirmText={popup?.confirmText}
        onConfirm={popup?.onConfirm}
        onClose={() => setPopup(null)}
      />
    </div>
  );
}