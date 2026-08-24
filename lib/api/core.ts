import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { getCookie } from "cookies-next";
import type { ApiError } from "@/types/api";

// Backend dùng session cookie HttpOnly (docs/auth.md) — không có access/refresh token
// để FE cầm. Mọi request phải withCredentials:true để trình duyệt gửi kèm session cookie;
// CSRF token đọc từ cookie đọc được `scheduler_csrf` và gắn vào header cho request có side-effect.
const CSRF_COOKIE = "scheduler_csrf";
const CSRF_HEADER = "X-CSRF-Token";
const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);
// 401 từ chính các endpoint auth là phản hồi bình thường (chưa đăng nhập / sai mật khẩu),
// không phải dấu hiệu một session đang sống bị hết hạn — không nên phát sự kiện global logout,
// nếu không useMe() sẽ tự tạo vòng lặp redirect vô hạn ngay trên trang /login.
const AUTH_ENDPOINT_PATTERN = /\/api\/v1\/auth\//;

class ApiService {
  private client: AxiosInstance;

  constructor(baseURL: string, timeout = 60000) {
    this.client = axios.create({
      baseURL,
      timeout,
      withCredentials: true,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use((config) => {
      const method = config.method?.toLowerCase();
      if (method && MUTATING_METHODS.has(method)) {
        const csrfToken = getCookie(CSRF_COOKIE);
        if (csrfToken) config.headers[CSRF_HEADER] = csrfToken;
      }
      if (config.data instanceof FormData) delete config.headers["Content-Type"];
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const isAuthEndpoint = AUTH_ENDPOINT_PATTERN.test(error.config?.url || "");
        if (error.response?.status === 401 && !isAuthEndpoint && typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:unauthorized"));
        }

        const apiError: ApiError = {
          code: error.response?.status,
          message: error.response?.data?.message || error.message || "Có lỗi xảy ra",
          status: false,
          data: error.response?.data,
        };

        return Promise.reject(apiError);
      }
    );
  }

  async request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.request<T>(config);
  }

  async get<T, P = never>(url: string, params?: P): Promise<AxiosResponse<T>> {
    return this.request<T>({ method: "GET", url, params });
  }

  async post<T, D, P = never>(url: string, data?: D, params?: P): Promise<AxiosResponse<T>> {
    return this.request<T>({ method: "POST", url, data, params });
  }

  async put<T, D, P = never>(url: string, data?: D, params?: P): Promise<AxiosResponse<T>> {
    return this.request<T>({ method: "PUT", url, data, params });
  }

  async patch<T, D, P = never>(url: string, data?: D, params?: P): Promise<AxiosResponse<T>> {
    return this.request<T>({ method: "PATCH", url, data, params });
  }

  async delete<T, P = never>(url: string, params?: P): Promise<AxiosResponse<T>> {
    return this.request<T>({ method: "DELETE", url, params });
  }

  /** GET trả về binary (vd. export .xlsx) — dùng responseType 'blob' để axios không cố parse JSON. */
  async download<P = never>(url: string, params?: P): Promise<AxiosResponse<Blob>> {
    return this.request<Blob>({ method: "GET", url, params, responseType: "blob" });
  }

  async upload<T>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      method: "POST",
      url,
      data: formData,
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  }
}

const apiService = new ApiService(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/");

export default apiService;
