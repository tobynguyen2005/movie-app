import { useState, useEffect } from 'react';
import { X, Loader2, Search } from 'lucide-react';
import type { Movie, MovieStatus, Actor, Genre } from '../types';
import { movieService } from '../services/movieService';
import { actorService } from '../services/actorService';
import { genreService } from '../services/genreService';

interface MovieModalProps { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void; 
  initialData: Movie | null; 
}

const defaultFormData = { 
  title: '', 
  releaseYear: new Date().getFullYear(), 
  totalEpisodes: 1, 
  country: '', 
  posterUrl: '', 
  description: '', 
  status: 'PLAN_TO_WATCH' as MovieStatus, 
  actorIds: [] as number[], 
  genreIds: [] as number[] 
};

export default function MovieModal({ isOpen, onClose, onSuccess, initialData }: MovieModalProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableActors, setAvailableActors] = useState<Actor[]>([]);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  
  // State phục vụ tìm kiếm tên diễn viên trực tiếp trong modal
  const [actorSearchKeyword, setActorSearchKeyword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActorSearchKeyword(''); 
      // Truyền size lớn (ví dụ size: 1000) để đảm bảo lấy hết toàn bộ diễn viên trong DB, không bị giới hạn ở trang đầu
      Promise.all([actorService.getAll({ size: 1000 }), genreService.getAll()])
        .then(([actorsData, genresData]) => {
          const actorsList = Array.isArray(actorsData) 
            ? actorsData 
            : (actorsData as any)?.content || [];
          setAvailableActors(actorsList);

          const genresList = Array.isArray(genresData) 
            ? genresData 
            : (genresData as any)?.content || [];
          setAvailableGenres(genresList);
        })
        .catch(err => {
          console.error("Lỗi tải dữ liệu cho modal:", err);
          setAvailableActors([]);
          setAvailableGenres([]);
        });

      if (initialData) {
        setFormData({
          title: initialData.title, 
          releaseYear: initialData.releaseYear,
          totalEpisodes: initialData.totalEpisodes, 
          country: initialData.country || '', 
          posterUrl: initialData.posterUrl || '',
          description: initialData.description || '', 
          status: initialData.status,
          actorIds: initialData.actors?.map(a => a.id) || [],
          genreIds: initialData.genres?.map(g => g.id) || [],
        });
      } else { 
        setFormData(defaultFormData); 
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'releaseYear' || name === 'totalEpisodes' ? Number(value) : value 
    }));
  };

  const handleActorToggle = (actorId: number) => {
    setFormData(prev => ({
      ...prev,
      actorIds: prev.actorIds.includes(actorId) 
        ? prev.actorIds.filter(id => id !== actorId) 
        : [...prev.actorIds, actorId]
    }));
  };

  const handleGenreToggle = (genreId: number) => {
    setFormData(prev => ({
      ...prev,
      genreIds: prev.genreIds.includes(genreId) 
        ? prev.genreIds.filter(id => id !== genreId) 
        : [...prev.genreIds, genreId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (initialData) {
        await movieService.update(initialData.id, formData);
      } else {
        await movieService.create(formData);
      }
      onSuccess(); 
      onClose();
    } catch (error) { 
      alert('Đã xảy ra lỗi khi lưu phim!'); 
      console.error(error);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // Lọc danh sách diễn viên theo từ khóa gõ vào ô tìm kiếm
  const filteredActors = availableActors.filter(actor => 
    actor.fullName.toLowerCase().includes(actorSearchKeyword.toLowerCase())
  );

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-colors duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Chỉnh sửa Phim' : 'Thêm Phim Mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="movie-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2">
              <label className={labelClass}>Tiêu đề phim *</label>
              <input required type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} />
            </div>
            
            {/* Thể loại (Genres) dạng Chips */}
            <div className="md:col-span-2">
              <label className={labelClass}>Thể loại</label>
              <div className="flex flex-wrap gap-2">
                {(!availableGenres || availableGenres.length === 0) ? (
                  <span className="text-sm text-gray-500">Chưa có dữ liệu thể loại</span>
                ) : (
                  availableGenres.map(genre => {
                    const isSelected = formData.genreIds.includes(genre.id);
                    return (
                      <label key={genre.id} className={`px-3 py-1.5 rounded-full border text-sm font-medium cursor-pointer transition-colors ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                        <input type="checkbox" className="hidden" checked={isSelected} onChange={() => handleGenreToggle(genre.id)} />
                        {genre.name}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>Trạng thái</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                <option value="PLAN_TO_WATCH">Dự định xem</option>
                <option value="WATCHING">Đang xem</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="DROPPED">Đã hủy</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Năm phát hành</label>
              <input required type="number" min="1900" name="releaseYear" value={formData.releaseYear} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Tổng số tập</label>
              <input required type="number" min="1" name="totalEpisodes" value={formData.totalEpisodes} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Quốc gia</label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} className={inputClass} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Link Poster (URL)</label>
              <input type="url" name="posterUrl" value={formData.posterUrl} onChange={handleChange} className={inputClass} />
            </div>
            
            {/* Diễn viên tham gia có ô tìm kiếm trực tiếp */}
            <div className="md:col-span-2">
              <label className={labelClass}>Diễn viên tham gia</label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 flex flex-col gap-3">
                
                {/* Ô input gõ tìm kiếm diễn viên */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    value={actorSearchKeyword} 
                    onChange={(e) => setActorSearchKeyword(e.target.value)} 
                    placeholder="Gõ tên diễn viên để tìm nhanh..." 
                    className={`${inputClass} pl-9 py-2 text-xs`}
                  />
                </div>

                {/* Danh sách diễn viên sau khi lọc */}
                <div className="max-h-40 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(!filteredActors || filteredActors.length === 0) ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 col-span-2 text-center py-2">Không tìm thấy diễn viên phù hợp.</p>
                  ) : (
                    filteredActors.map(actor => (
                      <label key={actor.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-500 transition-colors">
                        <input type="checkbox" checked={formData.actorIds.includes(actor.id)} onChange={() => handleActorToggle(actor.id)} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500" />
                        <div className="flex items-center gap-2">
                          {actor.avatarUrl ? (
                            <img src={actor.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                              {actor.fullName.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{actor.fullName}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Mô tả nội dung</label>
              <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className={`${inputClass} resize-none`}></textarea>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-800">
            Hủy
          </button>
          <button type="submit" form="movie-form" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} 
            {initialData ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>

      </div>
    </div>
  );
}