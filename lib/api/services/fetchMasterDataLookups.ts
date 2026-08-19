import apiService from "../core";

export interface MajorApiItem {
  id: number;
  code: string;
  name: string;
}

export interface StudentApiItem {
  id: number;
  student_code: string;
}

export const fetchMasterDataLookups = {
  /** GET /majors — ADMIN, MANAGER */
  majors: async (): Promise<MajorApiItem[]> => {
    const response = await apiService.get<MajorApiItem[]>("api/v1/majors");
    return response.data;
  },

  /** GET /students — ADMIN, MANAGER */
  students: async (): Promise<StudentApiItem[]> => {
    const response = await apiService.get<StudentApiItem[]>("api/v1/students");
    return response.data;
  },
};
