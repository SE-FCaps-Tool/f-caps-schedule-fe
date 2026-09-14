"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftRight,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronsUpDown,
  Crown,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shuffle,
  Trash2,
  Undo2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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
  useRoundInvitations,
} from "@/hooks/manager/useRounds";
import { useLecturers } from "@/hooks/manager/useLecturers";
import { ErrorBlock, LoadingBlock, StatBlock } from "../../components/round-detail-shared";
import { formatDate } from "@/lib/utils/formatDate";
import type {
  CouncilChairConfig,
  CouncilSecretaryConfig,
  CouncilReplacementConfig,
  CouncilConfig,
} from "@/lib/api/services/fetchRounds";
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
          <DialogDescription className="text-xs text-muted-foreground">
            {description}
          </DialogDescription>
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
                      <p className="truncate text-sm font-medium text-foreground">
                        {l.displayName}
                      </p>
                      <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                        {l.lecturerCode}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{l.email}</p>
                  </div>
                  {isSelected ? (
                    <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                      <Check className="size-3 text-primary" />
                      Đã có trong đợt
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

interface SearchableLecturerComboboxProps {
  label: string;
  sublabel?: string;
  placeholder: string;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  lecturers: LecturerApiItem[];
  existingChairIds: Set<number>;
  existingSecIds: Set<number>;
  activeParticipantIds: Set<number>;
  disabledId?: number | null;
}

function SearchableLecturerCombobox({
  label,
  sublabel,
  placeholder,
  selectedId,
  onSelect,
  lecturers,
  existingChairIds,
  existingSecIds,
  activeParticipantIds,
  disabledId,
}: SearchableLecturerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "IN_ROUND" | "OUTSIDE">("ALL");

  const selectedLecturer = useMemo(() => {
    if (!selectedId) return null;
    return lecturers.find((l) => Number(l.id) === selectedId) ?? null;
  }, [lecturers, selectedId]);

  const inRoundCount = useMemo(() => {
    return lecturers.filter((l) => activeParticipantIds.has(Number(l.id))).length;
  }, [lecturers, activeParticipantIds]);

  const outsideCount = lecturers.length - inRoundCount;

  const filtered = useMemo(() => {
    let list = lecturers;
    if (filterType === "IN_ROUND") {
      list = list.filter((l) => activeParticipantIds.has(Number(l.id)));
    } else if (filterType === "OUTSIDE") {
      list = list.filter((l) => !activeParticipantIds.has(Number(l.id)));
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (l) =>
        l.displayName.toLowerCase().includes(q) ||
        l.lecturerCode.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
    );
  }, [lecturers, filterType, search, activeParticipantIds]);

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          {label}
        </label>
        {sublabel && <span className="text-[11px] text-muted-foreground">{sublabel}</span>}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <div
              role="button"
              tabIndex={0}
              className={cn(
                "group relative flex w-full min-h-[42px] cursor-pointer items-center justify-between rounded-lg border bg-background px-3 py-2 text-left text-xs transition-all shadow-xs outline-none hover:border-primary/50 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary",
                open && "border-primary ring-1 ring-primary",
                selectedLecturer ? "border-border/80" : "border-input text-muted-foreground"
              )}
            >
              {selectedLecturer ? (
                <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="truncate font-semibold text-foreground text-xs leading-tight">
                        {selectedLecturer.displayName}
                      </p>
                      <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                        {selectedLecturer.lecturerCode}
                      </span>
                    </div>
                    <p className="truncate text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      {selectedLecturer.email}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {existingChairIds.has(selectedId!) ? (
                      <Badge
                        variant="default"
                        className="bg-amber-500 hover:bg-amber-600 text-[10px] px-1.5 py-0 gap-1 h-5 shadow-none font-medium"
                      >
                        <Crown className="size-2.5" /> Chủ tịch
                      </Badge>
                    ) : existingSecIds.has(selectedId!) ? (
                      <Badge
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700 text-[10px] px-1.5 py-0 gap-1 h-5 shadow-none font-medium"
                      >
                        <UserCheck className="size-2.5" /> Ưu tiên 2
                      </Badge>
                    ) : activeParticipantIds.has(selectedId!) ? (
                      <Badge
                        variant="secondary"
                        className="bg-sky-500/10 text-sky-600 border border-sky-500/20 text-[10px] px-1.5 py-0 h-5 font-medium"
                      >
                        Trong đợt
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-muted-foreground">
                        Ngoài đợt
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Search className="size-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{placeholder}</span>
                </div>
              )}

              <div className="flex items-center gap-1 shrink-0 ml-1">
                {selectedLecturer && (
                  <button
                    type="button"
                    title="Xóa lựa chọn"
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(null);
                    }}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
                <ChevronsUpDown className="size-3.5 opacity-50 shrink-0" />
              </div>
            </div>
          }
        />

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[var(--anchor-width)] min-w-[340px] max-w-[480px] p-0 shadow-lg border-border/80 rounded-xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="p-2.5 border-b border-border/70 bg-muted/20 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Nhập tên, mã GV (VD: AnhLT151), email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-background shadow-xs focus-visible:ring-1"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={cn(
                  "px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors border",
                  filterType === "ALL"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "text-muted-foreground hover:bg-muted border-transparent hover:text-foreground"
                )}
              >
                Tất cả ({lecturers.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("IN_ROUND")}
                className={cn(
                  "px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors border",
                  filterType === "IN_ROUND"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "text-muted-foreground hover:bg-muted border-transparent hover:text-foreground"
                )}
              >
                Trong đợt ({inRoundCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("OUTSIDE")}
                className={cn(
                  "px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors border",
                  filterType === "OUTSIDE"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "text-muted-foreground hover:bg-muted border-transparent hover:text-foreground"
                )}
              >
                Ngoài đợt ({outsideCount})
              </button>
            </div>
          </div>

          {/* List items */}
          <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center">
                <Search className="size-5 mb-2 opacity-40" />
                Không tìm thấy giảng viên nào phù hợp.
              </div>
            ) : (
              filtered.map((l) => {
                const lid = Number(l.id);
                const isSelected = lid === selectedId;
                const isDisabled = lid === disabledId;
                const isChair = existingChairIds.has(lid);
                const isSec = existingSecIds.has(lid);
                const isInRound = activeParticipantIds.has(lid);

                return (
                  <button
                    key={`lcomb-${l.id}`}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      onSelect(isSelected ? null : lid);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors border",
                      isSelected
                        ? "bg-primary/10 text-primary border-primary/30 font-medium"
                        : "border-transparent text-foreground",
                      isDisabled
                        ? "opacity-40 cursor-not-allowed bg-muted/20"
                        : "hover:bg-muted/70 active:bg-muted"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p
                          className={cn(
                            "truncate text-xs",
                            isSelected ? "font-semibold text-primary" : "font-medium text-foreground"
                          )}
                        >
                          {l.displayName}
                        </p>
                        <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                          {l.lecturerCode}
                        </span>
                      </div>
                      <p className="truncate text-[10px] text-muted-foreground mt-0.5 leading-normal">
                        {l.email}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isDisabled && (
                        <span className="text-[10px] italic text-muted-foreground">Đã chọn ô kia</span>
                      )}
                      {isChair ? (
                        <Badge
                          variant="default"
                          className="bg-amber-500 hover:bg-amber-600 text-[10px] px-1.5 py-0 gap-1 h-5 shadow-none font-medium"
                        >
                          <Crown className="size-2.5" /> Chủ tịch
                        </Badge>
                      ) : isSec ? (
                        <Badge
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700 text-[10px] px-1.5 py-0 gap-1 h-5 shadow-none font-medium"
                        >
                          <UserCheck className="size-2.5" /> Ưu tiên 2
                        </Badge>
                      ) : isInRound ? (
                        <Badge
                          variant="secondary"
                          className="bg-sky-500/10 text-sky-600 border border-sky-500/20 text-[10px] px-1.5 py-0 h-5 font-medium"
                        >
                          Trong đợt
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60">Ngoài đợt</span>
                      )}

                      {isSelected && <Check className="size-3.5 shrink-0 text-primary" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CouncilConfigPage({ roundId }: { roundId: string }) {
  const reduceMotion = useReducedMotion();
  const { currentSemesterId } = useSemesterContext();
  const { data: round, isLoading: roundLoading, isError: roundError } = useRoundDetail(roundId);
  const { data: config, isLoading: configLoading, isError: configError } = useCouncilConfig(roundId);
  const { data: invitations } = useRoundInvitations(roundId);
  const { data: lecturers, isLoading: lecturersLoading } = useLecturers();
  const updateConfig = useUpdateCouncilConfig();

  const [chairs, setChairs] = useState<CouncilChairConfig[]>([]);
  const [secretaries, setSecretaries] = useState<CouncilSecretaryConfig[]>([]);
  const [replacements, setReplacements] = useState<CouncilReplacementConfig[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [prevConfig, setPrevConfig] = useState<CouncilConfig | null | undefined>(null);

  // Dialog states
  const [chairPickerOpen, setChairPickerOpen] = useState(false);
  const [secPickerOpen, setSecPickerOpen] = useState(false);
  const [addParticipantPickerOpen, setAddParticipantPickerOpen] = useState(false);

  // Swap Tab States
  const [swapSourceId, setSwapSourceId] = useState<number | null>(null);
  const [swapTargetId, setSwapTargetId] = useState<number | null>(null);
  const [participantRoleFilter, setParticipantRoleFilter] = useState<
    "ALL" | "CHAIR" | "SECRETARY" | "MEMBER"
  >("ALL");
  const [participantSearch, setParticipantSearch] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (config !== prevConfig) {
    setPrevConfig(config);
    if (config) {
      setChairs(JSON.parse(JSON.stringify(config.chairs || [])));
      setSecretaries(JSON.parse(JSON.stringify(config.secretaries || [])));
      setReplacements(JSON.parse(JSON.stringify(config.replacements || [])));
      setHasUnsavedChanges(false);
    }
  }

  const allLecturersList = useMemo(() => lecturers || [], [lecturers]);

  const lecturerMap = useMemo(() => {
    const map = new Map<number, LecturerApiItem>();
    if (lecturers) {
      lecturers.forEach((l) => map.set(Number(l.id), l));
    }
    return map;
  }, [lecturers]);

  // Base pool of participants
  const baseParticipantIds = useMemo(() => {
    if (config?.baseLecturerIds && config.baseLecturerIds.length > 0) {
      return new Set(config.baseLecturerIds);
    }
    if (invitations && invitations.length > 0) {
      const accepted = invitations
        .filter((i) => i.status === "ACCEPTED")
        .map((i) => Number(i.lecturer.id));
      if (accepted.length > 0) return new Set(accepted);
      return new Set(invitations.map((i) => Number(i.lecturer.id)));
    }
    return new Set<number>();
  }, [config, invitations]);

  // Dynamic active participants considering replacements & role configs
  const { activeParticipantIds, addedParticipantIds, replacedOrRemovedMap } =
    useMemo(() => {
      const active = new Set<number>(baseParticipantIds);
      const added = new Set<number>();
      const removed = new Set<number>();
      const repMap = new Map<number, number>(); // oldId -> newId

      replacements.forEach((r) => {
        const oldId = Number(r.oldLecturerId);
        const newId = Number(r.newLecturerId);

        if (oldId > 0 && newId > 0) {
          active.delete(oldId);
          active.add(newId);
          repMap.set(oldId, newId);
        } else if (oldId === 0 && newId > 0) {
          active.add(newId);
          added.add(newId);
        } else if (oldId > 0 && newId === 0) {
          active.delete(oldId);
          removed.add(oldId);
        }
      });

      // Ensure all configured Chairs & Secretaries are in the active participant set
      chairs.forEach((c) => active.add(c.lecturerId));
      secretaries.forEach((s) => active.add(s.lecturerId));

      return {
        activeParticipantIds: active,
        addedParticipantIds: added,
        removedParticipantIds: removed,
        replacedOrRemovedMap: repMap,
      };
    }, [baseParticipantIds, replacements, chairs, secretaries]);

  const existingChairIds = useMemo(() => new Set(chairs.map((c) => c.lecturerId)), [chairs]);
  const existingSecIds = useMemo(() => new Set(secretaries.map((s) => s.lecturerId)), [secretaries]);

  // Active participants list mapped and sorted
  const activeParticipantsList = useMemo(() => {
    return Array.from(activeParticipantIds)
      .map((id) => {
        const lecturer = lecturerMap.get(id);
        const isChair = existingChairIds.has(id);
        const isSec = existingSecIds.has(id);
        const chairData = chairs.find((c) => c.lecturerId === id);
        const secData = secretaries.find((s) => s.lecturerId === id);
        const isAdded = addedParticipantIds.has(id);
        const isReplacement = Array.from(replacedOrRemovedMap.values()).includes(id);

        return {
          id,
          lecturer,
          displayName: lecturer?.displayName || `Giảng viên #${id}`,
          lecturerCode: lecturer?.lecturerCode || `GV-${id}`,
          email: lecturer?.email || "",
          role: isChair
            ? ("CHAIR" as const)
            : isSec
            ? ("SECRETARY" as const)
            : ("MEMBER" as const),
          quota: isChair ? chairData?.quota : isSec ? secData?.maxSessions : null,
          isAdded,
          isReplacement,
        };
      })
      .sort((a, b) => {
        const order = { CHAIR: 0, SECRETARY: 1, MEMBER: 2 };
        if (order[a.role] !== order[b.role]) {
          return order[a.role] - order[b.role];
        }
        return a.displayName.localeCompare(b.displayName);
      });
  }, [
    activeParticipantIds,
    lecturerMap,
    existingChairIds,
    existingSecIds,
    chairs,
    secretaries,
    addedParticipantIds,
    replacedOrRemovedMap,
  ]);

  const filteredActiveParticipants = useMemo(() => {
    let list = activeParticipantsList;
    if (participantRoleFilter !== "ALL") {
      list = list.filter((p) => p.role === participantRoleFilter);
    }
    const q = participantSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.displayName.toLowerCase().includes(q) ||
        p.lecturerCode.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }, [activeParticipantsList, participantRoleFilter, participantSearch]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Actions for Chairs
  const handleAddChair = (lecturerId: number) => {
    if (chairs.some((c) => c.lecturerId === lecturerId)) return;
    const newSecs = secretaries.filter((s) => s.lecturerId !== lecturerId);
    const newReps = replacements.filter(
      (r) => !(r.oldLecturerId === lecturerId && r.newLecturerId === 0)
    );
    setSecretaries(newSecs);
    setReplacements(newReps);
    setChairs([...chairs, { lecturerId, dailyQuota: {} }]);
    setHasUnsavedChanges(true);
    showNotice(
      `Đã thêm ${lecturerMap.get(lecturerId)?.displayName || `GV #${lecturerId}`} vào Chủ tịch (Tier 1).`
    );
  };

  const handleRemoveChair = (lecturerId: number) => {
    setChairs(chairs.filter((c) => c.lecturerId !== lecturerId));
    setHasUnsavedChanges(true);
    showNotice(`Đã xóa khỏi danh sách Chủ tịch.`);
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

  // Actions for Secretaries
  const handleAddSecretary = (lecturerId: number) => {
    if (secretaries.some((s) => s.lecturerId === lecturerId)) return;
    const newChairs = chairs.filter((c) => c.lecturerId !== lecturerId);
    const newReps = replacements.filter(
      (r) => !(r.oldLecturerId === lecturerId && r.newLecturerId === 0)
    );
    setChairs(newChairs);
    setReplacements(newReps);
    setSecretaries([...secretaries, { lecturerId, maxSessions: 10 }]);
    setHasUnsavedChanges(true);
    showNotice(
      `Đã thêm ${lecturerMap.get(lecturerId)?.displayName || `GV #${lecturerId}`} vào Ưu tiên 2 (Tier 2).`
    );
  };

  const handleRemoveSecretary = (lecturerId: number) => {
    setSecretaries(secretaries.filter((s) => s.lecturerId !== lecturerId));
    setHasUnsavedChanges(true);
    showNotice(`Đã xóa khỏi danh sách Ưu tiên 2.`);
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
    showNotice(`Đã đặt quota tất cả Ưu tiên 2 = ${quota} buổi.`);
  };

  // Round Participant Management (Add, Remove, Restore)
  const handleAddLecturerToRound = (lecturerId: number) => {
    const hadRemoval = replacements.some(
      (r) => r.oldLecturerId === lecturerId && r.newLecturerId === 0
    );
    if (hadRemoval) {
      setReplacements(
        replacements.filter((r) => !(r.oldLecturerId === lecturerId && r.newLecturerId === 0))
      );
    } else {
      setReplacements([...replacements, { oldLecturerId: 0, newLecturerId: lecturerId }]);
    }
    setHasUnsavedChanges(true);
    setAddParticipantPickerOpen(false);
    showNotice(
      `Đã bổ sung ${lecturerMap.get(lecturerId)?.displayName || `GV #${lecturerId}`} vào danh sách sắp xếp đợt này.`
    );
  };

  const handleRemoveLecturerFromRound = (lecturerId: number) => {
    setChairs(chairs.filter((c) => c.lecturerId !== lecturerId));
    setSecretaries(secretaries.filter((s) => s.lecturerId !== lecturerId));

    const isDirectAdd = replacements.some(
      (r) => r.oldLecturerId === 0 && r.newLecturerId === lecturerId
    );
    if (isDirectAdd) {
      setReplacements(
        replacements.filter((r) => !(r.oldLecturerId === 0 && r.newLecturerId === lecturerId))
      );
    } else {
      const repIdx = replacements.findIndex((r) => r.newLecturerId === lecturerId);
      if (repIdx !== -1) {
        const rep = replacements[repIdx];
        const updated = [...replacements];
        updated[repIdx] = { oldLecturerId: rep.oldLecturerId, newLecturerId: 0 };
        setReplacements(updated);
      } else {
        const updated = replacements.filter((r) => r.oldLecturerId !== lecturerId);
        updated.push({ oldLecturerId: lecturerId, newLecturerId: 0 });
        setReplacements(updated);
      }
    }

    setHasUnsavedChanges(true);
    showNotice(
      `Đã loại ${lecturerMap.get(lecturerId)?.displayName || `GV #${lecturerId}`} khỏi danh sách sắp xếp đợt này.`
    );
  };

  const handleRestoreLecturer = (oldId: number, newId: number) => {
    setReplacements(
      replacements.filter((r) => !(r.oldLecturerId === oldId && r.newLecturerId === newId))
    );
    setHasUnsavedChanges(true);
    showNotice("Đã khôi phục trạng thái ban đầu của giảng viên.");
  };

  // Change Role Helper
  const handleChangeRole = (lecturerId: number, targetRole: "CHAIR" | "SECRETARY" | "MEMBER") => {
    if (targetRole === "CHAIR") {
      handleAddChair(lecturerId);
    } else if (targetRole === "SECRETARY") {
      handleAddSecretary(lecturerId);
    } else {
      setChairs(chairs.filter((c) => c.lecturerId !== lecturerId));
      setSecretaries(secretaries.filter((s) => s.lecturerId !== lecturerId));
      setHasUnsavedChanges(true);
      showNotice(
        `Đã chuyển ${lecturerMap.get(lecturerId)?.displayName || `GV #${lecturerId}`} về Thành viên thường.`
      );
    }
  };

  // Swap or Replace 2 Lecturers
  const handleSwapLecturers = (idA: number | null, idB: number | null) => {
    if (!idA || !idB || idA === idB) return;

    const newChairs = [...chairs];
    const newSecretaries = [...secretaries];
    let newReplacements = [...replacements];

    const nameA = lecturerMap.get(idA)?.displayName || `GV #${idA}`;
    const nameB = lecturerMap.get(idB)?.displayName || `GV #${idB}`;

    const isAInRound = activeParticipantIds.has(idA);
    const isBInRound = activeParticipantIds.has(idB);

    const chairAIdx = newChairs.findIndex((c) => c.lecturerId === idA);
    const chairBIdx = newChairs.findIndex((c) => c.lecturerId === idB);
    const secAIdx = newSecretaries.findIndex((s) => s.lecturerId === idA);
    const secBIdx = newSecretaries.findIndex((s) => s.lecturerId === idB);

    let noticeMsg = `Đã cập nhật vị trí giữa ${nameA} và ${nameB}.`;

    // Case 1: A is in round, B is NOT in round -> A is replaced by B
    if (isAInRound && !isBInRound) {
      if (chairAIdx !== -1) {
        newChairs[chairAIdx] = { ...newChairs[chairAIdx], lecturerId: idB };
      } else if (secAIdx !== -1) {
        newSecretaries[secAIdx] = { ...newSecretaries[secAIdx], lecturerId: idB };
      }
      newReplacements = newReplacements.filter(
        (r) => r.oldLecturerId !== idA && r.newLecturerId !== idA
      );
      newReplacements.push({ oldLecturerId: idA, newLecturerId: idB });
      noticeMsg = `Đã thay thế ${nameA} bằng ${nameB} (người mới vào đợt).`;
    }
    // Case 2: B is in round, A is NOT in round -> B is replaced by A
    else if (!isAInRound && isBInRound) {
      if (chairBIdx !== -1) {
        newChairs[chairBIdx] = { ...newChairs[chairBIdx], lecturerId: idA };
      } else if (secBIdx !== -1) {
        newSecretaries[secBIdx] = { ...newSecretaries[secBIdx], lecturerId: idA };
      }
      newReplacements = newReplacements.filter(
        (r) => r.oldLecturerId !== idB && r.newLecturerId !== idB
      );
      newReplacements.push({ oldLecturerId: idB, newLecturerId: idA });
      noticeMsg = `Đã thay thế ${nameB} bằng ${nameA} (người mới vào đợt).`;
    }
    // Case 3: Both are in round
    else {
      // 3.1: Both in Chairs -> swap quota
      if (chairAIdx !== -1 && chairBIdx !== -1) {
        const quotaA = newChairs[chairAIdx].quota;
        const dailyA = newChairs[chairAIdx].dailyQuota;
        newChairs[chairAIdx] = {
          ...newChairs[chairAIdx],
          quota: newChairs[chairBIdx].quota,
          dailyQuota: newChairs[chairBIdx].dailyQuota,
        };
        newChairs[chairBIdx] = {
          ...newChairs[chairBIdx],
          quota: quotaA,
          dailyQuota: dailyA,
        };
        noticeMsg = `Đã hoán đổi định mức Chủ tịch giữa ${nameA} và ${nameB}.`;
      }
      // 3.2: Both in Secretaries -> swap maxSessions
      else if (secAIdx !== -1 && secBIdx !== -1) {
        const maxA = newSecretaries[secAIdx].maxSessions;
        newSecretaries[secAIdx] = {
          ...newSecretaries[secAIdx],
          maxSessions: newSecretaries[secBIdx].maxSessions,
        };
        newSecretaries[secBIdx] = {
          ...newSecretaries[secBIdx],
          maxSessions: maxA,
        };
        noticeMsg = `Đã hoán đổi hạn mức Ưu tiên 2 giữa ${nameA} và ${nameB}.`;
      }
      // 3.3: A in Chairs, B in Secretaries
      else if (chairAIdx !== -1 && secBIdx !== -1) {
        const chairAConfig = newChairs[chairAIdx];
        const secBConfig = newSecretaries[secBIdx];
        newChairs[chairAIdx] = {
          lecturerId: idB,
          quota: chairAConfig.quota,
          dailyQuota: chairAConfig.dailyQuota,
        };
        newSecretaries[secBIdx] = {
          lecturerId: idA,
          maxSessions: secBConfig.maxSessions,
        };
        noticeMsg = `Đã hoán đổi vai trò: ${nameB} (Chủ tịch) ↔ ${nameA} (Ưu tiên 2).`;
      }
      // 3.4: A in Secretaries, B in Chairs
      else if (secAIdx !== -1 && chairBIdx !== -1) {
        const secAConfig = newSecretaries[secAIdx];
        const chairBConfig = newChairs[chairBIdx];
        newSecretaries[secAIdx] = {
          lecturerId: idB,
          maxSessions: secAConfig.maxSessions,
        };
        newChairs[chairBIdx] = {
          lecturerId: idA,
          quota: chairBConfig.quota,
          dailyQuota: chairBConfig.dailyQuota,
        };
        noticeMsg = `Đã hoán đổi vai trò: ${nameA} (Chủ tịch) ↔ ${nameB} (Ưu tiên 2).`;
      }
      // 3.5: A is Chair, B is Member
      else if (chairAIdx !== -1 && chairBIdx === -1 && secBIdx === -1) {
        const chairAConfig = newChairs[chairAIdx];
        newChairs[chairAIdx] = {
          lecturerId: idB,
          quota: chairAConfig.quota,
          dailyQuota: chairAConfig.dailyQuota,
        };
        noticeMsg = `Đã chuyển vai trò Chủ tịch từ ${nameA} sang ${nameB}.`;
      }
      // 3.6: B is Chair, A is Member
      else if (chairBIdx !== -1 && chairAIdx === -1 && secAIdx === -1) {
        const chairBConfig = newChairs[chairBIdx];
        newChairs[chairBIdx] = {
          lecturerId: idA,
          quota: chairBConfig.quota,
          dailyQuota: chairBConfig.dailyQuota,
        };
        noticeMsg = `Đã chuyển vai trò Chủ tịch từ ${nameB} sang ${nameA}.`;
      }
      // 3.7: A is Secretary, B is Member
      else if (secAIdx !== -1 && chairBIdx === -1 && secBIdx === -1) {
        const secAConfig = newSecretaries[secAIdx];
        newSecretaries[secAIdx] = {
          lecturerId: idB,
          maxSessions: secAConfig.maxSessions,
        };
        noticeMsg = `Đã chuyển vai trò Ưu tiên 2 từ ${nameA} sang ${nameB}.`;
      }
      // 3.8: B is Secretary, A is Member
      else if (secBIdx !== -1 && chairAIdx === -1 && secAIdx === -1) {
        const secBConfig = newSecretaries[secBIdx];
        newSecretaries[secBIdx] = {
          lecturerId: idA,
          maxSessions: secBConfig.maxSessions,
        };
        noticeMsg = `Đã chuyển vai trò Ưu tiên 2 từ ${nameB} sang ${nameA}.`;
      } else {
        noticeMsg = `Cả hai giảng viên đều là Thành viên thường trong đợt.`;
      }
    }

    setChairs(newChairs);
    setSecretaries(newSecretaries);
    setReplacements(newReplacements);
    setHasUnsavedChanges(true);
    setSwapSourceId(null);
    setSwapTargetId(null);
    showNotice(noticeMsg);
  };

  const handleSave = () => {
    updateConfig.mutate(
      { roundId, payload: { chairs, secretaries, replacements } },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          showNotice("Đã lưu cấu hình phân vai Hội đồng thành công!");
        },
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

  const slotsPerDate = new Map<string, number>();
  round.days.forEach((d) => slotsPerDate.set(d.date, d.slots.length));

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.985 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-dvh flex-col overflow-hidden bg-background"
    >
      {/* 1. Header */}
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
          {/* Toast / Notification Banner */}
          {actionNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{actionNotice}</span>
            </motion.div>
          )}

          {/* Guide Banner */}
          <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 p-3.5 text-xs text-muted-foreground">
            <Info className="size-4 shrink-0 text-primary mt-0.5" />
            <div className="leading-relaxed">
              Cấu hình phân vai hỗ trợ chỉ định đích danh giảng viên đảm nhận các vị trí đặc thù:
              <strong className="text-foreground font-semibold"> Chủ tịch (Tier 1)</strong> ngồi ở vị trí Sequence 1 theo định mức số hội đồng từng ngày,
              <strong className="text-foreground font-semibold"> Ưu tiên 2 (Tier 2)</strong> ngồi ở vị trí Sequence 2 được thuật toán ưu tiên tối đa phân công, và
              <strong className="text-foreground font-semibold"> Tab Hoán đổi (Swap)</strong> giúp quản lý danh sách giảng viên tham gia đợt, hoán đổi vị trí, thêm hoặc loại giảng viên nhanh chóng.
            </div>
          </div>

          {/* Metrics summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <StatBlock
                label="Tổng khung giờ (Timeslots)"
                value={`${totalSlots} khung giờ`}
                icon={CalendarClock}
                tone="sky"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {round.days.length} ngày tổ chức · {totalSlots} khung giờ
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="flex items-start justify-between">
                <StatBlock
                  label="Chủ tịch (Tier 1)"
                  value={`${totalAssignedChairSessions} hội đồng`}
                  icon={Crown}
                  tone="emerald"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {chairs.length} giảng viên được phân công làm Chủ tịch
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="flex items-start justify-between">
                <StatBlock
                  label="Ưu tiên 2 (Tier 2)"
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

          {/* Tab bar */}
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
                  <span>Ưu tiên 2 (Tier 2)</span>
                  <Badge variant="secondary" className="ml-1 text-xs font-normal">
                    {secretaries.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="swap" className="gap-2 pb-3 pt-1 text-sm font-medium">
                  <ArrowLeftRight className="size-4 text-sky-500" />
                  <span>Hoán đổi & Điều phối</span>
                  <Badge variant="secondary" className="ml-1 text-xs font-normal">
                    {activeParticipantsList.length} trong đợt
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: CHỦ TỊCH */}
            <TabsContent value="chairs" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Chỉ định Chủ tịch và số hội đồng tham gia theo từng ngày
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Chủ tịch sẽ ngồi ở vị trí Sequence 1 trong phiên đánh giá. Thiết lập số hội đồng mà giảng viên sẽ tham gia trong ngày hôm đó.
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
                              {formatDate(date, "dddd")} ({slotsPerDate.get(date) ?? 0} khung giờ)
                            </span>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-semibold w-[120px]">Tổng hội đồng</TableHead>
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
                                    <p className="font-medium text-foreground text-sm">{l.displayName}</p>
                                    <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                                      {l.lecturerCode}
                                    </span>
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
                        <td className="p-3 font-semibold text-foreground">Tổng số hội đồng CT đã bố trí</td>
                        {roundDates.map((date) => {
                          const daySum = chairs.reduce(
                            (acc, c) => acc + (c.dailyQuota?.[date] || 0),
                            0
                          );
                          return (
                            <td key={date} className="text-center p-3 font-semibold tabular-nums text-foreground">
                              {daySum}
                            </td>
                          );
                        })}
                        <td className="text-center p-3 font-bold text-foreground tabular-nums">
                          {totalAssignedChairSessions}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </Table>
              </div>
            </TabsContent>

            {/* TAB 2: ƯU TIÊN 2 (TIER 2) */}
            <TabsContent value="secretaries" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Danh sách Giảng viên Ưu tiên 2 và giới hạn số buổi tối đa
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Giảng viên Ưu tiên 2 ngồi ở vị trí Sequence 2. Thuật toán sẽ ưu tiên tối đa lựa chọn các thầy cô này trước khi bổ sung giảng viên khác.
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
                    Thêm Ưu tiên 2
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
                            <h3 className="text-sm font-semibold text-foreground">Chưa có Giảng viên Ưu tiên 2 nào</h3>
                            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                              Bấm &ldquo;Thêm Ưu tiên 2&rdquo; để chọn thầy cô vào nhóm ưu tiên Tier 2 và đặt giới hạn số buổi tối đa.
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-4 gap-1.5"
                              onClick={() => setSecPickerOpen(true)}
                            >
                              <Plus className="size-4" />
                              Thêm Ưu tiên 2
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
                                    <p className="font-medium text-foreground text-sm">{l.displayName}</p>
                                    <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                                      {l.lecturerCode}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{l.email}</p>
                                </div>
                              ) : (
                                <span className="font-mono text-xs">ID #{s.lecturerId}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={99}
                                  className="h-8 w-20 text-center font-medium tabular-nums"
                                  value={s.maxSessions ?? 10}
                                  onChange={(e) => handleUpdateSecQuota(s.lecturerId, e.target.value)}
                                />
                                <span className="text-xs text-muted-foreground">buổi</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                title="Xóa khỏi nhóm Ưu tiên 2"
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

            {/* TAB 3: HOÁN ĐỔI & ĐIỀU PHỐI (SWAP & ROSTER) */}
            <TabsContent value="swap" className="space-y-6">
              {/* Section 1: Swap Tool */}
              <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                      <Shuffle className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Hoán đổi & Thay thế Giảng viên</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Chọn 2 giảng viên để đổi vai trò, đổi vị trí hoặc thay thế người mới ngoài danh sách vào đợt sắp xếp.
                      </p>
                    </div>
                  </div>

                  {swapSourceId && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setSwapSourceId(null);
                        setSwapTargetId(null);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground h-7"
                    >
                      Hủy lựa chọn
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                  <SearchableLecturerCombobox
                    label="Giảng viên A (Nguồn / Hiện tại)"
                    sublabel="Người muốn đổi vị trí hoặc bị thay thế"
                    placeholder="Tìm tên, mã GV A..."
                    selectedId={swapSourceId}
                    onSelect={setSwapSourceId}
                    lecturers={allLecturersList}
                    existingChairIds={existingChairIds}
                    existingSecIds={existingSecIds}
                    activeParticipantIds={activeParticipantIds}
                    disabledId={swapTargetId}
                  />

                  <div className="flex items-center justify-center pb-0.5">
                    <button
                      type="button"
                      title="Đổi chỗ A và B"
                      onClick={() => {
                        const temp = swapSourceId;
                        setSwapSourceId(swapTargetId);
                        setSwapTargetId(temp);
                      }}
                      disabled={!swapSourceId && !swapTargetId}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/60 text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-xs cursor-pointer"
                    >
                      <ArrowLeftRight className="size-4" />
                    </button>
                  </div>

                  <SearchableLecturerCombobox
                    label="Giảng viên B (Đích / Thay thế)"
                    sublabel="Người nhận vai trò hoặc bổ sung vào"
                    placeholder="Tìm tên, mã GV B..."
                    selectedId={swapTargetId}
                    onSelect={setSwapTargetId}
                    lecturers={allLecturersList}
                    existingChairIds={existingChairIds}
                    existingSecIds={existingSecIds}
                    activeParticipantIds={activeParticipantIds}
                    disabledId={swapSourceId}
                  />
                </div>

                {/* Preview Box */}
                {swapSourceId && swapTargetId && swapSourceId !== swapTargetId && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-3.5 rounded-lg border border-sky-500/30 bg-sky-500/5 text-xs text-foreground">
                      <div className="flex items-center gap-2 font-medium min-w-0">
                        <span className="truncate">{lecturerMap.get(swapSourceId)?.displayName}</span>
                        <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-background border border-border/50 text-muted-foreground shrink-0">
                          {lecturerMap.get(swapSourceId)?.lecturerCode}
                        </span>
                      </div>

                      <ArrowRight className="size-4 text-sky-500 shrink-0 mx-1" />

                      <div className="flex items-center gap-2 font-medium min-w-0">
                        <span className="truncate">{lecturerMap.get(swapTargetId)?.displayName}</span>
                        <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-background border border-border/50 text-muted-foreground shrink-0">
                          {lecturerMap.get(swapTargetId)?.lecturerCode}
                        </span>
                      </div>

                      <div className="ml-auto pl-4 text-muted-foreground text-[11px] italic shrink-0">
                        {(() => {
                          const isAIn = activeParticipantIds.has(swapSourceId);
                          const isBIn = activeParticipantIds.has(swapTargetId);
                          if (isAIn && !isBIn) return "Sẽ thay thế GV A bằng GV B mới ngoài danh sách";
                          if (!isAIn && isBIn) return "Sẽ thay thế GV B bằng GV A mới ngoài danh sách";
                          const isAConfig = existingChairIds.has(swapSourceId) || existingSecIds.has(swapSourceId);
                          const isBConfig = existingChairIds.has(swapTargetId) || existingSecIds.has(swapTargetId);
                          if (isAConfig && isBConfig) return "Sẽ hoán đổi vai trò & định mức của 2 giảng viên";
                          if (isAConfig || isBConfig) return "Sẽ chuyển vai trò đặc thù giữa 2 giảng viên";
                          return "Cả 2 đều là Thành viên thường trong đợt";
                        })()}
                      </div>
                    </div>
                  </motion.div>
                )}

                {(() => {
                  const isValid = Boolean(swapSourceId && swapTargetId && swapSourceId !== swapTargetId);
                  const isAIn = swapSourceId ? activeParticipantIds.has(swapSourceId) : false;
                  const isBIn = swapTargetId ? activeParticipantIds.has(swapTargetId) : false;

                  let buttonLabel = "Hoán đổi vai trò & vị trí (Swap A ↔ B)";

                  if (!swapSourceId || !swapTargetId) {
                    buttonLabel = "Chọn 2 giảng viên để thực hiện";
                  } else if (swapSourceId === swapTargetId) {
                    buttonLabel = "Vui lòng chọn 2 giảng viên khác nhau";
                  } else if (isAIn && !isBIn) {
                    const oldName = lecturerMap.get(swapSourceId!)?.displayName;
                    const newName = lecturerMap.get(swapTargetId!)?.displayName;
                    buttonLabel = `Thay thế ${oldName} bằng ${newName} (người mới vào đợt)`;
                  } else if (!isAIn && isBIn) {
                    const oldName = lecturerMap.get(swapTargetId!)?.displayName;
                    const newName = lecturerMap.get(swapSourceId!)?.displayName;
                    buttonLabel = `Thay thế ${oldName} bằng ${newName} (người mới vào đợt)`;
                  }

                  return (
                    <Button
                      size="sm"
                      className="w-full gap-2 h-10 font-medium shadow-sm transition-all"
                      disabled={!isValid}
                      onClick={() => handleSwapLecturers(swapSourceId, swapTargetId)}
                    >
                      <ArrowLeftRight className="size-4" />
                      {buttonLabel}
                    </Button>
                  );
                })()}
              </div>

              {/* Section 2: Replaced or Excluded List */}
              {replacements.length > 0 && (
                <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
                  <div className="bg-muted/40 px-4 py-3 border-b border-border/70 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Danh sách Giảng viên đã thay thế hoặc loại khỏi đợt ({replacements.length})
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ghi nhận các thay đổi so với roster ban đầu. Bạn có thể nhấn biểu tượng hoàn tác để khôi phục lại.
                      </p>
                    </div>
                  </div>
                  <Table>
                    <TableBody>
                      {replacements.map((r, idx) => {
                        const oldL = r.oldLecturerId > 0 ? lecturerMap.get(r.oldLecturerId) : null;
                        const newL = r.newLecturerId > 0 ? lecturerMap.get(r.newLecturerId) : null;

                        return (
                          <TableRow key={`rep-${idx}`} className="hover:bg-muted/20">
                            <TableCell className="w-[42%]">
                              {oldL ? (
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-muted-foreground text-sm line-through opacity-80">
                                    {oldL.displayName}
                                  </p>
                                  <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground line-through opacity-70 shrink-0">
                                    {oldL.lecturerCode}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">— Bổ sung mới vào đợt —</span>
                              )}
                            </TableCell>
                            <TableCell className="w-[10%] text-center">
                              <ArrowRight className="size-4 mx-auto text-muted-foreground" />
                            </TableCell>
                            <TableCell className="w-[42%]">
                              {newL ? (
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground text-sm">{newL.displayName}</p>
                                  <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 shrink-0">
                                    {newL.lecturerCode}
                                  </span>
                                  {r.oldLecturerId === 0 && (
                                    <Badge variant="outline" className="text-[10px] text-sky-600 border-sky-500/30">
                                      Bổ sung mới
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="destructive" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 shadow-none">
                                  Đã loại khỏi đợt
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right w-[60px]">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="Hoàn tác / Khôi phục"
                                onClick={() => handleRestoreLecturer(r.oldLecturerId, r.newLecturerId)}
                              >
                                <Undo2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Section 3: PRIMARY PARTICIPANTS ROSTER TABLE */}
              <div className="space-y-3">
                <div className="flex flex-col gap-3">
                  {/* Row 1: Title and Add button */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          Danh sách Giảng viên được sắp xếp trong đợt này
                        </h3>
                        <Badge variant="secondary" className="font-semibold text-xs px-2 py-0.5 whitespace-nowrap">
                          {activeParticipantsList.length} giảng viên
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Roster chính thức các giảng viên tham gia xếp lịch trong đợt này. Bạn có thể hoán đổi, gán vai trò hoặc loại khỏi đợt trực tiếp.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="gap-1.5 h-8 text-xs shrink-0 whitespace-nowrap self-start sm:self-auto"
                      onClick={() => setAddParticipantPickerOpen(true)}
                    >
                      <UserPlus className="size-3.5" />
                      Thêm vào đợt
                    </Button>
                  </div>

                  {/* Row 2: Role Filters and Search with no text wrapping */}
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between pt-1">
                    {/* Role Filter Tabs */}
                    <div className="flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs overflow-x-auto shrink-0 max-w-full">
                      <button
                        type="button"
                        onClick={() => setParticipantRoleFilter("ALL")}
                        className={cn(
                          "px-3 py-1.5 rounded-md transition-all font-medium whitespace-nowrap shrink-0",
                          participantRoleFilter === "ALL"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Tất cả ({activeParticipantsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setParticipantRoleFilter("CHAIR")}
                        className={cn(
                          "px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0",
                          participantRoleFilter === "CHAIR"
                            ? "bg-background text-amber-600 shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Crown className="size-3 text-amber-500 shrink-0" />
                        <span>Chủ tịch ({chairs.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setParticipantRoleFilter("SECRETARY")}
                        className={cn(
                          "px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0",
                          participantRoleFilter === "SECRETARY"
                            ? "bg-background text-emerald-600 shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <UserCheck className="size-3 text-emerald-500 shrink-0" />
                        <span>Ưu tiên 2 ({secretaries.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setParticipantRoleFilter("MEMBER")}
                        className={cn(
                          "px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0",
                          participantRoleFilter === "MEMBER"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Users className="size-3 text-muted-foreground shrink-0" />
                        <span>Thành viên ({activeParticipantsList.length - chairs.length - secretaries.length})</span>
                      </button>
                    </div>

                    <div className="relative w-full sm:w-64 shrink-0">
                      <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo tên, mã GV trong đợt..."
                        value={participantSearch}
                        onChange={(e) => setParticipantSearch(e.target.value)}
                        className="pl-8 h-8 text-xs bg-card"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-[280px]">Giảng viên</TableHead>
                        <TableHead className="w-[180px]">Vai trò trong đợt</TableHead>
                        <TableHead className="w-[150px] text-center">Định mức / Quota</TableHead>
                        <TableHead className="w-[130px]">Nguồn tham gia</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActiveParticipants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                            {participantSearch ? (
                              <span>
                                Không tìm thấy giảng viên nào phù hợp với từ khóa &ldquo;{participantSearch}&rdquo;.
                              </span>
                            ) : (
                              <span>Chưa có giảng viên nào trong đợt này. Nhấn &ldquo;Thêm vào đợt&rdquo; để bổ sung.</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredActiveParticipants.map((p) => {
                          const lecturerId = p.id;
                          const isChair = p.role === "CHAIR";
                          const isSec = p.role === "SECRETARY";
                          const isSelectedSource = swapSourceId === lecturerId;

                          return (
                            <TableRow
                              key={`p-${lecturerId}`}
                              className={cn(
                                "hover:bg-muted/30 transition-colors",
                                isSelectedSource && "bg-sky-500/10 hover:bg-sky-500/15"
                              )}
                            >
                              {/* Lecturer Details */}
                              <TableCell>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-foreground text-sm">{p.displayName}</p>
                                    <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                                      {p.lecturerCode}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{p.email}</p>
                                </div>
                              </TableCell>

                              {/* Role */}
                              <TableCell>
                                {isChair ? (
                                  <Badge
                                    variant="default"
                                    className="gap-1 bg-amber-500 hover:bg-amber-600 text-xs font-medium"
                                  >
                                    <Crown className="size-3" />
                                    Chủ tịch (Tier 1)
                                  </Badge>
                                ) : isSec ? (
                                  <Badge
                                    variant="default"
                                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs font-medium"
                                  >
                                    <UserCheck className="size-3" />
                                    Ưu tiên 2 (Tier 2)
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="gap-1 text-xs font-normal text-muted-foreground bg-muted/60"
                                  >
                                    <Users className="size-3" />
                                    Thành viên thường
                                  </Badge>
                                )}
                              </TableCell>

                              {/* Quota */}
                              <TableCell className="text-center">
                                {isChair ? (
                                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                    {p.quota || 0} hội đồng
                                  </span>
                                ) : isSec ? (
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    Tối đa {p.quota || 0} buổi
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>

                              {/* Source */}
                              <TableCell>
                                {p.isAdded ? (
                                  <Badge
                                    variant="outline"
                                    className="gap-1 text-[11px] text-sky-600 border-sky-500/30 bg-sky-500/5 font-medium"
                                  >
                                    <UserPlus className="size-3" />
                                    Bổ sung mới
                                  </Badge>
                                ) : p.isReplacement ? (
                                  <Badge
                                    variant="outline"
                                    className="gap-1 text-[11px] text-purple-600 border-purple-500/30 bg-purple-500/5 font-medium"
                                  >
                                    <RefreshCw className="size-3" />
                                    Thay thế
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] text-muted-foreground font-normal"
                                  >
                                    Gốc đợt này
                                  </Badge>
                                )}
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Quick Select for Swap */}
                                  <Button
                                    size="xs"
                                    variant={isSelectedSource ? "default" : "outline"}
                                    className={cn(
                                      "gap-1 text-[11px] h-7",
                                      isSelectedSource && "bg-sky-600 hover:bg-sky-700 text-white"
                                    )}
                                    onClick={() => {
                                      if (isSelectedSource) {
                                        setSwapSourceId(null);
                                      } else if (!swapSourceId) {
                                        setSwapSourceId(lecturerId);
                                        showNotice(`Đã chọn ${p.displayName} làm GV A. Hãy chọn tiếp GV B để hoán đổi.`);
                                      } else {
                                        setSwapTargetId(lecturerId);
                                      }
                                    }}
                                  >
                                    <Shuffle className="size-3" />
                                    {isSelectedSource ? "Đang chọn A" : "Hoán đổi"}
                                  </Button>

                                  {/* Role Toggle Buttons */}
                                  {!isChair && (
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      className="gap-1 text-[11px] h-7 px-2 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                                      title="Chuyển làm Chủ tịch"
                                      onClick={() => handleChangeRole(lecturerId, "CHAIR")}
                                    >
                                      <Crown className="size-3" />
                                      {isSec ? "Sang Chủ tịch" : "Làm CT"}
                                    </Button>
                                  )}
                                  {!isSec && (
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      className="gap-1 text-[11px] h-7 px-2 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                                      title="Chuyển làm Ưu tiên 2"
                                      onClick={() => handleChangeRole(lecturerId, "SECRETARY")}
                                    >
                                      <UserCheck className="size-3" />
                                      {isChair ? "Sang ƯT 2" : "Làm ƯT 2"}
                                    </Button>
                                  )}
                                  {(isChair || isSec) && (
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      className="gap-1 text-[11px] h-7 px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                      title="Chuyển về Thành viên thường"
                                      onClick={() => handleChangeRole(lecturerId, "MEMBER")}
                                    >
                                      <Users className="size-3" />
                                      Về thường
                                    </Button>
                                  )}

                                  {/* Remove from Round Button */}
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    className="size-7 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                                    title="Loại giảng viên khỏi đợt này"
                                    onClick={() => handleRemoveLecturerFromRound(lecturerId)}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
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
        lecturers={allLecturersList}
        existingIds={existingChairIds}
        onSelect={(id) => handleAddChair(id)}
      />

      <LecturerPickerModal
        open={secPickerOpen}
        onOpenChange={setSecPickerOpen}
        title="Thêm Giảng viên Ưu tiên 2"
        description="Chọn giảng viên vào nhóm Ưu tiên 2 (Tier 2) cho đợt đánh giá này."
        lecturers={allLecturersList}
        existingIds={existingSecIds}
        onSelect={(id) => handleAddSecretary(id)}
      />

      <LecturerPickerModal
        open={addParticipantPickerOpen}
        onOpenChange={setAddParticipantPickerOpen}
        title="Bổ sung Giảng viên vào đợt"
        description="Chọn giảng viên từ danh sách toàn trường để bổ sung vào nhóm tham gia sắp xếp hội đồng đợt này."
        lecturers={allLecturersList}
        existingIds={activeParticipantIds}
        onSelect={(id) => handleAddLecturerToRound(id)}
      />
    </motion.div>
  );
}
