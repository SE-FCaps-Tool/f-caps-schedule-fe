"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Eye,
  Filter,
  Info,
  MapPin,
  Pencil,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import type {
  AttachedRoundGroup,
  RoundDetail,
  RoundInvitation,
} from "@/lib/api/services/fetchRounds";
import type { RoomApiItem } from "@/lib/api/services/fetchRooms";
import type {
  ManualScheduleSession,
  ReviewerRole,
} from "./round-manual-schedule-board";

const GOOGLE_CALENDAR_COLORS = [
  {
    bg: "bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100/80 dark:hover:bg-sky-900/50",
    border: "border-sky-300 dark:border-sky-700/60",
    accent: "bg-sky-500",
    text: "text-sky-900 dark:text-sky-100",
    muted: "text-sky-700/80 dark:text-sky-300/80",
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20",
    dot: "bg-sky-500",
  },
  {
    bg: "bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50",
    border: "border-emerald-300 dark:border-emerald-700/60",
    accent: "bg-emerald-500",
    text: "text-emerald-900 dark:text-emerald-100",
    muted: "text-emerald-700/80 dark:text-emerald-300/80",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100/80 dark:hover:bg-amber-900/50",
    border: "border-amber-300 dark:border-amber-700/60",
    accent: "bg-amber-500",
    text: "text-amber-900 dark:text-amber-100",
    muted: "text-amber-700/80 dark:text-amber-300/80",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100/80 dark:hover:bg-purple-900/50",
    border: "border-purple-300 dark:border-purple-700/60",
    accent: "bg-purple-500",
    text: "text-purple-900 dark:text-purple-100",
    muted: "text-purple-700/80 dark:text-purple-300/80",
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20",
    dot: "bg-purple-500",
  },
  {
    bg: "bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100/80 dark:hover:bg-rose-900/50",
    border: "border-rose-300 dark:border-rose-700/60",
    accent: "bg-rose-500",
    text: "text-rose-900 dark:text-rose-100",
    muted: "text-rose-700/80 dark:text-rose-300/80",
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20",
    dot: "bg-rose-500",
  },
  {
    bg: "bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/50",
    border: "border-indigo-300 dark:border-indigo-700/60",
    accent: "bg-indigo-500",
    text: "text-indigo-900 dark:text-indigo-100",
    muted: "text-indigo-700/80 dark:text-indigo-300/80",
    badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    dot: "bg-indigo-500",
  },
  {
    bg: "bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100/80 dark:hover:bg-teal-900/50",
    border: "border-teal-300 dark:border-teal-700/60",
    accent: "bg-teal-500",
    text: "text-teal-900 dark:text-teal-100",
    muted: "text-teal-700/80 dark:text-teal-300/80",
    badge: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/20",
    dot: "bg-teal-500",
  },
];

const HOUR_HEIGHT = 68; // Height in pixels for 1 hour
const START_HOUR = 6; // 06:00 AM
const END_HOUR = 21; // 21:00 PM
const HOURS_COUNT = END_HOUR - START_HOUR;

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
  return (h || 0) * 60 + (m || 0);
}

interface CalendarEventLayout {
  session: ManualScheduleSession;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
  color: (typeof GOOGLE_CALENDAR_COLORS)[0];
}

interface RoundCalendarScheduleViewProps {
  round: RoundDetail;
  draftSessions: ManualScheduleSession[];
  rooms: RoomApiItem[];
  groupMap: Map<string, AttachedRoundGroup>;
  invitationMap: Map<string, RoundInvitation>;
  roles: ReviewerRole[];
  onSelectSessionForEdit?: (sessionId: string) => void;
}

export function RoundCalendarScheduleView({
  round,
  draftSessions,
  rooms,
  groupMap,
  invitationMap,
  roles,
  onSelectSessionForEdit,
}: RoundCalendarScheduleViewProps) {
  const roundDates = useMemo(() => {
    return Array.from(new Set(round.days.map((d) => d.date))).sort();
  }, [round.days]);

  const [selectedDateFilter, setSelectedDateFilter] = useState<string | "ALL">("ALL");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDetailSessionId, setActiveDetailSessionId] = useState<string | null>(null);

  // Map room IDs to consistent colors
  const roomColorMap = useMemo(() => {
    const map = new Map<string, (typeof GOOGLE_CALENDAR_COLORS)[0]>();
    rooms.forEach((r, idx) => {
      map.set(String(r.id), GOOGLE_CALENDAR_COLORS[idx % GOOGLE_CALENDAR_COLORS.length]);
    });
    return map;
  }, [rooms]);

  const roomMap = useMemo(() => {
    const map = new Map<string, RoomApiItem>();
    rooms.forEach((r) => map.set(String(r.id), r));
    return map;
  }, [rooms]);

  // Displayed dates according to selected filter
  const visibleDates = useMemo(() => {
    if (selectedDateFilter === "ALL") return roundDates;
    return roundDates.filter((d) => d === selectedDateFilter);
  }, [roundDates, selectedDateFilter]);

  // Filter sessions based on room, search query, and valid dates
  const filteredSessions = useMemo(() => {
    return draftSessions.filter((s) => {
      if (selectedRoomFilter !== "ALL") {
        if (!s.roomId || s.roomId !== selectedRoomFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const groupCodes = s.groupIds.map((gid) => groupMap.get(gid)?.groupCode?.toLowerCase() || "");
        const projectTitles = s.groupIds.map((gid) => groupMap.get(gid)?.title?.toLowerCase() || "");
        const reviewerNames = Object.values(s.reviewerIds).map(
          (rid) => (rid ? invitationMap.get(rid)?.lecturer?.fullName?.toLowerCase() || "" : "")
        );
        const roomCode = s.roomId ? roomMap.get(s.roomId)?.code?.toLowerCase() || "" : "";

        const matches =
          groupCodes.some((code) => code.includes(q)) ||
          projectTitles.some((title) => title.includes(q)) ||
          reviewerNames.some((name) => name.includes(q)) ||
          roomCode.includes(q) ||
          s.startTime.includes(q) ||
          s.endTime.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [draftSessions, selectedRoomFilter, searchQuery, groupMap, invitationMap, roomMap]);

  // Layout calculation for Google Calendar: cluster overlapping events in each day
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventLayout[]>();

    roundDates.forEach((date) => {
      const daySessions = filteredSessions.filter((s) => s.date === date);
      if (daySessions.length === 0) {
        map.set(date, []);
        return;
      }

      // Sort sessions by start time, then duration
      const sorted = [...daySessions].sort((a, b) => {
        const diff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        if (diff !== 0) return diff;
        return timeToMinutes(b.endTime) - timeToMinutes(a.endTime);
      });

      // Clustering overlapping sessions
      const clusters: ManualScheduleSession[][] = [];
      let currentCluster: ManualScheduleSession[] = [];
      let clusterEndMinutes = 0;

      sorted.forEach((session) => {
        const startMin = timeToMinutes(session.startTime);
        const endMin = timeToMinutes(session.endTime);

        if (currentCluster.length === 0) {
          currentCluster.push(session);
          clusterEndMinutes = endMin;
        } else if (startMin < clusterEndMinutes) {
          currentCluster.push(session);
          clusterEndMinutes = Math.max(clusterEndMinutes, endMin);
        } else {
          clusters.push(currentCluster);
          currentCluster = [session];
          clusterEndMinutes = endMin;
        }
      });
      if (currentCluster.length > 0) {
        clusters.push(currentCluster);
      }

      const layouts: CalendarEventLayout[] = [];

      clusters.forEach((cluster) => {
        const totalCols = cluster.length;
        cluster.forEach((session, colIdx) => {
          const startMin = timeToMinutes(session.startTime);
          const endMin = timeToMinutes(session.endTime);
          const duration = Math.max(30, endMin - startMin);

          const startOffsetMin = startMin - START_HOUR * 60;
          const top = Math.max(0, (startOffsetMin / 60) * HOUR_HEIGHT);
          const height = Math.max(36, (duration / 60) * HOUR_HEIGHT - 2);

          const leftPercent = (colIdx / totalCols) * 100;
          const widthPercent = (1 / totalCols) * 100;

          const color =
            (session.roomId && roomColorMap.get(session.roomId)) ||
            GOOGLE_CALENDAR_COLORS[colIdx % GOOGLE_CALENDAR_COLORS.length];

          layouts.push({
            session,
            top,
            height,
            leftPercent,
            widthPercent,
            color,
          });
        });
      });

      map.set(date, layouts);
    });

    return map;
  }, [roundDates, filteredSessions, roomColorMap]);

  // Selected session details
  const activeSession = useMemo(() => {
    if (!activeDetailSessionId) return null;
    return draftSessions.find((s) => s.id === activeDetailSessionId) || null;
  }, [activeDetailSessionId, draftSessions]);

  const hours = useMemo(() => {
    return Array.from({ length: HOURS_COUNT }, (_, i) => START_HOUR + i);
  }, []);

  return (
    <div className="flex h-full min-h-[400px] flex-col rounded-xl border border-border/80 bg-background shadow-xs overflow-hidden">
      {/* 1. Google Calendar Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-card/60 p-3 px-4">
        {/* Navigation & Date info */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center rounded-lg border border-border bg-background p-0.5 shadow-2xs">
            <Button
              variant="ghost"
              size="icon-xs"
              className="size-7 text-muted-foreground hover:text-foreground"
              disabled={selectedDateFilter === "ALL" || roundDates.indexOf(selectedDateFilter) <= 0}
              onClick={() => {
                if (selectedDateFilter === "ALL") return;
                const idx = roundDates.indexOf(selectedDateFilter);
                if (idx > 0) setSelectedDateFilter(roundDates[idx - 1]);
              }}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              className="h-7 px-2 text-xs font-medium"
              onClick={() => setSelectedDateFilter("ALL")}
            >
              Toàn bộ đợt
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="size-7 text-muted-foreground hover:text-foreground"
              disabled={
                selectedDateFilter === "ALL" ||
                roundDates.indexOf(selectedDateFilter) >= roundDates.length - 1
              }
              onClick={() => {
                if (selectedDateFilter === "ALL") return;
                const idx = roundDates.indexOf(selectedDateFilter);
                if (idx < roundDates.length - 1) setSelectedDateFilter(roundDates[idx + 1]);
              }}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {selectedDateFilter === "ALL"
                ? roundDates.length > 0
                  ? `${formatDate(roundDates[0], "DD/MM")} – ${formatDate(
                      roundDates[roundDates.length - 1],
                      "DD/MM/YYYY"
                    )}`
                  : "Chưa có ngày"
                : `${formatDate(selectedDateFilter, "dddd, DD/MM/YYYY")}`}
            </h3>
            <Badge variant="secondary" className="font-semibold text-xs px-2 py-0.5 whitespace-nowrap">
              {filteredSessions.length} phiên chấm
            </Badge>
          </div>
        </div>

        {/* Filters & Search Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Day Selector Pills */}
          <div className="hidden lg:flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSelectedDateFilter("ALL")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap",
                selectedDateFilter === "ALL"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tất cả ngày ({roundDates.length})
            </button>
            {roundDates.map((date) => (
              <button
                key={`pill-${date}`}
                type="button"
                onClick={() => setSelectedDateFilter(date)}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap",
                  selectedDateFilter === date
                    ? "bg-background text-primary shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {formatDate(date, "DD/MM")}
              </button>
            ))}
          </div>

          {/* Room Filter Dropdown */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs font-medium border-border/80"
                >
                  <DoorOpen className="size-3.5 text-muted-foreground" />
                  <span>
                    {selectedRoomFilter === "ALL"
                      ? "Tất cả phòng"
                      : roomMap.get(selectedRoomFilter)?.code || "Phòng"}
                  </span>
                </Button>
              }
            />
            <PopoverContent align="end" className="w-48 p-1.5 space-y-0.5">
              <button
                type="button"
                onClick={() => setSelectedRoomFilter("ALL")}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors",
                  selectedRoomFilter === "ALL"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span>Tất cả phòng ({rooms.length})</span>
              </button>
              {rooms.map((room) => {
                const color = roomColorMap.get(String(room.id));
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoomFilter(String(room.id))}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                      selectedRoomFilter === String(room.id)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span className={cn("size-2.5 rounded-full shrink-0", color?.dot || "bg-primary")} />
                    <span className="truncate">{room.code}</span>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>

          {/* Search Input */}
          <div className="relative w-40 sm:w-52">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm nhóm, đề tài, GV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>
      </div>

      {/* 2. Room Legend Bar */}
      {rooms.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto border-b border-border/50 bg-muted/20 px-4 py-2 text-xs">
          <span className="text-muted-foreground text-[11px] font-medium shrink-0">Chú thích phòng:</span>
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {rooms.map((room) => {
              const color = roomColorMap.get(String(room.id));
              const isSelected = selectedRoomFilter === String(room.id);
              return (
                <button
                  key={`leg-${room.id}`}
                  type="button"
                  onClick={() =>
                    setSelectedRoomFilter(isSelected ? "ALL" : String(room.id))
                  }
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all border",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-2xs"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className={cn("size-2 rounded-full shrink-0", color?.dot || "bg-primary")} />
                  <span>{room.code}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Google Calendar Main Canvas */}
      <div className="min-h-0 flex-1 overflow-auto">
        <div
          className="grid min-w-[760px] select-none"
          style={{
            gridTemplateColumns: `56px repeat(${visibleDates.length}, minmax(180px, 1fr))`,
          }}
        >
          {/* Header Row: GMT label & Day headers */}
          <div className="sticky top-0 z-30 flex items-center justify-center border-b border-r border-border/80 bg-card p-2 text-[10px] font-semibold text-muted-foreground uppercase">
            GMT+7
          </div>
          {visibleDates.map((date) => {
            const isSelected = selectedDateFilter === date;
            return (
              <div
                key={`head-${date}`}
                className={cn(
                  "sticky top-0 z-20 flex flex-col items-center justify-center border-b border-l border-border/80 bg-card/95 backdrop-blur-xs py-2 px-1 text-center transition-colors",
                  isSelected && "bg-primary/[0.04]"
                )}
              >
                <span className="text-[11px] font-medium text-muted-foreground uppercase">
                  {formatDate(date, "ddd")}
                </span>
                <span
                  className={cn(
                    "mt-0.5 flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-foreground group-hover:bg-muted"
                  )}
                >
                  {formatDate(date, "D")}
                </span>
              </div>
            );
          })}

          {/* Time Gutter and Event Canvas Columns */}
          <div className="relative border-r border-border/80 bg-card/30">
            {hours.map((hour) => (
              <div
                key={`time-${hour}`}
                className="relative border-b border-border/40 text-right pr-2 text-[11px] font-normal text-muted-foreground/80 tabular-nums"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="translate-y-1 inline-block">{`${hour.toString().padStart(2, "0")}:00`}</span>
              </div>
            ))}
          </div>

          {/* Day Columns containing Event Chips */}
          {visibleDates.map((date) => {
            const dayLayouts = eventsByDate.get(date) || [];
            return (
              <div
                key={`col-${date}`}
                className="relative border-l border-border/80 bg-background/50"
                style={{ height: HOURS_COUNT * HOUR_HEIGHT }}
              >
                {/* Background Hour Grid Lines */}
                {hours.map((hour) => (
                  <div
                    key={`gridline-${date}-${hour}`}
                    className="border-b border-border/40 w-full"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    {/* Half-hour dashed line */}
                    <div
                      className="border-b border-dashed border-border/20 w-full"
                      style={{ height: HOUR_HEIGHT / 2 }}
                    />
                  </div>
                ))}

                {/* Event Chips placed at calculated coordinates */}
                {dayLayouts.map(({ session, top, height, leftPercent, widthPercent, color }) => {
                  const room = session.roomId ? roomMap.get(session.roomId) : null;
                  const groupCodes = session.groupIds
                    .map((gid) => groupMap.get(gid)?.groupCode || `Nhóm #${gid}`)
                    .join(", ");
                  const projectTitle = session.groupIds
                    .map((gid) => groupMap.get(gid)?.title)
                    .filter(Boolean)
                    .join("; ");

                  const chairId = session.reviewerIds["CHAIR"];
                  const chairLecturer = chairId ? invitationMap.get(chairId)?.lecturer : null;

                  return (
                    <div
                      key={`event-${session.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveDetailSessionId(session.id)}
                      className={cn(
                        "group absolute rounded-md border p-1.5 text-left cursor-pointer transition-all shadow-2xs overflow-hidden select-none hover:z-10 hover:shadow-md hover:scale-[1.01] active:scale-95",
                        color.bg,
                        color.border
                      )}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `calc(${leftPercent}% + 2px)`,
                        width: `calc(${widthPercent}% - 4px)`,
                      }}
                    >
                      {/* Colored left edge bar */}
                      <div
                        className={cn("absolute left-0 top-0 bottom-0 w-1", color.accent)}
                      />

                      <div className="pl-1.5 h-full flex flex-col justify-between">
                        <div>
                          {/* Time & Room header */}
                          <div className="flex items-center justify-between gap-1 leading-tight">
                            <span
                              className={cn(
                                "text-[10px] font-semibold tabular-nums truncate",
                                color.muted
                              )}
                            >
                              {session.startTime} – {session.endTime}
                            </span>
                            {room && (
                              <span
                                className={cn(
                                  "font-mono text-[9px] font-bold px-1 py-0.2 rounded shrink-0",
                                  color.badge
                                )}
                              >
                                {room.code}
                              </span>
                            )}
                          </div>

                          {/* Group Code */}
                          <p
                            className={cn(
                              "text-xs font-bold truncate mt-0.5 leading-snug",
                              color.text
                            )}
                          >
                            {groupCodes}
                          </p>

                          {/* Project Title (if height allows) */}
                          {height >= 54 && projectTitle && (
                            <p
                              className={cn(
                                "text-[10px] truncate leading-normal opacity-85",
                                color.muted
                              )}
                            >
                              {projectTitle}
                            </p>
                          )}
                        </div>

                        {/* Council Preview (if height allows) */}
                        {height >= 68 && (
                          <div className="flex items-center gap-1 mt-auto pt-1 border-t border-border/20 text-[10px]">
                            <Users className={cn("size-2.5 shrink-0 opacity-70", color.text)} />
                            <span className={cn("truncate font-medium text-[9.5px]", color.muted)}>
                              {chairLecturer ? `CT: ${chairLecturer.fullName}` : `${Object.keys(session.reviewerIds).length} GV chấm`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Session Details Dialog */}
      {activeSession && (
        <Dialog
          open={Boolean(activeSession)}
          onOpenChange={(open) => !open && setActiveDetailSessionId(null)}
        >
          <DialogContent className="max-w-md gap-4 p-5 sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="size-4" />
                </span>
                <div>
                  <DialogTitle className="text-base font-semibold">
                    Chi tiết phiên đánh giá
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(activeSession.date, "dddd, DD/MM/YYYY")} · {activeSession.startTime} – {activeSession.endTime}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              {/* Info Badges */}
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-border/70 bg-muted/30">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">
                    {activeSession.startTime} – {activeSession.endTime}
                  </span>
                </div>
                <div className="text-muted-foreground">·</div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">
                    {activeSession.roomId
                      ? roomMap.get(activeSession.roomId)?.code || `Phòng #${activeSession.roomId}`
                      : "Chưa gán phòng"}
                  </span>
                </div>
              </div>

              {/* Group Information */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  Nhóm sinh viên đánh giá
                </h4>
                <div className="space-y-1.5">
                  {activeSession.groupIds.map((gid) => {
                    const group = groupMap.get(gid);
                    return (
                      <div
                        key={`dg-${gid}`}
                        className="p-3 rounded-lg border border-border/80 bg-card space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-primary">
                            {group?.groupCode || `Nhóm #${gid}`}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {group?.activeMemberCount ? `${group.activeMemberCount} thành viên` : ""}
                          </span>
                        </div>
                        {group?.title && (
                          <p className="text-xs text-foreground font-medium">{group.title}</p>
                        )}
                        {group?.leaderName && (
                          <p className="text-[11px] text-muted-foreground">
                            Trưởng nhóm: <span className="text-foreground">{group.leaderName}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Council Members */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-emerald-600" />
                  Hội đồng đánh giá
                </h4>
                <div className="divide-y divide-border/60 rounded-lg border border-border/80 bg-card overflow-hidden">
                  {roles.map((role) => {
                    const lecturerId = activeSession.reviewerIds[role.key];
                    const lecturer = lecturerId ? invitationMap.get(lecturerId)?.lecturer : null;

                    return (
                      <div
                        key={role.key}
                        className="flex items-center justify-between p-2.5 px-3 transition-colors hover:bg-muted/30"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {role.label}
                        </span>
                        {lecturer ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-xs">
                              {lecturer.fullName}
                            </span>
                            <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {lecturer.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Chưa phân công</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {onSelectSessionForEdit && (
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    const sid = activeSession.id;
                    setActiveDetailSessionId(null);
                    onSelectSessionForEdit(sid);
                  }}
                >
                  <Pencil className="size-3.5" />
                  Sửa phiên chấm này
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
