"use client";

import { useMemo } from "react";
import { AsyncCombobox } from "@/components/shared/async-combobox";
import { useLecturersInfinite } from "@/hooks/manager/useLecturers";
import type { LecturerApiItem } from "@/lib/api/services/fetchLecturers";
import { toLecturerExternalId } from "./committee-ids";

/**
 * Combobox "thêm thành viên" — không giữ 1 giá trị đang chọn (khác AsyncCombobox thường dùng
 * cho GVHD), mỗi lần chọn sẽ append vào danh sách của nhóm rồi combobox tự đóng lại. Giảng viên
 * đã có trong nhóm bị loại khỏi danh sách gợi ý để chặn trùng ngay trên UI.
 */
export function MemberPicker({
  excludeExternalIds,
  onAdd,
  disabled,
}: {
  excludeExternalIds: Set<string>;
  onAdd: (lecturer: LecturerApiItem) => void;
  disabled?: boolean;
}) {
  const { items, sentinelRef, isLoading, isFetchingNextPage } = useLecturersInfinite();

  const selectable = useMemo(
    () => items.filter((l) => !excludeExternalIds.has(toLecturerExternalId(l.id))),
    [items, excludeExternalIds]
  );

  return (
    <AsyncCombobox
      value={null}
      onChange={(id) => {
        if (!id) return;
        const lecturer = selectable.find((l) => String(l.id) === id);
        if (lecturer) onAdd(lecturer);
      }}
      items={selectable}
      getId={(l) => String(l.id)}
      getLabel={(l) => `${l.lecturerCode} — ${l.displayName}`}
      sentinelRef={sentinelRef}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      placeholder="Thêm thành viên..."
      searchPlaceholder="Tìm giảng viên..."
      emptyText="Không còn giảng viên phù hợp"
      disabled={disabled}
      className="border-dashed text-muted-foreground"
    />
  );
}
