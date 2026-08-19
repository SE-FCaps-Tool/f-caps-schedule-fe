"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { supervisedGroups as initialGroups } from "./mock-data";
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
  const [groups, setGroups] = useState(initialGroups);
  const reduceMotion = useReducedMotion();

  const needsAttention = useMemo(
    () => groups.filter((g) => !g.members.some((m) => m.isLeader) || g.remediation?.status === "pending").length,
    [groups]
  );

  function assignLeader(groupId: string, memberId: string) {
    setGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : { ...group, members: group.members.map((m) => ({ ...m, isLeader: m.id === memberId })) }
      )
    );
  }

  return (
    <div>
      <div className="motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Nhóm hướng dẫn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {groups.length} nhóm bạn đang hướng dẫn (chính hoặc đồng hướng dẫn)
          {needsAttention > 0 && (
            <>
              {" · "}
              <span className="font-medium text-primary">{needsAttention} nhóm cần chú ý</span>
            </>
          )}
          .
        </p>
      </div>

      <motion.div
        variants={reduceMotion ? undefined : containerVariants}
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "show"}
        className="mt-6 md:hidden"
      >
        {groups.map((group) => (
          <motion.div key={group.id} variants={reduceMotion ? undefined : itemVariants}>
            <GroupRow group={group} onAssignLeader={(memberId) => assignLeader(group.id, memberId)} />
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-6 hidden md:block">
        <GroupsTable groups={groups} onAssignLeader={assignLeader} />
      </div>
    </div>
  );
}
