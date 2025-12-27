import React from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { Lock, Wallet } from "lucide-react";

export default function Login() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) navigate("/");
  }, [currentUser, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black text-white p-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-900/50 p-8 shadow-2xl border border-gray-800 backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <Wallet className="h-10 w-10 text-emerald-400" />
        </div>
        <h2 className="mb-2 text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent text-center">
          Finance Tracker
        </h2>
        <p className="mb-8 text-gray-400 text-center text-sm font-light">
          Secure Personal Finance & Investment Dashboard
        </p>

        <button
          onClick={login}
          className="group flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98]"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span>Sign in with Google</span>
        </button>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-600">
          <Lock className="h-3 w-3" />
          <span>End-to-end secured data privacy</span>
        </div>
      </div>
    </div>
  );
}