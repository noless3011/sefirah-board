import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sharedService } from '../../services/shared.service';
import type { Board } from '@sefirah/shared';
import { BoardCard } from './BoardCard';

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
    <div className="p-8 max-w-[1400px] mx-auto font-sans">
      
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Shared with me
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Collaborative workspaces shared with you by other team members.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <input 
            type="text" 
            placeholder="Search boards..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 outline-none text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
          <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {loading ? (
        /* Skeleton Loader */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl h-64 flex flex-col overflow-hidden">
              <div className="h-40 bg-slate-100" />
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="flex items-center justify-between mt-2">
                  <div className="h-5 bg-slate-100 rounded w-16" />
                  <div className="h-4 bg-slate-100 rounded-full w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty Search/List State */
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-dashed border-slate-200 rounded-2xl text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800 text-lg">No shared boards found</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm">
            {searchQuery ? `No boards match your search "${searchQuery}".` : "Workspaces shared with you by other team members will appear here."}
          </p>
        </div>
      ) : (
        /* Grid of boards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}