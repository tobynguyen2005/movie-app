import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Users,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { actorService } from "../services/actorService";
import { getApiErrorMessage } from "../services/api";
import type { Actor, PageResponse } from "../types";
import ActorModal from "../components/ActorModal";
import ActorDetailModal from "../components/ActorDetailModal";
import ActionPopup, { type PopupType } from "../components/ActionPopup";

export default function ActorsPage() {
  const [actorPage, setActorPage] = useState<PageResponse<Actor> | null>(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    fullName: "",
    gender: "",
    country: "",
    birthYear: "",
  });
  const [currentPage, setCurrentPage] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActor, setEditingActor] = useState<Actor | null>(null);

  // State cho modal xem chi tiết diễn viên
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);

  type PopupState = {
    type: PopupType;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm?: () => void | Promise<void>;
  };
  const [popup, setPopup] = useState<PopupState | null>(null);

  // Live Search với Debounce 500ms
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchActors(0);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  const fetchActors = async (pageIndex: number = 0) => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page: pageIndex, size: 10 };

      if (filters.fullName.trim()) params.fullName = filters.fullName.trim();
      if (filters.gender.trim()) params.gender = filters.gender.trim();
      if (filters.country.trim()) params.country = filters.country.trim();
      if (filters.birthYear.trim()) params.birthYear = filters.birthYear.trim();

      const data = await actorService.getAll(params);

      if (Array.isArray(data)) {
        setActorPage({
          content: data,
          pageNo: 0,
          pageSize: data.length,
          totalElements: data.length,
          totalPages: 1,
          last: true,
        });
      } else {
        setActorPage(data);
      }

      setCurrentPage(pageIndex);
    } catch (err) {
      console.error("Lỗi tải diễn viên", err);
      setPopup({
        type: "error",
        title: "Không thể tải danh sách diễn viên",
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
      [e.target.name]: e.target.value.trim(),
    });
  };

  const handleDelete = (id: number) => {
    const actor = actorPage?.content?.find((item) => item.id === id);
    setPopup({
      type: "confirm",
      title: "Xác nhận xóa diễn viên",
      message: `Bạn có chắc muốn xóa \"${actor?.fullName || "diễn viên này"}\" không? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa diễn viên",
      onConfirm: async () => {
        try {
          await actorService.delete(id);
          setPopup(null);
          const isLastItemOnPage = actorPage?.content?.length === 1;
          if (isLastItemOnPage && currentPage > 0) {
            await fetchActors(currentPage - 1);
          } else {
            await fetchActors(currentPage);
          }
        } catch (err) {
          setPopup({
            type: "error",
            title: "Không thể xóa diễn viên",
            message: getApiErrorMessage(
              err,
              "Đã xảy ra lỗi khi xóa diễn viên.",
            ),
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
          <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          Quản lý Diễn viên
        </h1>
        <button
          onClick={() => {
            setEditingActor(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
        >
          <Plus className="w-5 h-5" /> Thêm diễn viên
        </button>
      </div>

      {/* Thanh Live Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            name="fullName"
            value={filters.fullName}
            onChange={handleFilterChange}
            placeholder="Tìm tên diễn viên..."
            className={`${inputClass} pl-10 w-full`}
          />
        </div>
        <select
          name="gender"
          value={filters.gender}
          onChange={handleFilterChange}
          className={inputClass}
        >
          <option value="">-- Tất cả Giới tính --</option>
          <option value="MALE">Nam</option>
          <option value="FEMALE">Nữ</option>
        </select>
        <input
          name="country"
          value={filters.country}
          onChange={handleFilterChange}
          placeholder="Quốc gia..."
          className={inputClass}
        />
        <input
          name="birthYear"
          type="number"
          value={filters.birthYear}
          onChange={handleFilterChange}
          placeholder="Năm sinh..."
          className={inputClass}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : (
        <>
          {actorPage?.content?.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Không tìm thấy diễn viên nào
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Hãy thử thay đổi điều kiện lọc hoặc thêm diễn viên mới.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8 items-start">
              {actorPage?.content?.map((actor) => (
                <div
                  key={actor.id}
                  onClick={() => {
                    setSelectedActor(actor);
                    setIsDetailOpen(true);
                  }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer"
                >
                  {/* Khung ảnh tỷ lệ 3:4 — dùng background-image thay <img> để box luôn đều nhau,
                    không bị trình duyệt lấy tỷ lệ ảnh gốc đè lên */}
                  <div
                    className="aspect-[3/4] w-full flex-shrink-0 bg-gray-900 bg-cover bg-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300"
                    style={
                      actor.avatarUrl
                        ? { backgroundImage: `url(${actor.avatarUrl})` }
                        : undefined
                    }
                    role="img"
                    aria-label={actor.fullName}
                  >
                    {!actor.avatarUrl && (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500 bg-gray-800">
                        {actor.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingActor(actor);
                          setIsModalOpen(true);
                        }}
                        className="p-2 bg-white dark:bg-gray-800 rounded-full text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(actor.id);
                        }}
                        className="p-2 bg-white dark:bg-gray-800 rounded-full text-red-600 dark:text-red-400 hover:scale-110 transition-transform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Phần chữ bên dưới: Ép cứng h-20 và dùng flex để các dòng đều nhau */}
                  <div className="p-3 text-center flex-1 flex flex-col justify-between h-20">
                    <h3
                      className="font-bold text-gray-900 dark:text-white text-sm truncate w-full"
                      title={actor.fullName}
                    >
                      {actor.fullName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
                      {actor.country || "Chưa rõ"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {actorPage && actorPage.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <button
                disabled={currentPage === 0}
                onClick={() => fetchActors(currentPage - 1)}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 dark:text-white" />
              </button>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Trang {currentPage + 1} / {actorPage.totalPages}
              </span>
              <button
                disabled={actorPage.last}
                onClick={() => fetchActors(currentPage + 1)}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5 dark:text-white" />
              </button>
            </div>
          )}
        </>
      )}

      <ActorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          if (editingActor) {
            fetchActors(currentPage);
          } else {
            const totalElements = actorPage?.totalElements || 0;
            const pageSize = 10;
            const newTotalElements = totalElements + 1;
            const targetPageIndex = Math.ceil(newTotalElements / pageSize) - 1;
            fetchActors(targetPageIndex >= 0 ? targetPageIndex : 0);
          }
        }}
        initialData={editingActor}
      />

      <ActorDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        actor={selectedActor}
        actors={actorPage?.content ?? []}
        onPrevious={() => {
          if (!selectedActor || !actorPage?.content) return;
          const index = actorPage.content.findIndex(
            (item) => item.id === selectedActor.id,
          );
          if (index > 0) {
            setSelectedActor(actorPage.content[index - 1]);
          }
        }}
        onNext={() => {
          if (!selectedActor || !actorPage?.content) return;
          const index = actorPage.content.findIndex(
            (item) => item.id === selectedActor.id,
          );
          if (index >= 0 && index < actorPage.content.length - 1) {
            setSelectedActor(actorPage.content[index + 1]);
          }
        }}
        hasPrevious={Boolean(
          selectedActor &&
            actorPage?.content &&
            actorPage.content.findIndex((item) => item.id === selectedActor.id) >
              0,
        )}
        hasNext={Boolean(
          selectedActor &&
            actorPage?.content &&
            (() => {
              const index = actorPage.content.findIndex(
                (item) => item.id === selectedActor.id,
              );
              return index >= 0 && index < actorPage.content.length - 1;
            })(),
        )}
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
