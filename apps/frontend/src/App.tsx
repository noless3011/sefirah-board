import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import { SocketProvider } from "./socket/SocketProvider";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Authenticated Pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import TemplatesPage from "./pages/dashboard/TemplatesPage";
import SharedPage from "./pages/dashboard/SharedPage";
import BoardPage from "./pages/workspace/BoardPage";
import AccountSettingsPage from "./pages/settings/AccountSettingsPage";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import RedeemInvitePage from "./pages/dashboard/RedeemInvitePage";

import type { ReactNode } from "react";

const PrivateRoute = ({ children }: { children: ReactNode }) => {
    const token = localStorage.getItem("access_token");
    const location = useLocation();

    return token ? (
        <SocketProvider>{children}</SocketProvider>
    ) : (
        <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
    );
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected Routes (Persistent Navigation Layout) */}
                <Route
                    element={
                        <PrivateRoute>
                            <DashboardLayout />
                        </PrivateRoute>
                    }
                >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/templates" element={<TemplatesPage />} />
                    <Route path="/shared" element={<SharedPage />} />
                    <Route path="/settings" element={<AccountSettingsPage />} />
                    <Route path="/invites/redeem" element={<RedeemInvitePage />} />
                </Route>

                {/* Dynamic route for individual boards/workspaces */}
                <Route
                    path="/board/:boardId"
                    element={
                        <PrivateRoute>
                            <BoardPage />
                        </PrivateRoute>
                    }
                />

                {/* Fallback Route */}
                <Route path="*" element={<h1>404</h1>} />
            </Routes>
        </Router>
    );
}

export default App;
