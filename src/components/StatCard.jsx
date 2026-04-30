import { TrendingUp, TrendingDown } from "lucide-react";

const palettes = {
  green: { bg: "#f0faf4", border: "#bbf7d0", iconBg: "#1B4332", trendBg: "#dcfce7", trendColor: "#15803d" },
  gold:  { bg: "#fffbeb", border: "#fde68a", iconBg: "#D4A017", trendBg: "#fef9c3", trendColor: "#a16207" },
  red:   { bg: "#fff5f5", border: "#fecaca", iconBg: "#C0392B", trendBg: "#fee2e2", trendColor: "#b91c1c" },
  blue:  { bg: "#eff6ff", border: "#bfdbfe", iconBg: "#2563EB", trendBg: "#dbeafe", trendColor: "#1d4ed8" },
};

export default function StatCard({ title, value, sub, icon: Icon, color = "green", trend, trendUp = true }) {
  const p = palettes[color] || palettes.green;
  return (
    <div style={{
      background: p.bg, border: "1px solid " + p.border, borderRadius: 16,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: "18px 20px",
      display: "flex", alignItems: "center", gap: 16,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", right: -20, top: -20, width: 80, height: 80, borderRadius: "50%", background: p.iconBg, opacity: 0.06 }} />
      <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: p.iconBg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px " + p.iconBg + "55" }}>
        {Icon && <Icon size={22} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{sub}</p>}
      </div>
      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, background: p.trendBg, color: p.trendColor, padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
          {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {trend}
        </div>
      )}
    </div>
  );
}
