### 1. 🛡️ Domain: Authentication (`/api/v1/auth`)
Xử lý đăng nhập, đăng ký và bảo mật tài khoản.

| Method | Endpoint | Payload (Body) | Ý nghĩa & Tính năng tương ứng |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | `{ email, password, fullName }` | Đăng ký tài khoản mới. |
| `POST` | `/login` | `{ email, password }` | Đăng nhập thường -> Trả về `{ user, accessToken, refreshToken }`. |
| `POST` | `/oauth/google` | `{ token }` (từ Google Auth Provider) | Đăng nhập/Đăng ký bằng Google. |
| `POST` | `/oauth/github` | `{ code }` (từ GitHub OAuth) | Đăng nhập/Đăng ký bằng GitHub. |
| `POST` | `/refresh-token`| `{ refreshToken }` | Lấy Access Token mới khi token cũ hết hạn (giữ user luôn đăng nhập). |
| `POST` | `/forgot-password`| `{ email }` | Gửi email chứa link/code reset mật khẩu. |

---

### 2. 👤 Domain: User & Account Settings (`/api/v1/users`)
Tương ứng với trang **Account Settings**. Cần `Authorization: Bearer <token>` cho tất cả API.

| Method | Endpoint | Payload (Body) | Ý nghĩa & Tính năng tương ứng |
| :--- | :--- | :--- | :--- |
| `GET` | `/me` | - | Lấy thông tin cá nhân hiện tại. |
| `PATCH`| `/me/profile` | `{ fullName, avatarUrl }` | Cập nhật Profile Information. |
| `PUT` | `/me/password` | `{ currentPassword, newPassword }` | Tính năng đổi mật khẩu (Security). |
| `PATCH`| `/me/preferences`| `{ emailNotifications: boolean, cursorVisibility: boolean }` | Cập nhật mục Preferences. |
| `DELETE`| `/me` | `{ password }` (để xác nhận) | Deactivate Account (Xóa/Vô hiệu hóa tài khoản). |

---

### 3. 🗂️ Domain: Board Management (`/api/v1/boards`)
Tương ứng với trang **Dashboard (My Workspaces, Shared, Templates)**.

| Method | Endpoint | Query / Body | Ý nghĩa & Tính năng tương ứng |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Query: `?type=personal\|shared` `&search=...` `&page=1` | Lấy danh sách bảng hiển thị trên Dashboard. |
| `POST` | `/` | Body: `{ title: string, templateId?: string }` | Nút **"Create New Board"** (có thể tạo từ template). |
| `GET` | `/:boardId` | - | Lấy meta-data của bảng (Tên, quyền của user, ngày update). |
| `PATCH`| `/:boardId` | Body: `{ title?: string, isArchived?: boolean }` | Đổi tên bảng hoặc Archive bảng. |
| `DELETE`| `/:boardId` | - | Xóa bảng. |
| `POST` | `/:boardId/thumbnail`| Form-data: `file` (image) | FE tự chụp màn hình Canvas và upload lên BE để làm ảnh bìa thumbnail cho Dashboard. |

---

### 4. 🤝 Domain: Collaboration & Sharing (`/api/v1/boards/:boardId/collaborators`)
Tương ứng với nút **"Share"** và tính năng **"Redeem Invite"**.

| Method | Endpoint | Payload / Query | Ý nghĩa & Tính năng tương ứng |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | - | Lấy danh sách những người đang có quyền trong bảng. |
| `POST` | `/invite` | `{ email: string, role: 'viewer' \| 'editor' }` | Mời người khác vào bảng qua email. |
| `PATCH`| `/:userId` | `{ role: 'viewer' \| 'editor' }` | Đổi quyền của một thành viên. |
| `DELETE`| `/:userId` | - | Đuổi một thành viên khỏi bảng (Revoke access). |
| `POST` | `/api/v1/invites/redeem`| `{ inviteCode: string }` | (Endpoint độc lập) Nhập mã để tham gia bảng chia sẻ. |

---

### 5. 🎨 Domain: Canvas State REST API (`/api/v1/boards/:boardId/canvas`)
Mặc dù dùng Socket cho Real-time, bạn vẫn CẦN REST API để tải dữ liệu khi user **vừa mở trang** hoặc lưu tự động hàng loạt.

| Method | Endpoint | Payload (Body) | Ý nghĩa & Tính năng tương ứng |
| :--- | :--- | :--- | :--- |
| `GET` | `/elements` | - | Tải TẤT CẢ hình khối, text, nét vẽ khi user vừa vào phòng. |
| `PUT` | `/snapshot` | `{ elements: CanvasElement[] }` | Lưu đè lại toàn bộ state của bảng (Auto-save fallback mỗi 1-2 phút nếu socket có vấn đề). |

---

### 6. 💬 Domain: Active Threads / Chat (`/api/v1/boards/:boardId/threads`)
Tương ứng với Tab **"CHAT"** và biểu tượng comment màu đỏ trên hình khối trong giao diện Canvas.

| Method | Endpoint | Payload (Body) | Ý nghĩa & Tính năng tương ứng |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | - | Lấy toàn bộ danh sách comment/thread trên bảng này. |
| `POST` | `/` | `{ targetElementId: string, message: string }` | Tạo 1 thread chat mới ghim vào một khối hình (ví dụ khối "Need to update API docs"). |
| `POST` | `/:threadId/reply`| `{ message: string }` | Trả lời trong một thread có sẵn. |
| `PATCH`| `/:threadId` | `{ status: 'resolved' }` | Đánh dấu thread đã giải quyết xong. |

---

### 7. 🚀 WebSockets Events (Namespace: `/workspace`)
Đây là phần giao tiếp thời gian thực 2 chiều thông qua `Socket.io`. Nó không dùng HTTP Request/Response truyền thống mà dùng khái niệm **Emit (Phát)** và **Listen (Lắng nghe)**.

**A. Quản lý Phòng (Room)**
* **FE Emit:** `join-room` `{ boardId }` -> Cấp quyền vào kênh chat/vẽ chung.
* **BE Phát:** `user-joined` `{ user }` -> Báo cho những người khác (để hiện avatar góc phải trên).
* **BE Phát:** `user-left` `{ userId }` -> Báo có người thoát.

**B. Đồng bộ Chuột (Cursors) - *Nếu "Real-time Cursor Visibility" bật***
* **FE Emit:** `cursor-move` `{ x: 120, y: 350 }` (Nên dùng lodash `throttle` 50ms trước khi gửi).
* **BE Phát:** `cursor-moved` `{ userId, x, y, userName }` -> Các client khác render con trỏ chuột ảo.

**C. Đồng bộ Thao tác vẽ (Canvas Sync)**
* **FE Emit:** `element-create` `{ element: CanvasElement }` (Ví dụ: Vừa vẽ xong 1 hình chữ nhật).
* **BE Phát:** `element-created` `{ element }`.
* **FE Emit:** `element-update` `{ id: 'rect-1', changes: { x: 200, y: 300, properties: { fillColor: '#000' } } }` (Khi kéo thả hoặc đổi màu bên cột Properties).
* **BE Phát:** `element-updated` `{ id, changes }`.
* **FE Emit:** `element-delete` `{ id: 'rect-1' }`.
* **BE Phát:** `element-deleted` `{ id }`.
