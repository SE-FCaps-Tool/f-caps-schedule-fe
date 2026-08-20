import {
  ROLE_ADMIN,
  ROLE_MANAGER,
  ROLE_LECTURER,
  ROLE_STUDENT,
} from "@/lib/types/roles";
import type { User } from "@/types/models";

// Tài khoản demo — dùng để xem thử UI khi chưa nối backend thật.
// TODO: xoá file này khi có API đăng nhập thật.
interface MockAccount {
  password: string;
  user: User;
}

export const MOCK_ACCOUNTS: Record<string, MockAccount> = {
  "student1@gmail.com": {
    password: "12345@Abc",
    user: {
      id: "mock-student-1",
      email: "student1@gmail.com",
      fullName: "Nguyễn Văn Sinh Viên",
      role: ROLE_STUDENT,
    },
  },
  "lecturer@gmail.com": {
    password: "12345@Abc",
    user: {
      id: "mock-lecturer-1",
      email: "lecturer@gmail.com",
      fullName: "Trần Thị Giảng Viên",
      role: ROLE_LECTURER,
    },
  },
  "manager@gmail.com": {
    password: "12345@Abc",
    user: {
      id: "mock-manager-1",
      email: "manager@gmail.com",
      fullName: "Lê Văn Bộ Môn",
      role: ROLE_MANAGER,
    },
  },
  "admin@gmail.com": {
    password: "12345@Abc",
    user: {
      id: "mock-admin-1",
      email: "admin@gmail.com",
      fullName: "Phạm Thị Quản Trị",
      role: ROLE_ADMIN,
    },
  },
};
