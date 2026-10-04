import { useEffect } from "react";
import {
  X,
  Users,
  Calendar,
  Globe2,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Actor } from "../types";

interface ActorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: Actor | null;
  actors: Actor[];
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export default function ActorDetailModal({
  isOpen,
  onClose,
  actor,
  actors,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: ActorDetailModalProps) {
  useEffect(() => {
    if (!isOpen || !actor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Không chặn phím mũi tên khi người dùng đang nhập liệu ở một form/input khác.
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (isTyping) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (hasPrevious) onPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (hasNext) onNext();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, actor, hasPrevious, hasNext, onPrevious, onNext, onClose]);

  if (!isOpen || !actor) return null;

  const currentIndex = actors.findIndex((item) => item.id === actor.id);
  const positionText =
    currentIndex >= 0 ? `${currentIndex + 1} / ${actors.length}` : "";

  const formattedDob = actor.dob
    ? new Date(actor.dob).toLocaleDateString("vi-VN")
    : "Chưa rõ";

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-gray-900/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900 z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative">
          {/* Avatar - dùng background-image để tránh lệ thuộc tỷ lệ ảnh gốc */}
          <div
            className="aspect-[3/4] w-full bg-gray-900 bg-cover bg-center relative overflow-hidden"
            style={
              actor.avatarUrl
                ? { backgroundImage: `url(${actor.avatarUrl})` }
                : undefined
            }
            role="img"
            aria-label={actor.fullName}
          >
            {!actor.avatarUrl && (
              <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-gray-500 bg-gray-800">
                {actor.fullName.charAt(0)}
              </div>
            )}
          </div>

          {/* Điều hướng actor ngay trên card chi tiết */}
          <button
            type="button"
            onClick={onPrevious}
            disabled={!hasPrevious}
            aria-label="Diễn viên trước"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/75 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/55"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Diễn viên tiếp theo"
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

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            {actor.fullName}
          </h2>

          <div className="grid grid-cols-1 gap-3 mt-5 text-sm">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4 text-indigo-500" />
              <span>Giới tính: <b>{actor.gender === "MALE" ? "Nam" : actor.gender === "FEMALE" ? "Nữ" : "N/A"}</b></span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Ngày sinh: <b>{formattedDob}</b></span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Globe2 className="w-4 h-4 text-indigo-500" />
              <span>Quốc gia: <b>{actor.country || "Chưa rõ"}</b></span>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Dùng phím ← → để chuyển diễn viên · Esc để đóng
          </p>
        </div>
      </div>
    </div>
  );
}
