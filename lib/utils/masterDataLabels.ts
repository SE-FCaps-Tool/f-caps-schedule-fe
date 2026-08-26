export type TopicType = "APPLICATION" | "RESEARCH" | "INTEGRATED" | "REGULAR";

export type LecturerSeniorityLevel = "Senior" | "MidLevel" | "Junior" | "Rookie";

export const TOPIC_TYPE_META: Record<TopicType, { label: string; description: string }> = {
  APPLICATION: { label: "Ứng dụng", description: "Đề tài ứng dụng" },
  RESEARCH: { label: "Nghiên cứu", description: "Đề tài nghiên cứu" },
  INTEGRATED: { label: "Tích hợp", description: "Đề tài tích hợp, vừa nghiên cứu vừa ứng dụng" },
  REGULAR: { label: "Thường", description: "Đề tài thường" },
};

export const TOPIC_TYPE_OPTIONS = (Object.keys(TOPIC_TYPE_META) as TopicType[]).map((value) => ({
  value,
  ...TOPIC_TYPE_META[value],
}));

export const SENIORITY_META: Record<LecturerSeniorityLevel, { label: string; description: string }> = {
  Senior: { label: "Senior", description: "Lâu năm, nhiều kinh nghiệm" },
  MidLevel: { label: "MidLevel", description: "Đã từng ngồi hội đồng" },
  Junior: { label: "Junior", description: "Trẻ, ít ngồi hội đồng" },
  Rookie: { label: "Rookie", description: "Người mới, chưa từng ngồi hội đồng" },
};

export const SENIORITY_NONE_VALUE = "NONE" as const;

export const SENIORITY_OPTIONS = [
  { value: SENIORITY_NONE_VALUE, label: "Chưa xét", description: "Chưa xét" },
  ...(Object.keys(SENIORITY_META) as LecturerSeniorityLevel[]).map((value) => ({
    value,
    ...SENIORITY_META[value],
  })),
] as const;

export function topicTypeLabel(value: TopicType | null | undefined) {
  return TOPIC_TYPE_META[value ?? "REGULAR"]?.label ?? TOPIC_TYPE_META.REGULAR.label;
}

export function topicTypeDescription(value: TopicType | null | undefined) {
  return TOPIC_TYPE_META[value ?? "REGULAR"]?.description ?? TOPIC_TYPE_META.REGULAR.description;
}

export function seniorityLabel(value: LecturerSeniorityLevel | null | undefined) {
  return value ? SENIORITY_META[value]?.label ?? value : "Chưa xét";
}
