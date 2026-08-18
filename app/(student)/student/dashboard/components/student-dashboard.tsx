import { StatusLine } from "./status-line";
import { HorizontalTimeline } from "./horizontal-timeline";
import { RoundTimeline } from "./round-timeline";
import { GroupMembers } from "./group-members";
import { CopyGroupCodeButton } from "./copy-group-code-button";
import { studentDashboardData } from "./mock-data";

// Server Component: lấy dữ liệu (mock hôm nay, API thật sau này) rồi giao
// phần tương tác/animate cho các client component con.
export function StudentDashboard() {
  const { group, rounds } = studentDashboardData;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">
          Chào bạn, {group.members.find((m) => m.isCurrentUser)?.fullName.split(" ").at(-1)}
        </h1>
        <div className="mt-2">
          <StatusLine data={studentDashboardData} />
        </div>
      </div>

      <div className="mt-6 grid gap-x-12 gap-y-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <HorizontalTimeline rounds={rounds} />
          <RoundTimeline rounds={rounds} />
        </div>

        <div className="space-y-8 lg:border-l lg:border-border lg:pl-8">
          <GroupMembers members={group.members} />

          <div className="border-t border-border pt-6 lg:border-t-0 lg:pt-0">
            <h2 className="text-sm font-semibold text-muted-foreground">Đề tài</h2>
            <div className="mt-3 flex items-center gap-2">
              <p className="font-mono text-sm font-semibold">{group.code}</p>
              <CopyGroupCodeButton code={group.code} />
            </div>
            <p className="mt-3 text-sm text-foreground text-pretty">{group.projectTitleVi}</p>
            <p className="mt-0.5 text-sm text-muted-foreground italic text-pretty">{group.projectTitleEn}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
