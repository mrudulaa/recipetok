import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      maxWidth: "480px",
      margin: "0 auto",
      position: "relative",
      background: "#ffffff",
    }}>
      <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
