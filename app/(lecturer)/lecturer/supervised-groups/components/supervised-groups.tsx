"use client";

import { useMemo } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupervisedProjects } from "@/hooks/lecturer/useLecturerPortal";
import { GroupRow } from "./group-row";
import { GroupsTable } from "./groups-table";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

export function SupervisedGroups() {
  const { data: projects, isLoading, isError } = useSupervisedProjects();
  const reduceMotion = useReducedMotion();

  const needsAttention = useMemo(
    () => (projects ?? []).filter((p) => !p.group.leader || p.remediation?.status === "PENDING").length,
    [projects]
  );

  return (
    <div>
      <div className="motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Nhóm hướng dẫn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {projects ? `${projects.length} nhóm bạn đang hướng dẫn (chính hoặc đồng hướng dẫn)` : "Đang tải..."}
          {needsAttention > 0 && (
            <>
              {" · "}
              <span className="font-medium text-primary">{needsAttention} nhóm cần chú ý</span>
            </>
          )}
          .
        </p>
      </div>

      {isLoading && (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && (
        <div className="mt-6 flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <WifiOff className="size-4 shrink-0" />
          Không tải được danh sách nhóm hướng dẫn. Thử tải lại trang.
        </div>
      )}

      {projects && projects.length === 0 && (
        <p className="mt-10 py-10 text-center text-sm text-muted-foreground">Bạn chưa hướng dẫn nhóm nào.</p>
      )}

      {projects && projects.length > 0 && (
        <>
          <motion.div
            variants={reduceMotion ? undefined : containerVariants}
            initial={reduceMotion ? undefined : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            className="mt-6 md:hidden"
          >
            {projects.map((project) => (
              <motion.div key={project.id} variants={reduceMotion ? undefined : itemVariants}>
                <GroupRow project={project} />
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-6 hidden md:block">
            <GroupsTable projects={projects} />
          </div>
        </>
      )}
    </div>
  );
}
