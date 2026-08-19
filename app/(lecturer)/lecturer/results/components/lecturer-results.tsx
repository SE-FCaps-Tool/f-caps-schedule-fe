"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { pendingResultSessions, remediationTasks } from "./mock-data";
import { ResultEntryRow, type SubmittedResult } from "./result-entry-row";
import { RemediationTaskRow } from "./remediation-task-row";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

export function LecturerResults() {
  const reduceMotion = useReducedMotion();
  const [submittedResults, setSubmittedResults] = useState<Record<string, SubmittedResult>>({});
  const [verifiedTasks, setVerifiedTasks] = useState<Record<string, "passed" | "overdue">>({});

  const pendingCount = pendingResultSessions.length - Object.keys(submittedResults).length;
  const pendingRemediationCount = remediationTasks.length - Object.keys(verifiedTasks).length;

  const sortedSessions = useMemo(
    () =>
      [...pendingResultSessions].sort((a, b) => {
        const aDone = Boolean(submittedResults[a.id]);
        const bDone = Boolean(submittedResults[b.id]);
        if (aDone !== bDone) return aDone ? 1 : -1;
        return a.date.localeCompare(b.date);
      }),
    [submittedResults]
  );

  return (
    <div>
      <div className="motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Nhập kết quả</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingCount > 0 ? (
            <>
              <span className="font-medium text-primary">{pendingCount} phiên</span> đang chờ nhập kết quả
            </>
          ) : (
            "Đã nhập kết quả cho tất cả phiên."
          )}
          {pendingRemediationCount > 0 && (
            <>
              {" · "}
              <span className="font-medium text-primary">{pendingRemediationCount} nhóm</span> chờ xác nhận khắc phục
            </>
          )}
        </p>
      </div>

      <div className="mt-7">
        <h2 className="text-sm font-semibold text-muted-foreground">Phiên cần nhập kết quả</h2>
        <motion.div
          variants={reduceMotion ? undefined : containerVariants}
          initial={reduceMotion ? undefined : "hidden"}
          animate={reduceMotion ? undefined : "show"}
          className="mt-2"
        >
          {sortedSessions.map((session) => (
            <motion.div key={session.id} variants={reduceMotion ? undefined : itemVariants} layout={!reduceMotion}>
              <ResultEntryRow
                session={session}
                submitted={submittedResults[session.id]}
                onSubmit={(result) => setSubmittedResults((prev) => ({ ...prev, [session.id]: result }))}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {remediationTasks.length > 0 && (
        <div className="mt-7">
          <h2 className="text-sm font-semibold text-muted-foreground">Xác nhận khắc phục</h2>
          <div className="mt-2">
            {remediationTasks.map((task) => (
              <RemediationTaskRow
                key={task.id}
                task={task}
                verified={verifiedTasks[task.id]}
                onVerify={(status) => setVerifiedTasks((prev) => ({ ...prev, [task.id]: status }))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
