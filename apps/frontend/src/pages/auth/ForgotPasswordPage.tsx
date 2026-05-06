import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/auth.api";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState({ type: "", message: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: "", message: "" });
        try {
            await authApi.forgotPassword({ email });
            setStatus({
                type: "success",
                message:
                    "Vui lòng kiểm tra email của bạn để nhận liên kết đặt lại mật khẩu.",
            });
        } catch (err: any) {
            setStatus({
                type: "error",
                message:
                    err.response?.data?.message ||
                    "Có lỗi xảy ra, vui lòng thử lại.",
            });
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg"
            >
                <h2 className="mb-2 text-center text-3xl font-bold text-gray-800">
                    Quên Mật Khẩu
                </h2>
                <p className="mb-6 text-center text-sm text-gray-500">
                    Nhập email của bạn để đặt lại mật khẩu
                </p>

                {status.message && (
                    <div
                        className={`mb-4 rounded p-3 text-sm text-center ${status.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                        {status.message}
                    </div>
                )}

                <input
                    type="email"
                    placeholder="Nhập địa chỉ email"
                    required
                    className="mb-6 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <button
                    type="submit"
                    className="mb-4 w-full rounded-lg bg-gray-800 py-3 font-semibold text-white transition hover:bg-gray-900"
                >
                    Gửi Yêu Cầu
                </button>

                <div className="text-center">
                    <Link
                        to="/login"
                        className="text-sm font-semibold text-blue-600 hover:underline"
                    >
                        Quay lại Đăng nhập
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default ForgotPasswordPage;
