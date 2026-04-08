import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth.api';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Đường dẫn không hợp lệ hoặc thiếu Token.');
        }
    }, [token]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp!');
            return;
        }
        if (!token) return;

        try {
            await authApi.resetPassword({ token, newPassword });
            alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Token hết hạn hoặc không hợp lệ.');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <form onSubmit={handleReset} className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
                <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">Đặt Lại Mật Khẩu</h2>

                {error && <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700 text-center">{error}</div>}

                <input
                    type="password" placeholder="Mật khẩu mới" required disabled={!token}
                    className="mb-4 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                    type="password" placeholder="Xác nhận mật khẩu mới" required disabled={!token}
                    className="mb-6 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button type="submit" disabled={!token} className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                    Xác Nhận Đổi Mật Khẩu
                </button>
            </form>
        </div>
    );
};

export default ResetPasswordPage;