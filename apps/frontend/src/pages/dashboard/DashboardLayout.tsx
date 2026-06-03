import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { disconnectWorkspace } from "../../socket/socketClient";

interface UserProfile {
    fullName: string;
    email: string;
    avatarUrl: string | null;
}

const DashboardLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    useEffect(() => {
        // Lấy thông tin user đăng nhập để hiển thị trên Header
        const fetchUser = async () => {
            const token = localStorage.getItem("access_token");
            if (!token) return;
            try {
                // Call API me để lấy profile (fallback về dữ liệu mặc định nếu lỗi)
                const res = await fetch("/api/v1/users/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    setUser(json.data || json);
                } else {
                    setUser({
                        fullName: "User",
                        email: "user@example.com",
                        avatarUrl: null
                    });
                }
            } catch (err) {
                // Fallback khi offline / backend chưa xong
                setUser({
                    fullName: "Cộng Tác Viên",
                    email: "member@sefirah.board",
                    avatarUrl: null
                });
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("isLoggedIn");
        disconnectWorkspace();
        navigate("/login");
    };

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
            {/* ─── SYSTEM HEADER (PERSISTENT TOP NAV BAR) ─── */}
            <header className="relative sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white px-6">
                
                {/* Logo & Search Bar */}
                <div className="flex items-center gap-6">
                    {/* Brand Logo */}
                    <div 
                        onClick={() => navigate("/dashboard")} 
                        className="cursor-pointer text-lg font-bold tracking-tight text-slate-900 transition hover:opacity-90 select-none"
                    >
                        Sefirah Board
                    </div>

                    {/* Search Bar */}
                    <div className="relative hidden w-64 sm:block">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search boards..."
                            className="w-full rounded-lg border-none bg-[#F1F3F9] py-1.5 pl-9 pr-4 text-sm text-slate-600 outline-none transition focus:bg-[#E5E7EB]"
                        />
                    </div>
                </div>

                {/* Navigation Tabs (Centered horizontally in the header) */}
                <nav className="absolute left-1/2 top-0 h-full -translate-x-1/2 flex items-center gap-8">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `relative flex h-full items-center px-1 text-sm font-semibold transition-colors border-b-[3px] ${
                                isActive 
                                    ? "text-blue-600 border-blue-600" 
                                    : "text-slate-500 border-transparent hover:text-slate-800"
                            }`
                        }
                    >
                        Recent
                    </NavLink>
                    
                    <NavLink
                        to="/templates"
                        className={({ isActive }) =>
                            `relative flex h-full items-center px-1 text-sm font-semibold transition-colors border-b-[3px] ${
                                isActive 
                                    ? "text-blue-600 border-blue-600" 
                                    : "text-slate-500 border-transparent hover:text-slate-800"
                            }`
                        }
                    >
                        Templates
                    </NavLink>
                    
                    <NavLink
                        to="/shared"
                        className={({ isActive }) =>
                            `relative flex h-full items-center px-1 text-sm font-semibold transition-colors border-b-[3px] ${
                                isActive 
                                    ? "text-blue-600 border-blue-600" 
                                    : "text-slate-500 border-transparent hover:text-slate-800"
                            }`
                        }
                    >
                        Shared
                    </NavLink>
                </nav>

                {/* Right Actions, Share Button & Profile Dropdown */}
                <div className="flex items-center gap-4">
                    
                    {/* Action Icons */}
                    <div className="flex items-center gap-3">
                        
                        {/* Notifications Bell */}
                        <button className="relative rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m7.73 13a2 2 0 0 1-3.46 0" />
                            </svg>
                        </button>

                        {/* Settings Button */}
                        <button 
                            onClick={() => navigate("/settings")}
                            className={`rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition ${location.pathname === "/settings" ? "bg-slate-100 text-slate-800" : ""}`}
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </button>
                    </div>

                    {/* Dải phân cách dọc */}
                    <div className="h-6 w-px bg-slate-200" />

                    {/* Create New Board Button */}
                    <button className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>Create New Board</span>
                    </button>

                    {/* Avatar & User Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 ring-2 ring-slate-100 transition hover:ring-indigo-300 focus:outline-none"
                        >
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <svg className="h-full w-full rounded-full" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="16" cy="16" r="16" fill="#F1F5F9" />
                                    {/* Head & Neck */}
                                    <rect x="14" y="18" width="4" height="6" rx="2" fill="#FDBA74" />
                                    <circle cx="16" cy="15" r="7" fill="#FDBA74" />
                                    {/* Hair (Brown, parted/cool style) */}
                                    <path d="M9 14C9 10 12 8 16 8C20 8 23 10 23 14C23 11 20 10 16 10C12 10 9 11 9 14Z" fill="#78350F" />
                                    <path d="M12 9C13.5 7.5 18.5 7.5 20 9C21.5 10.5 20 12 19 12C18 12 15 10.5 13 11C11.5 11.5 11 10 12 9Z" fill="#78350F" />
                                    {/* Face features (eyes & mouth) */}
                                    <circle cx="14" cy="14.5" r="0.75" fill="#1E293B" />
                                    <circle cx="18" cy="14.5" r="0.75" fill="#1E293B" />
                                    <path d="M14.5 18C15 18.5 17 18.5 17.5 18" stroke="#1E293B" strokeWidth="0.75" strokeLinecap="round" />
                                    {/* Clothes (Green Shirt) */}
                                    <path d="M6 28C6 24 10 22 16 22C22 22 26 24 26 28V32H6V28Z" fill="#10B981" />
                                    {/* Collar line */}
                                    <path d="M13 22L16 25L19 22" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            )}
                        </button>

                            {/* Dropdown Menu */}
                            {showProfileDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-150 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-50">
                                        <div className="px-3 py-2 text-xs border-b border-slate-100">
                                            <p className="font-semibold text-slate-800 truncate">{user?.fullName}</p>
                                            <p className="text-slate-400 truncate">{user?.email}</p>
                                        </div>
                                        <button 
                                            onClick={() => { setShowProfileDropdown(false); navigate("/settings"); }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            Account Settings
                                        </button>
                                        <button 
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50/70 transition"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
            </header>

            {/* ─── DYNAMIC SUB-PAGE BROWSER OUTLET ─── */}
            <div className="flex-1 overflow-hidden">
                <Outlet />
            </div>
        </div>
    );
};

export default DashboardLayout;
