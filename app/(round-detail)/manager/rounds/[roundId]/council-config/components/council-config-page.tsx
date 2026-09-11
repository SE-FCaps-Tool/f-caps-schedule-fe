"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  CalendarClock,
  Check,
  ChevronLeft,
  Crown,
  Info,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusDot } from "@/app/(manager)/manager/_shared/status-dot";
import { ROUND_STATUS_META, ROUND_TYPE_LABEL } from "@/app/(manager)/manager/_shared/labels";
import { useSemesterContext } from "@/app/(manager)/manager/_shared/semester-context";
import {
  useRoundDetail,
  useCouncilConfig,
  useUpdateCouncilConfig,
} from "@/hooks/manager/useRounds";
import { useLecturers } from "@/hooks/manager/useLecturers";
import { ErrorBlock, LoadingBlock, StatBlock } from "../../components/round-detail-shared";
import { formatDate } from "@/lib/utils/formatDate";
import type { CouncilChairConfig, CouncilSecretaryConfig, CouncilConfig } from "@/lib/api/services/fetchRounds";
import type { LecturerApiItem } from "@/lib/api/services/fetchLecturers";

/** Modal chọn giảng viên được thiết kế theo đúng quy chuẩn Dialog của hệ thống */
function LecturerPickerModal({
  open,
  onOpenChange,
  title,
  description,
  lecturers,
  existingIds,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  lecturers: LecturerApiItem[];
  existingIds: Set<number>;
  onSelect: (lecturerId: number) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lecturers.slice(0, 100);
    return lecturers
      .filter(
        (l) =>
          l.displayName.toLowerCase().includes(q) ||
          l.lecturerCode.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q)
      )
      .slice(0, 100);
  }, [lecturers, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-4 p-5 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, mã giảng viên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
            autoFocus
          />
        </div>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40 rounded-lg border border-border/70">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Không tìm thấy giảng viên phù hợp
            </div>
          ) : (
            filtered.map((l) => {
              const isSelected = existingIds.has(Number(l.id));
              return (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {l.lecturerCode}
                      </span>
                      <p className="truncate text-sm font-medium text-foreground">{l.displayName}</p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{l.email}</p>
                  </div>
                  {isSelected ? (
                    <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                      <Check className="size-3 text-primary" />
                      Đã thêm
                    </Badge>
                  ) : (
                    <Button
                      size="xs"
                      variant="outline"
                      className="shrink-0 gap-1"
                      onClick={() => {
                        onSelect(Number(l.id));
                      }}
                    >
                      <Plus className="size-3" />
                      Chọn
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CouncilConfigPage({ roundId }: { roundId: string }) {
  const reduceMotion = useReducedMotion();
  const { currentSemesterId } = useSemesterContext();
  const { data: round, isLoading: roundLoading, isError: roundError } = useRoundDetail(roundId);
  const { data: config, isLoading: configLoading, isError: configError } = useCouncilConfig(roundId);
  const { data: lecturers, isLoading: lecturersLoading } = useLecturers();
  const updateConfig = useUpdateCouncilConfig();

  const [chairs, setChairs] = useState<CouncilChairConfig[]>([]);
  const [secretaries, setSecretaries] = useState<CouncilSecretaryConfig[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [prevConfig, setPrevConfig] = useState<CouncilConfig | null | undefined>(null);

  // Dialog states
  const [chairPickerOpen, setChairPickerOpen] = useState(false);
  const [secPickerOpen, setSecPickerOpen] = useState(false);

  if (config !== prevConfig) {
    setPrevConfig(config);
    if (config) {
      setChairs(JSON.parse(JSON.stringify(config.chairs || [])));
      setSecretaries(JSON.parse(JSON.stringify(config.secretaries || [])));
      setHasUnsavedChanges(false);
    }
  }

  const lecturerMap = useMemo(() => {
    const map = new Map<number, LecturerApiItem>();
    if (lecturers) {
      lecturers.forEach((l) => map.set(Number(l.id), l));
    }
    return map;
  }, [lecturers]);

  // Handle Chairs
  const handleAddChair = (lecturerId: number) => {
    if (chairs.some((c) => c.lecturerId === lecturerId)) return;
    setChairs([...chairs, { lecturerId, dailyQuota: {} }]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveChair = (lecturerId: number) => {
    setChairs(chairs.filter((c) => c.lecturerId !== lecturerId));
    setHasUnsavedChanges(true);
  };

  const handleUpdateChairDailyQuota = (lecturerId: number, date: string, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    setChairs(
      chairs.map((c) => {
        if (c.lecturerId === lecturerId) {
          const newDaily = { ...(c.dailyQuota || {}) };
          newDaily[date] = numValue;
          const newTotal = Object.values(newDaily).reduce((acc, val) => acc + (val || 0), 0);
          return { ...c, dailyQuota: newDaily, quota: newTotal };
        }
        return c;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Handle Secretaries
  const handleAddSecretary = (lecturerId: number) => {
    if (secretaries.some((s) => s.lecturerId === lecturerId)) return;
    setSecretaries([...secretaries, { lecturerId, maxSessions: 10 }]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveSecretary = (lecturerId: number) => {
    setSecretaries(secretaries.filter((s) => s.lecturerId !== lecturerId));
    setHasUnsavedChanges(true);
  };

  const handleUpdateSecQuota = (lecturerId: number, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    setSecretaries(
      secretaries.map((s) => (s.lecturerId === lecturerId ? { ...s, maxSessions: numValue } : s))
    );
    setHasUnsavedChanges(true);
  };

  const handleApplyBulkSecQuota = (quota: number) => {
    setSecretaries(secretaries.map((s) => ({ ...s, maxSessions: quota })));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    updateConfig.mutate(
      { roundId, payload: { chairs, secretaries } },
      {
        onSuccess: () => setHasUnsavedChanges(false),
      }
    );
  };

  if (roundLoading || configLoading || lecturersLoading) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <LoadingBlock />
        </div>
      </div>
    );
  }

  if (roundError || configError || !round) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <div className="flex-1 p-6">
          <ErrorBlock label="Không tải được dữ liệu phân vai Hội đồng. Vui lòng thử lại." />
        </div>
      </div>
    );
  }

  const statusMeta = ROUND_STATUS_META[round.status];
  const roundName = round.name || `${ROUND_TYPE_LABEL[round.type]} — ${currentSemesterId}`;
  const roundDates = round.days.map((d) => d.date).sort();
  const totalSlots = round.days.reduce((acc, d) => acc + d.slots.length, 0);
  const totalAssignedChairSessions = chairs.reduce((acc, c) => acc + (c.quota || 0), 0);

  // Map slots per date
  const slotsPerDate = new Map<string, number>();
  round.days.forEach((d) => slotsPerDate.set(d.date, d.slots.length));

  // Existing IDs sets for pickers
  const existingChairIds = new Set(chairs.map((c) => c.lecturerId));
  const existingSecIds = new Set(secretaries.map((s) => s.lecturerId));

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.985 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-dvh flex-col overflow-hidden bg-background"
    >
      {/* 1. Header chuẩn của app */}
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-2 md:px-6">
        <Link
          href={`/manager/rounds/${roundId}`}
          aria-label="Quay lại chi tiết round"
          title="Quay lại chi tiết round"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-5" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="truncate text-base font-semibold tracking-tight">Phân vai Hội đồng</h1>
            <StatusDot tone={statusMeta.tone} label={statusMeta.label} className="shrink-0" />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{roundName}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href={`/manager/rounds/${roundId}`} />}
          >
            Quay lại đợt
          </Button>
          <Button
            size="sm"
            disabled={!hasUnsavedChanges || updateConfig.isPending}
            onClick={handleSave}
            className="gap-1.5 min-w-[120px]"
          >
            {updateConfig.isPending ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <Save className="size-4" />
            )}
            Lưu cấu hình
          </Button>
        </div>
      </header>

      {/* 2. Workspace Content */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Thông báo hướng dẫn ngắn gọn */}
          <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 p-3.5 text-xs text-muted-foreground">
            <Info className="size-4 shrink-0 text-primary mt-0.5" />
            <div className="leading-relaxed">
              Cấu hình phân vai hỗ trợ chỉ định đích danh giảng viên đảm nhận các vị trí đặc thù:
              <strong className="text-foreground font-semibold"> Chủ tịch (Tier 1)</strong> ngồi ở vị trí Sequence 1 theo định mức từng ngày, và
              <strong className="text-foreground font-semibold"> Thư ký (Tier 2)</strong> ngồi ở vị trí Sequence 2 được thuật toán ưu tiên tối đa phân công.
            </div>
          </div>

          {/* Metrics summary thống kê chuẩn theo style của website */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <StatBlock
                label="Tổng số suất đánh giá"
                value={`${totalSlots} suất`}
                icon={CalendarClock}
                tone="sky"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {round.days.length} ngày chấm · {totalSlots} phiên cần xếp
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="flex items-start justify-between">
                <StatBlock
                  label="Chủ tịch (Tier 1)"
                  value={`${totalAssignedChairSessions} / ${totalSlots}`}
                  icon={Crown}
                  tone={
                    totalAssignedChairSessions === totalSlots
                      ? "emerald"
                      : totalAssignedChairSessions < totalSlots
                        ? "amber"
                        : "orange"
                  }
                />
                {totalAssignedChairSessions === totalSlots ? (
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
                    Đủ suất
                  </Badge>
                ) : totalAssignedChairSessions < totalSlots ? (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                    Thiếu {totalSlots - totalAssignedChairSessions}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs">
                    Dư {totalAssignedChairSessions - totalSlots}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {chairs.length} giảng viên được phân công làm Chủ tịch
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="flex items-start justify-between">
                <StatBlock
                  label="Thư ký (Tier 2)"
                  value={`${secretaries.length} người`}
                  icon={UserCheck}
                  tone="emerald"
                />
                <Badge variant="secondary" className="text-xs font-normal">
                  Ưu tiên xếp lịch
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Công suất tối đa: {secretaries.reduce((acc, s) => acc + (s.maxSessions ?? 0), 0)} buổi
              </p>
            </div>
          </div>

          {/* Tab bar variant="line" đồng bộ toàn bộ app */}
          <Tabs defaultValue="chairs" className="w-full space-y-6">
            <div className="border-b border-border/70">
              <TabsList variant="line" className="gap-6 bg-transparent p-0">
                <TabsTrigger value="chairs" className="gap-2 pb-3 pt-1 text-sm font-medium">
                  <Crown className="size-4 text-amber-500" />
                  <span>Chủ tịch Hội đồng (Tier 1)</span>
                  <Badge variant="secondary" className="ml-1 text-xs font-normal">
                    {chairs.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="secretaries" className="gap-2 pb-3 pt-1 text-sm font-medium">
                  <UserCheck className="size-4 text-emerald-500" />
                  <span>Thư ký Hội đồng (Tier 2)</span>
                  <Badge variant="secondary" className="ml-1 text-xs font-normal">
                    {secretaries.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: CHỦ TỊCH */}
            <TabsContent value="chairs" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Chỉ định Chủ tịch và hạn mức số buổi theo từng ngày
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Chủ tịch sẽ ngồi ở vị trí Sequence 1 trong phiên đánh giá. Nhập số buổi tối đa mà giảng viên sẽ tham gia trong từng ngày.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setChairPickerOpen(true)}
                    className="gap-1.5"
                  >
                    <Plus className="size-4" />
                    Thêm Chủ tịch
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[300px]">Giảng viên</TableHead>
                      {roundDates.map((date) => (
                        <TableHead key={date} className="text-center min-w-[90px]">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-foreground">{formatDate(date, "DD/MM")}</span>
                            <span className="text-[11px] font-normal text-muted-foreground">
                              {formatDate(date, "dddd")} ({slotsPerDate.get(date) ?? 0} suất)
                            </span>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-semibold w-[90px]">Tổng buổi</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chairs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={roundDates.length + 3} className="p-0">
                          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 mb-3">
                              <Crown className="size-6" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Chưa có Chủ tịch nào được chỉ định</h3>
                            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                              Bấm &ldquo;Thêm Chủ tịch&rdquo; để chọn thầy cô vào nhóm Tier 1 và cấu hình hạn mức buổi cho từng ngày.
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-4 gap-1.5"
                              onClick={() => setChairPickerOpen(true)}
                            >
                              <Plus className="size-4" />
                              Thêm Chủ tịch
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      chairs.map((c, idx) => {
                        const l = lecturerMap.get(c.lecturerId);
                        return (
                          <TableRow key={`chair-${c.lecturerId}-${idx}`} className="hover:bg-muted/30">
                            <TableCell>
                              {l ? (
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      {l.lecturerCode}
                                    </span>
                                    <p className="font-medium text-foreground text-sm">{l.displayName}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{l.email}</p>
                                </div>
                              ) : (
                                <span className="font-mono text-xs">ID #{c.lecturerId}</span>
                              )}
                            </TableCell>
                            {roundDates.map((date) => (
                              <TableCell key={date} className="text-center">
                                <Input
                                  type="number"
                                  min={0}
                                  max={slotsPerDate.get(date) ?? 99}
                                  className="h-8 w-16 mx-auto text-center font-medium tabular-nums"
                                  value={c.dailyQuota?.[date] ?? 0}
                                  onChange={(e) =>
                                    handleUpdateChairDailyQuota(c.lecturerId, date, e.target.value)
                                  }
                                />
                              </TableCell>
                            ))}
                            <TableCell className="text-center font-bold text-primary tabular-nums">
                              {c.quota || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                title="Xóa khỏi danh sách Chủ tịch"
                                onClick={() => handleRemoveChair(c.lecturerId)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>

                  {chairs.length > 0 && (
                    <tfoot>
                      <tr className="border-t border-border/70 bg-muted/30 text-xs font-medium text-muted-foreground">
                        <td className="p-3 font-semibold text-foreground">Tổng buổi Chủ tịch đã bố trí</td>
                        {roundDates.map((date) => {
                          const daySum = chairs.reduce(
                            (acc, c) => acc + (c.dailyQuota?.[date] || 0),
                            0
                          );
                          const dayCapacity = slotsPerDate.get(date) ?? 0;
                          const isMatch = daySum === dayCapacity;
                          return (
                            <td key={date} className="text-center p-3 font-semibold tabular-nums">
                              <span
                                className={
                                  isMatch
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : daySum < dayCapacity
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-orange-600 dark:text-orange-400"
                                }
                              >
                                {daySum} / {dayCapacity}
                              </span>
                            </td>
                          );
                        })}
                        <td className="text-center p-3 font-bold text-foreground tabular-nums">
                          {totalAssignedChairSessions} / {totalSlots}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </Table>
              </div>
            </TabsContent>

            {/* TAB 2: THƯ KÝ */}
            <TabsContent value="secretaries" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Danh sách Thư ký ưu tiên và giới hạn số buổi tối đa
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Thư ký ngồi ở vị trí Sequence 2 và ghi biên bản. Thuật toán sẽ ưu tiên tối đa lựa chọn các thầy cô này trước khi bổ sung giảng viên khác.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {secretaries.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleApplyBulkSecQuota(10)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Đặt tất cả = 10 buổi
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSecPickerOpen(true)}
                    className="gap-1.5"
                  >
                    <Plus className="size-4" />
                    Thêm Thư ký
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Giảng viên</TableHead>
                      <TableHead className="w-[220px] text-center">Số buổi tối đa (Quota)</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {secretaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="p-0">
                          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-3">
                              <UserCheck className="size-6" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Chưa có Thư ký ưu tiên nào</h3>
                            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                              Bấm &ldquo;Thêm Thư ký&rdquo; để chọn thầy cô vào nhóm ưu tiên Tier 2 và đặt giới hạn số buổi tối đa.
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-4 gap-1.5"
                              onClick={() => setSecPickerOpen(true)}
                            >
                              <Plus className="size-4" />
                              Thêm Thư ký
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      secretaries.map((s, idx) => {
                        const l = lecturerMap.get(s.lecturerId);
                        return (
                          <TableRow key={`sec-${s.lecturerId}-${idx}`} className="hover:bg-muted/30">
                            <TableCell>
                              {l ? (
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      {l.lecturerCode}
                                    </span>
                                    <p className="font-medium text-foreground text-sm">{l.displayName}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{l.email}</p>
                                </div>
                              ) : (
                                <span className="font-mono text-xs">ID #{s.lecturerId}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min={0}
                                max={totalSlots}
                                className="h-8 w-24 mx-auto text-center font-medium tabular-nums"
                                value={s.maxSessions ?? 0}
                                onChange={(e) => handleUpdateSecQuota(s.lecturerId, e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                title="Xóa khỏi danh sách Thư ký"
                                onClick={() => handleRemoveSecretary(s.lecturerId)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Picker Dialogs */}
      <LecturerPickerModal
        open={chairPickerOpen}
        onOpenChange={setChairPickerOpen}
        title="Thêm Chủ tịch Hội đồng"
        description="Chọn giảng viên để phân công làm Chủ tịch (Tier 1) cho đợt đánh giá này."
        lecturers={lecturers || []}
        existingIds={existingChairIds}
        onSelect={(id) => handleAddChair(id)}
      />

      <LecturerPickerModal
        open={secPickerOpen}
        onOpenChange={setSecPickerOpen}
        title="Thêm Thư ký Hội đồng"
        description="Chọn giảng viên ưu tiên làm Thư ký (Tier 2) cho đợt đánh giá này."
        lecturers={lecturers || []}
        existingIds={existingSecIds}
        onSelect={(id) => handleAddSecretary(id)}
      />
    </motion.div>
  );
}
