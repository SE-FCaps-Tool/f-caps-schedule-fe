"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowRight, Building2, CalendarRange, GraduationCap } from "lucide-react";
import { useLecturers } from "@/hooks/useLecturers";
import { useSemesters } from "@/hooks/useSemesters";
import { useRooms } from "@/hooks/useRooms";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

function ConfigCard({
  href,
  icon: Icon,
  title,
  description,
  count,
  countLabel,
}: {
  href: string;
  icon: typeof Building2;
  title: string;
  description: string;
  count: number | undefined;
  countLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border p-5 transition-all hover:border-primary/40 hover:shadow-[0_1px_0_0_theme(colors.border),0_8px_24px_-12px_theme(colors.primary/0.35)]"
    >
      <div className="flex items-start justify-between">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-5.5" strokeWidth={1.75} />
        </span>
        <ArrowRight className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </div>

      <div className="mt-5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">{description}</p>
      </div>

      <div className="mt-5 border-t border-border pt-3">
        <p className="text-2xl font-semibold tabular-nums">
          {count === undefined ? <span className="text-muted-foreground/40">—</span> : count}
        </p>
        <p className="text-xs text-muted-foreground">{countLabel}</p>
      </div>
    </Link>
  );
}

export function ConfigHub() {
  const reduceMotion = useReducedMotion();
  const { data: lecturers } = useLecturers();
  const { data: semesters } = useSemesters();
  const { data: rooms } = useRooms();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Cấu hình</h1>
      <p className="mt-1 text-sm text-muted-foreground">Master data dùng chung cho toàn hệ thống xếp lịch.</p>

      <motion.div
        variants={reduceMotion ? undefined : containerVariants}
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "show"}
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div variants={reduceMotion ? undefined : itemVariants}>
          <ConfigCard
            href="/admin/master-data/lecturers"
            icon={GraduationCap}
            title="Giảng viên"
            description="Mã giảng viên, tài khoản và trạng thái hoạt động."
            count={lecturers?.length}
            countLabel="giảng viên"
          />
        </motion.div>
        <motion.div variants={reduceMotion ? undefined : itemVariants}>
          <ConfigCard
            href="/admin/master-data/semesters"
            icon={CalendarRange}
            title="Học kỳ"
            description="Chỉ một học kỳ được ACTIVE tại một thời điểm."
            count={semesters?.length}
            countLabel="học kỳ"
          />
        </motion.div>
        <motion.div variants={reduceMotion ? undefined : itemVariants}>
          <ConfigCard
            href="/admin/master-data/rooms"
            icon={Building2}
            title="Phòng"
            description="Mã phòng và sức chứa dùng khi xếp lịch bảo vệ."
            count={rooms?.length}
            countLabel="phòng"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
