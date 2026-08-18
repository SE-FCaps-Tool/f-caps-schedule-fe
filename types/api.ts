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
