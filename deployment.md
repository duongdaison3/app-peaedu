# Deployment Guide

Tài liệu này mô tả kiến trúc deploy khuyến nghị cho dự án **PEA Assessment Platform** và hướng dẫn thực hiện từng bước từ chuẩn bị code, cấu hình dịch vụ, trỏ subdomain, cho tới kiểm tra sau deploy.

## 1. Kiến trúc deploy khuyến nghị

### Flow khuyến nghị
```text
GitHub -> Vercel -> Supabase -> Cloudflare R2 -> Resend -> Cloudflare DNS
```

### Cách hiểu đúng của flow này
- **GitHub**: nơi chứa source code và là nguồn trigger cho CI/CD.
- **Vercel**: nơi chạy ứng dụng Next.js production.
- **Supabase**: nơi giữ PostgreSQL + Auth + SSR session.
- **Cloudflare R2**: nơi lưu media như audio, image, file đính kèm nếu bạn dùng upload bên ngoài Supabase Storage.
- **Resend**: nơi gửi email transactional như đăng ký, reset mật khẩu, thông báo.
- **Cloudflare DNS**: lớp quản lý domain/subdomain, trỏ app về Vercel và giữ landing page ở domain gốc.

### Khuyến nghị cho dự án này
- Domain gốc giữ cho landing page: `example.com`
- App chạy ở subdomain: `app.example.com`
- Nếu cần phân tách thêm, có thể dùng `portal.example.com`, nhưng `app.example.com` là lựa chọn rõ ràng nhất.

### Tại sao kiến trúc này phù hợp
- Dự án dùng Next.js App Router, phù hợp deploy serverless trên Vercel.
- Auth đang dựa trên Supabase, nên việc cấu hình callback URL và session SSR khá thẳng.
- Ứng dụng có question bank, upload media, và nhiều loại câu hỏi, nên cần storage tách biệt rõ.
- Email transactional là một phần thường gặp trong hệ thống giáo dục: mời lớp, reset mật khẩu, xác nhận tài khoản.
- Domain gốc đang dùng cho landing page nên việc tách subdomain là cách ít rủi ro nhất.

---

## 2. Sơ đồ môi trường

### Production
- `example.com` -> landing page
- `app.example.com` -> PEA Assessment Platform
- Supabase production project -> database, auth
- Cloudflare R2 -> media storage
- Resend -> email service
- Vercel -> app hosting

### Local development
- `http://localhost:3000` -> app local
- Supabase dev hoặc Supabase cloud project riêng cho development
- Có thể dùng storage/email mock hoặc môi trường test

---

## 3. Những việc cần chốt trước khi deploy

### 3.1 Chốt domain và subdomain
- Giữ landing page ở domain gốc.
- Dành subdomain riêng cho app.
- Nếu chưa muốn công khai tên app quá rõ, dùng `portal.example.com`.
- Nếu muốn UX dễ hiểu và phổ biến, dùng `app.example.com`.

### 3.2 Chốt nơi lưu file upload
Bạn nên chọn một trong hai hướng:
- **Hướng A: Supabase Storage** nếu muốn đơn giản, ít dịch vụ.
- **Hướng B: Cloudflare R2** nếu muốn storage rẻ, rõ ràng, dễ mở rộng.

Khuyến nghị cho flow bạn đang nghiên cứu là **Cloudflare R2**.

### 3.3 Chốt nơi gửi email
- Nếu app có email thật sự, dùng Resend.
- Nếu chưa cần email transaction sớm, có thể để sau, nhưng vẫn nên chuẩn bị sẵn cấu hình.

### 3.4 Chốt môi trường production riêng
Không dùng chung với dev.
- Supabase production riêng
- Vercel production riêng
- Environment variables production riêng
- DNS production riêng

---

## 4. Checklist trước khi bắt đầu

Chạy các lệnh sau để xác nhận codebase sẵn sàng:

```bash
npm run lint
npm run build
npx prisma generate
```

Nếu có thay đổi schema cần đẩy lên production DB, chuẩn bị thêm:

```bash
npx prisma migrate deploy
```

> Lưu ý: production chỉ dùng `migrate deploy`, không dùng `migrate dev`.

---

## 5. Cấu hình Supabase production

### 5.1 Tạo project Supabase riêng cho production
Làm các bước sau:
1. Tạo một Supabase project mới.
2. Không dùng chung database dev và production.
3. Lưu lại URL và key production.
4. Bật Auth provider cần dùng.

### 5.2 Lấy thông tin cần thiết
Bạn sẽ cần:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

### 5.3 Cấu hình Auth URLs
Trong Supabase Dashboard, vào Auth settings và cấu hình:

#### Site URL
```text
https://app.example.com
```

#### Redirect URLs
Thêm tất cả URL mà app có thể dùng:

```text
https://app.example.com/auth/callback
https://app.example.com/vi/auth/callback
https://app.example.com/en/auth/callback
```

Nếu còn test local, thêm:

```text
http://localhost:3000/auth/callback
http://localhost:3000/vi/auth/callback
http://localhost:3000/en/auth/callback
```

### 5.4 Nếu dùng Google OAuth
Trong Google Cloud Console, thêm redirect URI tương ứng với production.

Ví dụ:

```text
https://app.example.com/auth/callback
```

Nếu OAuth của bạn đi qua Supabase trước, hãy đảm bảo redirect URL đã khớp với route callback thực tế của app.

### 5.5 Kiểm tra quyền database
Sau khi tạo project production, kiểm tra:
- kết nối Prisma có chạy được không
- user role mặc định có đúng không
- các bảng đã migrate đầy đủ chưa

---

## 6. Cấu hình Cloudflare DNS cho domain và subdomain

Vì domain gốc đang dùng cho landing page, bạn chỉ cần thêm record cho subdomain app, không đụng vào root domain nếu đang chạy ổn.

### 6.1 Record cho app
Nếu dùng Vercel:

- Type: `CNAME`
- Name: `app`
- Target: `cname.vercel-dns.com`

Nếu dùng VPS riêng:

- Type: `A`
- Name: `app`
- Target: IP của server

### 6.2 Nếu dùng thêm email domain cho Resend
Resend sẽ yêu cầu các record DNS riêng để verify domain gửi mail. Bạn cần thêm đúng record mà Resend cung cấp trong dashboard.

### 6.3 Lưu ý quan trọng
- Không sửa record của `example.com` nếu landing page đang ổn.
- Chỉ thêm record mới cho `app.example.com`.
- Chờ DNS propagate xong rồi mới test.

---

## 7. Cấu hình Cloudflare R2

Nếu bạn chọn R2 làm storage cho media:

### 7.1 Tạo bucket
1. Vào Cloudflare Dashboard.
2. Tạo R2 bucket mới.
3. Đặt tên dễ hiểu, ví dụ: `pea-assessment-media-prod`.

### 7.2 Tạo access key
Tạo API token / access key để app upload file.

### 7.3 Thiết lập biến môi trường
Thường bạn sẽ cần:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=
```

### 7.4 Quy ước lưu file
Nên chia folder logic như:
- `questions/audio/`
- `questions/images/`
- `tests/attachments/`

### 7.5 Lưu ý
- Nếu app hiện tại đã dùng Supabase Storage, hãy chọn một storage chính để tránh phân tán logic.
- Nếu chưa cần R2 ngay, có thể deploy app trước rồi thêm R2 sau.

---

## 8. Cấu hình Resend

### 8.1 Tạo project / domain gửi mail
Trong Resend:
1. Add domain gửi mail.
2. Verify DNS record theo hướng dẫn của Resend.
3. Lấy API key.

### 8.2 Biến môi trường cần có

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

### 8.3 Dùng Resend cho các luồng nào
- Xác nhận email
- Reset mật khẩu
- Mời giáo viên / học sinh
- Thông báo bài test nếu có

---

## 9. Chuẩn bị deploy lên Vercel

### 9.1 Đẩy code lên GitHub
Các bước:
1. Commit code đã ổn định.
2. Push lên branch chính hoặc branch production.
3. Đảm bảo repo sạch lỗi build local.

### 9.2 Import project vào Vercel
Trong Vercel:
1. Chọn Import Project.
2. Kết nối repo GitHub.
3. Chọn framework Next.js.
4. Để build command là:

```bash
npm run build
```

5. Khai báo environment variables.
6. Deploy.

### 9.3 Environment variables trên Vercel
Tối thiểu nên có:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_BASE_URL=...
```

### 9.4 Add custom domain trên Vercel
Add domain:

```text
app.example.com
```

Sau đó làm theo hướng dẫn verify domain mà Vercel đưa ra.

### 9.5 Bật HTTPS
Vercel sẽ tự cấp SSL sau khi domain verify xong.

---

## 10. Migrate database production

Sau khi Vercel và Supabase đã sẵn sàng, chạy migration production.

### Lệnh cần chạy

```bash
npx prisma migrate deploy
```

### Khi nào chạy
- Sau khi schema đã được duyệt
- Sau khi đã backup nếu schema thay đổi lớn
- Trước khi mở production cho người dùng thật

### Nếu cần generate lại client

```bash
npx prisma generate
```

### Lưu ý
- Không dùng `migrate dev` trên production.
- Không migrate khi chưa test ở dev hoặc staging.

---

## 11. Quy trình deploy chi tiết từng bước

### Bước 1: Chuẩn bị source code
1. Pull latest code.
2. Chạy `npm run lint`.
3. Chạy `npm run build`.
4. Chạy `npx prisma generate` nếu schema có thay đổi.

### Bước 2: Chuẩn bị Supabase production
1. Tạo Supabase project production.
2. Cấu hình Auth Site URL.
3. Cấu hình Redirect URLs.
4. Lưu connection strings.

### Bước 3: Chuẩn bị storage và email
1. Tạo bucket R2 nếu dùng media.
2. Cấu hình Resend nếu app có gửi mail.
3. Lấy API keys và add vào secrets.

### Bước 4: Deploy app lên Vercel
1. Import repo vào Vercel.
2. Set env vars.
3. Deploy.
4. Add custom domain `app.example.com`.

### Bước 5: Cấu hình Cloudflare DNS
1. Thêm CNAME hoặc A record cho subdomain app.
2. Thêm record verify cho Resend nếu cần.
3. Đợi DNS propagate.

### Bước 6: Chạy migration production
1. Chạy `npx prisma migrate deploy`.
2. Kiểm tra log migrate.
3. Nếu có lỗi, dừng và sửa trước khi mở production.

### Bước 7: Kiểm tra hệ thống
1. Mở `https://app.example.com`.
2. Kiểm tra login.
3. Kiểm tra redirect role-based.
4. Kiểm tra question bank.
5. Kiểm tra upload file.
6. Kiểm tra email transactional nếu có.

---

## 12. Kiểm tra sau deploy

### 12.1 Login và session
- Đăng nhập email/password.
- Đăng nhập Google nếu đã bật.
- Kiểm tra cookie/session có hoạt động.

### 12.2 Redirect theo vai trò
- Student -> `/student/dashboard`
- Teacher -> `/teacher/dashboard`
- Admin / manager -> `/admin/dashboard`

### 12.3 Question bank
- Mở `https://app.example.com/vi/dashboard/question-bank`.
- Bấm tạo câu hỏi mới.
- Kiểm tra danh sách question types đầy đủ.
- Kiểm tra giao diện đổi theo từng type.

### 12.4 Upload media
- Tạo câu hỏi cần audio/image.
- Upload file.
- Kiểm tra file được lưu đúng bucket/storage.

### 12.5 Email
- Nếu có luồng email, test gửi mail thật.
- Kiểm tra sender name, from email, và spam score cơ bản.

### 12.6 Locale
- Kiểm tra cả `/vi` và `/en`.
- Kiểm tra route có locale segment đúng.

---

## 13. Checklist production

### Trước deploy
- [ ] Build thành công.
- [ ] Lint không lỗi.
- [ ] Prisma generate xong.
- [ ] Migration đã test.
- [ ] Supabase production đã tạo.
- [ ] Cloudflare DNS đã chuẩn bị.
- [ ] R2 bucket đã tạo nếu dùng.
- [ ] Resend domain đã verify nếu dùng email.

### Khi deploy
- [ ] Push code lên GitHub.
- [ ] Deploy Vercel.
- [ ] Set environment variables.
- [ ] Add `app.example.com`.
- [ ] Cập nhật Cloudflare DNS.

### Sau deploy
- [ ] Test login.
- [ ] Test auth callback.
- [ ] Test role-based redirect.
- [ ] Test question form.
- [ ] Test upload media.
- [ ] Test email.
- [ ] Test HTTPS.

---

## 14. Rollback plan

Nếu deploy lỗi:
1. Giữ landing page domain gốc như cũ.
2. Tạm dừng public subdomain nếu cần.
3. Rollback deployment trên Vercel về bản trước.
4. Nếu lỗi DB, rollback migration hoặc restore backup.
5. Kiểm tra lại redirect URL của Supabase Auth.
6. Kiểm tra lại DNS records nếu domain không resolve đúng.

---

## 15. Gợi ý cấu hình cuối cùng cho dự án này

Khuyến nghị dùng:
- Landing page: `example.com`
- App: `app.example.com`
- Hosting: Vercel
- Database/Auth: Supabase
- Storage media: Cloudflare R2
- Email: Resend
- DNS: Cloudflare DNS
- ORM: Prisma

Đây là cấu hình cân bằng tốt giữa tốc độ triển khai, chi phí vận hành và khả năng mở rộng.

---

## 16. Nếu muốn deploy bằng VPS riêng

Nếu không dùng Vercel, bạn có thể deploy bằng VPS + Nginx + SSL.
Khi đó cần thêm:
- Node.js runtime
- PM2 hoặc Docker
- Nginx reverse proxy
- SSL Let’s Encrypt
- Backup database định kỳ
- Log rotation

Tuy nhiên với dự án hiện tại, hướng Vercel + Supabase + Cloudflare sẽ nhẹ công vận hành hơn.

---

## 17. Kết luận

Luồng khuyến nghị cho dự án này là:
1. GitHub làm nơi quản lý source.
2. Vercel chạy Next.js app.
3. Supabase giữ DB + Auth.
4. Cloudflare R2 giữ media nếu cần.
5. Resend gửi email.
6. Cloudflare DNS trỏ domain/subdomain và verify các record phụ trợ.

Điểm quan trọng nhất là giữ `example.com` cho landing page và tách app sang `app.example.com`. Cách này ít rủi ro, rõ ràng, và phù hợp với cấu trúc hiện tại của dự án.
