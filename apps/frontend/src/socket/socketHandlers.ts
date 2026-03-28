import { Socket } from 'socket.io-client';

export const setupGlobalEvents = (socket: Socket) => {
  socket.on("connect", () => console.log("✅ Socket Connected:", socket.id));
  
  socket.on("notification", (data) => {
    console.log("🔔 Thông báo mới từ hệ thống:", data);
    // Ở đây bạn có thể dùng Toast hoặc thư viện thông báo để hiển thị cho User
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket Error:", err.message);
  });
};