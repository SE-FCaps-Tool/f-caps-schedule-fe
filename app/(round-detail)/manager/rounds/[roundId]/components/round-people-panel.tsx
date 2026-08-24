"use client";

import { RoundLecturersPanel } from "./round-lecturers-panel";
import { RoundGroupsPanel } from "./round-groups-panel";
import type { RoundDetail } from "@/lib/api/services/fetchRounds";

/**
 * Sidebar phải hợp nhất — nửa trên Giảng viên, nửa dưới Nhóm, chia đôi cố định 50/50 kiểu
 * Messenger (mỗi nửa tự cuộn riêng). Trước đây là 2 CollapsibleAsidePanel tách biệt; giờ dùng
 * chung 1 panel đóng/mở để đỡ chiếm chiều ngang và người dùng không phải đóng/mở 2 lần.
 */
export function RoundPeoplePanel({
  roundId,
  round,
}: {
  roundId: string;
  round: RoundDetail;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden pb-3">
        <RoundLecturersPanel roundId={roundId} />
      </div>

      <div className="shrink-0 border-t border-border" />

      <div className="min-h-0 flex-1 overflow-hidden pt-3">
        <RoundGroupsPanel roundId={roundId} round={round} />
      </div>
    </div>
  );
}
