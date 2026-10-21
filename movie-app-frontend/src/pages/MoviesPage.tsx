import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Film,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { movieService } from "../services/movieService";
import { getApiErrorMessage } from "../services/api";
import type { Movie, MovieStatus, PageResponse, Actor, Genre } from "../types";
import { actorService } from "../services/actorService";
import { genreService } from "../services/genreService";
import MovieModal from "../components/MovieModal";
import MovieDetailModal from "../components/MovieDetailModal";
import ActionPopup, { type PopupType } from "../components/ActionPopup";

export default function MoviesPage() {
  const [moviePage, setMoviePage] = useState<PageResponse<Movie> | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableActors, setAvailableActors] = useState<Actor[]>([]);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [genreSearchKeyword, setGenreSearchKeyword] = useState("");
  const [selectedActorIds, setSelectedActorIds] = useState<number[]>([]);
  const [actorSearchKeyword, setActorSearchKeyword] = useState("");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  // State điều kiện lọc khớp với Backend (title, country, genre, releaseYear)
  const [filters, setFilters] = useState({
    title: "",
    country: "",
    releaseYear: "",
    status: "" as MovieStatus | "",
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInput, setPageInput] = useState("1");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  // State cho modal xem chi tiết phim
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  type PopupState = {
    type: PopupType;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm?: () => void | Promise<void>;
  };
  const [popup, setPopup] = useState<PopupState | null>(null);

  // Tải danh sách diễn viên và thể loại cho bộ lọc nâng cao.
  useEffect(() => {
    const loadActors = async () => {
      try {
        const result = await actorService.getAll({ size: 1000 });
        setAvailableActors(Array.isArray(result) ? result : result.content || []);
      } catch (error) {
        console.error("Không thể tải danh sách diễn viên để lọc phim", error);
      }
    };
    const loadGenres = async () => {
      try {
        const result = await genreService.getAll();
        setAvailableGenres(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Không thể tải danh sách thể loại để lọc phim", error);
      }
    };
    loadActors();
    loadGenres();
  }, []);

  const normalizedActorSearch = actorSearchKeyword.trim().toLowerCase();
  const normalizedGenreSearch = genreSearchKeyword.trim().toLowerCase();
  const filteredActors = availableActors.filter((actor) =>
    actor.fullName.toLowerCase().includes(normalizedActorSearch),
  );
  const filteredGenres = availableGenres.filter((genre) =>
    genre.name.toLowerCase().includes(normalizedGenreSearch),
  );

  // Live Search với Debounce 500ms (Đợi ngừng gõ nửa giây mới gọi API)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMovies(0); // Thay đổi filter thì luôn đưa về trang đầu tiên
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filters, selectedActorIds, selectedGenreIds]);

  const fetchMovies = async (pageIndex: number = 0) => {
    try {
      setLoading(true);
      // Lọc thể loại/diễn viên trên danh sách kết quả; phân trang sau khi lọc.
      const relationshipFiltering = selectedActorIds.length > 0 || selectedGenreIds.length > 0;
      const params: Record<string, any> = { page: relationshipFiltering ? 0 : pageIndex, size: relationshipFiltering ? 1000 : 12 };

      if (filters.title.trim()) params.title = filters.title.trim();
      if (filters.country.trim()) params.country = filters.country.trim();
      if (filters.releaseYear.trim())
        params.releaseYear = filters.releaseYear.trim();
      if (filters.status) params.status = filters.status;
      const data = await movieService.getAll(params);
      const allMovies: Movie[] = Array.isArray(data) ? data : data.content || [];
      const matchingMovies = relationshipFiltering
        ? allMovies.filter((movie) => {
            const matchesActors = selectedActorIds.every((actorId) =>
              movie.actors?.some((actor) => actor.id === actorId),
            );
            const matchesGenres = selectedGenreIds.length === 0 ||
              movie.genres?.some((genre) => selectedGenreIds.includes(genre.id));
            return matchesActors && matchesGenres;
          })
        : allMovies;

      if (relationshipFiltering) {
        const pageSize = 12;
        const totalPages = Math.max(1, Math.ceil(matchingMovies.length / pageSize));
        const safePage = Math.max(0, Math.min(pageIndex, totalPages - 1));
        const content = matchingMovies.slice(safePage * pageSize, (safePage + 1) * pageSize);
        setMoviePage({ content, pageNo: safePage, pageSize, totalElements: matchingMovies.length, totalPages, last: safePage >= totalPages - 1 });
        setCurrentPage(safePage);
        setPageInput(String(safePage + 1));
      } else if (Array.isArray(data)) {
        setMoviePage({ content: data, pageNo: 0, pageSize: data.length, totalElements: data.length, totalPages: 1, last: true });
        setCurrentPage(0);
        setPageInput("1");
      } else {
        setMoviePage(data);
        const totalPages = Math.max(1, data.totalPages);
        const safePage = Math.max(0, Math.min(pageIndex, totalPages - 1));
        setCurrentPage(safePage);
        setPageInput(String(safePage + 1));
      }
    } catch (err) {
      console.error("Lỗi tải phim", err);
      setPopup({
        type: "error",
        title: "Không thể tải danh sách phim",
        message: getApiErrorMessage(
          err,
          "Không thể kết nối tới máy chủ. Vui lòng thử lại.",
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleDelete = (id: number) => {
    const movie = moviePage?.content?.find((item) => item.id === id);
    setPopup({
      type: "confirm",
      title: "Xác nhận xóa phim",
      message: `Bạn có chắc muốn xóa \"${movie?.title || "bộ phim này"}\" không? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa phim",
      onConfirm: async () => {
        try {
          await movieService.delete(id);
          setPopup(null);

          // Xóa item cuối cùng của trang thì lùi về 1 trang nếu cần.
          const isLastItemOnPage = moviePage?.content?.length === 1;
          if (isLastItemOnPage && currentPage > 0) {
            await fetchMovies(currentPage - 1);
          } else {
            await fetchMovies(currentPage);
          }
        } catch (err) {
          setPopup({
            type: "error",
            title: "Không thể xóa phim",
            message: getApiErrorMessage(err, "Đã xảy ra lỗi khi xóa phim."),
          });
        }
      },
    });
  };

  const inputClass =
    "border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Film className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          Quản lý Phim
        </h1>
        <button
          onClick={() => {
            setEditingMovie(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" /> Thêm phim
        </button>
      </div>

      {/* Bộ lọc nhanh: tên phim, quốc gia và trạng thái */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            name="title"
            value={filters.title}
            onChange={handleFilterChange}
            placeholder="Tìm tên phim..."
            className={`${inputClass} pl-10 w-full`}
          />
        </div>
        <input
          name="country"
          value={filters.country}
          onChange={handleFilterChange}
          placeholder="Quốc gia..."
          className={inputClass}
        />
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className={inputClass}
        >
          <option value="">-- Tất cả trạng thái --</option>
          <option value="PLAN_TO_WATCH">Dự định xem</option>
          <option value="WATCHING">Đang xem</option>
          <option value="COMPLETED">Đã hoàn thành</option>
          <option value="DROPPED">Đã huỷ</option>
        </select>
      </div>

      {/* Bộ lọc nâng cao */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedFiltersOpen((open) => !open)}
          aria-expanded={advancedFiltersOpen}
          className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <span className="flex items-center gap-2 min-w-0">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium text-sm text-gray-800 dark:text-gray-100">Bộ lọc nâng cao</span>
            {(filters.releaseYear || selectedGenreIds.length > 0 || selectedActorIds.length > 0) && (
              <span className="text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5">
                {[filters.releaseYear ? 1 : 0, selectedGenreIds.length > 0 ? 1 : 0, selectedActorIds.length > 0 ? 1 : 0].reduce((a, b) => a + b, 0)} điều kiện
              </span>
            )}
          </span>
          <ChevronDown className={`w-5 h-5 shrink-0 text-gray-500 transition-transform ${advancedFiltersOpen ? "rotate-180" : ""}`} />
        </button>
        {advancedFiltersOpen && (
          <div className="p-4 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-5">
            <div className="max-w-xs">
              <label htmlFor="releaseYear" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Năm phát hành</label>
              <input
                id="releaseYear"
                name="releaseYear"
                type="number"
                value={filters.releaseYear}
                onChange={handleFilterChange}
                placeholder="Nhập năm..."
                className={`${inputClass} w-full`}
              />
            </div>

            <section>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">Thể loại</h3>
                {selectedGenreIds.length > 0 && (
                  <button type="button" onClick={() => setSelectedGenreIds([])} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Bỏ chọn ({selectedGenreIds.length})</button>
                )}
              </div>
              <div className="relative mb-3 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input type="text" value={genreSearchKeyword} onChange={(e) => setGenreSearchKeyword(e.target.value)} placeholder="Tìm thể loại..." className={`${inputClass} pl-9 w-full`} />
              </div>
              <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableGenres.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Không có dữ liệu thể loại.</p>
                ) : filteredGenres.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Không tìm thấy thể loại phù hợp.</p>
                ) : filteredGenres.map((genre) => (
                  <label key={genre.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${selectedGenreIds.includes(genre.id) ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30" : "border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                    <input type="checkbox" checked={selectedGenreIds.includes(genre.id)} onChange={() => setSelectedGenreIds((current) => current.includes(genre.id) ? current.filter((id) => id !== genre.id) : [...current, genre.id])} className="w-4 h-4 shrink-0 accent-indigo-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{genre.name}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">Diễn viên</h3>
                {selectedActorIds.length > 0 && (
                  <button type="button" onClick={() => setSelectedActorIds([])} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Bỏ chọn ({selectedActorIds.length})</button>
                )}
              </div>
              <div className="relative mb-3 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input type="text" value={actorSearchKeyword} onChange={(e) => setActorSearchKeyword(e.target.value)} placeholder="Tìm diễn viên theo tên..." className={`${inputClass} pl-9 w-full`} />
              </div>
              <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableActors.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Không có dữ liệu diễn viên.</p>
                ) : filteredActors.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Không tìm thấy diễn viên phù hợp.</p>
                ) : filteredActors.map((actor) => (
                  <label key={actor.id} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer min-w-0 transition-colors ${selectedActorIds.includes(actor.id) ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30" : "border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                    <input type="checkbox" checked={selectedActorIds.includes(actor.id)} onChange={() => setSelectedActorIds((current) => current.includes(actor.id) ? current.filter((id) => id !== actor.id) : [...current, actor.id])} className="w-4 h-4 shrink-0 accent-indigo-600" />
                    {actor.avatarUrl ? <img src={actor.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" /> : <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-200 shrink-0">{actor.fullName.charAt(0)}</div>}
                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{actor.fullName}</span>
                  </label>
                ))}
              </div>
            </section>

            {(filters.releaseYear || selectedGenreIds.length > 0 || selectedActorIds.length > 0) && (
              <div className="flex justify-end border-t border-gray-100 dark:border-gray-700 pt-3">
                <button type="button" onClick={() => { setFilters((current) => ({ ...current, releaseYear: "" })); setSelectedGenreIds([]); setSelectedActorIds([]); }} className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                  <X className="w-4 h-4" /> Xóa bộ lọc nâng cao
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : (
        <>
          {moviePage?.content?.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <Film className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Không tìm thấy bộ phim nào
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Hãy thử thay đổi điều kiện lọc hoặc thêm phim mới.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8 items-start">
              {moviePage?.content?.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => {
                    setSelectedMovie(movie);
                    setIsDetailOpen(true);
                  }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer"
                >
                  {/* Poster chuẩn tỷ lệ 3:4 — dùng background-image thay vì <img> để tránh trình duyệt
                      lấy tỷ lệ gốc của ảnh đè lên box (nguyên nhân khiến poster cao thấp lệch nhau) */}
                  <div
                    className="aspect-[3/4] w-full flex-shrink-0 bg-gray-100 dark:bg-gray-700 bg-cover bg-center bg-no-repeat relative overflow-hidden"
                    style={
                      movie.posterUrl
                        ? { backgroundImage: `url(${movie.posterUrl})` }
                        : undefined
                    }
                    role="img"
                    aria-label={movie.title}
                  >
                    {!movie.posterUrl && (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-300 dark:text-gray-500">
                        {movie.title.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMovie(movie);
                          setIsModalOpen(true);
                        }}
                        className="p-2 bg-white dark:bg-gray-800 rounded-full text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(movie.id);
                        }}
                        className="p-2 bg-white dark:bg-gray-800 rounded-full text-red-600 dark:text-red-400 hover:scale-110 transition-transform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 text-center flex flex-col">
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 text-sm min-h-[2.5rem] flex items-center justify-center">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {movie.releaseYear} • {movie.country || "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Phân trang */}
          {moviePage && moviePage.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <button
                disabled={currentPage === 0}
                onClick={() => fetchMovies(currentPage - 1)}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 dark:text-white" />
              </button>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Trang</span>
              <input
                aria-label="Đi đến trang phim"
                type="number"
                min={1}
                max={moviePage.totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => {
                  const requested = Number(pageInput);
                  const page = Math.max(
                    1,
                    Math.min(
                      Number.isFinite(requested) && pageInput.trim() !== ""
                        ? Math.trunc(requested)
                        : 1,
                      moviePage.totalPages,
                    ),
                  );
                  setPageInput(String(page));
                  if (page - 1 !== currentPage) fetchMovies(page - 1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-20 text-center outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                / {moviePage.totalPages}
              </span>
              <button
                disabled={moviePage.last}
                onClick={() => fetchMovies(currentPage + 1)}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5 dark:text-white" />
              </button>
            </div>
          )}
        </>
      )}

      <MovieModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          if (editingMovie) {
            fetchMovies(currentPage);
          } else {
            const totalElements = moviePage?.totalElements || 0;
            const pageSize = 12;
            const newTotalElements = totalElements + 1;
            const targetPageIndex = Math.ceil(newTotalElements / pageSize) - 1;
            fetchMovies(targetPageIndex >= 0 ? targetPageIndex : 0);
          }
        }}
        initialData={editingMovie}
      />

      <MovieDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        movie={selectedMovie}
      />

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
