"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const QUICK_SUGGESTIONS = [
  "Skipping breakfast today",
  "Going out for dinner tonight",
  "Had a protein bar (200 cal)",
  "Ate a big lunch out",
  "Need a high protein dinner",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-6), // last 3 exchanges for context
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#ffffff" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "16px 20px", borderBottom: "1px solid #F2F2F2",
        background: "white", flexShrink: 0,
      }}>
        <Link href="/home" style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center",
          textDecoration: "none",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "17px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em" }}>AI Planner</p>
          <p style={{ fontSize: "12px", color: "#3D7A5F", marginTop: "1px" }}>Re-balancing your day</p>
        </div>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: "14px" }}>✦</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>

        {messages.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: "32px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: "28px",
            }}>✦</div>
            <p style={{ fontSize: "20px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em", marginBottom: "8px" }}>
              What&apos;s changing today?
            </p>
            <p style={{ fontSize: "14px", color: "#9B9B9B", marginBottom: "28px", lineHeight: 1.5 }}>
              Tell me about anything that affects your eating today and I&apos;ll adjust your plan to keep you on track.
            </p>
            {/* Quick suggestions */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    background: "white", border: "1.5px solid #E8E8E8",
                    borderRadius: "100px", padding: "8px 16px",
                    fontSize: "13px", color: "#1A1A1A", fontWeight: 500,
                    cursor: "pointer", fontFamily: "Inter, sans-serif",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: "12px",
            }}
          >
            {msg.role === "assistant" && (
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginRight: "8px", fontSize: "12px", alignSelf: "flex-end",
              }}>✦</div>
            )}
            <div style={{
              maxWidth: "75%",
              background: msg.role === "user" ? "#1A1A1A" : "#F5F5F5",
              color: msg.role === "user" ? "white" : "#1A1A1A",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "12px 16px",
              fontSize: "14px", lineHeight: 1.5,
              fontFamily: "Inter, sans-serif",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px",
            }}>✦</div>
            <div style={{ background: "#F5F5F5", borderRadius: "18px 18px 18px 4px", padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: "6px", height: "6px", borderRadius: "50%", background: "#BBBBBB",
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "#FDF2F1", border: "1px solid #F5C6C2", borderRadius: "12px", padding: "12px 16px", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", color: "#C0392B" }}>{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        borderTop: "1px solid #F2F2F2",
        background: "white", flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", maxWidth: "480px", margin: "0 auto" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
            placeholder="Tell me what's changing today..."
            style={{
              flex: 1, background: "#F5F5F5", border: "none", borderRadius: "14px",
              padding: "12px 16px", fontSize: "14px", color: "#1A1A1A",
              fontFamily: "Inter, sans-serif", outline: "none", resize: "none",
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: input.trim() && !loading ? "#1A1A1A" : "#E8E8E8",
              border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.15s",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? "white" : "#BBBBBB"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
