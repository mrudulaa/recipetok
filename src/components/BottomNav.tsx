"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/home",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#1A1A1A" : "none"} stroke={active ? "#1A1A1A" : "#9B9B9B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/recipes",
    label: "Recipes",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#1A1A1A" : "#9B9B9B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: "/import",
    label: "Import",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#1A1A1A" : "#9B9B9B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    href: "/planner",
    label: "Planner",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#1A1A1A" : "#9B9B9B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#1A1A1A" : "#9B9B9B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      borderTop: "1px solid #E8E8E8",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-around",
        paddingTop: "10px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        maxWidth: "480px", margin: "0 auto",
      }}>
        {tabs.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "4px", textDecoration: "none", padding: "2px 10px",
              position: "relative",
            }}>
              {icon(active)}
              <span style={{
                fontSize: "10px", fontWeight: active ? 700 : 400,
                color: active ? "#1A1A1A" : "#9B9B9B",
                fontFamily: "Inter, sans-serif", letterSpacing: "0.01em",
              }}>
                {label}
              </span>
              {active && (
                <span style={{
                  position: "absolute", bottom: "-10px",
                  width: "4px", height: "4px", borderRadius: "50%",
                  background: "#3D7A5F",
                }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
