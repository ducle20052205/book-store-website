/**
 * Luật đăng ký dùng chung cho form (components/RegisterForm.tsx) và Server
 * Action (app/actions/auth.ts) — một bản duy nhất để hai nơi không lệch nhau.
 * Form chỉ để tiện cho người dùng; Server Action mới là nơi kiểm lại thật sự.
 */

/** FR-5.1: tối thiểu 8 ký tự, KHÔNG áp đặt loại ký tự (NIST SP 800-63B). Khớp "Minimum password length" ở Supabase. */
export const PASSWORD_MIN_LENGTH = 8;

/** Họ tên đi vào `user_metadata` rồi vào JWT (cookie mỗi request) — chặn độ dài để cookie không phình. */
export const FULL_NAME_MAX_LENGTH = 100;
