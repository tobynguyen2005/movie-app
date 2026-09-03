import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Genre } from '../types';
import { genreService } from '../services/genreService';

interface GenreModalProps { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void; 
  initialData: Genre | null; 
}

export default function GenreModal({ isOpen, onClose, onSuccess, initialData }: GenreModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData ? initialData.name : '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (initialData) await genreService.update(initialData.id, { name });
      else await genreService.create({ name });
      onSuccess(); 
      onClose();
    } catch (error) { 
      alert('Lỗi khi lưu thể loại!'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md flex flex-col transition-colors duration-300">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Chỉnh sửa Thể loại' : 'Thêm Thể loại'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <form id="genre-form" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên thể loại *
            </label>
            <input 
              required 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className={inputClass} 
              placeholder="VD: Hành động, Viễn tưởng..."
            />
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-800">
            Hủy
          </button>
          <button type="submit" form="genre-form" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} 
            {initialData ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  );
}