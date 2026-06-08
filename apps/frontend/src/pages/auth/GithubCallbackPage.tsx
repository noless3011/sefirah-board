import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/auth.api";

const GithubCallbackPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"loading" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const called = useRef(false);

    useEffect(() => {
        if (called.current) return;
        called.current = true;

        const handleCallback = async () => {
            try {
                const code = searchParams.get("code");
                if (!code) {
                    throw new Error("No authorization code returned from GitHub");
                }

                // Call backend oauth endpoint
                const response = await authApi.loginWithGithub(code);
                const { accessToken, refreshToken } = response.data;

                localStorage.setItem("access_token", accessToken);
                localStorage.setItem("refresh_token", refreshToken);
                localStorage.setItem("isLoggedIn", "true");

                // Redirect to dashboard or previous destination
                navigate("/dashboard");
            } catch (err: any) {
                console.error("GitHub login callback error:", err);
                setStatus("error");
                setErrorMsg(
                    err.response?.data?.message ||
                    err.message ||
                    "Đăng nhập qua GitHub thất bại. Vui lòng thử lại!"
                );
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-8 text-center">
                {status === "loading" ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-950 mt-4 tracking-tight">
                            Verifying GitHub Account
                        </h2>
                        <p className="text-sm text-gray-500">
                            Connecting you to the Atelier...
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 py-6">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-950 tracking-tight">
                            Authentication Failed
                        </h2>
                        <p className="text-sm text-red-500 max-w-xs">{errorMsg}</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 transition duration-150"
                        >
                            Return to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GithubCallbackPage;
