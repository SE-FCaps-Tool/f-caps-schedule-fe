"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Layers3, Plus, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/shared/useDebouncedValue";
import { usePreviewCommittees, useCreateCommittees } from "@/hooks/useCommittees";
import type {
  CommitteeBulkCreateError,
  CommitteePreviewGroup,
} from "@/lib/api/services/fetchCommittees";
import { createDraftGroup, type DraftGroup, type DraftMember } from "./builder-types";
import { CommitteeGroupCard } from "./committee-group-card";

const MAX_MEMBERS = 15;

function isStructurallyValid(group: DraftGroup, duplicateCodes: Set<string>): boolean {
  const code = group.code.trim();
  if (!code || code.length > 32) return false;
  if (group.members.length < 1 || group.members.length > MAX_MEMBERS) return false;
  if (duplicateCodes.has(code.toUpperCase())) return false;
  return true;
}

function findDuplicateCodes(groups: DraftGroup[]): Set<string> {
  const counts = new Map<string, number>();
  for (const g of groups) {
    const code = g.code.trim().toUpperCase();
    if (!code) continue;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const duplicates = new Set<string>();
  counts.forEach((count, code) => {
    if (count > 1) duplicates.add(code);
  });
  return duplicates;
}

/**
 * Dialog rộng tạo hàng loạt Committee — nhiều nhóm cùng lúc, mỗi nhóm có mã + danh sách thành
 * viên kéo-thả sắp thứ tự (thứ tự quyết định role, BE tính, FE không tự suy). Preview debounce
 * mỗi khi nội dung đổi để hiển thị role/label thật + lỗi ngay trong lúc soạn. Cùng shell dialog
 * rộng (sticky header/footer, scroll ở giữa) với TimeframeDialog để đồng bộ với phần còn lại.
 */
export function CommitteeCreateDialog() {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<DraftGroup[]>([createDraftGroup()]);
  const [previewByKey, setPreviewByKey] = useState<Record<string, CommitteePreviewGroup>>({});
  const [createErrorsByKey, setCreateErrorsByKey] = useState<
    Record<string, CommitteeBulkCreateError>
  >({});

  const preview = usePreviewCommittees();
  const create = useCreateCommittees();

  const debouncedGroups = useDebouncedValue(groups, 500);
  const duplicateCodes = findDuplicateCodes(groups);

  useEffect(() => {
    if (!open) {
      // Dialog sở hữu draft này — reset khi đóng để lần mở kế tiếp bắt đầu sạch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroups([createDraftGroup()]);
      setPreviewByKey({});
      setCreateErrorsByKey({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const eligible = debouncedGroups.filter((g) => g.code.trim() && g.members.length > 0);
    // Không group nào sẵn sàng preview — bỏ qua, không cần dọn previewByKey: entry cũ chỉ được
    // đọc bởi member row của group đang hiển thị, group rỗng/xoá code không còn render row nào.
    if (eligible.length === 0) return;
    preview.mutate(
      {
        groups: eligible.map((g) => ({
          code: g.code.trim(),
          memberIds: g.members.map((m) => m.externalId),
        })),
      },
      {
        onSuccess: (data) => {
          const map: Record<string, CommitteePreviewGroup> = {};
          eligible.forEach((g, i) => {
            if (data.groups[i]) map[g.key] = data.groups[i];
          });
          setPreviewByKey(map);
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedGroups, open]);

  function updateGroup(key: string, patch: Partial<DraftGroup>) {
    setGroups((current) => current.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  }

  function addGroup() {
    setGroups((current) => [...current, createDraftGroup()]);
  }

  function removeGroup(key: string) {
    setGroups((current) => (current.length > 1 ? current.filter((g) => g.key !== key) : current));
  }

  const eligibleForSubmit = groups.filter((g) => isStructurallyValid(g, duplicateCodes));
  const skippedCount = groups.length - eligibleForSubmit.length;

  function handleSubmit() {
    if (eligibleForSubmit.length === 0) return;
    const submitted = eligibleForSubmit;
    create.mutate(
      {
        groups: submitted.map((g) => ({
          code: g.code.trim(),
          memberIds: g.members.map((m) => m.externalId),
        })),
      },
      {
        onSuccess: (data) => {
          const erroredKeys = new Set(data.errors.map((e) => submitted[e.index]?.key));
          setCreateErrorsByKey(
            Object.fromEntries(
              data.errors
                .map((e) => [submitted[e.index]?.key, e] as const)
                .filter(([key]) => key !== undefined)
            )
          );
          setGroups((current) => {
            const remaining = current.filter((g) => {
              const wasSubmitted = submitted.some((s) => s.key === g.key);
              if (!wasSubmitted) return true;
              return erroredKeys.has(g.key);
            });
            return remaining.length > 0 ? remaining : [createDraftGroup()];
          });
          if (data.skipped === 0 && data.created > 0 && skippedCount === 0) {
            setOpen(false);
          }
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus />
            Tạo hội đồng
          </Button>
        }
      />
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="sticky top-0 z-10 shrink-0 border-b border-border bg-popover px-5 py-4 pr-12 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" aria-hidden />
            </span>
            <div>
              <DialogTitle className="text-lg">Tạo hội đồng</DialogTitle>
              <DialogDescription>
                Thêm nhiều nhóm cùng lúc — kéo-thả để đổi thứ tự thành viên, thứ tự quyết định vai
                trò. Vai trò luôn tính từ backend, cập nhật ngay khi bạn chỉnh sửa.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-b border-border bg-muted/25 px-5 py-3 text-xs text-muted-foreground sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <Layers3 className="size-3.5 text-primary" aria-hidden />
            {groups.length} nhóm đang soạn
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5 text-sky-600" aria-hidden />
            Tối đa {MAX_MEMBERS} thành viên / nhóm
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
            {eligibleForSubmit.length} nhóm sẵn sàng
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 p-5 sm:p-6">
            {groups.map((group, index) => (
              <CommitteeGroupCard
                key={group.key}
                group={group}
                index={index}
                previewGroup={previewByKey[group.key]}
                previewPending={preview.isPending}
                duplicateCodeInBatch={duplicateCodes.has(group.code.trim().toUpperCase())}
                createError={createErrorsByKey[group.key]}
                onCodeChange={(code) => updateGroup(group.key, { code })}
                onMembersChange={(members: DraftMember[]) => updateGroup(group.key, { members })}
                onRemoveGroup={() => removeGroup(group.key)}
                canRemove={groups.length > 1}
              />
            ))}

            <button
              type="button"
              onClick={addGroup}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/15 py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="size-4" aria-hidden />
              Thêm nhóm hội đồng
            </button>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 z-10 mx-0 mb-0 shrink-0 border-border bg-popover px-5 sm:px-6">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {skippedCount > 0 ? (
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-4 shrink-0" aria-hidden />
                  {eligibleForSubmit.length} nhóm sẵn sàng tạo, {skippedCount} nhóm chưa hợp lệ sẽ
                  bị bỏ qua
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" aria-hidden />
                  {eligibleForSubmit.length} nhóm sẵn sàng tạo
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={eligibleForSubmit.length === 0 || create.isPending}
              >
                {create.isPending ? "Đang tạo..." : `Tạo ${eligibleForSubmit.length || ""} hội đồng`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
