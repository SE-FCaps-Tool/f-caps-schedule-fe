"use client";

import { useMemo, useState, type RefObject } from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AsyncComboboxProps<T> {
  value: string | null;
  onChange: (value: string | null) => void;
  items: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  sentinelRef: RefObject<HTMLDivElement | null>;
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
 * Search lọc trong các item đã tải (client-side); kéo xuống cuối danh sách để tải thêm.
 */
export function AsyncCombobox<T>({
  value,
  onChange,
  items,
  getId,
  getLabel,
  sentinelRef,
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

  const selectedLabel = useMemo(() => {
    const found = items.find((item) => getId(item) === value);
    return found ? getLabel(found) : null;
  }, [items, value, getId, getLabel]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => getLabel(item).toLowerCase().includes(q));
  }, [items, search, getLabel]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn("w-full justify-between font-normal", !selectedLabel && "text-muted-foreground", className)}
          >
            <span className="truncate">{selectedLabel ?? placeholder}</span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-80 p-0">
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
                    onChange(isSelected ? null : id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                    isSelected && "bg-muted"
                  )}
                >
                  <Check className={cn("size-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{getLabel(item)}</span>
                </button>
              );
            })}
          {!search.trim() && <div ref={sentinelRef} className="h-1" aria-hidden />}
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
