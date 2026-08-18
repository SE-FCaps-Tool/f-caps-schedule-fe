"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/lib/redux/hooks";
import { logout } from "@/lib/redux/slices/authSlice";

/**
 * Đồng bộ logout giữa các tab: tab A logout ⇒ tab B/C/D cũng logout.
 */
export function useAuthSyncAcrossTabs() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleLogout = () => dispatch(logout());
    window.addEventListener("logout", handleLogout);
    return () => window.removeEventListener("logout", handleLogout);
  }, [dispatch]);
}
