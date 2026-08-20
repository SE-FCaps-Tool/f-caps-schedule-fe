"use client";

import { useEffect, useState } from "react";

/** Trì hoãn cập nhật giá trị `delayMs` — dùng để không gọi API tìm kiếm trên từng phím gõ. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
