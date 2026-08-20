// Shape response chuẩn từ backend
export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
  metadata?: unknown;
}

export interface ApiError {
  code?: number;
  message: string;
  status: boolean;
  data?: unknown;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface RequestParams {
  [key: string]: string | number | boolean | undefined | null | string[];
}

/** Query params gửi kèm khi gọi 1 endpoint list có phân trang. */
export interface PageParams {
  page?: number;
  pageSize?: number;
}

/** meta trả về khi BE đã hỗ trợ phân trang thật (vd. fetchProjects/fetchGroups/fetchRounds). */
export interface ListMeta {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Response shape chuẩn cho GET list — `meta` optional vì nhiều endpoint BE hiện tại
 * (xem lib/api/pagination.ts) chưa hỗ trợ phân trang và chỉ trả mảng phẳng; FE tự
 * chuẩn hóa/paginate phía client cho tới khi BE bổ sung `meta`.
 */
export interface ListResponse<T> {
  data: T[];
  meta?: ListMeta;
}
