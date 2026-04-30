import { useState } from "react";
import { Search, Plus, Eye, Pencil, Trash2, X } from "lucide-react";
import BookingModal from "../components/BookingModal";
import BookingDetailModal from "../components/BookingDetailModal";
import InvoiceModal from "../components/InvoiceModal";
import { useToast } from "../components/Toast";
import { useBookings } from "../context/BookingsContext";
import { useRole } from "../context/RoleContext";

const TABS = ["All", "Confirmed", "Pending Payment", "Enquiry", "Completed"];

const STATUS_STYLE = {
  Confirmed:       { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Pending Payment":{ bg: "#fef9c3", color: "#a16207", dot: "#eab308" },
  Enquiry:         { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
  Completed:       { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
  Cancelled:       { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
};

const EVENT_EMOJI = {
  Wedding:"💍", Reception:"🥂", Engagement:"💑",
  Birthday:"🎂", Corporate:"💼", Conference:"💼", Others:"🎉",
};

export default function Bookings() {
  const [search, setSearch]       = useState("");
  const [tab, setTab]             = useState("All");
  const [showAdd, setShowAdd]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detail, setDetail]       = useState(null);
  const [invoice, setInvoice]     = useState(null);
  const { addToast }              = useToast();
  const { bookings, deleteBooking } = useBookings();
  const { can }                   = useRole();

  const filtered = bookings.filter(b => {
    const matchTab = tab === "All" || b.status === tab;
    const q = search.toLowerCase();
    const matchSearch = !q || b.customerName.toLowerCase().includes(q) || b.phone.includes(q) || b.id.toLowerCase().includes(q) || b.eventType.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const handleDelete = (id) => {
    deleteBooking(id);
    addToast("Booking deleted", "success");
  };

  const tabCount = (t) => t === "All" ? bookings.length : bookings.filter(b => b.status === t).length;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── HEADER BAR ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, ID, event…"
            style={{
              width: "100%", height: 40, paddingLeft: 36, paddingRight: 12,
              borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff",
              fontSize: 13, color: "#374151", outline: "none",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Add Button — only if allowed */}
        {can("canAddBooking") && (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0 18px", height: 40, borderRadius: 10,
            background: "#1B4332", color: "#fff", border: "none",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 10px rgba(27,67,50,0.35)",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#163829"}
          onMouseLeave={e => e.currentTarget.style.background = "#1B4332"}
        >
          <Plus size={16} /> New Booking
        </button>
        )}
      </div>

      {/* ── FILTER TABS ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, transition: "all 0.15s",
            background: tab === t ? "#1B4332" : "#fff",
            color:      tab === t ? "#fff"    : "#6b7280",
            boxShadow:  tab === t ? "0 2px 10px rgba(27,67,50,0.25)" : "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            {t}
            <span style={{
              fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
              borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
              background: tab === t ? "rgba(255,255,255,0.25)" : "#f3f4f6",
              color:      tab === t ? "#fff" : "#374151",
              padding: "0 5px",
            }}>{tabCount(t)}</span>
          </button>
        ))}
      </div>

      {/* ── TABLE ── */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                {["Booking ID","Customer","Event","Hall","Date","Session", ...(can("canViewRevenue") ? ["Amount"] : []),"Status","Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 14 }}>
                    No bookings found
                  </td>
                </tr>
              ) : (
                filtered.map((b, idx) => {
                  const st = STATUS_STYLE[b.status] || STATUS_STYLE.Enquiry;
                  return (
                    <tr key={b.id} style={{ borderBottom: "1px solid #f9fafb", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0faf4"}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa"}
                    >
                      {/* ID */}
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1B4332", background: "#F0F4EF", padding: "2px 8px", borderRadius: 6 }}>{b.id}</span>
                      </td>
                      {/* Customer */}
                      <td style={{ padding: "12px 16px" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>{b.customerName}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{b.phone}</p>
                      </td>
                      {/* Event */}
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 13, color: "#374151" }}>
                          {EVENT_EMOJI[b.eventType] || "🎉"} {b.eventType}
                        </span>
                      </td>
                      {/* Hall */}
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>{b.hall}</td>
                      {/* Date */}
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <p style={{ fontSize: 13, color: "#374151" }}>
                          {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </td>
                      {/* Session */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                          background: b.session === "Full Day" ? "#fef3c7" : "#eff6ff",
                          color:      b.session === "Full Day" ? "#b45309"  : "#1d4ed8",
                        }}>{b.session}</span>
                      </td>
                      {/* Amount — Owner/Manager only */}
                      {can("canViewRevenue") && (
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>₹{b.totalAmount.toLocaleString()}</p>
                        <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>Adv: ₹{b.advance.toLocaleString()}</p>
                      </td>
                      )}
                      {/* Status */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
                          {b.status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setDetail(b)} title="View" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#1B4332" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#F0F4EF"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                            <Eye size={14} />
                          </button>
                          {can("canEditBooking") && (
                          <button onClick={() => { setEditTarget(b); setShowAdd(true); }} title="Edit" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                            <Pencil size={14} />
                          </button>
                          )}
                          {can("canDeleteBooking") && (
                          <button onClick={() => handleDelete(b.id)} title="Delete" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                            <Trash2 size={14} />
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>Showing {filtered.length} of {bookings.length} bookings</span>
          <span style={{ fontSize: 12, color: "#1B4332", fontWeight: 600 }}>
            Total: ₹{filtered.reduce((s, b) => s + b.totalAmount, 0).toLocaleString()}
          </span>
        </div>
      </div>

      {showAdd && <BookingModal onClose={() => { setShowAdd(false); setEditTarget(null); }} editData={editTarget} />}
      {detail  && <BookingDetailModal booking={detail} onClose={() => setDetail(null)} onInvoice={() => { setInvoice(detail); setDetail(null); }} onEdit={(b) => { setEditTarget(b); setShowAdd(true); }} />}
      {invoice && <InvoiceModal booking={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}
