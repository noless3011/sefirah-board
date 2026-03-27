import { useEffect, useState } from 'react';
import { socket, connectWorkspace } from '../lib/socket';

const SocketTest = () => {
  const [status, setStatus] = useState('Disconnected');

  useEffect(() => {
    // 1. Giả lập một token (hoặc lấy từ localStorage nếu bạn đã login)
    const mockToken = "your_test_token_here";
    
    // 2. Kích hoạt kết nối
    connectWorkspace(mockToken);

    // 3. Lắng nghe các sự kiện hệ thống
    socket.on('connect', () => {
      setStatus('Connected ✅');
      console.log('ID Socket của tôi:', socket.id);

      // Thử Join vào một board bất kỳ để test BE logic
      socket.emit('join-room', { 
        boardId: 'test-board-123', 
        user: { userId: 'u1', fullName: 'Developer Test' } 
      });
    });

    socket.on('user-joined', (data) => {
      console.log('Thông báo từ Server: Có người mới vào board!', data);
    });

    socket.on('connect_error', (err) => {
      setStatus('Connect Error ❌');
      console.error('Lỗi kết nối:', err.message);
    });

    socket.on('disconnect', () => {
      setStatus('Disconnected 🔴');
    });

    return () => {
      socket.off('connect');
      socket.off('user-joined');
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
      <h2>Trạng thái Socket: {status}</h2>
      <p>Mở <b>F12 {'>'} Console</b> để xem log chi tiết.</p>
      <button onClick={() => socket.emit('cursor-move', { x: 100, y: 200 })}>
        Test gửi Cursor Move
      </button>
    </div>
  );
};
export default SocketTest;
