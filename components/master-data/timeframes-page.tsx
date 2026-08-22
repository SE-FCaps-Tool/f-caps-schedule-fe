"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Coffee,
  Eye,
  History,
  LoaderCircle,
  Pencil,
  Plus,
  TimerReset,
  Trash2,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type ManualTimeline,
  type ManualTimeframeMutationRequest,
  type TimeframeBreakWindow,
  type Timeframe,
  type TimeframeMutationRequest,
  type TimeframePreview,
} from "@/lib/api/services/fetchTimeframes";
import {
  useArchiveTimeframe,
  useCreateManualTimeframe,
  useCreateTimeframe,
  useManualTimeframePreview,
  useTimeframePreview,
  useTimeframes,
  useUpdateManualTimeframe,
  useUpdateTimeframe,
} from "@/hooks/useTimeframes";
import { cn } from "@/lib/utils";

type TimeframeDraft = TimeframeMutationRequest;
type CreationMode = "choose" | "quick" | "manual";

const EMPTY_DRAFT: TimeframeDraft = {
  name: "",
  type: "COUNCIL",
  startTime: "07:00",
  endTime: "17:30",
  blockDurationMinutes: 135,
  groupDurationMinutes: 45,
  breakBetweenBlocksMinutes: 0,
  breakWindows: [
    { name: "Nghỉ trưa", startTime: "11:45", endTime: "13:00" },
  ],
  reason: "",
};

const DEFAULT_BREAK_WINDOW: TimeframeBreakWindow = {
  name: "Nghỉ trưa",
  startTime: "11:45",
  endTime: "13:00",
};

function toApiTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

function displayTime(value: string) {
  return value.slice(0, 5);
}

function normalizeBreakWindow(breakWindows?: TimeframeBreakWindow[]) {
  const breakWindow = breakWindows?.[0];
  return [
    {
      name: DEFAULT_BREAK_WINDOW.name,
      startTime: breakWindow?.startTime
        ? displayTime(breakWindow.startTime)
        : DEFAULT_BREAK_WINDOW.startTime,
      endTime: breakWindow?.endTime
        ? displayTime(breakWindow.endTime)
        : DEFAULT_BREAK_WINDOW.endTime,
    },
  ];
}

function minutesToTime(minutes: number) {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, minutes));
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(
    normalized % 60,
  ).padStart(2, "0")}`;
}

function addMinutesToTime(value: string, minutes: number) {
  return minutesToTime(timeToMinutes(value) + minutes);
}

function getManualTimelines(timeframe: Timeframe | null): ManualTimeline[] {
  if (timeframe?.manualTimelines?.length) {
    return timeframe.manualTimelines.map((timeline) => ({
      startTime: displayTime(timeline.startTime),
      endTime: displayTime(timeline.endTime),
      groupsPerSlot: timeline.groupsPerSlot,
    }));
  }

  if (timeframe?.blocks?.length) {
    return timeframe.blocks.map((block) => ({
      startTime: displayTime(block.startTime),
      endTime: displayTime(block.endTime),
      groupsPerSlot: block.groupSlots.length,
    }));
  }

  return [{ startTime: "07:00", endTime: "07:45", groupsPerSlot: 1 }];
}

function getQuickDraft(timeframe: Timeframe | null): TimeframeDraft {
  if (!timeframe) return EMPTY_DRAFT;
  return {
    name: timeframe.name,
    type: "COUNCIL",
    startTime: displayTime(timeframe.startTime),
    endTime: displayTime(timeframe.endTime),
    blockDurationMinutes: Math.max(
      1,
      timeframe.blockDurationMinutes ?? timeframe.groupDurationMinutes,
    ),
    groupDurationMinutes: timeframe.groupDurationMinutes,
    breakBetweenBlocksMinutes: timeframe.breakBetweenBlocksMinutes ?? 0,
    breakWindows: normalizeBreakWindow(timeframe.breakWindows),
    reason: "",
  };
}

function getManualTimelinesFromPreview(preview: TimeframePreview): ManualTimeline[] {
  if (preview.manualTimelines?.length) {
    return preview.manualTimelines.map((timeline) => ({
      startTime: displayTime(timeline.startTime),
      endTime: displayTime(timeline.endTime),
      groupsPerSlot: timeline.groupsPerSlot,
    }));
  }

  return preview.blocks.map((block) => ({
    startTime: displayTime(block.startTime),
    endTime: displayTime(block.endTime),
    groupsPerSlot: block.groupSlots.length,
  }));
}

function getManualTimelineErrors(
  timelines: ManualTimeline[],
  groupDurationMinutes: number,
) {
  const errors: Array<string | null> = timelines.map(() => null);

  if (groupDurationMinutes <= 0) {
    return timelines.map(() => "Thời lượng mỗi nhóm phải lớn hơn 0.");
  }

  timelines.forEach((timeline, index) => {
    const start = timeToMinutes(timeline.startTime);
    const end = timeToMinutes(timeline.endTime);
    if (end <= start) {
      errors[index] = "Giờ kết thúc phải sau giờ bắt đầu.";
    } else if (timeline.groupsPerSlot <= 0) {
      errors[index] = "Số nhóm phải lớn hơn 0.";
    } else if (end - start !== groupDurationMinutes * timeline.groupsPerSlot) {
      errors[index] = `Timeline cần đúng ${formatDuration(
        groupDurationMinutes * timeline.groupsPerSlot,
      )}.`;
    }
  });

  const sorted = timelines
    .map((timeline, index) => ({ timeline, index }))
    .sort((a, b) => a.timeline.startTime.localeCompare(b.timeline.startTime));
  sorted.forEach((entry, sortedIndex) => {
    const previous = sorted[sortedIndex - 1];
    if (
      previous &&
      timeToMinutes(entry.timeline.startTime) <
        timeToMinutes(previous.timeline.endTime)
    ) {
      errors[entry.index] = "Timeline đang chồng lên timeline trước.";
    }
  });

  return errors;
}

function getManualValidationError(
  timelines: ManualTimeline[],
  groupDurationMinutes: number,
) {
  if (groupDurationMinutes <= 0) return "Thời lượng mỗi nhóm phải lớn hơn 0.";
  if (timelines.length === 0) return "Thêm ít nhất một timeline.";
  return getManualTimelineErrors(timelines, groupDurationMinutes).find(Boolean) ?? null;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

function timeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

const TIME_PRESETS = ["07:00", "11:45", "12:00", "13:00", "17:30"];

function padTimePart(value: number) {
  return String(value).padStart(2, "0");
}

function splitTime(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return { hours, minutes };
}

function TimeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { hours, minutes } = splitTime(value);

  function updateTime(nextHours: number, nextMinutes: number) {
    onChange(`${padTimePart(nextHours)}:${padTimePart(nextMinutes)}`);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger
          render={
            <button
              id={id}
              type="button"
              className="flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          }
        >
          <Clock3 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="flex-1 text-left font-medium tabular-nums">{value}</span>
          <span className="text-xs text-muted-foreground">Chọn</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Chọn {label.toLowerCase()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Giờ local, định dạng 24h</p>
            </div>
            <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold tabular-nums text-primary">{value}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              Giờ
              <select
                aria-label={`${label} - giờ`}
                value={hours}
                onChange={(event) => updateTime(Number(event.target.value), minutes)}
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour} value={hour}>{padTimePart(hour)}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Phút
              <select
                aria-label={`${label} - phút`}
                value={minutes}
                onChange={(event) => updateTime(hours, Number(event.target.value))}
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                {Array.from({ length: 60 }, (_, minute) => (
                  <option key={minute} value={minute}>{padTimePart(minute)}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">Mốc thường dùng</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange(preset)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs tabular-nums transition-colors hover:bg-muted",
                    preset === value ? "border-primary/40 bg-primary/10 text-primary" : "border-border",
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function validateDraft(draft: TimeframeDraft) {
  if (!draft.startTime || !draft.endTime)
    return "Chọn đủ giờ bắt đầu và kết thúc.";
  if (timeToMinutes(draft.endTime) <= timeToMinutes(draft.startTime))
    return "Giờ kết thúc phải sau giờ bắt đầu.";
  if (draft.blockDurationMinutes <= 0 || draft.groupDurationMinutes <= 0)
    return "Thời lượng phải lớn hơn 0.";
  if ((draft.breakBetweenBlocksMinutes ?? 0) < 0)
    return "Thời gian nghỉ giữa slot không được âm.";

  const dayStart = timeToMinutes(draft.startTime);
  const dayEnd = timeToMinutes(draft.endTime);
  const sortedBreaks = [...(draft.breakWindows ?? [])].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  for (const [index, breakWindow] of sortedBreaks.entries()) {
    const start = timeToMinutes(breakWindow.startTime);
    const end = timeToMinutes(breakWindow.endTime);
    if (!breakWindow.name.trim()) return `Khoảng nghỉ ${index + 1} cần có tên.`;
    if (end <= start) return `Khoảng nghỉ “${breakWindow.name}” chưa hợp lệ.`;
    if (start < dayStart || end > dayEnd)
      return `Khoảng nghỉ “${breakWindow.name}” phải nằm trong khung giờ áp dụng.`;
    const previous = sortedBreaks[index - 1];
    if (previous && start < timeToMinutes(previous.endTime))
      return `Khoảng nghỉ “${breakWindow.name}” đang chồng lên một khoảng khác.`;
  }
  return null;
}

function SummaryMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number | null;
  tone?: "default" | "accent" | "warning";
}) {
  return (
    <div className="min-w-0 rounded-lg bg-background/70 px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-semibold tabular-nums",
          tone === "accent" && "text-primary",
          tone === "warning" && "text-amber-700 dark:text-amber-400",
        )}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

function PreviewPanel({
  preview,
  isPending,
  error,
  editableTimelines,
  editableGroupDurationMinutes,
  onTimelineChange,
  onAddTimeline,
  onRemoveTimeline,
  timelineEditorInitiallyOpen = false,
  validationMessage,
}: {
  preview: TimeframePreview | undefined;
  isPending: boolean;
  error: unknown;
  editableTimelines?: ManualTimeline[];
  editableGroupDurationMinutes?: number;
  onTimelineChange?: (
    index: number,
    field: keyof ManualTimeline,
    value: string | number,
  ) => void;
  onAddTimeline?: () => void;
  onRemoveTimeline?: (index: number) => void;
  timelineEditorInitiallyOpen?: boolean;
  validationMessage?: string | null;
}) {
  const [isTimelineEditorOpen, setIsTimelineEditorOpen] = useState(
    timelineEditorInitiallyOpen,
  );
  const canEditTimelines = Boolean(
    editableTimelines &&
      editableGroupDurationMinutes !== undefined &&
      onTimelineChange &&
      onAddTimeline &&
      onRemoveTimeline,
  );
  const editableTimelineErrors =
    editableTimelines && editableGroupDurationMinutes !== undefined
      ? getManualTimelineErrors(editableTimelines, editableGroupDurationMinutes)
      : [];

  if (isPending && !canEditTimelines) {
    return (
      <div className="flex h-full min-h-80 flex-col justify-center rounded-xl border border-dashed border-primary/30 bg-primary/[0.035] p-5">
        <LoaderCircle
          className="size-5 animate-spin text-primary"
          aria-hidden
        />
        <p className="mt-3 text-sm font-medium">Đang tính lịch trong ngày…</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Preview lấy trực tiếp từ API để đảm bảo khớp với scheduler.
        </p>
      </div>
    );
  }

  if (error && !canEditTimelines) {
    return (
      <div className="flex h-full min-h-80 flex-col justify-center rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
        <AlertTriangle
          className="size-5 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <p className="mt-3 text-sm font-medium">Chưa thể tính preview</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Kiểm tra lại khung giờ, thời lượng slot/nhóm và khoảng nghỉ trưa.
        </p>
      </div>
    );
  }

  if (!preview && !canEditTimelines) {
    return (
      <div className="flex h-full min-h-80 flex-col justify-center rounded-xl border border-dashed border-border bg-muted/20 p-5">
        <Waves className="size-5 text-muted-foreground" aria-hidden />
        <p className="mt-3 text-sm font-medium">Preview sẽ xuất hiện ở đây</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
          Điền đủ mốc giờ và thời lượng để xem sức chứa, slot và khoảng nghỉ.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-80 min-w-0 flex-col overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.035] p-4 sm:min-h-0 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-primary">Kết quả tính thử</p>
          <p className="mt-1 text-sm font-semibold">Một ngày có thể xếp</p>
        </div>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            isPending
              ? "bg-primary/15 text-primary"
              : error
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "bg-primary text-primary-foreground",
          )}
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : error ? (
            <AlertTriangle className="size-4" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
        </span>
      </div>

      <div className="mt-3 min-h-5">
        {isPending && canEditTimelines && (
          <p className="flex items-center gap-1.5 text-xs text-primary">
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
            Đang cập nhật kết quả từ timeline mới…
          </p>
        )}
        {Boolean(error) && canEditTimelines && (
          <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="size-3.5" aria-hidden />
            Không thể cập nhật preview, bạn vẫn có thể tiếp tục chỉnh timeline.
          </p>
        )}
      </div>
      {validationMessage && (
        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-2 text-xs leading-5 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {validationMessage} Preview vẫn giữ theo lần hợp lệ gần nhất và sẽ
            tự cập nhật khi timeline hợp lệ.
          </span>
        </div>
      )}

      {preview ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <SummaryMetric
            label="Slot / ngày"
            value={preview.blocksPerDay}
            tone="accent"
          />
          <SummaryMetric
            label="Nhóm / slot"
            value={preview.groupsPerBlock ?? "Không đều"}
          />
          <SummaryMetric
            label="Sức chứa / ngày"
            value={`${preview.capacityPerDay} nhóm`}
            tone="accent"
          />
          <SummaryMetric
            label="Tổng thời gian nghỉ"
            value={formatDuration(preview.totalBreakMinutes ?? 0)}
            tone={preview.totalBreakMinutes ? "warning" : "default"}
          />
          <SummaryMetric
            label="Nghỉ giữa slot"
            value={formatDuration(preview.appliedBlockBreakMinutes ?? 0)}
          />
          <SummaryMetric
            label="Thời gian dư"
            value={formatDuration(preview.unusedMinutes)}
            tone={preview.unusedMinutes ? "warning" : "default"}
          />
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-background/60 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          Kết quả sẽ cập nhật sau khi bạn hoàn tất chỉnh timeline.
        </div>
      )}

      {preview && (
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                Timeline trong ngày
              </p>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {displayTime(preview.startTime)} — {displayTime(preview.endTime)}
              </span>
            </div>
            {canEditTimelines && (
              <div className="flex shrink-0 items-center gap-1.5">
                {isTimelineEditorOpen && onAddTimeline && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={onAddTimeline}
                  >
                    <Plus />
                    Thêm slot
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setIsTimelineEditorOpen((current) => !current)}
                >
                  {isTimelineEditorOpen ? <Check /> : <Pencil />}
                  {isTimelineEditorOpen ? "Xong" : "Chỉnh sửa"}
                </Button>
              </div>
            )}
          </div>
          <div
            aria-label="Timeline các slot trong ngày"
            className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 [scrollbar-gutter:stable]"
          >
            {Array.from(
              {
                length:
                  isTimelineEditorOpen && editableTimelines
                    ? editableTimelines.length
                    : preview.blocks.length,
              },
              (_, index) => {
              const block = preview.blocks[index];
              const editableTimeline = editableTimelines?.[index];
              const canEditRow =
                isTimelineEditorOpen &&
                editableTimeline &&
                onTimelineChange;
              const startTime = editableTimeline?.startTime ?? block?.startTime ?? preview.startTime;
              const endTime = editableTimeline?.endTime ?? block?.endTime ?? preview.endTime;
              const groupCount =
                block?.groupSlots.length ?? editableTimeline?.groupsPerSlot ?? 0;

              return (
                <div
                  key={`timeline-row-${index}`}
                  className="rounded-lg border border-border/70 bg-background px-2.5 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                      {index + 1}
                    </span>
                    {canEditRow ? (
                      <>
                        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_70px] gap-1.5">
                          <Input
                            aria-label={`Timeline ${index + 1} bắt đầu`}
                            type="time"
                            value={editableTimeline.startTime}
                            onChange={(event) =>
                              onTimelineChange(index, "startTime", event.target.value)
                            }
                            className="h-8 min-w-0 px-2 text-xs tabular-nums"
                          />
                          <Input
                            aria-label={`Timeline ${index + 1} kết thúc`}
                            type="time"
                            value={editableTimeline.endTime}
                            onChange={(event) =>
                              onTimelineChange(index, "endTime", event.target.value)
                            }
                            className="h-8 min-w-0 px-2 text-xs tabular-nums"
                          />
                          <Input
                            aria-label={`Timeline ${index + 1} số nhóm`}
                            type="number"
                            min={1}
                            step={1}
                            value={editableTimeline.groupsPerSlot}
                            onChange={(event) =>
                              onTimelineChange(
                                index,
                                "groupsPerSlot",
                                Number(event.target.value),
                              )
                            }
                            className="h-8 min-w-0 px-2 text-xs tabular-nums"
                          />
                        </div>
                        {onRemoveTimeline && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Xóa timeline ${index + 1}`}
                            title="Xóa timeline"
                            onClick={() => onRemoveTimeline(index)}
                            disabled={editableTimelines.length === 1}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium tabular-nums">
                            {displayTime(startTime)} — {displayTime(endTime)}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {groupCount} nhóm
                          </span>
                        </div>
                        <div className="mt-1 flex gap-1">
                          {block?.groupSlots.slice(0, 4).map((slot) => (
                            <span
                              key={slot.sequenceNumber}
                              className="h-1.5 flex-1 rounded-full bg-primary/25"
                              title={`${displayTime(slot.startTime)} — ${displayTime(slot.endTime)}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {canEditRow && editableTimelineErrors[index] && (
                    <p className="mt-1.5 pl-8 text-[11px] text-destructive">
                      {editableTimelineErrors[index]}
                    </p>
                  )}
                </div>
              );
              },
            )}
          </div>
          {(preview.breakWindows?.length ?? 0) > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="mr-1 font-medium text-muted-foreground">Khoảng nghỉ</span>
              {preview.breakWindows?.map((breakWindow) => (
                <span
                  key={`${breakWindow.name}-${breakWindow.startTime}`}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-800 dark:text-amber-300"
                >
                  <Coffee className="size-3" aria-hidden />
                  {breakWindow.name} · {displayTime(breakWindow.startTime)} — {displayTime(breakWindow.endTime)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {preview && preview.unusedMinutes > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-xs leading-5 text-amber-800 dark:text-amber-300">
          <TimerReset className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            Còn {formatDuration(preview.unusedMinutes)} cuối ngày chưa đủ một
            slot. Vẫn có thể lưu cấu hình.
          </span>
        </div>
      )}
    </div>
  );
}

function CreationModePicker({
  onChoose,
}: {
  onChoose: (mode: Exclude<CreationMode, "choose">) => void;
}) {
  return (
    <div className="min-h-0 flex-1 animate-in fade-in-0 slide-in-from-bottom-1 overflow-y-auto duration-300 motion-reduce:animate-none">
      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock3 className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-xs font-semibold text-primary">Bắt đầu cấu hình</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Chọn cách tạo timeframe phù hợp
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Bạn có thể xem preview ngay lập tức và điều chỉnh từng slot trước khi
            lưu cấu hình.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChoose("quick")}
          className="group flex min-h-56 flex-col rounded-2xl border border-primary/40 bg-primary/[0.035] p-6 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-start justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Clock3 className="size-5" aria-hidden />
            </span>
            <span className="flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </span>
          <span className="mt-7 block text-lg font-semibold tracking-tight">
            Tạo nhanh
          </span>
          <span className="mt-2 block text-sm leading-6 text-muted-foreground">
            Nhập khung giờ và công thức, hệ thống tự sinh timeline để bạn rà soát
            và chỉnh sửa.
          </span>
          <span className="mt-auto flex items-center gap-2 pt-6 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            Preview tự động từ khung giờ và công thức
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChoose("manual")}
          className="group flex min-h-56 flex-col rounded-2xl border border-border bg-card p-6 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-start justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-foreground text-background">
              <Pencil className="size-5" aria-hidden />
            </span>
            <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </span>
          <span className="mt-7 block text-lg font-semibold tracking-tight">
            Tạo thủ công
          </span>
          <span className="mt-2 block text-sm leading-6 text-muted-foreground">
            Tự nhập từng timeline, số nhóm và thời lượng theo lịch thực tế của bạn.
          </span>
          <span className="mt-auto flex items-center gap-2 pt-6 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-foreground/50" aria-hidden />
            Kiểm soát từng slot
          </span>
        </button>
        </div>
      </div>
    </div>
  );
}

function ManualTimelineEditor({
  name,
  reason,
  groupDurationMinutes,
  onNameChange,
  onReasonChange,
  onGroupDurationChange,
}: {
  name: string;
  reason: string;
  groupDurationMinutes: number;
  onNameChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onGroupDurationChange: (value: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="manual-timeframe-name">Tên hiển thị</Label>
        <Input
          id="manual-timeframe-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Hội đồng tùy chỉnh"
          autoFocus
          required
        />
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <TimerReset className="size-4 text-primary" aria-hidden />
          <p className="text-sm font-medium">Cách chia thời gian</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Thời lượng mỗi nhóm được dùng để kiểm tra từng timeline bạn nhập.
        </p>
        <div className="mt-3 max-w-[180px] space-y-1.5">
          <Label htmlFor="manual-group-duration">Thời lượng mỗi nhóm</Label>
          <div className="relative">
            <Input
              id="manual-group-duration"
              type="number"
              min={1}
              step={1}
              value={groupDurationMinutes}
              onChange={(event) => onGroupDurationChange(Number(event.target.value))}
              className="pr-16"
              required
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
              phút
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="manual-timeframe-reason">
          Ghi chú thay đổi{" "}
          <span className="font-normal text-muted-foreground">(tùy chọn)</span>
        </Label>
        <Textarea
          id="manual-timeframe-reason"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Ví dụ: Điều chỉnh timeline theo lịch phòng"
          className="min-h-20 resize-none"
        />
      </div>
    </div>
  );
}

function TimeframeDialog({
  open,
  onOpenChange,
  timeframe,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeframe: Timeframe | null;
}) {
  const [mode, setMode] = useState<CreationMode>(() =>
    timeframe ? (timeframe.manualTimelines ? "manual" : "quick") : "choose",
  );
  const [draft, setDraft] = useState<TimeframeDraft>(() =>
    getQuickDraft(timeframe),
  );
  const [manualTimelines, setManualTimelines] = useState<ManualTimeline[]>(() =>
    getManualTimelines(timeframe),
  );
  const [quickTimelines, setQuickTimelines] = useState<ManualTimeline[]>([]);
  const [quickTimelinesDirty, setQuickTimelinesDirty] = useState(false);
  const [lastQuickPreview, setLastQuickPreview] = useState<TimeframePreview>();
  const [lastManualPreview, setLastManualPreview] = useState<TimeframePreview>();
  const {
    data: previewData,
    error: previewError,
    isPending: previewPending,
    mutate: requestPreview,
    reset: resetPreview,
  } = useTimeframePreview();
  const {
    data: manualPreviewData,
    error: manualPreviewError,
    isPending: manualPreviewPending,
    mutate: requestManualPreview,
    reset: resetManualPreview,
  } = useManualTimeframePreview();
  const create = useCreateTimeframe();
  const update = useUpdateTimeframe();
  const createManual = useCreateManualTimeframe();
  const updateManual = useUpdateManualTimeframe();
  const validationError = useMemo(() => validateDraft(draft), [draft]);
  const manualValidationError = useMemo(
    () => getManualValidationError(manualTimelines, draft.groupDurationMinutes),
    [draft.groupDurationMinutes, manualTimelines],
  );
  const quickTimelineValidationError = useMemo(
    () => getManualValidationError(quickTimelines, draft.groupDurationMinutes),
    [draft.groupDurationMinutes, quickTimelines],
  );
  const usesManualPreview = mode === "manual" || quickTimelinesDirty;
  const activeValidationError = usesManualPreview
    ? mode === "manual"
      ? manualValidationError
      : quickTimelineValidationError ?? validationError
    : validationError;
  const latestQuickPreview = previewData ?? lastQuickPreview;
  const latestManualPreview = manualPreviewData ?? lastManualPreview;
  const activePreview = usesManualPreview
    ? latestManualPreview ?? latestQuickPreview
    : latestQuickPreview;
  const activePreviewPending = activeValidationError
    ? false
    : usesManualPreview
      ? manualPreviewPending
      : previewPending;
  const activePreviewError = activeValidationError
    ? null
    : usesManualPreview
      ? manualPreviewError
      : previewError;
  const isSaving =
    create.isPending ||
    update.isPending ||
    createManual.isPending ||
    updateManual.isPending;

  useEffect(() => {
    if (!open) {
      // The dialog owns this draft state and must reset it when the dialog closes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(timeframe ? (timeframe.manualTimelines ? "manual" : "quick") : "choose");
      setDraft(getQuickDraft(timeframe));
      setManualTimelines(getManualTimelines(timeframe));
      setQuickTimelines([]);
      setQuickTimelinesDirty(false);
      setLastQuickPreview(undefined);
      setLastManualPreview(undefined);
    }
  }, [open, timeframe]);

  useEffect(() => {
    if (mode === "quick" && previewData && !quickTimelinesDirty) {
      // Preview data is the external source for the editable timeline draft.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuickTimelines(getManualTimelinesFromPreview(previewData));
    }
  }, [mode, previewData, quickTimelinesDirty]);
  const previewPayload = useMemo(
    () => ({
      startTime: toApiTime(draft.startTime),
      endTime: toApiTime(draft.endTime),
      blockDurationMinutes: draft.blockDurationMinutes,
      groupDurationMinutes: draft.groupDurationMinutes,
      breakBetweenBlocksMinutes: draft.breakBetweenBlocksMinutes ?? 0,
      breakWindows: normalizeBreakWindow(draft.breakWindows).map(
        (breakWindow) => ({
          name: breakWindow.name,
          startTime: toApiTime(breakWindow.startTime),
          endTime: toApiTime(breakWindow.endTime),
        }),
      ),
    }),
    [
      draft.startTime,
      draft.endTime,
      draft.blockDurationMinutes,
      draft.groupDurationMinutes,
      draft.breakBetweenBlocksMinutes,
      draft.breakWindows,
    ],
  );
  const manualPreviewPayload = useMemo(
    () => ({
      groupDurationMinutes: draft.groupDurationMinutes,
      timelines: manualTimelines.map((timeline) => ({
        startTime: toApiTime(timeline.startTime),
        endTime: toApiTime(timeline.endTime),
        groupsPerSlot: timeline.groupsPerSlot,
      })),
    }),
    [draft.groupDurationMinutes, manualTimelines],
  );

  useEffect(() => {
    if (!open || mode === "choose") {
      resetPreview();
      resetManualPreview();
      if (mode === "choose") {
        // Clear cached results when switching creation modes.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLastQuickPreview(undefined);
        setLastManualPreview(undefined);
      }
      return;
    }

    if (activeValidationError) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (usesManualPreview) {
        requestManualPreview(manualPreviewPayload, {
          onSuccess: (data) => setLastManualPreview(data),
        });
      } else {
        requestPreview(previewPayload, {
          onSuccess: (data) => setLastQuickPreview(data),
        });
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
  open,
    mode,
    validationError,
    activeValidationError,
    usesManualPreview,
    previewPayload,
    manualPreviewPayload,
    requestPreview,
    requestManualPreview,
    resetPreview,
    resetManualPreview,
  ]);

  function setField<K extends keyof TimeframeDraft>(
    field: K,
    value: TimeframeDraft[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateBreakTime(field: "startTime" | "endTime", value: string) {
    setDraft((current) => ({
      ...current,
      breakWindows: [
        {
          ...(normalizeBreakWindow(current.breakWindows)[0] ?? DEFAULT_BREAK_WINDOW),
          name: DEFAULT_BREAK_WINDOW.name,
          [field]: value,
        },
      ],
    }));
  }

  function updateManualTimeline(
    index: number,
    field: keyof ManualTimeline,
    value: string | number,
  ) {
    setManualTimelines((current) =>
      current.map((timeline, currentIndex) =>
        currentIndex === index ? { ...timeline, [field]: value } : timeline,
      ),
    );
  }

  function addManualTimeline() {
    setManualTimelines((current) => {
      if (current.length >= 50) return current;
      const last = current[current.length - 1];
      const startTime = last?.endTime ?? draft.startTime;
      const duration = Math.max(1, draft.groupDurationMinutes);
      return [
        ...current,
        {
          startTime,
          endTime: addMinutesToTime(startTime, duration),
          groupsPerSlot: 1,
        },
      ];
    });
  }

  function removeManualTimeline(index: number) {
    setManualTimelines((current) =>
      current.length > 1 ? current.filter((_, currentIndex) => currentIndex !== index) : current,
    );
  }

  function selectMode(nextMode: Exclude<CreationMode, "choose">) {
    if (nextMode === "quick") {
      setQuickTimelines([]);
      setQuickTimelinesDirty(false);
    }
    setMode(nextMode);
  }

  function updateQuickTimeline(
    index: number,
    field: keyof ManualTimeline,
    value: string | number,
  ) {
    setQuickTimelinesDirty(true);
    setQuickTimelines((current) =>
      current.map((timeline, currentIndex) =>
        currentIndex === index ? { ...timeline, [field]: value } : timeline,
      ),
    );
  }

  function addQuickTimeline() {
    setQuickTimelinesDirty(true);
    setQuickTimelines((current) => {
      if (current.length >= 50) return current;
      const last = current[current.length - 1];
      const startTime = last?.endTime ?? draft.startTime;
      const duration = Math.max(1, draft.groupDurationMinutes);
      return [
        ...current,
        {
          startTime,
          endTime: addMinutesToTime(startTime, duration),
          groupsPerSlot: 1,
        },
      ];
    });
  }

  function removeQuickTimeline(index: number) {
    setQuickTimelinesDirty(true);
    setQuickTimelines((current) =>
      current.length > 1 ? current.filter((_, currentIndex) => currentIndex !== index) : current,
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "choose" || !draft.name.trim()) return;

    const options = { onSuccess: () => onOpenChange(false) };
    if (mode === "manual" || quickTimelinesDirty) {
      const timelines = mode === "manual" ? manualTimelines : quickTimelines;
      const timelineValidationError =
        mode === "manual"
          ? manualValidationError
          : quickTimelineValidationError;
      if (timelineValidationError) return;
      const payload: ManualTimeframeMutationRequest = {
        name: draft.name.trim(),
        type: "COUNCIL",
        groupDurationMinutes: draft.groupDurationMinutes,
        timelines: timelines.map((timeline) => ({
          startTime: toApiTime(timeline.startTime),
          endTime: toApiTime(timeline.endTime),
          groupsPerSlot: timeline.groupsPerSlot,
        })),
        reason: draft.reason?.trim() || null,
      };
      if (timeframe) updateManual.mutate({ id: timeframe.id, payload }, options);
      else createManual.mutate(payload, options);
      return;
    }

    if (validationError) return;
    const payload: TimeframeMutationRequest = {
      ...draft,
      name: draft.name.trim(),
      type: "COUNCIL",
      startTime: toApiTime(draft.startTime),
      endTime: toApiTime(draft.endTime),
      breakBetweenBlocksMinutes: draft.breakBetweenBlocksMinutes ?? 0,
      breakWindows: normalizeBreakWindow(draft.breakWindows).map(
        (breakWindow) => ({
          name: breakWindow.name,
          startTime: toApiTime(breakWindow.startTime),
          endTime: toApiTime(breakWindow.endTime),
        }),
      ),
      reason: draft.reason?.trim() || null,
    };
    if (timeframe) update.mutate({ id: timeframe.id, payload }, options);
    else create.mutate(payload, options);
  }

  const isChoosing = !timeframe && mode === "choose";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[calc(100dvh-1rem)] flex-col gap-0 overflow-hidden p-0"
        style={{
          maxWidth: isChoosing
            ? "min(42rem, calc(100% - 2rem))"
            : "min(72rem, calc(100% - 2rem))",
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogHeader
            icon={Clock3}
            iconTone="primary"
            className="sticky top-0 z-10 shrink-0 border-b border-border bg-popover px-5 py-4 pr-12 sm:px-6"
          >
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>
                {timeframe
                  ? "Chỉnh sửa timeframe"
                  : mode === "manual"
                    ? "Tạo timeframe thủ công"
                    : mode === "quick"
                      ? "Tạo timeframe nhanh"
                      : "Tạo timeframe"}
              </DialogTitle>
              {!timeframe && mode !== "choose" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setMode("choose")}
                >
                  <ArrowLeft />
                  Đổi cách tạo
                </Button>
              )}
            </div>
            <DialogDescription>
              {mode === "manual"
                ? "Tự thiết kế từng timeline, backend sẽ kiểm tra và tính sức chứa."
                : mode === "quick"
                  ? "Nhập công thức, backend sẽ sinh timeline nháp trước khi lưu."
                  : "Chọn cách tạo phù hợp với lịch đánh giá của bạn."}
            </DialogDescription>
          </DialogHeader>

          {!timeframe && mode === "choose" ? (
            <CreationModePicker key="choose" onChoose={selectMode} />
          ) : mode === "manual" ? (
            <div
              key="manual"
              className="min-h-0 flex-1 animate-in fade-in-0 slide-in-from-bottom-1 overflow-y-auto duration-300 motion-reduce:animate-none"
            >
              <div className="grid items-stretch gap-6 p-5 sm:p-6 lg:grid-cols-2">
                <ManualTimelineEditor
                  name={draft.name}
                  reason={draft.reason ?? ""}
                  groupDurationMinutes={draft.groupDurationMinutes}
                  onNameChange={(value) => setField("name", value)}
                  onReasonChange={(value) => setField("reason", value)}
                  onGroupDurationChange={(value) =>
                    setField("groupDurationMinutes", value)
                  }
                />
                <PreviewPanel
                  preview={manualPreviewData}
                  isPending={manualPreviewPending}
                  error={manualPreviewError}
                  editableTimelines={manualTimelines}
                  editableGroupDurationMinutes={draft.groupDurationMinutes}
                  onTimelineChange={updateManualTimeline}
                  onAddTimeline={addManualTimeline}
                  onRemoveTimeline={removeManualTimeline}
                  validationMessage={manualValidationError}
                />
              </div>
            </div>
          ) : (
          <div
            key="quick"
            className="min-h-0 flex-1 animate-in fade-in-0 slide-in-from-bottom-1 overflow-y-auto duration-300 motion-reduce:animate-none"
          >
            <div className="grid items-stretch gap-6 p-5 sm:p-6 lg:grid-cols-2">
              <div className="space-y-5">
                <div>
                <div className="space-y-1.5">
                  <Label htmlFor="timeframe-name">Tên hiển thị</Label>
                  <Input
                    id="timeframe-name"
                    value={draft.name}
                    onChange={(event) => setField("name", event.target.value)}
                    placeholder="Hội đồng cả ngày"
                    autoFocus
                    required
                  />
                </div>
                </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4 text-primary" aria-hidden />
                  <p className="text-sm font-medium">Khung giờ áp dụng mỗi ngày</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chọn theo giờ 24h để tránh nhầm AM/PM.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <TimeField
                    id="timeframe-start"
                    label="Bắt đầu"
                    value={draft.startTime}
                    onChange={(value) => setField("startTime", value)}
                  />
                  <TimeField
                    id="timeframe-end"
                    label="Kết thúc"
                    value={draft.endTime}
                    onChange={(value) => setField("endTime", value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <TimerReset className="size-4 text-primary" aria-hidden />
                  <p className="text-sm font-medium">Cách chia thời gian</p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="slot-duration">Thời lượng 01 slot</Label>
                    <div className="relative">
                      <Input
                        id="slot-duration"
                        type="number"
                        min={1}
                        step={1}
                        value={draft.blockDurationMinutes}
                        onChange={(event) =>
                          setField(
                            "blockDurationMinutes",
                            Number(event.target.value),
                          )
                        }
                        className="pr-16"
                        required
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                        phút
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="group-duration">Thời lượng mỗi nhóm</Label>
                    <div className="relative">
                      <Input
                        id="group-duration"
                        type="number"
                        min={1}
                        step={1}
                        value={draft.groupDurationMinutes}
                        onChange={(event) =>
                          setField(
                            "groupDurationMinutes",
                            Number(event.target.value),
                          )
                        }
                        className="pr-16"
                        required
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                        phút
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="slot-break-duration">Nghỉ giữa slot</Label>
                    <div className="relative">
                      <Input
                        id="slot-break-duration"
                        type="number"
                        min={0}
                        step={1}
                        value={draft.breakBetweenBlocksMinutes ?? 0}
                        onChange={(event) =>
                          setField(
                            "breakBetweenBlocksMinutes",
                            Number(event.target.value),
                          )
                        }
                        className="pr-16"
                        required
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                        phút
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Slot phải chia hết cho thời lượng mỗi nhóm. Nghỉ giữa slot chỉ
                  áp dụng giữa hai slot liên tiếp.
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <Coffee className="size-4 text-amber-600" aria-hidden />
                  <div>
                    <p className="text-sm font-medium">Nghỉ trưa</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Slot có thể bắt đầu ngay sau mốc nghỉ, ví dụ 11:45.
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <TimeField
                    id="break-start"
                    label="Bắt đầu nghỉ"
                    value={normalizeBreakWindow(draft.breakWindows)[0].startTime}
                    onChange={(value) => updateBreakTime("startTime", value)}
                  />
                  <TimeField
                    id="break-end"
                    label="Kết thúc nghỉ"
                    value={normalizeBreakWindow(draft.breakWindows)[0].endTime}
                    onChange={(value) => updateBreakTime("endTime", value)}
                  />
                </div>
              </div>

              {validationError && (
                <p className="flex items-center gap-2 text-xs text-destructive">
                  <AlertTriangle className="size-3.5" aria-hidden />
                  {validationError}
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="timeframe-reason">
                  Ghi chú thay đổi{" "}
                  <span className="font-normal text-muted-foreground">
                    (tùy chọn)
                  </span>
                </Label>
                <Textarea
                  id="timeframe-reason"
                  value={draft.reason ?? ""}
                  onChange={(event) => setField("reason", event.target.value)}
                  placeholder="Ví dụ: Cấu hình chuẩn cho hội đồng học kỳ mới"
                  className="min-h-20 resize-none"
                />
              </div>
            </div>

              <PreviewPanel
                preview={activePreview}
                isPending={activePreviewPending}
                error={activePreviewError}
                editableTimelines={
                  quickTimelines.length > 0 ? quickTimelines : undefined
                }
                editableGroupDurationMinutes={draft.groupDurationMinutes}
                onTimelineChange={updateQuickTimeline}
                onAddTimeline={addQuickTimeline}
                onRemoveTimeline={removeQuickTimeline}
                validationMessage={activeValidationError}
              />
            </div>
          </div>
          )}

          <DialogFooter className="sticky bottom-0 z-10 mx-0 mb-0 shrink-0 border-border bg-popover px-5 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            {mode !== "choose" && (
              <Button
                type="submit"
                disabled={
                  isSaving ||
                  !draft.name.trim() ||
                  (mode === "manual"
                    ? manualValidationError !== null || !manualPreviewData
                    : validationError !== null || !previewData)
                }
              >
                {isSaving && (
                  <LoaderCircle className="animate-spin" aria-hidden />
                )}
                {timeframe ? "Lưu thay đổi" : "Tạo timeframe"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ArchiveDialog({
  timeframe,
  open,
  onOpenChange,
}: {
  timeframe: Timeframe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const archive = useArchiveTimeframe();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!timeframe || !reason.trim()) return;
    archive.mutate(
      { id: timeframe.id, reason: reason.trim() },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader icon={Archive} iconTone="amber">
            <DialogTitle>Archive timeframe?</DialogTitle>
            <DialogDescription>
              “{timeframe?.name}” sẽ không còn xuất hiện trong danh sách đang
              dùng. Lịch sử version vẫn được giữ lại.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="archive-reason">Lý do</Label>
            <Textarea
              id="archive-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Nhập lý do archive"
              className="min-h-20 resize-none"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!reason.trim() || archive.isPending}
            >
              {archive.isPending ? "Đang archive…" : "Archive timeframe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TimeframeDetailDialog({
  timeframe,
  open,
  onOpenChange,
  onEdit,
}: {
  timeframe: Timeframe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}) {
  if (!timeframe) return null;

  const lunchBreak = timeframe.breakWindows?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader icon={Eye} iconTone="sky">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <DialogTitle className="truncate">{timeframe.name}</DialogTitle>
              <DialogDescription>
                Chi tiết cấu hình khung giờ đang dùng.
              </DialogDescription>
            </div>
            <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Đang dùng
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-xl border border-primary/20 bg-primary/[0.035] p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock3 className="size-4 text-primary" aria-hidden />
              {displayTime(timeframe.startTime)} — {displayTime(timeframe.endTime)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Khung giờ áp dụng mỗi ngày
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryMetric
              label="Slot / ngày"
              value={timeframe.blocksPerDay}
              tone="accent"
            />
            <SummaryMetric label="Nhóm / slot" value={timeframe.groupsPerBlock} />
            <SummaryMetric
              label="Sức chứa"
              value={`${timeframe.capacityPerDay} nhóm`}
              tone="accent"
            />
            <SummaryMetric
              label="Nghỉ giữa slot"
              value={formatDuration(timeframe.appliedBlockBreakMinutes ?? 0)}
            />
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <Coffee className="size-4 text-amber-600" aria-hidden />
              <p className="text-sm font-medium">Nghỉ trưa</p>
            </div>
            <p className="mt-2 text-sm tabular-nums">
              {lunchBreak
                ? `${displayTime(lunchBreak.startTime)} — ${displayTime(lunchBreak.endTime)}`
                : "Chưa cấu hình"}
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Timeline trong ngày</p>
              <span className="text-xs text-muted-foreground">
                {timeframe.blocks.length} slot
              </span>
            </div>
            <div className="max-h-[19rem] space-y-1.5 overflow-y-auto pr-1">
              {timeframe.blocks.map((slot) => (
                <div
                  key={slot.sequenceNumber}
                  className="flex items-center gap-2 rounded-lg border border-border/70 bg-background px-2.5 py-2"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                    {slot.sequenceNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium tabular-nums">
                        {displayTime(slot.startTime)} — {displayTime(slot.endTime)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {slot.groupSlots.length} nhóm
                      </span>
                    </div>
                    <div className="mt-1 flex gap-1">
                      {slot.groupSlots.slice(0, 4).map((groupSlot) => (
                        <span
                          key={groupSlot.sequenceNumber}
                          className="h-1.5 flex-1 rounded-full bg-primary/25"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button type="button" onClick={onEdit}>
            <Pencil />
            Chỉnh sửa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TimeframeCard({
  timeframe,
  onView,
  onEdit,
  onArchive,
}: {
  timeframe: Timeframe;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const lunchBreak = timeframe.breakWindows?.[0];

  return (
    <article className="group flex min-h-56 flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40">
      <button
        type="button"
        onClick={onView}
        className="flex flex-1 flex-col p-4 text-left outline-none transition-colors hover:bg-muted/20 focus-visible:bg-muted/20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock3 className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-semibold">{timeframe.name}</p>
              <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                Đang dùng
              </span>
            </div>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              {displayTime(timeframe.startTime)} — {displayTime(timeframe.endTime)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div>
            <p className="text-[11px] text-muted-foreground">Slot</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              {timeframe.blocksPerDay}/ngày
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Nhóm</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              {timeframe.groupsPerBlock}/slot
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Sức chứa</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-primary">
              {timeframe.capacityPerDay}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5 text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-1">
            {timeframe.breakBetweenBlocksMinutes ?? 0} phút giữa slot
          </span>
          {lunchBreak && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-amber-800 dark:text-amber-300">
              <Coffee className="size-3" aria-hidden />
              {displayTime(lunchBreak.startTime)} — {displayTime(lunchBreak.endTime)}
            </span>
          )}
        </div>
      </button>

      <div className="flex items-center justify-end gap-1 border-t border-border bg-muted/20 px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Xem chi tiết ${timeframe.name}`}
          title="Xem chi tiết"
          onClick={onView}
        >
          <Eye />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Chỉnh sửa ${timeframe.name}`}
          title="Chỉnh sửa"
          onClick={onEdit}
        >
          <Pencil />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Lưu trữ ${timeframe.name}`}
          title="Lưu trữ"
          onClick={onArchive}
        >
          <Archive />
        </Button>
      </div>
    </article>
  );
}

export function TimeframesPage({
  backHref,
  backLabel = "Cấu hình",
}: {
  backHref: string;
  backLabel?: string;
}) {
  const { data: timeframes, isLoading, isError, refetch } = useTimeframes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Timeframe | null>(null);
  const [viewing, setViewing] = useState<Timeframe | null>(null);
  const [archiving, setArchiving] = useState<Timeframe | null>(null);

  function openEditor(timeframe: Timeframe | null) {
    setEditing(timeframe);
    setDialogOpen(true);
  }

  return (
    <div>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock3 className="size-5" aria-hidden />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">Timeframe</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cấu hình khung giờ dùng chung cho toàn hệ thống. Mỗi thay đổi tạo
            một version mới, không ảnh hưởng lịch đã có.
          </p>
        </div>
        <Button
          onClick={() => {
            openEditor(null);
          }}
        >
          <Plus />
          Tạo timeframe
        </Button>
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Đang sử dụng</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {timeframes
                ? `${timeframes.length} cấu hình`
                : "Đang tải danh sách…"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <History className="size-3.5" aria-hidden />
            Version được lưu tự động
          </div>
        </div>
        {isLoading && (
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        )}
        {isError && (
          <div className="mt-3 flex flex-col items-center justify-center gap-3 rounded-xl border border-border px-4 py-14 text-center">
            <AlertTriangle
              className="size-5 text-muted-foreground"
              aria-hidden
            />
            <p className="text-sm text-muted-foreground">
              Không tải được danh sách timeframe.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        )}
        {!isLoading && !isError && timeframes?.length === 0 && (
          <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-14 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Clock3 className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-medium">Chưa có timeframe nào</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              Tạo cấu hình đầu tiên để chuẩn hoá khung giờ và sức chứa cho các
              ngày đánh giá.
            </p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => {
                openEditor(null);
              }}
            >
              <Plus />
              Tạo timeframe
            </Button>
          </div>
        )}
        {!isLoading && !isError && timeframes && timeframes.length > 0 && (
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {timeframes.map((timeframe) => (
              <TimeframeCard
                key={timeframe.id}
                timeframe={timeframe}
                onView={() => setViewing(timeframe)}
                onEdit={() => openEditor(timeframe)}
                onArchive={() => setArchiving(timeframe)}
              />
            ))}
          </div>
        )}
      </div>

      <TimeframeDetailDialog
        timeframe={viewing}
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
        onEdit={() => {
          if (!viewing) return;
          const timeframe = viewing;
          setViewing(null);
          openEditor(timeframe);
        }}
      />
      <TimeframeDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        timeframe={editing}
      />
      <ArchiveDialog
        key={archiving?.id ?? "none"}
        timeframe={archiving}
        open={archiving !== null}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
      />
    </div>
  );
}
