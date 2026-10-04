import { useState, useEffect } from "react";
import { X, Loader2, Search } from "lucide-react";
import type { Movie, MovieStatus, Actor, Genre } from "../types";
import { movieService } from "../services/movieService";
import { actorService } from "../services/actorService";
import { genreService } from "../services/genreService";
import { getApiErrorMessage, withRetry } from "../services/api";
import ActionPopup, { type PopupType } from "./ActionPopup";

interface MovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: Movie | null;
}

const defaultFormData = {
  title: "",
  releaseYear: new Date().getFullYear(),
  totalEpisodes: 1,
  country: "",
  posterUrl: "",
  description: "",
  status: "PLAN_TO_WATCH" as MovieStatus,
  actorIds: [] as number[],
  genreIds: [] as number[],
};

type PopupState = {
  type: PopupType;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void | Promise<void>;
};

export default function MovieModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: MovieModalProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableActors, setAvailableActors] = useState<Actor[]>([]);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [isLoadingRelatedData, setIsLoadingRelatedData] = useState(false);
  const [actorSearchKeyword, setActorSearchKeyword] = useState("");
  const [popup, setPopup] = useState<PopupState | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    setPopup(null);
    setActorSearchKeyword("");
    setIsLoadingRelatedData(true);

    // Reset related data while loading.
    setAvailableActors([]);
    setAvailableGenres([]);

    const loadRelatedData = async () => {
      const [actorsResult, genresResult] = await Promise.allSettled([
        withRetry(() => actorService.getAll({ size: 1000 })),
        withRetry(() => genreService.getAll()),
      ]);

      if (cancelled) return;

      // -------------------------
      // Actors
      // -------------------------
      if (actorsResult.status === "fulfilled") {
        const actorsData = actorsResult.value;

        const actorsList = Array.isArray(actorsData)
          ? actorsData
          : actorsData.content || [];

        setAvailableActors(actorsList);
      } else {
        console.error("Failed to load actors:", actorsResult.reason);

        setAvailableActors([]);
      }

      // -------------------------
      // Genres
      // -------------------------
      if (genresResult.status === "fulfilled") {
        const genresData = genresResult.value;

        const genresList = Array.isArray(genresData) ? genresData : [];

        setAvailableGenres(genresList);
      } else {
        console.error("Failed to load genres:", genresResult.reason);

        setAvailableGenres([]);
      }

      // -------------------------
      // Error popup
      // -------------------------
      const failedMessages: string[] = [];

      if (actorsResult.status === "rejected") {
        failedMessages.push(
          `Diễn viên: ${getApiErrorMessage(
            actorsResult.reason,
            "Không tải được danh sách diễn viên.",
          )}`,
        );
      }

      if (genresResult.status === "rejected") {
        failedMessages.push(
          `Thể loại: ${getApiErrorMessage(
            genresResult.reason,
            "Không tải được danh sách thể loại.",
          )}`,
        );
      }

      if (failedMessages.length > 0) {
        setPopup({
          type: "error",
          title: "Không tải được dữ liệu liên quan",
          message: failedMessages.join("\n\n"),
        });
      }

      setIsLoadingRelatedData(false);
    };

    void loadRelatedData();

    // -------------------------
    // Load existing movie data
    // -------------------------
    if (initialData) {
      setFormData({
        title: initialData.title,
        releaseYear: initialData.releaseYear,
        totalEpisodes: initialData.totalEpisodes,
        country: initialData.country || "",
        posterUrl: initialData.posterUrl || "",
        description: initialData.description || "",
        status: initialData.status,
        actorIds: initialData.actors?.map((a) => a.id) || [],
        genreIds: initialData.genres?.map((g) => g.id) || [],
      });
    } else {
      setFormData({
        ...defaultFormData,
        actorIds: [],
        genreIds: [],
      });
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "releaseYear" || name === "totalEpisodes"
          ? value === ""
            ? 0
            : Number(value)
          : value,
    }));
  };

  const handleActorToggle = (actorId: number) => {
    setFormData((prev) => ({
      ...prev,
      actorIds: prev.actorIds.includes(actorId)
        ? prev.actorIds.filter((id) => id !== actorId)
        : [...prev.actorIds, actorId],
    }));
  };

  const handleGenreToggle = (genreId: number) => {
    setFormData((prev) => ({
      ...prev,
      genreIds: prev.genreIds.includes(genreId)
        ? prev.genreIds.filter((id) => id !== genreId)
        : [...prev.genreIds, genreId],
    }));
  };

  const saveMovie = async () => {
    try {
      setIsSubmitting(true);
      if (initialData) {
        await movieService.update(initialData.id, formData);
      } else {
        await movieService.create(formData);
      }
      setPopup(null);
      onSuccess();
      onClose();
    } catch (error) {
      setPopup({
        type: "error",
        title: "Không thể lưu phim",
        message: getApiErrorMessage(error, "Đã xảy ra lỗi khi lưu phim."),
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setPopup({
        type: "warning",
        title: "Thiếu thông tin",
        message: "Vui lòng nhập tiêu đề phim.",
      });
      return;
    }

    if (formData.releaseYear && formData.releaseYear < 1900) {
      setPopup({
        type: "warning",
        title: "Dữ liệu chưa hợp lệ",
        message: "Năm phát hành phải từ 1900 trở lên.",
      });
      return;
    }

    if (!formData.totalEpisodes || formData.totalEpisodes < 1) {
      setPopup({
        type: "warning",
        title: "Dữ liệu chưa hợp lệ",
        message: "Số tập tối thiểu là 1.",
      });
      return;
    }

    if (initialData) {
      setPopup({
        type: "confirm",
        title: "Xác nhận cập nhật",
        message: `Bạn có chắc muốn cập nhật bộ phim "${initialData.title}" không?`,
        confirmText: "Cập nhật",
        onConfirm: saveMovie,
      });
      return;
    }

    void saveMovie();
  };

  const filteredActors = availableActors.filter((actor) =>
    actor.fullName.toLowerCase().includes(actorSearchKeyword.toLowerCase()),
  );

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm";
  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-colors duration-300">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? "Chỉnh sửa Phim" : "Thêm Phim Mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form
            id="movie-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <label className={labelClass}>Tiêu đề phim *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Năm phát hành</label>
              <input
                type="number"
                name="releaseYear"
                min="1900"
                value={formData.releaseYear || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Số tập *</label>
              <input
                type="number"
                name="totalEpisodes"
                min="1"
                value={formData.totalEpisodes || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Quốc gia</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="PLAN_TO_WATCH">Dự định xem</option>
                <option value="WATCHING">Đang xem</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="DROPPED">Đã huỷ</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Link Poster (URL)</label>
              <input
                type="url"
                name="posterUrl"
                value={formData.posterUrl}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Diễn viên tham gia</label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 flex flex-col gap-3">
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

                <div className="max-h-40 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                  {isLoadingRelatedData ? (
                    <div className="col-span-2 flex items-center justify-center gap-2 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tải danh sách diễn viên...
                    </div>
                  ) : filteredActors.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 col-span-2 text-center py-2">
                      Không tìm thấy diễn viên phù hợp.
                    </p>
                  ) : (
                    filteredActors.map((actor) => (
                      <label
                        key={actor.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-500 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.actorIds.includes(actor.id)}
                          onChange={() => handleActorToggle(actor.id)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500"
                        />

                        <div className="flex items-center gap-2 min-w-0">
                          {actor.avatarUrl ? (
                            <img
                              src={actor.avatarUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
                              {actor.fullName.charAt(0)}
                            </div>
                          )}

                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                            {actor.fullName}
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Thể loại</label>
              <div className="flex flex-wrap gap-2">
                {isLoadingRelatedData ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tải thể loại...
                  </div>
                ) : availableGenres.length === 0 ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Chưa có dữ liệu thể loại.
                  </span>
                ) : (
                  availableGenres.map((genre) => {
                    const isSelected = formData.genreIds.includes(genre.id);
                    return (
                      <label
                        key={genre.id}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium cursor-pointer transition-colors ${isSelected ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isSelected}
                          onChange={() => handleGenreToggle(genre.id)}
                        />
                        {genre.name}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Mô tả nội dung</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className={`${inputClass} resize-none`}
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="movie-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {initialData ? "Cập nhật" : "Thêm mới"}
          </button>
        </div>
      </div>

      <ActionPopup
        isOpen={!!popup}
        type={popup?.type}
        title={popup?.title ?? ""}
        message={popup?.message ?? ""}
        confirmText={popup?.confirmText}
        onConfirm={popup?.onConfirm}
        onClose={() => setPopup(null)}
      />
    </div>
  );
}
