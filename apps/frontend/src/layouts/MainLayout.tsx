import { Outlet, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

const MainLayout = () => {
  const { isSidebarOpen, toggleSidebar } = useAppStore();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Sidebar được cải thiện */}
      {isSidebarOpen && (
        <aside style={{ 
          width: '260px', 
          background: '#1e1e2f', 
          color: '#ffffff', 
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px', // Thêm khoảng trống bao quanh
          boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{ marginBottom: '32px', textAlign: 'center', color: '#4fc3f7' }}>Sefirah Board</h2>
          <nav>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <Link to="/" style={{ 
                  color: '#e0e0e0', 
                  textDecoration: 'none', 
                  display: 'block',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)'
                }}>
                  📊 Dashboard
                </Link>
              </li>
              <li>
                <Link to="/workspace/1" style={{ 
                  color: '#e0e0e0', 
                  textDecoration: 'none', 
                  display: 'block',
                  padding: '10px 16px',
                  borderRadius: '8px'
                }}>
                  📂 Workspace Test
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f5f7f9' }}>
        <header style={{ 
          padding: '16px 24px', 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0' 
        }}>
          <button 
            onClick={toggleSidebar}
            style={{ 
              padding: '8px 12px', 
              cursor: 'pointer',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: '#fff'
            }}
          >
            {isSidebarOpen ? '◀ Thu gọn' : '▶ Mở rộng'}
          </button>
        </header>

        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;