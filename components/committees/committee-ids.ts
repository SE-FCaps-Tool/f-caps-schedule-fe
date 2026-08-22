/**
 * Committee API dùng external id dạng "lec_123" (theo handoff), khác với id số thuần
 * (`LecturerApiItem.id: number`) mà phần còn lại của app dùng trực tiếp. Chuyển đổi ở đúng 1
 * chỗ để không rải rác format string khắp nơi.
 */
export function toLecturerExternalId(numericId: number): string {
  return `lec_${numericId}`;
}
