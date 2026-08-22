"use client";

import { useId } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AlertTriangle, Trash2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CommitteeBulkCreateError,
  CommitteePreviewGroup,
} from "@/lib/api/services/fetchCommittees";
import type { DraftGroup, DraftMember } from "./builder-types";
import { toLecturerExternalId } from "./committee-ids";
import { MemberPicker } from "./member-picker";
import { SortableMemberRow } from "./sortable-member-row";

const MAX_CODE_LENGTH = 32;
const MIN_MEMBERS = 1;
const MAX_MEMBERS = 15;
const GROUP_TONES = [
  { badge: "bg-orange-100 text-orange-700", wash: "bg-orange-50/70" },
  { badge: "bg-sky-100 text-sky-700", wash: "bg-sky-50/70" },
  { badge: "bg-emerald-100 text-emerald-700", wash: "bg-emerald-50/70" },
  { badge: "bg-violet-100 text-violet-700", wash: "bg-violet-50/70" },
] as const;

export function CommitteeGroupCard({
  group,
  index,
  previewGroup,
  previewPending,
  duplicateCodeInBatch,
  createError,
  onCodeChange,
  onMembersChange,
  onRemoveGroup,
  canRemove,
}: {
  group: DraftGroup;
  index: number;
  previewGroup: CommitteePreviewGroup | undefined;
  previewPending: boolean;
  duplicateCodeInBatch: boolean;
  createError: CommitteeBulkCreateError | undefined;
  onCodeChange: (code: string) => void;
  onMembersChange: (members: DraftMember[]) => void;
  onRemoveGroup: () => void;
  canRemove: boolean;
}) {
  const codeInputId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const memberCountInvalid = group.members.length > 0 && group.members.length > MAX_MEMBERS;
  const codeEmpty = group.code.trim().length === 0;
  const memberCountTooLow = group.members.length > 0 && group.members.length < MIN_MEMBERS;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = group.members.findIndex((m) => m.externalId === active.id);
    const newIndex = group.members.findIndex((m) => m.externalId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onMembersChange(arrayMove(group.members, oldIndex, newIndex));
  }

  function handleAdd(lecturer: { id: number; lecturer_code: string; display_name: string }) {
    if (group.members.length >= MAX_MEMBERS) return;
    onMembersChange([
      ...group.members,
      {
        externalId: toLecturerExternalId(lecturer.id),
        lecturerCode: lecturer.lecturer_code,
        displayName: lecturer.display_name,
      },
    ]);
  }

  function handleRemoveMember(externalId: string) {
    onMembersChange(group.members.filter((m) => m.externalId !== externalId));
  }

  const excludeIds = new Set(group.members.map((m) => m.externalId));
  const backendErrors = previewGroup && !previewGroup.ok ? previewGroup.errors : [];
  const tone = GROUP_TONES[index % GROUP_TONES.length];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 sm:p-5",
        (createError || (previewGroup && !previewGroup.ok)) && "border-destructive/40 bg-destructive/3"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold", tone.badge)}>
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Nhóm hội đồng {index + 1}</p>
            <p className="text-xs text-muted-foreground">Gán vai trò theo thứ tự thành viên</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium tabular-nums",
              memberCountInvalid || memberCountTooLow
                ? "bg-destructive/10 text-destructive"
                : "bg-background text-muted-foreground"
            )}
          >
            <Users className="size-3" aria-hidden />
            {group.members.length}/{MAX_MEMBERS}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Xoá nhóm ${index + 1}`}
            onClick={onRemoveGroup}
            disabled={!canRemove}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(190px,0.34fr)_minmax(0,1fr)]">
        <div className={cn("rounded-lg p-3.5", tone.wash)}>
          <Label htmlFor={codeInputId}>Mã hội đồng</Label>
          <Input
            id={codeInputId}
            value={group.code}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase().slice(0, MAX_CODE_LENGTH))}
            placeholder="HD-REV-01"
            maxLength={MAX_CODE_LENGTH}
            aria-invalid={codeEmpty || duplicateCodeInBatch}
            className="mt-1.5 bg-background font-mono"
          />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Dùng mã ngắn, dễ nhận biết trong danh sách xếp lịch.
          </p>
          {duplicateCodeInBatch && (
            <p className="mt-2 flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="size-3" aria-hidden />
              Trùng mã với nhóm khác trong đợt tạo này
            </p>
          )}
        </div>

        <div className="min-w-0 lg:border-l lg:border-border lg:pl-5">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Thành viên <span className="font-normal">· kéo-thả để đổi vị trí</span>
          </p>
          <div className="space-y-1.5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={group.members.map((m) => m.externalId)}
              strategy={verticalListSortingStrategy}
            >
              {group.members.map((member) => {
                const memberPreview = previewGroup?.members.find(
                  (m) => m.lecturerId === member.externalId
                );
                return (
                  <SortableMemberRow
                    key={member.externalId}
                    member={member}
                    preview={memberPreview}
                    previewPending={previewPending}
                    onRemove={() => handleRemoveMember(member.externalId)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>

            {group.members.length === 0 && (
            <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border bg-background/60 px-3 py-6 text-center">
              <Users className="size-4 text-muted-foreground/50" aria-hidden />
              <p className="text-xs text-muted-foreground">
                Chưa có thành viên — thêm ít nhất 1 người
              </p>
            </div>
          )}

            <MemberPicker excludeExternalIds={excludeIds} onAdd={handleAdd} />
          </div>
        </div>
      </div>

      {backendErrors.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg bg-destructive/5 px-3 py-2">
          {backendErrors.map((err) => (
            <p key={err.code} className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden />
              {err.message}
            </p>
          ))}
        </div>
      )}

      {createError && (
        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden />
          {createError.message}
        </div>
      )}
    </div>
  );
}
