"use client";

import type { Committee } from "@/lib/api/services/fetchCommittees";
import { CommitteeCard } from "./committee-card";

export function CommitteesGrid({
  committees,
  selectedIds,
  onSelectedIdsChange,
}: {
  committees: Committee[];
  selectedIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
}) {
  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedIdsChange(next);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {committees.map((committee) => (
        <CommitteeCard
          key={committee.id}
          committee={committee}
          selected={selectedIds.has(committee.id)}
          onSelectedChange={() => toggleOne(committee.id)}
        />
      ))}
    </div>
  );
}
