import { useNavigate } from "react-router-dom";
import { disconnectWorkspace } from "../../socket/socketClient";

const DashboardPage = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // 1. Xóa token và trạng thái đăng nhập
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("isLoggedIn");

        // 2. Ngắt kết nối Socket (nếu đang chạy)
        disconnectWorkspace();

        // 3. Điều hướng về trang đăng nhập
        navigate("/login");
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-xl">
                <div className="mb-6 flex justify-center">
                    {/* Icon chúc mừng */}
                    <span className="text-6xl">🎉</span>
                </div>

                <h1 className="mb-4 text-4xl font-extrabold text-green-600">
                    Chúc Mừng!
                </h1>

                <p className="mb-2 text-lg text-gray-700">
                    Bạn đã đăng nhập và xác thực thành công.
                </p>

                <div className="my-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                    <p>
                        <strong>Lưu ý:</strong> Giao diện tính năng chi tiết của
                        Dashboard sẽ do đồng đội của bạn phát triển và ghép vào
                        sau. Nhiệm vụ Authentication của bạn đến đây là hoàn
                        hảo! 🚀
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    className="mt-4 w-full rounded-lg bg-red-500 py-3 font-semibold text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300"
                >
                    Đăng Xuất (Test lại luồng Auth)
                </button>
            </div>
        </div>
    );
};

export default DashboardPage;
