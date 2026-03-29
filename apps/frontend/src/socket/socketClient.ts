import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL;

export const socket: Socket = io(WS_URL, {
  autoConnect: false, // Quan trọng: Chỉ kết nối khi ta gọi hàm
  withCredentials: true,
  transports: ['websocket'],
});

export const connectWorkspace = (token: string) => {
  if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }
};

export const disconnectWorkspace = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};