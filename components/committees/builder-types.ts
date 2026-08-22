export interface DraftMember {
  externalId: string;
  lecturerCode: string;
  displayName: string;
}

export interface DraftGroup {
  /** Chỉ dùng làm React/dnd-kit key phía client — không gửi lên API. */
  key: string;
  code: string;
  members: DraftMember[];
}

export function createDraftGroup(): DraftGroup {
  return { key: crypto.randomUUID(), code: "", members: [] };
}
