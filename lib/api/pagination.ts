import type { ListMeta, ListResponse, PageParams } from "@/types/api";

export const DEFAULT_PAGE_SIZE = 10;

/**
 * Chuẩn hóa response GET list về { items, meta } bất kể BE đã hỗ trợ phân trang hay chưa:
 * - BE trả `{ data, meta }` (đã migrate — vd. fetchProjects/fetchGroups/fetchRounds): dùng thẳng.
 * - BE chỉ trả mảng phẳng hoặc `{ data }` không có `meta` (chưa migrate): tự cắt trang phía
 *   client trên mảng đã fetch, để UI phân trang chạy đúng ngay hôm nay và tự nâng cấp lên
 *   server-side khi BE bổ sung `meta` mà không cần đổi code gọi component.
 */
export function normalizeListResponse<T>(
  response: T[] | ListResponse<T>,
  params: PageParams
): { items: T[]; meta: ListMeta } {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  const full = Array.isArray(response) ? response : response.data;
  const meta = Array.isArray(response) ? undefined : response.meta;

  if (meta) {
    return { items: full, meta };
  }

  const total = full.length;
  const start = (page - 1) * pageSize;
  return {
    items: full.slice(start, start + pageSize),
    meta: { page, pageSize, total },
  };
}

export function totalPages(meta: ListMeta): number {
  return Math.max(1, Math.ceil(meta.total / Math.max(1, meta.pageSize)));
}
