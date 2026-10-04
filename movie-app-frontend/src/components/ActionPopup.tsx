import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

export type PopupType = 'confirm' | 'error' | 'warning' | 'success' | 'info';

interface ActionPopupProps {
  isOpen: boolean;
  type?: PopupType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onClose: () => void;
}

const iconMap = {
  confirm: AlertTriangle,
  error: CircleAlert,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const iconClassMap = {
  confirm: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
  error: 'text-red-500 bg-red-50 dark:bg-red-900/30',
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
  success: 'text-green-500 bg-green-50 dark:bg-green-900/30',
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
};

export default function ActionPopup({
  isOpen,
  type = 'info',
  title,
  message,
  confirmText = type === 'confirm' ? 'Xác nhận' : 'Đóng',
  cancelText = 'Hủy',
  onConfirm,
  onClose,
}: ActionPopupProps) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) setSubmitting(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const Icon = iconMap[type];
  const isConfirm = type === 'confirm';

  const handleConfirm = async () => {
    if (!onConfirm) {
      onClose();
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClassMap[type]}`}>
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">{message}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          {isConfirm && (
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`rounded-lg px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              isConfirm ? 'bg-indigo-600 hover:bg-indigo-700' : type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {submitting ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
