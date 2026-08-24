import apiService from "../core";

/**
 * Committee = danh mục hội đồng nháp (chưa gắn Round/thời gian), khác bảng `councils` (hội đồng
 * chấm điểm thật, tự sinh theo session, không sửa/xoá được). BE trả thẳng camelCase khớp với
 * các type dưới đây — không snakeize như fetchLecturers/fetchRooms, vì đây là contract mới theo
 * đúng handoff, không phải endpoint cũ đang dùng chuẩn snake_case.
 */

export type CommitteeRole = "REVIEWER" | "CHAIR" | "SECRETARY" | "MEMBER";

export interface CommitteeGroupInput {
  code: string;
  memberIds: string[];
}

export interface CommitteeBatchRequest {
  groups: CommitteeGroupInput[];
}

export interface CommitteeMember {
  lecturerId: string;
  lecturerCode: string | null;
  displayName: string | null;
  role: CommitteeRole;
  sequenceNumber: number;
  roleLabel: string;
}

export interface CommitteePreviewGroupError {
  code: string;
  message: string;
}

export interface CommitteePreviewGroup {
  code: string;
  memberCount: number;
  ok: boolean;
  members: CommitteeMember[];
  errors: CommitteePreviewGroupError[];
}

export interface CommitteePreviewResponse {
  groups: CommitteePreviewGroup[];
}

export interface Committee {
  id: string;
  code: string;
  memberCount: number;
  createdBy: string | null;
  createdAt: string;
  members: CommitteeMember[];
}

export interface CommitteeBulkCreateError {
  index: number;
  code: string;
  message: string;
}

export interface CommitteeBulkCreateResponse {
  created: number;
  skipped: number;
  errors: CommitteeBulkCreateError[];
  committees: Committee[];
}

export interface CommitteeBulkDeleteResponse {
  deleted: number;
  deletedIds: number[];
}

export interface CommitteeListMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface CommitteeListResponse {
  data: Committee[];
  meta: CommitteeListMeta;
}

export const fetchCommittees = {
  /** POST /committees/preview — validate + gán role, không ghi DB. Luôn 200 nếu shape hợp lệ. */
  preview: async (payload: CommitteeBatchRequest): Promise<CommitteePreviewResponse> => {
    const response = await apiService.post<{ data: CommitteePreviewResponse }, CommitteeBatchRequest>(
      "api/v1/committees/preview",
      payload
    );
    return response.data.data;
  },

  /** POST /committees — tạo hàng loạt, partial success (201 dù có skipped > 0). */
  createBatch: async (payload: CommitteeBatchRequest): Promise<CommitteeBulkCreateResponse> => {
    const response = await apiService.post<{ data: CommitteeBulkCreateResponse }, CommitteeBatchRequest>(
      "api/v1/committees",
      payload
    );
    return response.data.data;
  },

  /** GET /committees — chưa phân trang thật (BE luôn trả full mảng), có thể lọc theo lecturerId. */
  list: async (lecturerId?: string): Promise<CommitteeListResponse> => {
    const response = await apiService.get<CommitteeListResponse, { lecturerId?: string }>("api/v1/committees", {
      lecturerId,
    });
    return response.data;
  },

  detail: async (committeeId: string): Promise<Committee> => {
    const response = await apiService.get<{ data: Committee }>(`api/v1/committees/${committeeId}`);
    return response.data.data;
  },

  /** DELETE /committees/{id} — xoá cứng, cascade members. */
  remove: async (committeeId: string): Promise<void> => {
    await apiService.delete(`api/v1/committees/${committeeId}`);
  },

  bulkDelete: async (committeeIds: string[]): Promise<CommitteeBulkDeleteResponse> => {
    const response = await apiService.post<{ data: CommitteeBulkDeleteResponse }, { committeeIds: string[] }>(
      "api/v1/committees/bulk-delete",
      { committeeIds }
    );
    return response.data.data;
  },
};
