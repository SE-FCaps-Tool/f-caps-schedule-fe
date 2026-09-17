# Brainstorm: ẩn demo-account login block khỏi production

## Problem

`/login` (`app/(auth)/login/login-form.tsx`) luôn render block "Tài khoản demo (chưa nối backend)" — 4 nút prefill email/password từ `lib/mock/mockUsers.ts` (`MOCK_ACCOUNTS`). Muốn: nhánh `dev` chạy local (`npm run dev`) thì vẫn thấy block này để test nhanh không cần Google Client ID; nhánh `main` deploy production thì ẩn hẳn.

## Findings từ scout

- Click nút demo chỉ autofill form field — submit vẫn gọi `POST /api/v1/auth/login` thật, không bypass backend. Nhãn "chưa nối backend" trong code hơi lỗi thời (comment trong `mockUsers.ts`: "TODO: xoá file này khi có API đăng nhập thật").
- `dev` branch chỉ chạy local qua `npm run dev` — không có Vercel Preview deploy (xác nhận với user). `next dev` tự set `NODE_ENV=development`; `next build` (dùng cho main/production) tự set `NODE_ENV=production` — không cần thêm biến env thủ công.
- Codebase đã có sẵn pattern `isProduction` y hệt cái cần, đang bị lặp 2 lần trong `utils/cookieConfig.ts`:
  ```ts
  process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENV === "production"
  ```
  `docs/SETUP.md` cũng document `NEXT_PUBLIC_ENV=production` là biến bắt buộc set ở production deploy.
- `lib/api/services/fetchGroups.ts` cũng có tiền lệ gate 1 dev-only warning bằng `NODE_ENV !== "production"`.

## Approaches xét

1. **Extract `lib/utils/env.ts` → `isProductionEnv()`, refactor `cookieConfig.ts` dùng chung, gate render trong `login-form.tsx`.** (chọn)
   - DRY: gộp check đang lặp trong `cookieConfig.ts` + chỗ dùng mới thành 1 nguồn.
2. Inline check trực tiếp trong `login-form.tsx`, không đụng `cookieConfig.ts`.
   - Đơn giản hơn, nhưng thành lần lặp thứ 3 của cùng 1 biểu thức.

MOCK_ACCOUNTS: chỉ cần ẩn UI, không cần tách khỏi JS bundle production (dynamic import) — đây là 4 credential giả gắn với backend thật, không phải secret thật; nếu backend production không có các account này thì biết cũng không login được.

## Quyết định cuối

- Approach 1 (extract shared helper).
- Không tách MOCK_ACCOUNTS khỏi bundle — chỉ ẩn UI bằng điều kiện render.

## Implementation touchpoints

- `lib/utils/env.ts` (mới) — export `isProductionEnv()`.
- `utils/cookieConfig.ts` — thay 2 chỗ tính `isProduction` inline bằng gọi `isProductionEnv()`.
- `app/(auth)/login/login-form.tsx` — bọc block "Tài khoản demo" (dòng ~158-180) trong `{!isProductionEnv() && (...)}`.

## Acceptance criteria

- `npm run dev` (bất kỳ branch nào, kể cả `main` checkout local) → demo block hiển thị.
- `npm run build && npm start` → demo block không render (đúng hành vi khi deploy `main` lên production).
- Không đổi hành vi Google login / submit login thật.
- `npx tsc --noEmit`, `npm run lint`, `npm test` pass.

## Risks / rollback

- Rủi ro thấp — chỉ là 1 điều kiện render + 1 helper nhỏ, dễ revert bằng cách bỏ điều kiện.
- Nếu sau này `dev` branch được deploy lên Vercel Preview thật, cần set `NEXT_PUBLIC_ENV` phù hợp ở Vercel project settings (Preview env riêng khác Production) để giữ đúng hành vi — ghi chú lại cho tương lai, không cần làm ngay.

## Unresolved questions

- Không có.
