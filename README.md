# 🔒 Lonely Obfuscator v1.0 (Web Edition)

Ứng dụng Web mã hóa mã nguồn Lua (Lua 5.1 / Roblox Executor) trực quan, hiện đại, chạy hoàn toàn bằng giao diện Web.

## 🚀 Tính năng nổi bật
- **Watermark Tùy Chỉnh**: `-- This file was protected using Lonely Obfuscator v1.0 [https://lonelyhub.wibu.life]`
- **Bọc Hàm Output**: Mặc định bọc output dạng `return(function(...) ... end)(...)` không comment thừa.
- **Bảo mật Nâng Cao**:
  - Mã hóa chuỗi hằng số (String Encryption / Polymorphic Decryption).
  - Control Flow Flattening (chuyển đổi luồng thực thi hàm).
  - Opcode Mutation & Super Operators.
  - Phân tách hằng số & chèn dead code.
- **Giao diện Web 100% SVG**: Không dùng emoji hệ thống, thiết kế Dark Mode Glassmorphism cao cấp.

---

## 💻 Hướng Dẫn Chạy Trên Replit

1. Tải file `lonely_obfuscator.zip` và giải nén (hoặc upload trực tiếp lên Replit).
2. Tạo một **Node.js Repl** mới trên Replit.
3. Tải toàn bộ các file trong thư mục này lên Repl.
4. Mở cửa sổ **Console / Shell** trong Replit và cài đặt package:
   ```bash
   npm install
   ```
5. Đảm bảo môi trường Replit đã có `lua5.1` / `luac` (Replit tự động hỗ trợ khi cài package Lua hoặc chạy qua shell).
6. Bấm nút **Run** (hoặc gõ `npm start` trong Shell). Replit sẽ tự động mở xem trước Web (Webview link).

---

## 💻 Hướng Dẫn Chạy Local (Máy Cá Nhân)

1. Mở Terminal / PowerShell tại thư mục dự án:
   ```bash
   npm install
   node server.js
   ```
2. Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)
3. Dán code Lua vào ô bên trái -> Chọn tùy chọn -> Bấm **MÃ HÓA NGAY** -> Copy hoặc Download file `.lua` đã mã hóa.
