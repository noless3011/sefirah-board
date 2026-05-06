import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/auth.api";

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await authApi.register(formData);
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            navigate("/login");
        } catch (err: any) {
            setError(err.response?.data?.message || "Đăng ký thất bại!");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <form
                onSubmit={handleRegister}
                className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg"
            >
                <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
                    Tạo Tài Khoản
                </h2>
                {error && (
                    <div className="mb-4 text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <input
                    type="text"
                    placeholder="Họ và tên"
                    required
                    className="mb-4 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                    onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                    }
                />
                <input
                    type="email"
                    placeholder="Email"
                    required
                    className="mb-4 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                    onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                    }
                />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    required
                    className="mb-6 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                    onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                    }
                />

                <button
                    type="submit"
                    className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
                >
                    Đăng Ký
                </button>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Đã có tài khoản?{" "}
                    <Link
                        to="/login"
                        className="font-semibold text-blue-600 hover:underline"
                    >
                        Đăng nhập
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterPage;
