"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#F8F7F4]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🍴</div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">RecipeTok</h1>
          <p className="text-gray-500 mt-2 text-base">From TikTok to your table.</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Check your email</h2>
            <p className="text-gray-500 text-sm">
              We sent a magic link to <span className="font-medium text-gray-700">{email}</span>.
              Tap it to sign in.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-8 text-sm text-gray-500">
              {[
                { icon: "📱", text: "Paste any TikTok cooking video URL" },
                { icon: "🤖", text: "AI extracts the full recipe + macros" },
                { icon: "💪", text: "Goal-aware ingredient swap suggestions" },
                { icon: "📅", text: "Weekly meal planner + grocery list" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <span className="text-xl w-7 text-center">{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 text-base"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl text-base transition-all disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send magic link"}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              No password needed — we'll email you a sign-in link.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
