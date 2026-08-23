"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/shared/useDebouncedValue";
import { cn } from "@/lib/utils";

interface AsyncComboboxProps<T> {
  value: string | null;
  onChange: (value: string | null) => void;
  items: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  /** Bỏ trống khi danh sách đã nằm hết trong `items` (không phân trang). */
  sentinelRef?: RefObject<HTMLDivElement | null>;
  /**
   * Có truyền = search chạy phía server: ô tìm kiếm được debounce rồi báo ra ngoài để caller
   * đổi query, component không lọc lại client (BE đã lọc trên TOÀN bộ dữ liệu, không chỉ các
   * trang đã tải). Bỏ trống = lọc client trong `items`.
   */
  onSearchChange?: (search: string) => void;
  /** Nhãn của giá trị đang chọn khi item đó không nằm trong `items` hiện tại (vd. đã bị search thu hẹp). */
  selectedLabelFallback?: string;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Dropdown tìm kiếm + load-more theo scroll cho danh sách dài (giảng viên, đề tài, phòng...).
 * Dùng cùng hooks/shared/useInfiniteScroll.ts — truyền thẳng `items`/`sentinelRef` từ hook đó.
 * Kéo xuống cuối danh sách để tải thêm; xem `onSearchChange` để chọn search client hay server.
 */
export function AsyncCombobox<T>({
  value,
  onChange,
  items,
  getId,
  getLabel,
  sentinelRef,
  onSearchChange,
  selectedLabelFallback,
  isLoading,
  isFetchingNextPage,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
  emptyText = "Không có kết quả.",
  className,
  disabled,
}: AsyncComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const serverSearch = Boolean(onSearchChange);

  const debouncedSearch = useDebouncedValue(search);
  const onSearchChangeRef = useRef(onSearchChange);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  });
  useEffect(() => {
    onSearchChangeRef.current?.(debouncedSearch.trim());
  }, [debouncedSearch]);

  /** Giữ nhãn đã chọn để trigger không rơi về placeholder khi item đó bị search đẩy khỏi `items`. */
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);
  const selectedLabel = useMemo(() => {
    const found = items.find((item) => getId(item) === value);
    if (found) return getLabel(found);
    if (value === null) return null;
    return pickedLabel ?? selectedLabelFallback ?? null;
  }, [items, value, getId, getLabel, pickedLabel, selectedLabelFallback]);

  const filtered = useMemo(() => {
    if (serverSearch || !search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => getLabel(item).toLowerCase().includes(q));
  }, [items, search, getLabel, serverSearch]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSearch("");
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn("w-full min-w-0 justify-between font-normal", !selectedLabel && "text-muted-foreground", className)}
          >
            {/* min-w-0: Button là inline-flex + whitespace-nowrap, thiếu nó thì `truncate` không cắt
                được, min-content phình theo nhãn dài và đẩy tràn cả dialog/grid bọc ngoài. */}
            <span className="min-w-0 truncate">{selectedLabel ?? placeholder}</span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      {/* Rộng bằng đúng ô chọn (--anchor-width của Base UI positioner) để nhãn dài đỡ bị cắt,
          nhưng không hẹp hơn 18rem khi trigger nằm trong cột hẹp. */}
      <PopoverContent align="start" className="w-(--anchor-width) min-w-72 p-0">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-7 border-0 p-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tải...
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
          )}
          {!isLoading &&
            filtered.map((item) => {
              const id = getId(item);
              const isSelected = id === value;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setPickedLabel(isSelected ? null : getLabel(item));
                    onChange(isSelected ? null : id);
                    handleOpenChange(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                    isSelected && "bg-muted"
                  )}
                >
                  <Check className={cn("size-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 truncate">{getLabel(item)}</span>
                </button>
              );
            })}
          {/* Search server vẫn phân trang trên kết quả đã lọc nên giữ sentinel; search client thì
              không, vì trang chưa tải không được lọc — cuộn thêm chỉ ra kết quả lệch. */}
          {sentinelRef && (serverSearch || !search.trim()) && <div ref={sentinelRef} className="h-1" aria-hidden />}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Đang tải thêm...
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
