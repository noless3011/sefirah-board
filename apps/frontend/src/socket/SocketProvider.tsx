import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { socket, connectWorkspace, disconnectWorkspace } from './socketClient';
import { setupGlobalEvents } from './socketHandlers';

const SocketContext = createContext(socket);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (token) {
      connectWorkspace(token);
      setupGlobalEvents(socket);
    }

    return () => {
      socket.off("connect");
      socket.off("notification");
      socket.off("connect_error");
      disconnectWorkspace();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};