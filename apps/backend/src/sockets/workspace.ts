import { Server, Socket } from 'socket.io';

interface UserPayload {
  userId: string;
  fullName: string;
  avatarUrl?: string;
}

export default function setupWorkspaceSockets(io: Server) {
  const workspaceNamespace = io.of('/workspace');
  
  // In-memory maps to track users and their current boards for precise broadcasting
  const socketUsers = new Map<string, UserPayload>();
  const socketBoards = new Map<string, string>(); // socketId -> boardId

  workspaceNamespace.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected to /workspace namespace: ${socket.id}`);

    // --- A. Room Management ---
    
    // Client -> Server: join-room
    socket.on('join-room', (payload: { boardId: string, user?: UserPayload }) => {
      const { boardId, user } = payload;
      if (!boardId) return;

      socket.join(boardId);
      socketBoards.set(socket.id, boardId);
      
      if (user) {
        socketUsers.set(socket.id, user);
        // Server -> FE: user-joined
        socket.to(boardId).emit('user-joined', { user });
      }

      console.log(`[Socket.io] Client ${socket.id} joined board room: ${boardId}`);
    });

    // Handle explicit leave (optional, but good practice)
    socket.on('leave-room', (payload: { boardId: string }) => {
      const { boardId } = payload;
      if (!boardId) return;

      socket.leave(boardId);
      
      const user = socketUsers.get(socket.id);
      if (user) {
        // Server -> FE: user-left
        socket.to(boardId).emit('user-left', { userId: user.userId });
      }
      
      socketBoards.delete(socket.id);
      console.log(`[Socket.io] Client ${socket.id} left board room: ${boardId}`);
    });

    // --- B. Cursor Sync ---
    
    socket.on('cursor-move', (payload: { x: number, y: number }) => {
      const boardId = socketBoards.get(socket.id);
      const user = socketUsers.get(socket.id);
      
      if (boardId && user) {
        // Server -> FE: cursor-moved
        socket.to(boardId).emit('cursor-moved', {
          userId: user.userId,
          userName: user.fullName,
          x: payload.x,
          y: payload.y
        });
      }
    });

    // --- C. Canvas Element Sync ---
    
    socket.on('element-create', (payload: { element: any }) => {
      const boardId = socketBoards.get(socket.id);
      if (boardId) {
        // Server -> FE: element-created
        socket.to(boardId).emit('element-created', { element: payload.element });
      }
    });

    socket.on('element-update', (payload: { id: string, changes: any }) => {
      const boardId = socketBoards.get(socket.id);
      if (boardId) {
        // Server -> FE: element-updated
        socket.to(boardId).emit('element-updated', { id: payload.id, changes: payload.changes });
      }
    });

    socket.on('element-delete', (payload: { id: string }) => {
      const boardId = socketBoards.get(socket.id);
      if (boardId) {
        // Server -> FE: element-deleted
        socket.to(boardId).emit('element-deleted', { id: payload.id });
      }
    });

    // --- Disconnect Handling ---
    
    socket.on('disconnect', () => {
      const boardId = socketBoards.get(socket.id);
      const user = socketUsers.get(socket.id);
      
      if (boardId && user) {
        socket.to(boardId).emit('user-left', { userId: user.userId });
      }
      
      socketBoards.delete(socket.id);
      socketUsers.delete(socket.id);
      
      console.log(`[Socket.io] Client disconnected from /workspace namespace: ${socket.id}`);
    });
  });
}
