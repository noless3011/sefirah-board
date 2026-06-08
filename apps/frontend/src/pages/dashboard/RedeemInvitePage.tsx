import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collaborationApi } from "../../api/board.api";

const RedeemInvitePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const inviteCode = searchParams.get("code") || "";

    const [status, setStatus] = useState<"loading" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!inviteCode) {
            setStatus("error");
            setErrorMessage("No invitation code was found in the URL.");
            return;
        }

        const redeem = async () => {
            try {
                const res = await collaborationApi.redeemInvite(inviteCode);
                // Redirect immediately to the newly joined board!
                navigate(`/board/${res.board.id}`, { replace: true });
            } catch (err: any) {
                console.error("Failed to redeem invite link:", err);
                setStatus("error");
                setErrorMessage(
                    err.response?.data?.message ||
                    err.message ||
                    "This invitation link might be invalid, expired, or you may already be a member of this board."
                );
            }
        };

        redeem();
    }, [inviteCode, navigate]);

    if (status === "loading") {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50/50 p-6 text-center">
                <div className="flex flex-col items-center max-w-sm">
                    {/* Pulsing loading spinner */}
                    <div className="relative flex h-14 w-14 items-center justify-center mb-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-25"></span>
                        <div className="relative rounded-full bg-blue-50 p-3 text-blue-600 shadow-xs">
                            <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Verifying Invitation...</h2>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                        Setting up your secure workspace access and loading the canvas. Please wait a moment.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50/50 p-6 text-center">
            <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] animate-in fade-in zoom-in duration-200">
                {/* Error warning icon */}
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-6">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-slate-900 leading-snug">Invalid or Expired Invite Link</h2>
                <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                    {errorMessage}
                </p>

                <div className="mt-8 flex flex-col gap-3">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-center text-sm font-semibold text-white transition shadow-sm cursor-pointer hover:scale-[1.01]"
                    >
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => navigate(0)} // Reloads page to try again
                        className="w-full rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 py-3 text-center text-sm font-semibold text-slate-650 transition cursor-pointer"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RedeemInvitePage;
