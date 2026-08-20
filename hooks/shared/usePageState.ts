"use client";

import { useState } from "react";

/**
 * State trang hiện tại cho bảng phân trang — tự reset về trang 1 khi bất kỳ giá trị nào
 * trong `resetKeys` đổi (search, filter, pageSize đo lại...). Reset ngay trong lúc render
 * (theo khuyến nghị của React: "Adjusting state when a prop changes") thay vì trong
 * useEffect, để tránh 1 nhịp render thừa và lỗi lint react-hooks/set-state-in-effect.
 */
export function usePageState(...resetKeys: unknown[]) {
  const [page, setPage] = useState(1);
  const key = resetKeys.join("|");
  const [prevKey, setPrevKey] = useState(key);

  if (key !== prevKey) {
    setPrevKey(key);
    setPage(1);
  }

  return [page, setPage] as const;
}
