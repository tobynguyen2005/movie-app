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

  const genderLabel =
    actor.gender === "MALE"
      ? "Nam"
      : actor.gender === "FEMALE"
        ? "Nữ"
        : "Chưa rõ";

  const details = [
    { label: "Giới tính", value: genderLabel, Icon: User },
    { label: "Ngày sinh", value: formattedDob, Icon: Calendar },
    { label: "Quốc gia", value: actor.country || "Chưa rõ", Icon: Globe2 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-[2px] sm:p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="actor-detail-title"
        className="relative flex w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-full bg-gray-900/65 text-white shadow-lg backdrop-blur-sm transition hover:bg-gray-900/85 sm:right-4 sm:top-4"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex w-[38%] min-w-[116px] max-w-[300px] shrink-0 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-3 dark:from-gray-900 dark:to-gray-700 sm:p-4 md:w-[300px] md:p-5">
          <div className="relative aspect-[2/3] w-full max-w-[260px] overflow-hidden rounded-xl bg-gray-900 shadow-lg ring-1 ring-black/10 dark:ring-white/10">
            {actor.avatarUrl ? (
              <img
                src={actor.avatarUrl}
                alt={actor.fullName}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-800 text-5xl font-bold text-gray-400">
                {actor.fullName.charAt(0)}
              </div>
            )}

            <button
              type="button"
              onClick={onPrevious}
              disabled={!hasPrevious}
              aria-label="Diễn viên trước"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/75 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-black/55 sm:left-3 sm:p-2.5"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              aria-label="Diễn viên tiếp theo"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/75 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-black/55 sm:right-3 sm:p-2.5"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {positionText && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white shadow backdrop-blur-sm sm:bottom-3">
                {positionText}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-5 md:p-7">
          <div className="mb-1 flex items-center gap-2 pr-8 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400 sm:text-xs">
            <Users className="h-4 w-4" />
            Hồ sơ diễn viên
          </div>

          <h2
            id="actor-detail-title"
            className="break-words text-xl font-bold leading-tight text-gray-900 dark:text-white sm:text-2xl"
          >
            {actor.fullName}
          </h2>

          <div className="mt-4 h-px w-full bg-gray-200 dark:bg-gray-700 sm:mt-5" />

          <div className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:gap-3">
            {details.map(({ label, value, Icon }) => (
              <div
                key={label}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-700/45 sm:px-3.5 sm:py-3"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:text-[11px]">
                    {label}
                  </p>
                  <p className="break-words text-xs font-semibold text-gray-800 dark:text-gray-100 sm:text-sm">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 hidden items-center gap-2 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400 sm:flex md:mt-4 md:pt-4">
            <span className="rounded border border-gray-300 px-1.5 py-0.5 font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-300">
              ←
            </span>
            <span className="rounded border border-gray-300 px-1.5 py-0.5 font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-300">
              →
            </span>
            <span>Chuyển diễn viên</span>
            <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>
            <span className="rounded border border-gray-300 px-1.5 py-0.5 font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-300">
              ESC
            </span>
            <span>Đóng</span>
          </div>
        </div>
      </div>
    </div>
  );
}
