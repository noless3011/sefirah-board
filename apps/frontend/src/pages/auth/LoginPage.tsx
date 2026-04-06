import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await authApi.login(formData);
            const { accessToken, refreshToken } = response.data;

            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('isLoggedIn', 'true');

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <form onSubmit={handleLogin} className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
                <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">Đăng Nhập</h2>
                {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}

                <input
                    type="email" placeholder="Email" required
                    className="mb-4 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <input
                    type="password" placeholder="Mật khẩu" required
                    className="mb-4 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />

                <div className="mb-6 flex items-center justify-between">
                    <label className="flex items-center text-sm text-gray-600">
                        <input
                            type="checkbox" className="mr-2 rounded"
                            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                        />
                        Ghi nhớ
                    </label>
                    <Link to="/forgot-password" className="text-sm text-blue-500 hover:underline">Quên mật khẩu?</Link>
                </div>

                <button type="submit" className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700">
                    Đăng Nhập
                </button>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Chưa có tài khoản? <Link to="/register" className="font-semibold text-blue-600 hover:underline">Đăng ký ngay</Link>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;