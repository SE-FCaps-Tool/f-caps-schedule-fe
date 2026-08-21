"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, DoorOpen, FileText, Lock, Settings2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot } from "@/app/(manager)/manager/_shared/status-dot";
import { ROUND_STATUS_META, ROUND_TYPE_LABEL } from "@/app/(manager)/manager/_shared/labels";
import { useSemesterContext } from "@/app/(manager)/manager/_shared/semester-context";
import { useRoundDetail, useUpdateRound } from "@/hooks/manager/useRounds";
import { formatDate, formatInVietnamTime, formatTimeRange } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils";
import { ErrorBlock } from "@/app/(round-detail)/manager/rounds/[roundId]/components/round-detail-shared";
import type { RoomType, RoundDetail, RoundType, RoundUpdatePayload } from "@/lib/api/services/fetchRounds";

const RESULT_OWNER_ALLOWED_TYPES = new Set<RoundType>(["DEFENSE_1_1", "DEFENSE_2"]);

const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  NORMAL: "Phòng thường",
  SEMINAR: "Seminar",
  LAB: "Lab",
};

const ROOM_TYPES: RoomType[] = ["NORMAL", "SEMINAR", "LAB"];

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  return formatInVietnamTime(iso, "YYYY-MM-DDTHH:mm");
}

function datetimeLocalToIso(value: string): string {
  return `${value}:00+07:00`;
}

function StepHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 pt-0.5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function EditRoundConfigForm({ round, backHref }: { round: RoundDetail; backHref: string }) {
  const router = useRouter();
  const updateRound = useUpdateRound();

  const [startDate, setStartDate] = useState(round.startDate);
  const [endDate, setEndDate] = useState(round.endDate);
  const [durationMinutes, setDurationMinutes] = useState(String(round.durationMinutes || ""));
  const [maxGroupsPerTimeslot, setMaxGroupsPerTimeslot] = useState(String(round.maxGroupsPerTimeslot || ""));
  const [registrationDeadline, setRegistrationDeadline] = useState(isoToDatetimeLocal(round.registrationDeadline));
  const [groupSelectionMode, setGroupSelectionMode] = useState(round.groupSelectionMode);
  const [resultOwnerMode, setResultOwnerMode] = useState(round.resultOwnerMode);
  const [roomTypes, setRoomTypes] = useState<Set<RoomType>>(new Set(round.roomTypes));

  function toggleRoomType(rt: RoomType) {
    setRoomTypes((prev) => {
      const next = new Set(prev);
      if (next.has(rt)) next.delete(rt);
      else next.add(rt);
      return next;
    });
  }

  const duration = Number(durationMinutes) || 0;
  const maxGroups = Number(maxGroupsPerTimeslot) || 0;
  const isValid =
    startDate !== "" &&
    endDate !== "" &&
    startDate <= endDate &&
    duration > 0 &&
    maxGroups > 0 &&
    registrationDeadline !== "" &&
    roomTypes.size >= 1;

  const totalSlots = round.days.reduce((sum, d) => sum + d.slots.length, 0);

  function handleSubmit() {
    if (!isValid) return;
    const payload: RoundUpdatePayload = {
      startDate,
      endDate,
      durationMinutes: duration,
      maxGroupsPerTimeslot: maxGroups,
      registrationDeadline: datetimeLocalToIso(registrationDeadline),
      groupSelectionMode,
      resultOwnerMode,
      roomTypes: Array.from(roomTypes),
    };
    updateRound.mutate(
      { roundId: round.id, payload },
      { onSuccess: () => router.push(backHref) },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col pb-10">
      <StepHeader
        icon={Settings2}
        title="Cấu hình đợt đánh giá"
        description="Thông số buổi, loại phòng và lịch đăng ký. Tên, loại đợt và khung giờ đã tạo không thể sửa ở đây."
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid md:grid-cols-2 md:divide-x md:divide-border lg:grid-cols-3">
          <div className="space-y-5 p-6">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Lock className="size-3.5 shrink-0" aria-hidden />
              Không thể sửa sau khi tạo
            </div>
            <div className="space-y-1.5">
              <Label>Tên đợt</Label>
              <Input value={round.name} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Loại đợt</Label>
              <Input value={ROUND_TYPE_LABEL[round.type]} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea value={round.description ?? ""} rows={4} disabled placeholder="Không có mô tả" />
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Timer className="size-3.5 shrink-0" aria-hidden />
                Thông số buổi
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Thời lượng</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="bg-background pr-11"
                      required
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                      phút
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Reviewer</Label>
                  <div className="relative">
                    <Input type="number" value={round.reviewerCount} disabled className="bg-background pr-14" />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                      /buổi
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nhóm tối đa</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      value={maxGroupsPerTimeslot}
                      onChange={(e) => setMaxGroupsPerTimeslot(e.target.value)}
                      className="bg-background pr-14"
                      required
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                      /slot
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Reviewer/buổi cố định theo loại đợt — BE từ chối nếu khác giá trị mặc định.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Loại phòng cho phép</Label>
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map((rt) => {
                  const active = roomTypes.has(rt);
                  return (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => toggleRoomType(rt)}
                      aria-pressed={active}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted",
                      )}
                    >
                      <DoorOpen className="size-3.5 shrink-0" aria-hidden />
                      {ROOM_TYPE_LABEL[rt]}
                    </button>
                  );
                })}
              </div>
              {roomTypes.size === 0 && <p className="text-xs text-destructive">Chọn ít nhất 1 loại phòng.</p>}
            </div>
          </div>

          <div className="space-y-4 border-t border-border p-6 md:col-span-2 md:border-l-0 lg:col-span-1 lg:border-t-0 lg:border-l lg:border-border">
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                groupSelectionMode ? "border-primary/40 bg-primary/5" : "border-border",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Nhóm tự chọn lịch</p>
                  <Switch checked={groupSelectionMode} onCheckedChange={setGroupSelectionMode} aria-label="Nhóm tự chọn lịch" />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Leader chọn slot ưu tiên cho nhóm thay vì Manager xếp toàn bộ.
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                !RESULT_OWNER_ALLOWED_TYPES.has(round.type)
                  ? "border-border opacity-50"
                  : resultOwnerMode
                    ? "border-primary/40 bg-primary/5"
                    : "border-border",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Chỉ định Result Owner</p>
                  <Switch
                    checked={resultOwnerMode}
                    onCheckedChange={setResultOwnerMode}
                    disabled={!RESULT_OWNER_ALLOWED_TYPES.has(round.type)}
                    aria-label="Chỉ định Result Owner"
                  />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {RESULT_OWNER_ALLOWED_TYPES.has(round.type)
                    ? "Một reviewer được chỉ định nhập kết quả chính thức cho buổi."
                    : "Chỉ áp dụng cho đợt Defense 1.1 / Defense 2."}
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Ngày bắt đầu</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Ngày kết thúc</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
              </div>
              {startDate !== "" && endDate !== "" && startDate > endDate && (
                <p className="text-xs text-destructive">Ngày kết thúc phải sau ngày bắt đầu.</p>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Hạn đăng ký chọn lịch</Label>
                <Input
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            Ngày &amp; khung giờ đã tạo
          </div>
          <p className="text-xs text-muted-foreground">
            {round.days.length} ngày · {totalSlots} khung giờ
          </p>
        </div>
        {round.days.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">Chưa có ngày/khung giờ nào.</p>
        ) : (
          <div className="max-h-64 space-y-3 overflow-y-auto px-6 py-4">
            {round.days.map((day) => (
              <div key={day.date} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="w-24 shrink-0 font-medium tabular-nums">{formatDate(day.date, "DD/MM")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {day.slots.map((slot) => (
                    <span
                      key={slot.id}
                      className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs tabular-nums text-muted-foreground"
                    >
                      {formatTimeRange(slot.startTime, slot.endTime)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">Thay đổi có hiệu lực ngay và áp dụng cho các thao tác xếp lịch tiếp theo.</p>
        <div className="flex items-center gap-3">
          <Button variant="outline" nativeButton={false} render={<Link href={backHref} />}>
            Hủy
          </Button>
          <Button type="button" disabled={!isValid || updateRound.isPending} onClick={handleSubmit}>
            {updateRound.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EditRoundConfigPage({ roundId }: { roundId: string }) {
  const router = useRouter();
  const { currentSemesterId } = useSemesterContext();
  const { data: round, isLoading, isError } = useRoundDetail(roundId);
  const backHref = `/manager/rounds/${roundId}${currentSemesterId ? `?semester=${currentSemesterId}` : ""}`;
  const canEditConfig = round ? round.status === "DRAFT" || round.status === "OPEN_REGISTRATION" : true;

  useEffect(() => {
    if (round && !canEditConfig) router.replace(backHref);
  }, [round, canEditConfig, router, backHref]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border px-6 py-4 md:px-8">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" />
          {round?.name ?? "Đợt đánh giá"}
        </Link>
        <div className="mt-1 flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight">Chỉnh sửa cấu hình đợt đánh giá</h1>
          {round && <StatusDot tone={ROUND_STATUS_META[round.status].tone} label={ROUND_STATUS_META[round.status].label} />}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8">
        {isLoading && (
          <div className="mx-auto w-full max-w-7xl space-y-4">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        )}
        {isError && (
          <div className="mx-auto w-full max-w-7xl">
            <ErrorBlock label="Không tải được đợt đánh giá. Thử tải lại trang." />
          </div>
        )}
        {round && canEditConfig && <EditRoundConfigForm key={round.id} round={round} backHref={backHref} />}
      </main>
    </div>
  );
}
