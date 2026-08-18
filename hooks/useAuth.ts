/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  loginAsync,
  logoutAsync,
  selectAuth,
  selectUser,
  setupAutoRefresh,
} from "@/lib/redux/slices/authSlice";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT } from "@/lib/types/roles";

const ROLE_HOME: Record<string, string> = {
  [ROLE_ADMIN]: "/admin/dashboard",
  [ROLE_MANAGER]: "/manager/dashboard",
  [ROLE_LECTURER]: "/lecturer/dashboard",
  [ROLE_STUDENT]: "/student/dashboard",
};

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useAppSelector(selectAuth);
  const user = useAppSelector(selectUser);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const result = await dispatch(loginAsync(credentials)).unwrap();

      if (result.token) setupAutoRefresh(result.token, dispatch as any);

      toast.success("Đăng nhập thành công");
      router.push(ROLE_HOME[result.user?.role ?? ""] ?? "/");

      return result;
    } catch (error: any) {
      toast.error(error || "Đăng nhập thất bại");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await dispatch(logoutAsync()).unwrap();
      toast.success("Đăng xuất thành công");
      router.push("/login");
    } catch {
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  return {
    ...auth,
    user,
    isAdmin: user?.role === ROLE_ADMIN,
    isManager: user?.role === ROLE_MANAGER,
    isLecturer: user?.role === ROLE_LECTURER,
    isStudent: user?.role === ROLE_STUDENT,
    login,
    logout,
  };
}
