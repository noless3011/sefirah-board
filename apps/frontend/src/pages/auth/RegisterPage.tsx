import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/auth.api";

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_URL ?? "/api/v1"}/auth/google`;
const GITHUB_AUTH_URL = `${import.meta.env.VITE_API_URL ?? "/api/v1"}/auth/github`;

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
    });
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get("redirect");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            setError("Bạn cần đồng ý với Terms and Conditions để tiếp tục.");
            return;
        }
        setError("");
        try {
            await authApi.register(formData);
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            navigate(
                redirectUrl
                    ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
                    : "/login"
            );
        } catch (err: any) {
            setError(err.response?.data?.message || "Đăng ký thất bại!");
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
            {/* Header */}
            <header className="px-6 py-4">
                <span className="text-base font-semibold text-gray-900 tracking-tight">
                    Sefirah Board
                </span>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
                {/* Card */}
                <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-8">
                    <div className="mb-7 text-center">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Create your workspace
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Join the Ethereal Atelier today.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                placeholder="Leonardo da Vinci"
                                required
                                value={formData.fullName}
                                className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                                onChange={(e) =>
                                    setFormData({ ...formData, fullName: e.target.value })
                                }
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="leo@atelier.com"
                                required
                                value={formData.email}
                                className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    className="w-full rounded-xl bg-gray-50 border border-gray-200 pl-4 pr-10 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-3.5 flex items-center text-gray-400 hover:text-gray-600 transition"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Terms checkbox */}
                        <div className="flex items-start gap-3 pt-1">
                            <input
                                id="agree"
                                type="checkbox"
                                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                            />
                            <label
                                htmlFor="agree"
                                className="text-sm text-gray-600 cursor-pointer select-none leading-snug"
                            >
                                I agree to the{" "}
                                <a href="#" className="text-blue-600 font-medium hover:underline">
                                    Terms and Conditions
                                </a>{" "}
                                and Privacy Policy.
                            </label>
                        </div>

                        {/* Create Account Button */}
                        <button
                            type="submit"
                            className="w-full rounded-full py-3 font-semibold text-white text-sm tracking-wide transition-opacity hover:opacity-90 active:opacity-80 mt-2"
                            style={{
                                background: "linear-gradient(135deg, #4f6ef7 0%, #7c6ef7 100%)",
                                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
                            }}
                        >
                            Create Account
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs font-medium text-gray-400 tracking-widest uppercase">
                            or
                        </span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <a
                            href={GOOGLE_AUTH_URL}
                            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Google
                        </a>
                        <a
                            href={GITHUB_AUTH_URL}
                            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
                            </svg>
                            GitHub
                        </a>
                    </div>

                    {/* Sign In link */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link
                            to={
                                redirectUrl
                                    ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
                                    : "/login"
                            }
                            className="font-semibold text-blue-600 hover:underline"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="px-6 py-5 border-t border-gray-200 bg-[#f3f4f6]">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-900">Sefirah Board</span>
                    <nav className="flex items-center gap-5 text-sm text-gray-500">
                        <a href="#" className="hover:text-gray-700 transition">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-700 transition">Terms of Service</a>
                        <a href="#" className="hover:text-gray-700 transition">Help Center</a>
                        <a href="#" className="hover:text-gray-700 transition">Contact</a>
                    </nav>
                    <span className="text-xs text-gray-400">
                        © 2024 Sefirah Board. Crafted for the Ethereal Atelier.
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default RegisterPage;
