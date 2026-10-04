import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Actor, ActorGender } from '../types';
import { actorService } from '../services/actorService';
import { getApiErrorMessage } from '../services/api';
import ActionPopup, { type PopupType } from './ActionPopup';

interface ActorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: Actor | null;
}

const defaultFormData = {
  fullName: '',
  dob: '',
  country: '',
  gender: 'MALE' as ActorGender,
  avatarUrl: '',
};

type PopupState = {
  type: PopupType;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void | Promise<void>;
};

export default function ActorModal({ isOpen, onClose, onSuccess, initialData }: ActorModalProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popup, setPopup] = useState<PopupState | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPopup(null);
      if (initialData) {
        setFormData({
          fullName: initialData.fullName,
          dob: initialData.dob || '',
          country: initialData.country || '',
          gender: initialData.gender,
          avatarUrl: initialData.avatarUrl || '',
        });
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveActor = async () => {
    try {
      setIsSubmitting(true);
      if (initialData) {
        await actorService.update(initialData.id, formData);
      } else {
        await actorService.create(formData);
      }
      setPopup(null);
      onSuccess();
      onClose();
    } catch (error) {
      setPopup({
        type: 'error',
        title: 'Không thể lưu diễn viên',
        message: getApiErrorMessage(error, 'Đã xảy ra lỗi khi lưu diễn viên.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      setPopup({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập Họ và Tên diễn viên.',
      });
      return;
    }

    if (!formData.gender) {
      setPopup({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn giới tính diễn viên.',
      });
      return;
    }

    if (initialData) {
      setPopup({
        type: 'confirm',
        title: 'Xác nhận cập nhật',
        message: `Bạn có chắc muốn cập nhật thông tin của "${initialData.fullName}" không?`,
        confirmText: 'Cập nhật',
        onConfirm: saveActor,
      });
      return;
    }

    void saveActor();
  };

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg flex flex-col transition-colors duration-300">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Chỉnh sửa Diễn viên' : 'Thêm Diễn viên Mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <form id="actor-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Họ và Tên *</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Ngày sinh</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Giới tính *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Quốc gia</label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Link Avatar (URL)</label>
              <input type="url" name="avatarUrl" value={formData.avatarUrl} onChange={handleChange} className={inputClass} />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800">
            Hủy
          </button>
          <button type="submit" form="actor-form" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {initialData ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>

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
