"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { Building2, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomApiItem } from "@/lib/api/services/fetchRooms";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

function RoomCard({ room }: { room: RoomApiItem }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border p-5 transition-colors",
        !room.active && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg",
            room.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
          aria-hidden
        >
          <Building2 className="size-5.5" strokeWidth={1.75} />
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", room.active ? "bg-emerald-500" : "bg-muted-foreground/40")} aria-hidden />
          {room.active ? "Đang dùng" : "Ngừng dùng"}
        </span>
      </div>

      <div>
        <p className="font-mono text-xs font-medium text-muted-foreground">{room.code}</p>
        <h2 className="mt-0.5 truncate text-base font-semibold tracking-tight" title={room.name}>
          {room.name}
        </h2>
      </div>

      <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-3 text-sm text-muted-foreground">
        <Users2 className="size-4" />
        <span className="tabular-nums">{room.capacity}</span> chỗ
      </div>
    </div>
  );
}

export function RoomsGrid({ rooms }: { rooms: RoomApiItem[] }) {
  const reduceMotion = useReducedMotion();

  if (rooms.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Không có phòng khớp tìm kiếm.</p>;
  }

  return (
    <motion.div
      variants={reduceMotion ? undefined : containerVariants}
      initial={reduceMotion ? undefined : "hidden"}
      animate={reduceMotion ? undefined : "show"}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {rooms.map((room) => (
        <motion.div key={room.id} variants={reduceMotion ? undefined : itemVariants}>
          <RoomCard room={room} />
        </motion.div>
      ))}
    </motion.div>
  );
}
