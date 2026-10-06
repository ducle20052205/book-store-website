"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createBook, updateBook } from "@/app/actions/admin-books";
import { FieldFrame } from "@/components/AuthFields";
import { BookCover } from "@/components/BookCover";
import { BOOK_COLUMNS, BOOK_FIELDS, BOOK_FIELD_LABELS, type BookErrors, type BookField, type BookInput, validateBook } from "@/lib/admin/bookRules";
import { slugify } from "@/lib/admin/slug";
import { isNextRedirect } from "@/lib/nextRedirect";
import { cardClass, primaryButtonClass, secondaryButtonClass, touchTargetClass } from "@/lib/ui/classes";

/**
 * MỘT form dùng chung cho `/admin/sach/moi` và `/admin/sach/[slug]` (đợt 5B, spec FR-5B.2, FR-5B.3 — không
 * sao chép đôi). Bố cục theo docs/mockups/buoc-5b/: một mặt phẳng trắng chia bằng kẻ mảnh theo bốn nhóm, lưới
 * hai–ba cột cho ô ngắn và cả hàng cho mô tả và mục lục, cột phải 280px xem trước bìa do BookCover sinh (xếp
 * lên đầu trên mobile). Chữ giao diện lấy từ spec, KHÔNG lấy từ ghi chú kỹ thuật trong ảnh mockup.
 *
 * Ba lớp kiểm tra (spec FR-5B.6): (1) ở đây — cùng module luật với Server Action, chặn gửi và KHÔNG có lời
 * gọi mạng nào; (2) Server Action kiểm lại; (3) database. Lỗi hiện cạnh đúng ô (`aria-invalid`,
 * `aria-describedby`); gửi lỗi thì focus về tóm tắt lỗi (tiền lệ CheckoutView). Thêm và sửa thành công kết thúc
 * bằng `redirect()` trong action (dải kết quả do trang hiện), nên ở đây chỉ xử lý các nhánh thất bại.
 *
 * Slug (FR-5B.4): form THÊM tự theo tên cho tới khi gõ vào chính ô slug (xoá trắng thì theo tên trở lại); form
 * SỬA điền slug hiện tại và KHÔNG tự đổi theo tên. Khi slug khác slug gốc, dòng `role="note"` cảnh báo ngay tại ô.
 */
export interface BookFormCategory {
  id: string;
  name: string;
  children: { id: string; name: string }[];
}

interface BookFormProps {
  mode: "new" | "edit";
  bookId?: string;
  initial: BookInput;
  categories: BookFormCategory[];
}

const fieldId = (name: BookField) => `book-field-${name}`;
const textareaClass = "!h-auto min-h-[7.5rem] py-3 leading-relaxed";

type FormFailure = { text: string; signIn?: boolean };

function describeFailure(kind: "not_found" | "signed_out" | "forbidden" | "unknown"): FormFailure {
  switch (kind) {
    case "not_found":
      return { text: "Chúng mình không còn thấy cuốn sách này (có thể vừa bị xoá). Bạn quay lại danh sách để kiểm tra nhé." };
    case "signed_out":
      return { text: "Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại để lưu nhé.", signIn: true };
    case "forbidden":
      return { text: "Tài khoản này không có quyền quản lý sách." };
    default:
      return { text: "Chúng mình chưa lưu được cuốn sách này. Bạn thử lại sau ít phút nhé." };
  }
}

export function BookForm({ mode, bookId, initial, categories }: BookFormProps) {
  const [values, setValues] = useState<BookInput>(initial);
  // Tồn kho đổi từ ngoài form (nút "Đặt tồn kho về 0" ở vùng xoá làm trang được làm mới): ô tồn kho theo giá trị mới, các ô khác giữ nguyên bản đang sửa dở.
  const [seenStock, setSeenStock] = useState(initial.stockQuantity);
  if (initial.stockQuantity !== seenStock) {
    setSeenStock(initial.stockQuantity);
    setValues((current) => ({ ...current, stockQuantity: initial.stockQuantity }));
  }
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<BookErrors>({});
  const [failure, setFailure] = useState<FormFailure | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pending, startTransition] = useTransition();
  const summaryRef = useRef<HTMLDivElement>(null);

  const childIds = useMemo(() => new Set(categories.flatMap((c) => c.children.map((child) => child.id))), [categories]);

  useEffect(() => {
    if (attempt > 0) summaryRef.current?.focus();
  }, [attempt]);

  function change(name: BookField, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function changeTitle(value: string) {
    setValues((current) => ({ ...current, title: value, ...(mode === "new" && !slugTouched ? { slug: slugify(value) } : {}) }));
    setErrors((current) => {
      if (!current.title && !(mode === "new" && !slugTouched && current.slug)) return current;
      const next = { ...current };
      delete next.title;
      if (mode === "new" && !slugTouched) delete next.slug;
      return next;
    });
  }

  function changeSlug(value: string) {
    if (mode === "new") setSlugTouched(value !== "");
    change("slug", value);
  }

  function focusField(name: BookField) {
    document.getElementById(fieldId(name))?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const { errors: found, value } = validateBook(values, { childCategoryIds: childIds });
    if (!value) {
      setErrors(found);
      setFailure(null);
      setAttempt((n) => n + 1);
      return;
    }
    setErrors({});
    setFailure(null);
    startTransition(async () => {
      try {
        const result = mode === "new" ? await createBook(values) : await updateBook(bookId ?? "", values);
        if (result.kind === "invalid") setErrors(result.errors);
        else setFailure(describeFailure(result.kind));
      } catch (error) {
        // Thành công kết thúc bằng redirect() trong action: lời gọi bị từ chối bằng NEXT_REDIRECT, router tự điều hướng.
        if (isNextRedirect(error)) return;
        setFailure(describeFailure("unknown"));
      }
      setAttempt((n) => n + 1);
    });
  }

  const errorEntries = BOOK_FIELDS.filter((name) => errors[name]);
  const slugChanged = mode === "edit" && values.slug.trim() !== initial.slug;
  const slugWarningId = "book-slug-warning";
  const isNew = mode === "new";

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
      <aside aria-label="Bìa xem trước" className={`${cardClass} p-4 md:p-5 lg:col-start-2 lg:row-start-1`}>
        <div className="flex gap-4 lg:flex-col lg:items-center">
          <div aria-hidden="true" className="w-24 shrink-0 lg:w-40">
            <BookCover slug={values.slug.trim() || "xem-truoc"} title={values.title.trim() || "Tên sách"} author={values.author.trim() || "Tác giả"} coverImageUrl={null} />
          </div>
          <div className="min-w-0">
            <h2 className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-600">Bìa xem trước</h2>
            <p className="mt-2 text-body-sm text-ink-600">Bìa sinh tự động từ tên sách và tác giả. Không có ô tải ảnh: đây là quyết định đã chốt, không phải thiếu sót.</p>
          </div>
        </div>
      </aside>

      <form onSubmit={handleSubmit} noValidate data-testid="admin-book-form" className="min-w-0 lg:col-start-1 lg:row-start-1">
        {(errorEntries.length > 0 || failure) && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            data-testid="admin-book-error-summary"
            className="mb-5 rounded-notice border-l-[3px] border-danger bg-danger-tint px-4 py-3 text-body-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
          >
            {errorEntries.length > 0 && (
              <>
                <p className="font-medium">Bạn kiểm tra lại {errorEntries.length} chỗ sau giúp chúng mình nhé:</p>
                <ul className="mt-1 list-disc pl-5">
                  {errorEntries.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        onClick={() => focusField(name)}
                        className={`${touchTargetClass} text-left underline underline-offset-2 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600`}
                      >
                        {BOOK_FIELD_LABELS[name]}
                      </button>
                      : {errors[name]}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {failure && (
              <p className={errorEntries.length > 0 ? "mt-2" : ""}>
                {failure.text}
                {failure.signIn && (
                  <>
                    {" "}
                    <Link href="/dang-nhap?next=/admin/sach" className={`${touchTargetClass} font-medium text-cham-700 underline`}>
                      Đăng nhập lại
                    </Link>
                  </>
                )}
              </p>
            )}
          </div>
        )}

        <div className={`${cardClass} divide-y divide-menu-sep`}>
          <Group title="Thông tin chính">
            <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
              <TextField name="title" required values={values} errors={errors} onChange={(v) => changeTitle(v)} />
              <SlugField value={values.slug} error={errors.slug} warning={slugChanged ? values.slug.trim() : null} onChange={changeSlug} warningId={slugWarningId} />
              <TextField name="author" required values={values} errors={errors} onChange={(v) => change("author", v)} />
              <TextField name="translator" placeholder="Để trống nếu không có" values={values} errors={errors} onChange={(v) => change("translator", v)} />
              <CategoryField value={values.categoryId} error={errors.categoryId} categories={categories} onChange={(v) => change("categoryId", v)} />
            </div>
          </Group>

          <Group title="Giá và kho">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3">
              <div className="col-span-2 md:col-span-1">
                <TextField name="price" required inputMode="numeric" hint="Số nguyên đồng, 1 → 100.000.000." values={values} errors={errors} onChange={(v) => change("price", v)} />
              </div>
              <TextField name="discountPrice" inputMode="numeric" hint="Nhỏ hơn giá, hoặc để trống." values={values} errors={errors} onChange={(v) => change("discountPrice", v)} />
              <TextField name="stockQuantity" inputMode="numeric" hint="Đặt 0 để hiện “Hết hàng”." values={values} errors={errors} onChange={(v) => change("stockQuantity", v)} />
            </div>
          </Group>

          <Group title="Chi tiết xuất bản">
            <p className="mb-4 text-body-sm text-ink-600">Để trống được. 40 cuốn seed ban đầu bỏ trống những ô này vì không xác minh được nguồn; sách thêm qua form là dữ liệu demo.</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
              <div className="col-span-2">
                <TextField name="publisher" values={values} errors={errors} onChange={(v) => change("publisher", v)} />
              </div>
              <div className="col-span-2">
                <TextField name="publishDate" placeholder="dd/mm/yyyy" inputMode="numeric" values={values} errors={errors} onChange={(v) => change("publishDate", v)} />
              </div>
              <div className="col-span-2">
                <TextField name="isbn" placeholder="10 hoặc 13 chữ số" values={values} errors={errors} onChange={(v) => change("isbn", v)} />
              </div>
              <TextField name="pageCount" inputMode="numeric" values={values} errors={errors} onChange={(v) => change("pageCount", v)} />
              <TextField name="dimensions" placeholder="14 × 20 cm" values={values} errors={errors} onChange={(v) => change("dimensions", v)} />
            </div>
          </Group>

          <Group title="Nội dung">
            <div className="grid gap-y-5">
              <TextField name="description" multiline rows={5} values={values} errors={errors} onChange={(v) => change("description", v)} />
              <TextField name="tableOfContents" multiline rows={4} placeholder="Mỗi chương một dòng" values={values} errors={errors} onChange={(v) => change("tableOfContents", v)} />
            </div>
          </Group>

          <div className="flex flex-col gap-4 bg-field/60 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <p className="order-3 text-body-sm text-ink-600 md:order-1 md:max-w-[46ch]">Lưu là đăng luôn — không có bước nháp. Trang chủ, danh mục và trang chi tiết được làm mới ngay.</p>
            <div className="order-1 flex flex-col gap-3 md:order-2 md:flex-row-reverse">
              <button type="submit" disabled={pending} aria-busy={pending} data-testid="admin-book-submit" className={`${primaryButtonClass} md:!w-auto`}>
                {pending ? "Đang lưu…" : isNew ? "Thêm sách" : "Lưu thay đổi"}
              </button>
              <Link href="/admin/sach" className={`${secondaryButtonClass} w-full md:w-auto`}>
                Huỷ
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 px-4 py-5 md:px-6">
      <legend className="float-left mb-4 w-full text-micro font-semibold uppercase tracking-[0.08em] text-ink-600">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function TextField({
  name,
  values,
  errors,
  onChange,
  required,
  hint,
  placeholder,
  inputMode,
  multiline,
  rows,
}: {
  name: BookField;
  values: BookInput;
  errors: BookErrors;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  inputMode?: "numeric";
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <FieldFrame
      id={fieldId(name)}
      label={BOOK_FIELD_LABELS[name]}
      required={required}
      hint={hint}
      error={errors[name]}
      renderInput={(frame) =>
        multiline ? (
          <textarea
            {...frame}
            name={BOOK_COLUMNS[name]}
            data-testid={`admin-book-field-${BOOK_COLUMNS[name]}`}
            rows={rows}
            placeholder={placeholder}
            aria-required={required || undefined}
            value={values[name]}
            onChange={(event) => onChange(event.target.value)}
            className={`${frame.className} ${textareaClass}`}
          />
        ) : (
          <input
            {...frame}
            type="text"
            name={BOOK_COLUMNS[name]}
            data-testid={`admin-book-field-${BOOK_COLUMNS[name]}`}
            placeholder={placeholder}
            inputMode={inputMode}
            autoComplete="off"
            aria-required={required || undefined}
            value={values[name]}
            onChange={(event) => onChange(event.target.value)}
          />
        )
      }
    />
  );
}

/** Ô "Địa chỉ trang": tiền tố tĩnh "/sach/" nằm trong ô (chồng lên phần đệm trái, để viền focus thuộc chính ô nhập); cảnh báo đổi slug nối vào `aria-describedby`. */
function SlugField({ value, error, warning, onChange, warningId }: { value: string; error?: string; warning: string | null; onChange: (value: string) => void; warningId: string }) {
  return (
    <FieldFrame
      id={fieldId("slug")}
      label={BOOK_FIELD_LABELS.slug}
      required
      hint="Tự sinh từ tên sách, sửa được. Phải khác mọi địa chỉ đang có."
      error={error}
      afterId={warningId}
      after={
        warning !== null ? (
          <p id={warningId} role="note" data-testid="admin-book-slug-warning" className="mt-3 rounded-notice border-l-[3px] border-nghe-400 bg-field px-3 py-2.5 text-body-sm text-ink-900">
            Đổi địa chỉ trang làm hỏng liên kết cũ — trang cũ trả về 404, và chưa có chuyển hướng sang địa chỉ mới.
          </p>
        ) : undefined
      }
      renderInput={(frame) => (
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-base text-ink-600">
            /sach/
          </span>
          <input
            {...frame}
            type="text"
            name="slug"
            data-testid="admin-book-field-slug"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-required="true"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={`${frame.className} !pl-[3.9rem]`}
          />
        </div>
      )}
    />
  );
}

function CategoryField({ value, error, categories, onChange }: { value: string; error?: string; categories: BookFormCategory[]; onChange: (value: string) => void }) {
  return (
    <FieldFrame
      id={fieldId("categoryId")}
      label={BOOK_FIELD_LABELS.categoryId}
      required
      hint="Chỉ chọn được danh mục con."
      error={error}
      renderInput={(frame) => (
        <select
          {...frame}
          name="category_id"
          data-testid="admin-book-field-category_id"
          aria-required="true"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={frame.className}
        >
          <option value="">Chọn danh mục con</option>
          {categories.map((parent) => (
            <optgroup key={parent.id} label={parent.name}>
              {parent.children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}
    />
  );
}
