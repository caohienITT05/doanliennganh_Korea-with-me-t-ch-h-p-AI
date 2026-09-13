Website học & ôn thi TOPIK tiếng Hàn tích hợp AI Chatbot
Đồ án liên ngành CNTT — Nền tảng học tiếng Hàn (từ vựng, ngữ pháp, luyện thi TOPIK I/II) có trợ lý học tập AI.
1. Giới thiệu
Korean With Me là website hỗ trợ học và ôn thi tiếng Hàn (đặc biệt là kỳ thi TOPIK I & II), bao gồm:
Học từ vựng theo cấp độ (Flashcard, trắc nghiệm, luyện gõ, luyện nghe).
Học ngữ pháp có ví dụ, cách dùng, bài tập dịch.
Làm đề thi thử TOPIK (Nghe – Đọc – Viết) với chấm điểm tự động.
Chatbot AI hỗ trợ giải đáp, gợi ý lộ trình học, luyện hội thoại.
Hệ thống quản trị (Admin) quản lý người dùng, khóa học, đề thi.
2. Đối tượng người dùng & phân quyền

Vai trò
Mô tả
Quyền hạn chính
Khách (Guest)
Chưa đăng nhập
Xem trang giới thiệu, đăng ký/đăng nhập
User (đã đăng ký)
Người học
Học từ vựng/ngữ pháp, làm đề thi, dùng chatbot, xem tiến độ cá nhân
Admin
Quản trị viên
Quản lý người dùng, quản lý khóa học (SC1/SC2/TC), quản lý đề thi, xem thống kê tổng quan

Luồng xác thực: Đăng ký / Đăng nhập → phân luồng theo role (admin / user) → điều hướng vào Trang Admin hoặc Trang người dùng tương ứng.
3. Tính năng chi tiết
3.1 Xác thực (Auth)
Đăng ký, đăng nhập (Email/Password), quên mật khẩu.
Phân quyền bằng JWT (access token + refresh token) hoặc session.
(Tùy chọn nâng cao) Đăng nhập Google OAuth2.
3.2 Trang Admin
a. Tổng quan (Dashboard)
Thống kê số người dùng, số khóa học, số đề thi, biểu đồ hoạt động.
b. Quản lý người dùng
Danh sách: tên, email, phân quyền, trạng thái (khóa/mở).
Chức năng: xóa người dùng, khóa/mở khóa tài khoản, phân quyền.
c. Quản lý khóa học
Phân loại theo cấp độ: SC1 (sơ cấp 1), SC2 (sơ cấp 2), TC (trung cấp)....
Mỗi khóa học gồm: tên, mức độ, ảnh bìa, mô tả, danh sách Từ vựng và Ngữ pháp.
Có thể thêm/sửa/xóa khóa học, thêm/sửa/xóa từ vựng & ngữ pháp trong khóa học.
Cơ chế mở khóa tuần tự: học xong SC1 → mở SC2 → mở TC (giống hệ thống "sao"/rank, có badge/QR ghi nhận hoàn thành).
d. Quản lý đề thi (TOPIK I / TOPIK II)
TOPIK I: 70 câu — Nghe 30 câu, Đọc 40 câu — thang điểm 200.
TOPIK II: 104 câu — Nghe 50 câu, Đọc 51 câu, Viết 3 câu.
Import đề thi bằng file Excel, hoặc dùng AI (Gemini) sinh đề tự động dựa trên file PDF gốc do admin cung cấp.
File âm thanh (nghe) được upload lên Cloud Storage (Firebase Storage), lưu link vào JSON/Excel/DB để phát trong bài thi.
3.3 Trang người dùng
a. Học từ vựng
4 chế độ luyện tập: Flashcard, Trắc nghiệm, Luyện gõ từ, Luyện nghe.
Âm thanh phát âm: dùng Google Cloud Text-to-Speech (TTS) API để đọc từ tiếng Hàn.
Luyện gõ: hiển thị nghĩa tiếng Việt → người dùng gõ tiếng Hàn tương ứng, hệ thống chấm đúng/sai.
b. Học ngữ pháp
Mỗi mục ngữ pháp gồm: tên gọi/cấu trúc, cách dùng, ví dụ minh họa.
Bài tập: dịch Hán(Hàn)→Việt hoặc nghe rồi viết lại, mỗi bài ~5 câu.
c. Luyện thi TOPIK
Làm bài thi thử theo cấu trúc thật (Nghe/Đọc trắc nghiệm, Viết tự luận).
Phần Viết (TOPIK II): 4 câu, 50 phút, tổng 100 điểm:
Câu 1: Điền từ theo chuẩn văn phong (nghe/đọc) — 10đ
Câu 2: Điền từ/hoàn thành câu — 10đ
Câu 3: Mô tả biểu đồ, số liệu (200–300 chữ) — 30đ
Câu 4: Bài văn nghị luận xã hội (600–700 chữ) — 50đ
→ Chấm điểm bằng AI (Gemini/GPT chấm theo tiêu chí: ngữ pháp, từ vựng, bố cục, độ dài).
d. Chatbot AI
Trả lời câu hỏi kiểu "từ này nghĩa là gì?", gợi ý lộ trình học cho người mới bắt đầu.
Sinh câu hội thoại ngắn ngẫu nhiên (qua Gemini/ChatGPT API) để người dùng luyện nghe/luyện nói, có thể kết hợp TTS để đọc câu và cho người dùng luyện phát âm.
