"use client";

import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { normalizeListResponse } from "@/lib/api/pagination";
import type { ListResponse } from "@/types/api";

interface UseInfiniteScrollOptions<T> {
  queryKey: QueryKey;
  /** Gọi API list với { page, pageSize } — chấp nhận cả mảng phẳng (BE chưa hỗ trợ phân trang) lẫn { data, meta }. */
  queryFn: (params: { page: number; pageSize: number }) => Promise<T[] | ListResponse<T>>;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Load-more theo scroll cho danh sách dài trong dropdown/combobox: gắn `sentinelRef` vào 1
 * div rỗng ở cuối danh sách trong popover — khi div đó lọt vào viewport (IntersectionObserver),
 * tự fetch trang kế tiếp. Dùng chung `normalizeListResponse` nên hoạt động đúng ngay cả khi
 * BE của field đó chưa hỗ trợ `page`/`pageSize` (toàn bộ dữ liệu về trong 1 trang, hasNextPage
 * tự thành false sau khi hết mảng).
 */
export function useInfiniteScroll<T>({
  queryKey,
  queryFn,
  pageSize = 20,
  enabled = true,
}: UseInfiniteScrollOptions<T>) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const response = await queryFn({ page: pageParam, pageSize });
      return normalizeListResponse(response, { page: pageParam, pageSize });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.meta.page * lastPage.meta.pageSize;
      return loaded < lastPage.meta.total ? lastPage.meta.page + 1 : undefined;
    },
    enabled,
    staleTime: 30 * 1000,
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "64px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );

  return {
    items,
    sentinelRef,
    isLoading: query.isLoading,
    isFetchingNextPage,
    hasNextPage: Boolean(hasNextPage),
    isError: query.isError,
  };
}
