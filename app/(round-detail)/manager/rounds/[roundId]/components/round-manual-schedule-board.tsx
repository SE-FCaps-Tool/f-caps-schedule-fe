"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  DoorOpen,
  Info,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserRoundPlus,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRoundGroups, useRoundInvitations, useRoundMyAvailability } from "@/hooks/manager/useRounds";
import {
  useCreateManualScheduleSession,
  useDeleteManualScheduleSession,
  useBulkUpsertManualSchedule,
  useManualScheduleBoard,
  useManualScheduleOptions,
  usePublishManualSchedule,
  useUpdateManualScheduleSession,
  useValidateManualSchedule,
} from "@/hooks/manager/useManualScheduling";
import {
  useDeleteScheduleVersion,
  useRunSchedule,
  useScheduleVersions,
} from "@/hooks/manager/useScheduling";
import { useRooms } from "@/hooks/useRooms";
import { cn } from "@/lib/utils";
import { formatDate, formatInVietnamTime } from "@/lib/utils/formatDate";
import type {
  AttachedRoundGroup,
  RoundConfigTimeslot,
  RoundDetail,
  RoundInvitation,
} from "@/lib/api/services/fetchRounds";
import type { RoomApiItem } from "@/lib/api/services/fetchRooms";
import type {
  ManualBlocker,
  ManualScheduleBulkUpsertPayload,
  ManualScheduleOptionsParams,
  ManualScheduleReviewerInput,
  ManualScheduleSession as ApiManualScheduleSession,
} from "@/lib/api/services/fetchManualScheduling";
import { fetchScheduling } from "@/lib/api/services/fetchScheduling";
import { detailCode, detailDetails } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

export type ReviewerRole = {
  key: string;
  label: string;
};

export type ManualScheduleSession = {
  id: string;
  date: string;
  slotId: string;
  startTime: string;
  endTime: string;
  groupIds: string[];
  roomId: string | null;
  reviewerIds: Record<string, string | null>;
};

function canonicalGroupId(groupId: string | number) {
  return String(groupId).replace(/^grp_/, "");
}

export function apiSessionToDraft(session: ApiManualScheduleSession, roles: ReviewerRole[]): ManualScheduleSession {
  const reviewerIds = emptyReviewerIds(roles);
  for (const reviewer of session.reviewers) reviewerIds[reviewer.role] = String(reviewer.lecturerId);

  return {
    id: session.id,
    date: session.date,
    slotId: session.roundTimeslotId,
    startTime: session.startTime,
    endTime: session.endTime,
    groupIds: session.groups.map((group) => canonicalGroupId(group.groupId)),
    roomId: session.room ? String(session.room.roomId) : null,
    reviewerIds,
  };
}

type ActiveEditor = {
  date: string;
  slot: RoundConfigTimeslot;
  sessionId?: string;
};

type VersionConfirmation = {
  action: "copy" | "delete";
  versionId: number;
  versionNo: number;
};


function blockersFromPublishError(error: unknown): ManualBlocker[] {
  if (!isRecord(error)) return [];
  const details = detailDetails(error as unknown as ApiError);
  if (!isRecord(details) || !Array.isArray(details.blockers)) return [];
  return details.blockers.filter(
    (blocker): blocker is ManualBlocker =>
      isRecord(blocker) && typeof blocker.code === "string" && typeof blocker.message === "string",
  );
}

function warningsFromPublishError(error: unknown): ManualBlocker[] {
  if (!isRecord(error)) return [];
  const details = detailDetails(error as unknown as ApiError);
  if (!isRecord(details) || !Array.isArray(details.warnings)) return [];
  return details.warnings.filter(
    (warning): warning is ManualBlocker =>
      isRecord(warning) && typeof warning.code === "string" && typeof warning.message === "string",
  );
}

type SupervisorAwareGroup = AttachedRoundGroup & {
  supervisorIds?: Array<string | number>;
  mainSupervisorId?: string | number | null;
  coSupervisorId?: string | number | null;
  project?: {
    mainSupervisorId?: string | number | null;
    coSupervisorId?: string | number | null;
    mainSupervisor?: { id?: string | number | null } | null;
    coSupervisor?: { id?: string | number | null } | null;
  } | null;
};

function normalizedId(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" && typeof value !== "number") return null;
  return String(value);
}

export function buildReviewerRoles(reviewerCount: number): ReviewerRole[] {
  const count = Math.max(1, reviewerCount || 1);
  if (count <= 2) {
    return Array.from({ length: count }, (_, index) => ({
      key: `REVIEWER_${index + 1}`,
      label: `Review ${index + 1}`,
    }));
  }

  return [
    { key: "CHAIR", label: "Chủ tịch" },
    { key: "SECRETARY", label: "Thư kí" },
    ...Array.from({ length: count - 2 }, (_, index) => ({
      key: `MEMBER_${index + 1}`,
      label: `Thành viên ${index + 1}`,
    })),
  ];
}

function emptyReviewerIds(roles: ReviewerRole[]) {
  return Object.fromEntries(roles.map((role) => [role.key, null])) as Record<string, string | null>;
}

function withRoleDefaults(session: ManualScheduleSession, roles: ReviewerRole[]): ManualScheduleSession {
  return {
    ...session,
    reviewerIds: Object.fromEntries(
      roles.map((role) => [role.key, session.reviewerIds[role.key] ?? null])
    ) as Record<string, string | null>,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cellKey(date: string, slotId: string) {
  return `${date}__${slotId}`;
}

function dayStartKey(date: string, startTime: string) {
  return `${date}__${startTime}`;
}

function groupIdVariants(groupId: string) {
  const variants = new Set([groupId]);
  if (groupId.startsWith("grp_")) variants.add(groupId.slice(4));
  else variants.add(`grp_${groupId}`);
  return variants;
}

function groupNumericIds(groupId: string) {
  return Array.from(groupIdVariants(groupId))
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
}

function getGroupSupervisorIds(group: AttachedRoundGroup | undefined) {
  if (!group) return new Set<string>();
  const supervisorGroup = group as SupervisorAwareGroup;
  const ids = [
    ...(Array.isArray(supervisorGroup.supervisorIds) ? supervisorGroup.supervisorIds : []),
    supervisorGroup.mainSupervisorId,
    supervisorGroup.coSupervisorId,
    supervisorGroup.project?.mainSupervisorId,
    supervisorGroup.project?.coSupervisorId,
    supervisorGroup.project?.mainSupervisor?.id,
    supervisorGroup.project?.coSupervisor?.id,
  ];

  return new Set(ids.map(normalizedId).filter((id): id is string => id !== null));
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function includesSearch(query: string, ...values: Array<string | number | null | undefined>) {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  return values.some((value) => String(value ?? "").toLowerCase().includes(needle));
}

function hasSupervisorConflict(group: AttachedRoundGroup, reviewerIds: Iterable<string | null>) {
  const supervisorIds = getGroupSupervisorIds(group);
  if (supervisorIds.size === 0) return false;
  for (const reviewerId of reviewerIds) {
    if (reviewerId && supervisorIds.has(reviewerId)) return true;
  }
  return false;
}

function sessionMissingCount(session: ManualScheduleSession, roles: ReviewerRole[]) {
  let count = 0;
  if (session.groupIds.length === 0) count += 1;
  if (!session.roomId) count += 1;
  count += roles.filter((role) => !session.reviewerIds[role.key]).length;
  return count;
}

function getGroupCodes(groupIds: string[], groupById: Map<string, AttachedRoundGroup>) {
  return groupIds.map((groupId) => groupById.get(groupId)?.groupCode ?? groupId);
}

function ManualSessionChip({
  session,
  roles,
  groupById,
  roomById,
  lecturerById,
  onEdit,
  disabled = false,
}: {
  session: ManualScheduleSession;
  roles: ReviewerRole[];
  groupById: Map<string, AttachedRoundGroup>;
  roomById: Map<string, RoomApiItem>;
  lecturerById: Map<string, RoundInvitation>;
  onEdit: () => void;
  disabled?: boolean;
}) {
  const groupCodes = getGroupCodes(session.groupIds, groupById);
  const room = session.roomId ? roomById.get(session.roomId) : undefined;
  const missing = sessionMissingCount(session, roles);

  return (
    <button
      type="button"
      onClick={onEdit}
      disabled={disabled}
      title="Chỉnh hội đồng"
      className="group relative w-full rounded-md border border-primary/25 bg-primary/10 px-2.5 py-2.5 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={`Chỉnh hội đồng ${groupCodes.length > 0 ? groupCodes.join(", ") : "chưa chọn nhóm"}`}
    >
      <span className="flex min-w-0 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
          <span className="truncate font-mono text-xs font-semibold text-primary">
            {groupCodes[0] ?? "Chưa chọn nhóm"}
          </span>
          {groupCodes.length > 1 && (
            <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
              +{groupCodes.length - 1} nhóm
            </span>
          )}
        </span>
        <span
          className={cn(
            "shrink-0 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold",
            missing > 0
              ? "text-amber-700 dark:text-amber-300"
              : "text-emerald-700 dark:text-emerald-300",
          )}
        >
          {missing > 0 ? `Thiếu ${missing}` : "Đủ"}
        </span>
      </span>
      <span className="mt-2 flex min-w-0 items-center gap-x-2 text-[11px] text-muted-foreground">
        <span className={cn("inline-flex min-w-0 items-center gap-1", !room && "font-medium text-amber-700 dark:text-amber-300")}>
          <DoorOpen className="size-3 text-primary" />
          <span className="truncate">{room ? room.code : "Chưa gán phòng"}</span>
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span className="shrink-0">{session.groupIds.length} nhóm</span>
      </span>
      <span className="mt-1.5 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-[11px] leading-4 text-muted-foreground">
        {roles.map((role, index) => {
          const lecturerId = session.reviewerIds[role.key];
          const lecturer = lecturerId ? lecturerById.get(lecturerId) : undefined;
          const compactRole = role.key === "CHAIR" ? "CT" : role.key === "SECRETARY" ? "TK" : role.key.startsWith("MEMBER") ? "TV" : `R${index + 1}`;
          return (
            <span key={role.key} className={cn(!lecturer && "font-medium text-amber-700 dark:text-amber-300")}>
              <span className="font-semibold text-primary">{compactRole}</span>{" "}
              {lecturer?.lecturer.code ?? "Chưa chọn"}
            </span>
          );
        })}
      </span>
      <Pencil className="absolute top-2.5 right-2.5 size-3 text-primary opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
    </button>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-8 pl-8 text-sm"
      />
    </div>
  );
}

function ReviewerPicker({
  role,
  selectedLecturer,
  options,
  search,
  onSearchChange,
  onSelect,
  onClear,
}: {
  role: ReviewerRole;
  selectedLecturer?: RoundInvitation;
  options: RoundInvitation[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (lecturerId: string) => void;
  onClear: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className={cn(
          "flex min-h-12 w-full items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left transition-colors hover:border-orange-300 hover:bg-orange-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          selectedLecturer && "border-orange-300/70 bg-orange-500/5"
        )}
        aria-label={`Chọn ${role.label.toLowerCase()}`}
      >
        <span className="min-w-0">
          {selectedLecturer ? (
            <>
              <span className="block truncate font-mono text-xs font-semibold text-foreground">
                {selectedLecturer.lecturer.code}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {selectedLecturer.lecturer.fullName}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Chọn {role.label.toLowerCase()}...</span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(24rem,calc(100vw-3rem))] p-2">
        <div className="flex items-center justify-between gap-2 px-1 pb-1">
          <span className="text-xs font-semibold">Chọn {role.label.toLowerCase()}</span>
          {selectedLecturer && (
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={onClear}
            >
              Bỏ chọn
            </button>
          )}
        </div>
        <SearchField
          value={search}
          onChange={onSearchChange}
          placeholder={`Tìm ${role.label.toLowerCase()}...`}
        />
        <div className="max-h-56 overflow-y-auto rounded-md border border-border">
          {options.length === 0 && (
            <p className="px-3 py-5 text-center text-xs text-muted-foreground">Không có giảng viên phù hợp.</p>
          )}
          {options.map((invitation) => {
            const lecturerId = String(invitation.lecturer.id);
            const selected = selectedLecturer?.lecturer.id === invitation.lecturer.id;
            return (
              <button
                key={lecturerId}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(lecturerId)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected && "bg-orange-500/10 text-orange-700 dark:text-orange-300"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-mono text-xs font-semibold">{invitation.lecturer.code}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {invitation.lecturer.fullName}
                  </span>
                </span>
                {selected && <Check className="size-4 shrink-0" aria-hidden />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function RoundManualScheduleBoard({ roundId, round }: { roundId: string; round: RoundDetail }) {
  const roles = useMemo(() => buildReviewerRoles(round.reviewerCount), [round.reviewerCount]);
  const canPublishManualSchedule = ![
    "ONGOING",
    "POSTPONED",
    "COMPLETED",
    "LOCKED",
    "CANCELLED",
  ].includes(round.status);
  const canRunAlgorithm = ["REGISTRATION_CLOSED", "SCHEDULING", "SCHEDULED", "POSTPONED"].includes(round.status);
  // The server-side manual schedule is the source of truth. This state only
  // mirrors the latest API response while the board is mounted; it is never
  // persisted in browser storage.
  const [sessions, setSessions] = useState<ManualScheduleSession[]>([]);
  const draftIdRef = useRef(sessions.length);
  const hydratedApiSnapshotRef = useRef<string | null>(null);
  const [revision, setRevision] = useState<number | null>(null);
  const [validationBlockers, setValidationBlockers] = useState<ManualBlocker[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ManualBlocker[]>([]);
  const [validationPanelOpen, setValidationPanelOpen] = useState(false);
  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [draft, setDraft] = useState<ManualScheduleSession | null>(null);
  const [groupSearch, setGroupSearch] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [reviewerSearchByRole, setReviewerSearchByRole] = useState<Record<string, string>>({});

  const manualBoardQuery = useManualScheduleBoard(roundId);
  const manualBoard = manualBoardQuery.data;
  const refetchManualBoard = manualBoardQuery.refetch;
  const createSessionMutation = useCreateManualScheduleSession();
  const updateSessionMutation = useUpdateManualScheduleSession();
  const deleteSessionMutation = useDeleteManualScheduleSession();
  const bulkUpsertMutation = useBulkUpsertManualSchedule();
  const validateMutation = useValidateManualSchedule();
  const publishMutation = usePublishManualSchedule();
  const deleteVersionMutation = useDeleteScheduleVersion();
  const runScheduleMutation = useRunSchedule();
  const numericRoundId = Number(roundId);
  const semesterId = Number(round.semesterId || 0) || null;
  const { data: storedVersions = [], isLoading: versionsLoading } = useScheduleVersions(
    Number.isFinite(numericRoundId) ? numericRoundId : null,
    semesterId,
  );
  const visibleVersions = useMemo(
    () => storedVersions.filter((version) => !["DISCARDED", "SUPERSEDED"].includes(version.status)),
    [storedVersions],
  );
  const [copyingVersionId, setCopyingVersionId] = useState<number | null>(null);
  const [versionConfirmation, setVersionConfirmation] = useState<VersionConfirmation | null>(null);
  const publishPending = publishMutation.isPending;
  const scheduleInteractionLocked =
    manualBoardQuery.isLoading || copyingVersionId !== null || bulkUpsertMutation.isPending;

  useEffect(() => {
    if (!manualBoardQuery.data) return;
    const snapshot = JSON.stringify({
      revision: manualBoardQuery.data.revision,
      sessions: manualBoardQuery.data.sessions,
    });
    if (snapshot === hydratedApiSnapshotRef.current) return;
    hydratedApiSnapshotRef.current = snapshot;
    setRevision(manualBoardQuery.data.revision);
    setSessions(manualBoardQuery.data.sessions.map((session) => apiSessionToDraft(session, roles)));
  }, [manualBoardQuery.data, roles]);

  const legacyRoundId = Number(roundId);
  const { data: availability, isLoading: availabilityLoading } = useRoundMyAvailability(
    Number.isFinite(legacyRoundId) ? legacyRoundId : null
  );
  const { data: invitations, isLoading: invitationsLoading } = useRoundInvitations(roundId);
  const { data: attachedGroups, isLoading: groupsLoading } = useRoundGroups(roundId);
  const { data: rooms, isLoading: roomsLoading } = useRooms();

  const dates = useMemo(
    () => round.days.filter((day) => day.slots.length > 0).map((day) => day.date),
    [round.days]
  );

  const timeRows = useMemo(() => {
    const rows = new Map<string, { startTime: string; endTime: string }>();
    for (const day of round.days) {
      for (const slot of day.slots) {
        rows.set(slot.startTime, { startTime: slot.startTime, endTime: slot.endTime });
      }
    }
    return Array.from(rows.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [round.days]);

  const slotsByCell = useMemo(() => {
    const map = new Map<string, RoundConfigTimeslot>();
    for (const day of round.days) {
      for (const slot of day.slots) {
        map.set(dayStartKey(day.date, slot.startTime), slot);
      }
    }
    return map;
  }, [round.days]);

  const availabilityTimeslotByCell = useMemo(() => {
    const map = new Map<string, number>();
    for (const slot of availability?.timeslots ?? []) {
      const date = formatInVietnamTime(slot.startAt, "YYYY-MM-DD");
      const startTime = formatInVietnamTime(slot.startAt, "HH:mm");
      map.set(dayStartKey(date, startTime), slot.id);
    }
    return map;
  }, [availability]);

  const lecturerAvailableByTimeslot = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const row of availability?.selectedByLecturer ?? []) {
      if (row.state !== "AVAILABLE") continue;
      const bucket = map.get(row.timeslotId) ?? new Set<number>();
      bucket.add(row.lecturerId);
      map.set(row.timeslotId, bucket);
    }
    return map;
  }, [availability]);

  const groupSelectedByTimeslot = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const row of availability?.selectedByGroup ?? []) {
      if (!row.selected) continue;
      const bucket = map.get(row.timeslotId) ?? new Set<number>();
      bucket.add(row.groupId);
      map.set(row.timeslotId, bucket);
    }
    return map;
  }, [availability]);

  const acceptedInvitations = useMemo(
    () => (invitations ?? []).filter((invitation) => invitation.status === "ACCEPTED"),
    [invitations]
  );

  const lecturerById = useMemo(() => {
    const map = new Map<string, RoundInvitation>();
    for (const invitation of invitations ?? []) map.set(String(invitation.lecturer.id), invitation);
    return map;
  }, [invitations]);

  const groupById = useMemo(() => {
    const map = new Map<string, AttachedRoundGroup>();
    for (const group of attachedGroups ?? []) {
      for (const variant of groupIdVariants(group.groupId)) map.set(variant, group);
    }
    return map;
  }, [attachedGroups]);

  const roomById = useMemo(() => {
    const map = new Map<string, RoomApiItem>();
    for (const room of rooms ?? []) map.set(String(room.id), room);
    return map;
  }, [rooms]);

  const persistedSessions = sessions;
  const sessionsByCell = useMemo(() => {
    const map = new Map<string, ManualScheduleSession[]>();
    for (const session of persistedSessions) {
      const key = cellKey(session.date, session.slotId);
      const bucket = map.get(key) ?? [];
      bucket.push(session);
      map.set(key, bucket);
    }
    return map;
  }, [persistedSessions]);

  const scheduledGroupIds = useMemo(() => {
    const ids = new Set<string>();
    for (const session of persistedSessions) {
      if (session.id === draft?.id) continue;
      for (const groupId of session.groupIds) ids.add(groupId);
    }
    return ids;
  }, [draft?.id, persistedSessions]);

  const activeAvailabilityTimeslotId = activeEditor
    ? availabilityTimeslotByCell.get(dayStartKey(activeEditor.date, activeEditor.slot.startTime))
    : undefined;

  const activeCellSessions = activeEditor
    ? sessionsByCell.get(cellKey(activeEditor.date, activeEditor.slot.id)) ?? []
    : [];

  const manualOptionsParams = useMemo<ManualScheduleOptionsParams | null>(() => {
    if (!activeEditor || !draft) return null;
    return {
      date: activeEditor.date,
      roundTimeslotId: activeEditor.slot.id,
      sessionId: activeEditor.sessionId,
      reviewerIds: Object.values(draft.reviewerIds).filter((id): id is string => Boolean(id)),
      groupIds: draft.groupIds,
      roomId: draft.roomId,
      page: 1,
      pageSize: 200,
    };
  }, [activeEditor, draft]);
  const manualOptionsQuery = useManualScheduleOptions(roundId, manualOptionsParams, Boolean(activeEditor && draft));

  const activeSelectedReviewerIds = new Set<string>(
    Object.values(draft?.reviewerIds ?? {}).filter((id): id is string => Boolean(id))
  );
  const draftGroupIds = new Set(draft?.groupIds ?? []);
  const selectedGroupSupervisorIds = new Set<string>();
  for (const groupId of draftGroupIds) {
    for (const supervisorId of getGroupSupervisorIds(groupById.get(groupId))) {
      selectedGroupSupervisorIds.add(supervisorId);
    }
  }

  const serverGroupStateById = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const option of manualOptionsQuery.data?.options.groups ?? []) {
      for (const variant of groupIdVariants(option.groupId)) map.set(variant, option.available);
    }
    return map;
  }, [manualOptionsQuery.data]);

  const serverLecturerStateById = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const option of manualOptionsQuery.data?.options.lecturers ?? []) {
      map.set(String(option.lecturerId), option.available);
    }
    return map;
  }, [manualOptionsQuery.data]);

  const serverRoomStateById = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const option of manualOptionsQuery.data?.options.rooms ?? []) {
      map.set(String(option.roomId), option.available);
    }
    return map;
  }, [manualOptionsQuery.data]);

  const groupOptions = (attachedGroups ?? []).filter((group) => {
    const isSelectedInDraft = draftGroupIds.has(group.groupId);
    if (!isSelectedInDraft && scheduledGroupIds.has(group.groupId)) return false;

    const serverAvailable = serverGroupStateById.get(group.groupId);
    if (!isSelectedInDraft && serverAvailable === false) return false;

    if (!isSelectedInDraft && availability && activeAvailabilityTimeslotId !== undefined) {
      const selectedIds = groupSelectedByTimeslot.get(activeAvailabilityTimeslotId);
      if (!selectedIds || !groupNumericIds(group.groupId).some((id) => selectedIds.has(id))) return false;
    }

    return !hasSupervisorConflict(group, activeSelectedReviewerIds);
  });

  const roomsInActiveCell = new Set(
    activeCellSessions
      .filter((session) => session.id !== draft?.id)
      .map((session) => session.roomId)
      .filter((roomId): roomId is string => Boolean(roomId))
  );

  const roomOptions = (rooms ?? []).filter((room) => {
    if (room.status && room.status !== "ACTIVE") return false;
    if (room.type && round.roomTypes.length > 0 && !round.roomTypes.includes(room.type)) return false;
    if (serverRoomStateById.get(String(room.id)) === false && draft?.roomId !== String(room.id)) return false;
    return !roomsInActiveCell.has(String(room.id)) || draft?.roomId === String(room.id);
  });

  const baseLecturerOptions = acceptedInvitations.filter((invitation) => {
    const lecturerId = String(invitation.lecturer.id);
    if (selectedGroupSupervisorIds.has(lecturerId)) return false;
    if (serverLecturerStateById.get(lecturerId) === false && !activeSelectedReviewerIds.has(lecturerId)) return false;

    if (availability && activeAvailabilityTimeslotId !== undefined) {
      const selectedIds = lecturerAvailableByTimeslot.get(activeAvailabilityTimeslotId);
      return selectedIds?.has(Number(invitation.lecturer.id)) ?? false;
    }

    return true;
  });

  const selectedInOtherSessionSameCell = new Set(
    activeCellSessions
      .filter((session) => session.id !== draft?.id)
      .flatMap((session) => Object.values(session.reviewerIds))
      .filter((id): id is string => Boolean(id))
  );

  const isLoadingOptions =
    manualBoardQuery.isLoading ||
    manualOptionsQuery.isLoading ||
    invitationsLoading ||
    groupsLoading ||
    roomsLoading ||
    availabilityLoading;
  const maxSessionsPerCell = round.maxGroupsPerTimeslot;
  const hasSessionLimit = maxSessionsPerCell !== null;
  const activeCellAssignedSessionCount = activeCellSessions.filter(
    (session) => session.id !== draft?.id,
  ).length;
  const activeCellRemainingSessionCount = hasSessionLimit
    ? Math.max(0, maxSessionsPerCell - activeCellAssignedSessionCount)
    : Number.POSITIVE_INFINITY;
  const draftRemainingSessionCount = Math.max(
    0,
    activeCellRemainingSessionCount - (draft?.id ? 1 : 0),
  );
  const filteredGroupOptions = groupOptions.filter((group) =>
    includesSearch(groupSearch, group.groupCode, group.leaderName, group.activeMemberCount)
  );
  const filteredRoomOptions = roomOptions.filter((room) =>
    includesSearch(roomSearch, room.code, room.name, room.type, room.capacity)
  );

  const cellResourceAvailability = useMemo(() => {
    const map = new Map<string, { groupCount: number; lecturerCount: number }>();
    const hasAvailabilityResponse = availability !== undefined;
    const hasGroupAvailability = Array.isArray(availability?.selectedByGroup);
    const hasLecturerAvailability = Array.isArray(availability?.selectedByLecturer);

    for (const day of round.days) {
      for (const slot of day.slots) {
        const availabilityTimeslotId = availabilityTimeslotByCell.get(
          dayStartKey(day.date, slot.startTime),
        );
        const selectedGroups = availabilityTimeslotId === undefined
          ? undefined
          : groupSelectedByTimeslot.get(availabilityTimeslotId);
        const availableLecturers = availabilityTimeslotId === undefined
          ? undefined
          : lecturerAvailableByTimeslot.get(availabilityTimeslotId);

        const groupCount = (attachedGroups ?? []).filter((group) => {
          if (scheduledGroupIds.has(group.groupId)) return false;
          if (!hasAvailabilityResponse || !hasGroupAvailability) return true;
          return Boolean(
            selectedGroups && groupNumericIds(group.groupId).some((id) => selectedGroups.has(id)),
          );
        }).length;

        const lecturerCount = acceptedInvitations.filter((invitation) => {
          if (!hasAvailabilityResponse || !hasLecturerAvailability) return true;
          return Boolean(availableLecturers?.has(Number(invitation.lecturer.id)));
        }).length;

        map.set(cellKey(day.date, slot.id), { groupCount, lecturerCount });
      }
    }

    return map;
  }, [
    acceptedInvitations,
    attachedGroups,
    availability,
    availabilityTimeslotByCell,
    groupSelectedByTimeslot,
    lecturerAvailableByTimeslot,
    round.days,
    scheduledGroupIds,
  ]);

  const cellResourcesLoading = invitationsLoading || groupsLoading || availabilityLoading;

  const unscheduledGroupIds = useMemo(() => {
    const ids = new Set<string>();
    for (const blocker of validationBlockers) {
      if (!Array.isArray(blocker.groupIds)) continue;
      for (const groupId of blocker.groupIds) ids.add(String(groupId));
    }
    return Array.from(ids);
  }, [validationBlockers]);
  const hasValidationResult = validationBlockers.length > 0 || validationWarnings.length > 0;

  function resetEditorSearch() {
    setGroupSearch("");
    setRoomSearch("");
    setReviewerSearchByRole({});
  }

  function openCreate(date: string, slot: RoundConfigTimeslot) {
    draftIdRef.current = Math.max(draftIdRef.current, sessions.length) + 1;
    const nextDraft: ManualScheduleSession = {
      id: `manual-${date}-${slot.id}-${draftIdRef.current}`,
      date,
      slotId: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      groupIds: [],
      roomId: null,
      reviewerIds: emptyReviewerIds(roles),
    };
    resetEditorSearch();
    setActiveEditor({ date, slot });
    setDraft(nextDraft);
  }

  function openEdit(session: ManualScheduleSession) {
    setActiveEditor({
      date: session.date,
      slot: { id: session.slotId, startTime: session.startTime, endTime: session.endTime },
      sessionId: session.id,
    });
    resetEditorSearch();
    setDraft(withRoleDefaults(session, roles));
  }

  function closeEditor() {
    setActiveEditor(null);
    setDraft(null);
  }

  function buildMutationPayload(session: ManualScheduleSession, editor: ActiveEditor) {
    return {
      date: session.date,
      roundTimeslotId: editor.slot.id,
      groupIds: session.groupIds,
      roomId: session.roomId,
      reviewers: roles.flatMap((role, index) => {
        const lecturerId = session.reviewerIds[role.key];
        return lecturerId ? [{ lecturerId, role: role.key as ManualScheduleReviewerInput["role"], order: index + 1 }] : [];
      }),
      clientRevision: revision,
    };
  }

  async function saveDraft() {
    if (!draft || !activeEditor) return;
    const normalizedDraft = withRoleDefaults(draft, roles);
    const payload = buildMutationPayload(normalizedDraft, activeEditor);
    try {
      const result = activeEditor.sessionId && !activeEditor.sessionId.startsWith("manual-")
        ? await updateSessionMutation.mutateAsync({ roundId, sessionId: activeEditor.sessionId, payload })
        : await createSessionMutation.mutateAsync({ roundId, payload });
      setRevision(result.revision);
      setValidationBlockers([]);
      setValidationWarnings([]);
      const savedSession = apiSessionToDraft(result.session, roles);
      setSessions((current) => {
        if (current.some((session) => session.id === normalizedDraft.id)) {
          return current.map((session) => (session.id === normalizedDraft.id ? savedSession : session));
        }
        return [...current, savedSession];
      });
      closeEditor();
    } catch {
      // Mutation hooks surface the server error; keep the editor open for correction.
    }
  }

  async function deleteDraft() {
    if (!draft) return;
    try {
      if (draft.id.startsWith("manual_session_") || draft.id.match(/^\d+$/)) {
        const result = await deleteSessionMutation.mutateAsync({ roundId, sessionId: draft.id, clientRevision: revision });
        setRevision(result.revision);
      }
      setValidationBlockers([]);
      setValidationWarnings([]);
      setSessions((current) => current.filter((session) => session.id !== draft.id));
      closeEditor();
    } catch {
      // Mutation hooks surface the server error; keep the editor open.
    }
  }

  async function validateDraft() {
    if (revision === null || validateMutation.isPending) return;
    try {
      const result = await validateMutation.mutateAsync({ roundId, clientRevision: revision });
      setRevision(result.revision);
      setValidationBlockers(result.blockers);
      setValidationWarnings(result.warnings);
      setValidationPanelOpen(true);
      if (result.valid) toast.success("Lịch hợp lệ, có thể công bố");
      else toast.error(`Lịch còn ${result.blockers.length} lỗi cần xử lý`);
    } catch {
      // Mutation hook surfaces the server error.
    }
  }

  async function publishDraft() {
    if (revision === null || publishMutation.isPending) return;
    try {
      await publishMutation.mutateAsync({
        roundId,
        payload: { clientRevision: revision, confirmWarnings: [], reason: "Manager published manual schedule" },
      });
    } catch (error) {
      if (detailCode(error as ApiError) === "PUBLISH_BLOCKED") {
        setValidationBlockers(blockersFromPublishError(error));
        setValidationWarnings(warningsFromPublishError(error));
        setValidationPanelOpen(true);
      }
    }
  }

  async function runAlgorithm() {
    if (!canRunAlgorithm) return;
    try {
      await runScheduleMutation.mutateAsync({
        roundId: numericRoundId,
        semesterId,
      });
    } catch {
      // Mutation hook surfaces the server error.
    }
  }

  async function copyVersion(versionId: number) {
    closeEditor();
    setCopyingVersionId(versionId);
    try {
      const selectedVersionDetail = await fetchScheduling.versionDetail(versionId, semesterId);
      const latestManualBoard = (await refetchManualBoard()).data ?? manualBoard;
      if (!latestManualBoard) {
        toast.error("Không tải được lịch xếp tay hiện tại để thay thế.");
        return;
      }

      const payload: ManualScheduleBulkUpsertPayload = {
        clientRevision: latestManualBoard.revision,
        allowDraftIncomplete: true,
        deletedSessionIds: latestManualBoard.sessions.map((session) => session.id),
        sourceVersionId: versionId,
        sessions: selectedVersionDetail.assignments.map((assignment) => {
          const reviewerIds = [
            ...assignment.resultOwnerIds,
            ...assignment.reviewerIds.filter((lecturerId) => !assignment.resultOwnerIds.includes(lecturerId)),
          ];
          return {
            date: formatInVietnamTime(assignment.startAt, "YYYY-MM-DD"),
            roundTimeslotId: String(assignment.timeslotId),
            groupIds: [
              canonicalGroupId(groupById.get(String(assignment.groupId))?.groupId ?? assignment.groupId),
            ],
            roomId: assignment.roomId === null ? null : String(assignment.roomId),
            reviewers: reviewerIds.slice(0, roles.length).map((lecturerId, index) => ({
              lecturerId: String(lecturerId),
              role: roles[index].key as ManualScheduleReviewerInput["role"],
              order: index + 1,
            })),
          };
        }),
      };
      const board = await bulkUpsertMutation.mutateAsync({ roundId, payload });
      hydratedApiSnapshotRef.current = JSON.stringify({ revision: board.revision, sessions: board.sessions });
      setRevision(board.revision);
      setSessions(board.sessions.map((session) => apiSessionToDraft(session, roles)));
      setValidationBlockers([]);
      setValidationWarnings([]);
    } catch {
      // Mutation and detail-fetch hooks surface the server error where available.
      toast.error("Không tải hoặc lưu được phương án vào lịch xếp tay.");
    } finally {
      setCopyingVersionId(null);
    }
  }

  async function removeVersion(versionId: number) {
    try {
      await deleteVersionMutation.mutateAsync({
        versionId,
        roundId: numericRoundId,
        semesterId,
      });
    } catch {
      // Mutation hook surfaces the server error.
    }
  }

  function requestCopyVersion(versionId: number, versionNo: number) {
    if (!canPublishManualSchedule || copyingVersionId !== null || deleteVersionMutation.isPending) return;
    setVersionConfirmation({ action: "copy", versionId, versionNo });
  }

  function requestDeleteVersion(versionId: number, versionNo: number) {
    if (copyingVersionId !== null || deleteVersionMutation.isPending) return;
    setVersionConfirmation({ action: "delete", versionId, versionNo });
  }

  async function confirmVersionAction() {
    const pending = versionConfirmation;
    if (!pending || copyingVersionId !== null || deleteVersionMutation.isPending) return;
    setVersionConfirmation(null);
    if (pending.action === "copy") {
      await copyVersion(pending.versionId);
      return;
    }
    await removeVersion(pending.versionId);
  }

  function updateRoom(roomId: string | null) {
    setDraft((current) => (current ? { ...current, roomId } : current));
  }

  function toggleGroup(groupId: string) {
    setDraft((current) => {
      if (!current) return current;
      const normalizedGroupId = canonicalGroupId(groupId);
      const normalizedGroupIds = current.groupIds.map(canonicalGroupId);
      if (normalizedGroupIds.includes(normalizedGroupId)) {
        return {
          ...current,
          groupIds: normalizedGroupIds.filter((id) => id !== normalizedGroupId),
        };
      }
      return { ...current, groupIds: [...normalizedGroupIds, normalizedGroupId] };
    });
  }

  function addVisibleGroups() {
    setDraft((current) => {
      if (!current) return current;
      const selected = new Set(current.groupIds);
      for (const group of filteredGroupOptions) selected.add(group.groupId);
      return { ...current, groupIds: Array.from(selected) };
    });
  }

  function clearGroups() {
    setDraft((current) => (current ? { ...current, groupIds: [] } : current));
  }

  function updateReviewer(roleKey: string, lecturerId: string | null) {
    setDraft((current) => {
      if (!current) return current;
      const reviewerIds = { ...current.reviewerIds, [roleKey]: lecturerId };
      const selectedReviewers = Object.values(reviewerIds).filter((id): id is string => Boolean(id));
      return {
        ...current,
        reviewerIds,
        groupIds: current.groupIds.filter((groupId) => {
          const group = groupById.get(groupId);
          return !(group && hasSupervisorConflict(group, selectedReviewers));
        }),
      };
    });
  }

  function updateReviewerSearch(roleKey: string, value: string) {
    setReviewerSearchByRole((current) => ({ ...current, [roleKey]: value }));
  }

  if (dates.length === 0 || timeRows.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Round chưa có khung giờ nào.</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Xếp lịch bằng tay</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {roles.length} vai trò chấm · {hasSessionLimit ? `tối đa ${maxSessionsPerCell} hội đồng / timeslot` : "không giới hạn hội đồng / timeslot"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={scheduleInteractionLocked || runScheduleMutation.isPending || !canRunAlgorithm}
            title={canRunAlgorithm ? undefined : "Sau khi công bố, hãy sửa tay hoặc tạo thay đổi có kiểm soát thay vì chạy lại toàn bộ thuật toán."}
            onClick={runAlgorithm}
          >
            {runScheduleMutation.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {runScheduleMutation.isPending
              ? "Đang chạy…"
              : visibleVersions.length > 0
                ? "Chạy lại thuật toán"
                : "Chạy thuật toán"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={scheduleInteractionLocked || revision === null || validateMutation.isPending}
            onClick={validateDraft}
          >
            <CheckCircle2 />
            Kiểm tra
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={scheduleInteractionLocked || revision === null || publishPending || !canPublishManualSchedule}
            title={canPublishManualSchedule ? undefined : "Round hiện tại không thể công bố bản nháp."}
            onClick={publishDraft}
          >
            {publishPending && <Loader2 className="animate-spin" />}
            Công bố lịch
          </Button>
        </div>
      </div>

      {versionsLoading && visibleVersions.length === 0 ? (
        <Skeleton className="h-20 w-full" />
      ) : visibleVersions.length > 0 ? (
        <div className="shrink-0 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Phương án xếp lịch</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Chọn version để chép vào cùng lịch xếp tay; sau đó bạn vẫn có thể sửa hội đồng trực tiếp.
              </p>
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                Reviewer được nạp theo thứ tự của phương án; hãy kiểm tra lại vai trò trước khi công bố.
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {visibleVersions.length} phương án
            </span>
          </div>
          <div aria-label="Các phương án xếp lịch" className="mt-2 flex flex-wrap gap-2">
            {visibleVersions.map((version) => {
              const scheduledCount = version.scheduledCount ?? version.metrics?.scheduledGroups ?? 0;
              const unscheduledCount = version.unscheduledCount ?? 0;
              return (
                <div
                  key={version.id}
                  className="inline-flex items-stretch overflow-hidden rounded-md border border-border bg-background text-xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => requestCopyVersion(version.id, version.versionNo)}
                    disabled={copyingVersionId !== null || deleteVersionMutation.isPending || !canPublishManualSchedule}
                    className="px-2.5 py-1.5 text-left font-medium hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {copyingVersionId === version.id ? "Đang chép…" : `V${version.versionNo} · ${version.objectiveLabel ?? "Phương án"} · ${scheduledCount} nhóm`}
                    {unscheduledCount > 0 && ` · ${unscheduledCount} chưa xếp`}
                  </button>
                  {version.status === "DRAFT" && (
                    <button
                      type="button"
                      aria-label={`Xóa version V${version.versionNo}`}
                      title="Xóa phương án nháp"
                      onClick={() => requestDeleteVersion(version.id, version.versionNo)}
                      disabled={scheduleInteractionLocked || deleteVersionMutation.isPending}
                      className="border-l border-border/70 px-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasValidationResult && (
        <div
          className={cn(
            "shrink-0 rounded-lg border px-3 py-2.5",
            validationBlockers.length > 0
              ? "border-red-200 bg-red-50 text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100"
              : "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {validationBlockers.length > 0 ? (
                <AlertCircle className="size-4 shrink-0" aria-hidden />
              ) : (
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {validationBlockers.length > 0 ? "Chưa thể công bố lịch" : "Lịch đã vượt qua kiểm tra"}
                </p>
                <p className="truncate text-xs opacity-80">
                  {unscheduledGroupIds.length > 0
                    ? `${unscheduledGroupIds.length} nhóm chưa được xếp lịch`
                    : validationWarnings.length > 0
                      ? `${validationWarnings.length} quy tắc chưa được cấu hình`
                      : "Không còn lỗi chặn"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="shrink-0"
              onClick={() => setValidationPanelOpen(true)}
            >
              Xem chi tiết
            </Button>
          </div>
        </div>
      )}

      {isLoadingOptions && <Skeleton className="h-8 w-full max-w-sm" />}

      {copyingVersionId !== null && (
        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-100">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Đang tải phương án để chép vào lịch xếp tay...
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-background">
        <table className="w-full min-w-[1040px] table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 w-28 min-w-28 border-r border-b border-border bg-muted px-3 py-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                Timeslot
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  className="sticky top-0 z-20 min-w-0 border-b border-l border-border bg-muted px-3 py-2 text-left align-middle"
                >
                  <span className="block text-[11px] font-medium text-muted-foreground capitalize">
                    {formatDate(date, "dddd")}
                  </span>
                  <span className="mt-1 block text-sm font-semibold tabular-nums">{formatDate(date, "DD/MM")}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeRows.map((row) => (
              <tr key={row.startTime}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 w-28 min-w-28 border-r border-b border-border bg-background px-3 py-3 text-left align-top"
                >
                  <span className="block text-xs font-semibold tabular-nums">{row.startTime}</span>
                  <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground tabular-nums">
                    đến {row.endTime}
                  </span>
                </th>
                {dates.map((date) => {
                  const slot = slotsByCell.get(dayStartKey(date, row.startTime));
                  if (!slot) {
                    return (
                      <td
                        key={`${date}-${row.startTime}`}
                        aria-disabled
                        className="h-40 min-w-0 border-b border-l border-border bg-muted/35 p-3 align-top"
                      >
                        <span className="text-xs text-muted-foreground">Không mở</span>
                      </td>
                    );
                  }

                  const key = cellKey(date, slot.id);
                  const cellSessions = sessionsByCell.get(key) ?? [];
                  const cellGroupCount = cellSessions.reduce((sum, session) => sum + session.groupIds.length, 0);
                  const canAdd = !scheduleInteractionLocked && (!hasSessionLimit || cellSessions.length < maxSessionsPerCell);
                  const cellResources = cellResourceAvailability.get(key);
                  const hasAvailableResources =
                    cellResourcesLoading ||
                    Boolean(cellResources && cellResources.groupCount > 0 && cellResources.lecturerCount > 0);
                  const showAddAction = canAdd && hasAvailableResources;
                  const unavailableMessage =
                    cellResources?.groupCount === 0 && cellResources.lecturerCount === 0
                      ? "Không có nhóm hoặc GV khả dụng"
                      : cellResources?.groupCount === 0
                        ? "Không có nhóm khả dụng"
                        : "Không có GV khả dụng";

                  return (
                    <td
                      key={key}
                      className="h-40 min-w-0 border-b border-l border-border p-2 align-top transition-colors hover:bg-muted/20"
                    >
                      <div className="flex min-h-36 min-w-0 flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold tabular-nums">
                            {hasSessionLimit
                              ? `${cellSessions.length}/${maxSessionsPerCell} hội đồng · ${cellGroupCount} nhóm`
                              : `${cellSessions.length} hội đồng · ${cellGroupCount} nhóm`}
                          </span>
                          {showAddAction && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={() => openCreate(date, slot)}
                              aria-label={`Thêm buổi ${formatDate(date, "DD/MM")} ${row.startTime}`}
                              title="Thêm buổi"
                            >
                              <Plus />
                              Thêm
                            </Button>
                          )}
                        </div>

                        {cellSessions.length === 0 ? (
                          showAddAction ? (
                            <button
                              type="button"
                              onClick={() => openCreate(date, slot)}
                              className="flex min-h-24 flex-1 items-center justify-center rounded-md border border-dashed border-border bg-muted/20 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                            >
                              <Plus className="mr-1 size-3.5" />
                              Thêm hội đồng
                            </button>
                          ) : (
                            <div className="flex min-h-24 flex-1 items-center justify-center rounded-md border border-amber-200 bg-amber-50/75 px-3 text-center text-xs font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                              <span className="flex items-center gap-2">
                                <Info className="size-4 shrink-0" aria-hidden />
                                {cellResourcesLoading ? "Đang kiểm tra khả dụng..." : unavailableMessage}
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="space-y-1.5">
                            {cellSessions.map((session) => (
                              <ManualSessionChip
                                key={session.id}
                                session={session}
                                roles={roles}
                                groupById={groupById}
                                roomById={roomById}
                                lecturerById={lecturerById}
                                disabled={scheduleInteractionLocked}
                                onEdit={() => openEdit(session)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(draft && activeEditor)} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col overflow-hidden sm:max-w-6xl">
          {draft && activeEditor && (
            <>
              <DialogHeader icon={UserRoundPlus} iconTone="primary">
                <DialogTitle>{activeEditor.sessionId ? "Chỉnh hội đồng" : "Thêm hội đồng"}</DialogTitle>
                <DialogDescription>
                  {formatDate(activeEditor.date, "dddd, DD/MM")} · {activeEditor.slot.startTime} đến{" "}
                  {activeEditor.slot.endTime} · {hasSessionLimit ? `còn ${draftRemainingSessionCount} hội đồng có thể thêm` : "có thể thêm hội đồng"}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-4">
                  <section className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-300">
                        <UserRoundPlus className="size-4" />
                        Giảng viên chấm
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Object.values(draft.reviewerIds).filter(Boolean).length}/{roles.length} đã chọn
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {roles.map((role) => {
                        const selectedForOtherRoles = new Set(
                          Object.entries(draft.reviewerIds)
                            .filter(([key, value]) => key !== role.key && Boolean(value))
                            .map(([, value]) => value as string)
                        );
                        const roleSearch = reviewerSearchByRole[role.key] ?? "";
                        const lecturerOptions = baseLecturerOptions.filter((invitation) => {
                          const lecturerId = String(invitation.lecturer.id);
                          const isCurrentValue = draft.reviewerIds[role.key] === lecturerId;
                          return (
                            (isCurrentValue ||
                              (!selectedForOtherRoles.has(lecturerId) && !selectedInOtherSessionSameCell.has(lecturerId))) &&
                            includesSearch(roleSearch, invitation.lecturer.code, invitation.lecturer.fullName)
                          );
                        });
                        const selectedLecturer = draft.reviewerIds[role.key]
                          ? lecturerById.get(draft.reviewerIds[role.key] as string)
                          : undefined;

                        return (
                          <div key={role.key} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-xs font-medium text-foreground">{role.label}</label>
                              <span className="text-[10px] text-muted-foreground">Bắt buộc</span>
                            </div>
                            <ReviewerPicker
                              role={role}
                              selectedLecturer={selectedLecturer}
                              options={lecturerOptions}
                              search={roleSearch}
                              onSearchChange={(value) => updateReviewerSearch(role.key, value)}
                              onSelect={(lecturerId) => updateReviewer(role.key, lecturerId)}
                              onClear={() => updateReviewer(role.key, null)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <div className="grid items-stretch gap-4 lg:grid-cols-2">
                    <section className="flex h-full min-w-0 flex-col rounded-lg border border-border bg-background p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300">
                          <UsersRound className="size-4 shrink-0" />
                          <span>Nhóm</span>
                          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold">
                            {draft.groupIds.length} đã chọn
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="xs" onClick={addVisibleGroups} disabled={filteredGroupOptions.length === 0}>
                            Chọn tất cả
                          </Button>
                          <Button type="button" variant="ghost" size="xs" onClick={clearGroups} disabled={draft.groupIds.length === 0}>
                            Bỏ chọn
                          </Button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Nhiều nhóm có thể dùng chung một phòng và hội đồng.</p>
                      <div className="mt-3">
                        <SearchField value={groupSearch} onChange={setGroupSearch} placeholder="Tìm mã nhóm, leader..." />
                      </div>
                      <div className="mt-2 min-h-0 flex-1 max-h-64 overflow-y-auto rounded-md border border-border lg:max-h-72">
                        {filteredGroupOptions.length === 0 && (
                          <p className="px-3 py-8 text-center text-xs text-muted-foreground">Không có nhóm phù hợp timeslot này.</p>
                        )}
                        {filteredGroupOptions.map((group) => {
                          const checked = draft.groupIds.some(
                            (groupId) => canonicalGroupId(groupId) === canonicalGroupId(group.groupId),
                          );
                          return (
                            <label
                              key={group.groupId}
                              className={cn(
                                "flex cursor-pointer items-start gap-2.5 border-b border-border px-3 py-2.5 text-sm last:border-b-0 hover:bg-muted/45",
                                checked && "bg-violet-500/5"
                              )}
                            >
                              <Checkbox
                                className="mt-0.5"
                                checked={checked}
                                onCheckedChange={() => toggleGroup(group.groupId)}
                                aria-label={`Chọn nhóm ${group.groupCode}`}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-mono text-xs font-semibold text-violet-700 dark:text-violet-300">
                                  {group.groupCode}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                  {group.leaderName ?? "Chưa có leader"} · {group.activeMemberCount} TV
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </section>

                    <section className="flex h-full min-w-0 flex-col rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-sky-300">
                          <DoorOpen className="size-4" />
                          Phòng
                        </div>
                        <span className="text-xs text-muted-foreground">{draft.roomId ? "Đã gán" : "Bắt buộc"}</span>
                      </div>
                      <div className="mt-3">
                        <SearchField value={roomSearch} onChange={setRoomSearch} placeholder="Tìm mã phòng, loại, sức chứa..." />
                      </div>
                      <div className="mt-2 min-h-0 flex-1 max-h-64 overflow-y-auto rounded-md border border-border lg:max-h-72">
                        {filteredRoomOptions.length === 0 && (
                          <p className="px-3 py-6 text-center text-xs text-muted-foreground">Không có phòng phù hợp.</p>
                        )}
                        {filteredRoomOptions.map((room) => {
                          const selected = draft.roomId === String(room.id);
                          return (
                            <button
                              key={room.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => updateRoom(String(room.id))}
                              className={cn(
                                "flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                selected && "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                              )}
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-mono text-xs font-semibold">{room.code}</span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                  {room.name || "Phòng"} · {room.type ?? "ROOM"} · {room.capacity} chỗ
                                </span>
                              </span>
                              {selected && <Check className="size-4 shrink-0" aria-hidden />}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              <DialogFooter className="shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <div className="mr-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{draft.groupIds.length} nhóm</span>
                  <span>{draft.roomId ? "Đã gán phòng" : "Chưa gán phòng"}</span>
                  <span>
                    {Object.values(draft.reviewerIds).filter(Boolean).length}/{roles.length} GV
                  </span>
                </div>
                {activeEditor.sessionId && (
                  <Button type="button" variant="destructive" onClick={deleteDraft}>
                    <X />
                    Xóa buổi
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditor}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={saveDraft}
                  disabled={
                    draft.groupIds.length === 0 &&
                    !draft.roomId &&
                    Object.values(draft.reviewerIds).every((value) => !value)
                  }
                >
                  Lưu{draft.groupIds.length > 0 ? ` (${draft.groupIds.length} nhóm)` : ""}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={versionConfirmation !== null}
        onOpenChange={(open) => {
          if (!open && copyingVersionId === null && !deleteVersionMutation.isPending) {
            setVersionConfirmation(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {versionConfirmation && (
            <>
              <DialogHeader
                icon={versionConfirmation.action === "delete" ? Trash2 : Sparkles}
                iconTone={versionConfirmation.action === "delete" ? "destructive" : "primary"}
              >
                <DialogTitle>
                  {versionConfirmation.action === "delete"
                    ? `Xóa phương án V${versionConfirmation.versionNo}?`
                    : `Chép phương án V${versionConfirmation.versionNo} vào lịch tay?`}
                </DialogTitle>
                <DialogDescription>
                  {versionConfirmation.action === "delete"
                    ? "Phương án nháp và dữ liệu lịch thuộc phương án sẽ bị xóa. Nếu phương án này đã được chép vào lịch tay, toàn bộ lịch tay liên kết cũng sẽ được dọn. Thao tác này không thể hoàn tác."
                    : "Toàn bộ lịch tay hiện tại sẽ được xóa trong một lần và thay bằng các nhóm, khung giờ, phòng và reviewer của phương án đã chọn."}
                </DialogDescription>
              </DialogHeader>

              <div className={cn(
                "rounded-lg border px-3 py-2.5 text-sm leading-5",
                versionConfirmation.action === "delete"
                  ? "border-destructive/20 bg-destructive/5 text-destructive"
                  : "border-primary/20 bg-primary/5 text-foreground",
              )}>
                {versionConfirmation.action === "delete"
                  ? "Các phiên lịch đã materialize và bản nháp lịch tay được chép từ version này sẽ không còn được giữ lại."
                  : "Nếu bạn đang chỉnh lịch tay, mọi phiên hiện tại sẽ bị thay thế bằng dữ liệu của version này."}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setVersionConfirmation(null)}>
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant={versionConfirmation.action === "delete" ? "destructive" : "default"}
                  onClick={() => void confirmVersionAction()}
                  disabled={copyingVersionId !== null || deleteVersionMutation.isPending}
                >
                  {versionConfirmation.action === "delete" ? "Xóa phương án" : "Chép vào lịch tay"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={validationPanelOpen} onOpenChange={setValidationPanelOpen}>
        <SheetContent side="right" className="w-[min(92vw,30rem)] gap-0 p-0 sm:max-w-[30rem]">
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle className="flex items-center gap-2">
              {validationBlockers.length > 0 ? (
                <AlertCircle className="size-5 text-red-600" aria-hidden />
              ) : (
                <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
              )}
              {validationBlockers.length > 0 ? "Chưa thể công bố lịch" : "Kết quả kiểm tra lịch"}
            </SheetTitle>
            <SheetDescription>
              {validationBlockers.length > 0
                ? "Xử lý các lỗi chặn dưới đây rồi thử công bố lại."
                : "Lịch không còn lỗi chặn. Các mục bên dưới chỉ là thông tin cấu hình."}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {unscheduledGroupIds.length > 0 && (
              <section className="rounded-lg border border-red-200 bg-red-50/70 p-3 dark:border-red-900/60 dark:bg-red-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
                      {unscheduledGroupIds.length} nhóm chưa được xếp lịch
                    </h3>
                    <p className="mt-1 text-xs text-red-800/80 dark:text-red-200/80">
                      Mỗi nhóm cần xuất hiện trong ít nhất một hội đồng trước khi công bố.
                    </p>
                  </div>
                  <span className="inline-flex min-w-[4.75rem] shrink-0 justify-center whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-red-800 dark:bg-red-900/50 dark:text-red-100">
                    Lỗi chặn
                  </span>
                </div>
                <div className="mt-3 max-h-64 divide-y divide-red-200/80 overflow-y-auto rounded-md border border-red-200/80 bg-background dark:divide-red-900/60 dark:border-red-900/60">
                  {unscheduledGroupIds.map((groupId) => {
                    const group = groupById.get(groupId);
                    return (
                      <div key={groupId} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-semibold text-violet-700 dark:text-violet-300">
                            {group?.groupCode ?? groupId}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {group?.leaderName ?? "Chưa có leader"}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground">Chưa xếp</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {validationBlockers.filter((blocker) => blocker.code !== "UNSCHEDULED_GROUPS").length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Lỗi cần xử lý</h3>
                <div className="space-y-2">
                  {validationBlockers
                    .filter((blocker) => blocker.code !== "UNSCHEDULED_GROUPS")
                    .map((blocker, index) => (
                      <div
                        key={`${blocker.code}-${blocker.sessionId ?? "global"}-${index}`}
                        className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-100"
                      >
                        <p className="font-semibold">{blocker.message}</p>
                        {blocker.field && <p className="mt-1 opacity-75">Vị trí: {blocker.field}</p>}
                      </div>
                    ))}
                </div>
              </section>
            )}

            {validationWarnings.length > 0 && (
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Info className="size-4 text-sky-600" aria-hidden />
                  <h3 className="text-sm font-semibold text-foreground">Thông tin cần lưu ý</h3>
                </div>
                <div className="space-y-2">
                  {validationWarnings.map((warning, index) => (
                    <div
                      key={`${warning.code}-${index}`}
                      className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-100"
                    >
                      <p className="font-semibold">{warning.message}</p>
                      {warning.status === "notConfigured" && (
                        <p className="mt-1 opacity-75">Trạng thái: Chưa cấu hình, không phải lỗi của lịch hiện tại.</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
