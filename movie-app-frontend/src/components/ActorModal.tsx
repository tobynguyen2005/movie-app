import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Actor, ActorGender } from '../types';
import { actorService } from '../services/actorService';

interface ActorModalProps { isOpen: boolean; onClose: () => void; onSuccess: () => void; initialData: Actor | null; }
const defaultFormData = { fullName: '', dob: '', country: '', gender: 'MALE' as ActorGender, avatarUrl: '', };

export default function ActorModal({ isOpen, onClose, onSuccess, initialData }: ActorModalProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ fullName: initialData.fullName, dob: initialData.dob || '', country: initialData.country || '', gender: initialData.gender, avatarUrl: initialData.avatarUrl || '' });
      } else { setFormData(defaultFormData); }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (initialData) await actorService.update(initialData.id, formData);
      else await actorService.create(formData);
      onSuccess(); onClose();
    } catch (error) { alert('Lỗi!'); } finally { setIsSubmitting(false); }
  };

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      {/* Container chính nhận nền tối */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg flex flex-col transition-colors duration-300">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{initialData ? 'Chỉnh sửa Diễn viên' : 'Thêm Diễn viên Mới'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6">
          <form id="actor-form" onSubmit={handleSubmit} className="space-y-4">
            <div><label className={labelClass}>Họ và Tên *</label><input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Ngày sinh</label><input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass} /></div>
              <div>
                <label className={labelClass}>Giới tính *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                  <option value="MALE" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Nam</option>
                  <option value="FEMALE" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Nữ</option>
                  <option value="OTHER" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Khác</option>
                </select>
              </div>
            </div>
            <div><label className={labelClass}>Quốc gia</label><input type="text" name="country" value={formData.country} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Link Avatar (URL)</label><input type="url" name="avatarUrl" value={formData.avatarUrl} onChange={handleChange} className={inputClass} /></div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800">Hủy</button>
          <button type="submit" form="actor-form" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 flex items-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} {initialData ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  );
}