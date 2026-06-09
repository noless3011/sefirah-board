import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sharedService } from '../../services/shared.service';
import type { Board } from '@sefirah/shared';

export default function SharedPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    sharedService.getSharedBoards()
      .then(data => {
        setBoards(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setBoards([]);
        setLoading(false);
      });
  }, []);

  const filteredItems = boards.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Shared with me
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Collaborative workspaces shared with you by other team members.
          </p>
        </div>

        <div style={{ position: 'relative', width: '320px' }}>
          <input 
            type="text" 
            placeholder="Search boards..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 16px', 
              borderRadius: '10px', 
              border: '1px solid #e2e8f0', 
              fontSize: '14px', 
              outline: 'none', 
              background: '#f8fafc',
              transition: 'all 0.2s ease', 
              boxSizing: 'border-box' 
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2563eb';
              e.target.style.background = '#fff';
              e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.background = '#f8fafc';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div style={{ width: '24px', height: '24px', border: '2.5px solid #f1f5f9', borderTopColor: '#2563eb', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}></div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '12px', fontWeight: '500' }}>Loading workspaces...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '100px 24px', 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px dashed #cbd5e1',
          textAlign: 'center'
        }}>
          <div style={{ width: '64px', height: '64px', background: '#f0f5ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 6px 0' }}>
            No results match your search
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '380px', margin: 0, lineHeight: '1.5' }}>
            Try adjusting your keywords or search terms to find the collaborative boards.
          </p>
        </div>
      ) : (
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => {
                navigate(`/board/${item.id}`);
              }}
              style={{ 
                border: '1px solid #e2e8f0', 
                padding: '16px', 
                borderRadius: '16px', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)', 
                cursor: 'pointer', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                background: '#fff',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 10px 10px -5px rgba(15, 23, 42, 0.04)';
                e.currentTarget.style.borderColor = '#cbd5e1';
                const imgBox = e.currentTarget.firstChild as HTMLElement;
                if (imgBox && imgBox.firstChild) {
                  (imgBox.firstChild as HTMLElement).style.transform = 'scale(1.04)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.02)';
                e.currentTarget.style.borderColor = '#e2e8f0';
                const imgBox = e.currentTarget.firstChild as HTMLElement;
                if (imgBox && imgBox.firstChild) {
                  (imgBox.firstChild as HTMLElement).style.transform = 'scale(1)';
                }
              }}
            >
              <div style={{ 
                height: '180px', 
                borderRadius: '12px', 
                marginBottom: '16px', 
                overflow: 'hidden', 
                border: '1px solid #f1f5f9',
                background: '#f8fafc',
                position: 'relative'
              }}>
                <img 
                  src={item.thumbnailUrl || undefined} 
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if(parent) {
                      parent.style.backgroundImage = 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)';
                      parent.style.backgroundSize = '16px 16px';
                      parent.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }} 
                />
              </div>

              <h3 style={{ fontSize: '16px', margin: '0 0 6px 0', fontWeight: '600', color: '#0f172a', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.title}
              </h3>
              
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>
                Last updated {new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', textAlign: 'center', lineHeight: '24px', fontWeight: '600', fontSize: '11px' }}>
                  {(item.sharedBy?.fullName || 'U').charAt(0).toUpperCase()}
                </span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Shared by <strong style={{ color: '#334155', fontWeight: '500' }}>{item.sharedBy?.fullName || 'Team Member'}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}