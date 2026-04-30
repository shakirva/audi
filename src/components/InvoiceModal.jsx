  import { X, Printer, MessageCircle } from "lucide-react";
import { auditoriumInfo } from "../data/dummyData";
import { useToast } from "./Toast";

export default function InvoiceModal({ booking, onClose }) {
  const { addToast } = useToast();
  if (!booking) return null;

  const advance = Number(booking.advance ?? booking.advancePaid ?? 0);
  const balance = booking.totalAmount - advance;
  const hallRental = Math.max(booking.totalAmount - 3500, 0);
  const formattedDate = (() => {
    try { return new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return booking.date; }
  })();
  const invoiceNo = `INV-2026-${booking.id.slice(2)}`;

  const handlePrint = () => {
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>${invoiceNo}</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:'Segoe UI',sans-serif;margin:0;padding:32px;color:#111;font-size:13px;background:#fff}
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #1B4332;margin-bottom:24px}
      .venue-name{font-size:22px;font-weight:800;color:#1B4332;margin:0 0 4px}
      .venue-sub{font-size:11px;color:#6b7280;margin:2px 0}
      .inv-title{font-size:26px;font-weight:800;color:#1B4332;text-align:right}
      .inv-meta{font-size:11px;color:#6b7280;text-align:right;margin-top:4px}
      .bill-row{display:flex;justify-content:space-between;margin-bottom:20px}
      .bill-box{background:#f9fafb;border-radius:10px;padding:14px 18px;flex:1;margin:0 6px}
      .bill-box:first-child{margin-left:0} .bill-box:last-child{margin-right:0}
      .bill-label{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
      .bill-val{font-size:13px;font-weight:600;color:#111}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th{background:#1B4332;color:#fff;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
      td{padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:12px}
      .totals{margin-top:20px;border-top:2px solid #1B4332;padding-top:16px}
      .total-row{display:flex;justify-content:flex-end;gap:40px;margin-bottom:8px;font-size:13px}
      .total-row.grand{font-size:16px;font-weight:800;color:#1B4332;border-top:1px dashed #e5e7eb;padding-top:10px;margin-top:4px}
      .balance{color:#b91c1c} .paid{color:#15803d}
      .footer{margin-top:32px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px}
      .stamp{display:inline-block;border:2px solid #1B4332;border-radius:8px;padding:8px 20px;color:#1B4332;font-weight:700;font-size:14px;margin-top:20px}
      @media print{body{padding:12px}}
    </style></head><body>
    <div class="header">
      <div>
        <div class="venue-name">🏛️ ${auditoriumInfo.name || "Sharada Auditorium"}</div>
        <div class="venue-sub">📍 ${auditoriumInfo.location || "Taliparamba, Kannur, Kerala"}</div>
        <div class="venue-sub">📞 ${auditoriumInfo.phone || "9447012345"}</div>
        <div class="venue-sub">GSTIN: ${auditoriumInfo.gstin || auditoriumInfo.gst || "32AABCT3518Q1Z5"}</div>
      </div>
      <div>
        <div class="inv-title">INVOICE</div>
        <div class="inv-meta">${invoiceNo}</div>
        <div class="inv-meta">Date: ${formattedDate}</div>
      </div>
    </div>
    <div class="bill-row">
      <div class="bill-box"><div class="bill-label">Billed To</div><div class="bill-val">${booking.customerName}</div><div style="font-size:11px;color:#6b7280;margin-top:3px">📞 ${booking.phone}</div></div>
      <div class="bill-box"><div class="bill-label">Event</div><div class="bill-val">${booking.eventType}</div><div style="font-size:11px;color:#6b7280;margin-top:3px">${formattedDate}</div></div>
      <div class="bill-box"><div class="bill-label">Booking ID</div><div class="bill-val">${booking.id}</div><div style="font-size:11px;color:#6b7280;margin-top:3px">Status: ${booking.status}</div></div>
    </div>
    <table>
      <tr><th>Description</th><th>Details</th><th style="text-align:right">Amount</th></tr>
      <tr><td>Hall Rental (${booking.hall})</td><td>${booking.session} session</td><td style="text-align:right">₹${hallRental.toLocaleString()}</td></tr>
      <tr><td>Extra Chairs (50 nos)</td><td>₹50 × 50</td><td style="text-align:right">₹2,500</td></tr>
      <tr><td>Generator Backup</td><td>Full day</td><td style="text-align:right">₹1,000</td></tr>
    </table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>₹${booking.totalAmount.toLocaleString()}</span></div>
      <div class="total-row"><span>GST (0% — Composite)</span><span>₹0</span></div>
      <div class="total-row grand"><span>TOTAL</span><span>₹${booking.totalAmount.toLocaleString()}</span></div>
      <div class="total-row paid"><span>Advance Received</span><span>- ₹${advance.toLocaleString()}</span></div>
      <div class="total-row balance"><span style="font-weight:700">BALANCE DUE</span><span style="font-weight:800">₹${balance.toLocaleString()}</span></div>
    </div>
    <div class="footer">
      <div>Thank you for choosing ${auditoriumInfo.name || "our auditorium"}! 🙏</div>
      <div style="margin-top:4px">This is a computer-generated invoice. No signature required.</div>
      <div class="stamp">✅ ${booking.status}</div>
    </div>
    <script>window.onload=()=>{window.print();}<` + `/script>
    </body></html>`);
    w.document.close();
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Dear ${booking.customerName},\n\nPlease find your invoice details below:\n\n🧾 Invoice: ${invoiceNo}\n📅 Date: ${formattedDate}\n🏛️ Hall: ${booking.hall} (${booking.session})\n💰 Total: ₹${booking.totalAmount.toLocaleString()}\n✅ Advance: ₹${advance.toLocaleString()}\n⚠️ Balance: ₹${balance.toLocaleString()}\n\nThank you! 🙏 — ${auditoriumInfo.name || "HallMaster"}`
    );
    window.open(`https://wa.me/91${booking.phone}?text=${msg}`, "_blank");
    addToast("Invoice shared on WhatsApp! 📱", "success");
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.25)", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Header bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>Invoice Preview</h3>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{invoiceNo}</p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Invoice body ── */}
        <div style={{ padding: "20px 24px", fontFamily: "monospace" }}>

          {/* Letterhead */}
          <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: "2px dashed #e5e7eb", marginBottom: 16 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#1B4332", fontFamily: "'Playfair Display', serif", margin: 0 }}>
              🏛️ {auditoriumInfo.name || "Sharada Auditorium"}
            </p>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{auditoriumInfo.location || "Taliparamba, Kannur, Kerala"}</p>
            <p style={{ fontSize: 11, color: "#6b7280" }}>Ph: {auditoriumInfo.phone || "9447012345"} · GSTIN: {auditoriumInfo.gstin || auditoriumInfo.gst || "32AABCT3518Q1Z5"}</p>
          </div>

          {/* Invoice meta */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 12 }}>
            <div>
              <p style={{ fontWeight: 700, color: "#374151", margin: 0 }}>{invoiceNo}</p>
              <p style={{ color: "#6b7280", marginTop: 2 }}>Date: {formattedDate}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontWeight: 700, color: "#374151", margin: 0 }}>BILL TO:</p>
              <p style={{ color: "#374151", marginTop: 2 }}>{booking.customerName}</p>
              <p style={{ color: "#9ca3af" }}>Ph: {booking.phone}</p>
            </div>
          </div>

          {/* Event details */}
          <div style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 11 }}>
            <p style={{ fontWeight: 700, color: "#374151", marginBottom: 6 }}>Event Details</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 0", color: "#6b7280" }}>
              <span>Event Type:</span><span style={{ fontWeight: 600, color: "#111" }}>{booking.eventType}</span>
              <span>Hall:</span><span style={{ fontWeight: 600, color: "#111" }}>{booking.hall}</span>
              <span>Date:</span><span style={{ fontWeight: 600, color: "#111" }}>{formattedDate}</span>
              <span>Session:</span><span style={{ fontWeight: 600, color: "#111" }}>{booking.session}</span>
              <span>Guests:</span><span style={{ fontWeight: 600, color: "#111" }}>{booking.guests}</span>
            </div>
          </div>

          {/* Line items */}
          <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: 12, marginBottom: 12 }}>
            {[
              { desc: `Hall Rental (${booking.hall}) — ${booking.session}`, amt: hallRental },
              { desc: "Extra Chairs (50 nos @ ₹50)", amt: 2500 },
              { desc: "Generator Backup", amt: 1000 },
            ].map(item => (
              <div key={item.desc} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: "#374151" }}>
                <span>{item.desc}</span>
                <span style={{ fontWeight: 600 }}>₹{item.amt.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#6b7280" }}>
              <span>Subtotal</span><span>₹{booking.totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, fontWeight: 800, color: "#111827", borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>
              <span>TOTAL</span><span>₹{booking.totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#15803d", marginBottom: 6 }}>
              <span>Advance Received</span><span style={{ fontWeight: 700 }}>₹{advance.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: balance > 0 ? "#b91c1c" : "#15803d", borderTop: "1px dashed #e5e7eb", paddingTop: 8 }}>
              <span>{balance > 0 ? "BALANCE DUE" : "✅ FULLY PAID"}</span>
              <span>₹{balance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 10 }}>
          <button onClick={handlePrint} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <Printer size={15} /> Print / PDF
          </button>
          <button onClick={handleWhatsApp} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", borderRadius: 12, background: "#22c55e", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#16a34a"}
            onMouseLeave={e => e.currentTarget.style.background = "#22c55e"}>
            <MessageCircle size={15} /> Send WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
