import { ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT, type UserRole } from "@/lib/types/roles";

export const ROLE_LABEL_VI: Record<UserRole, string> = {
  [ROLE_ADMIN]: "Quản trị viên",
  [ROLE_MANAGER]: "Bộ môn",
  [ROLE_LECTURER]: "Giảng viên",
  [ROLE_STUDENT]: "Sinh viên",
};

export const ROLE_LABEL_EN: Record<UserRole, string> = {
  [ROLE_ADMIN]: "Admin",
  [ROLE_MANAGER]: "Manager",
  [ROLE_LECTURER]: "Lecturer",
  [ROLE_STUDENT]: "Student",
};
