export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export const SITE = {
  name: "Capstone Scheduler",
  shortName: "Capstone Scheduler",
  defaultDescription:
    "Hệ thống xếp lịch & quản lý đánh giá đồ án tốt nghiệp — Khoa Kỹ thuật Phần mềm, Đại học FPT.",
  locale: "vi_VN",
};
