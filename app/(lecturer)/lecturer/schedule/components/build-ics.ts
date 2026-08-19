import { ROUND_TYPE_LABEL, type LecturerSession } from "./mock-data";

function toIcsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export function buildIcsCalendar(sessions: LecturerSession[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Capstone Scheduler//Lich cua toi//VI",
    "CALSCALE:GREGORIAN",
  ];

  for (const session of sessions) {
    if (session.status === "CANCELLED") continue;
    const summary = `${ROUND_TYPE_LABEL[session.roundType]} · ${session.groupCode}`;
    const location = session.isOnline ? session.room : `Phòng ${session.room}`;
    const description = `${session.groupTitleVi}\\nVai trò: ${session.myRole}\\nHội đồng: ${session.councilMembers.join(", ")}`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${session.id}@capstone-scheduler`,
      `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
      `DTSTART:${toIcsDate(session.startAtIso)}`,
      `DTEND:${toIcsDate(session.endAtIso)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `LOCATION:${escapeIcsText(location)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcsCalendar(sessions: LecturerSession[], fileName = "lich-cua-toi.ics") {
  const ics = buildIcsCalendar(sessions);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
