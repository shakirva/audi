import { X, Printer, MessageCircle } from "lucide-react";
import { auditoriumInfo } from "../data/dummyData";
import { useToast } from "./Toast";

/* GST Helper: totalAmount = GST-exclusive base. Grand total = base * 1.18 */
export function calcGST(baseAmount, gstApplicable = true) {
  if (!gstApplicable) return { base: baseAmount, cgst: 0, sgst: 0, grandTotal: baseAmount };
  const cgst = Math.round(baseAmount * 0.09);
  const sgst = Math.round(baseAmount * 0.09);
  return { base: baseAmount, cgst, sgst, grandTotal: baseAmount + cgst + sgst };
}

export default function InvoiceModal({ booking, onClose }) {
  const { addToast } = useToast();
  if (!booking) return null;

  const advance    = Number(booking.advance ?? booking.advancePaid ?? 0);
  const gst        = calcGST(booking.totalAmount, booking.gstApplicable !== false);
  const balance    = gst.grandTotal - advance;
  const hallRental = Math.max(booking.totalAmount - 3500, 0);
  const formattedDate = (() => {
    try { return new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return booking.date; }
  })();
  const invoiceNo = `INV-2026-${booking.id.slice(2)}`;

  const handlePrint = () => {
    const w = window.open("", "_blank");
    const gstBlock = gst.cgst > 0
      ? `<div class="gst-box">
           <div class="gst-row"><span style="font-weight:700;color:#92400e">GST @ 18% (SAC 997212)</span></div>
           <div class="gst-row"><span>CGST @ 9%</span><span style="font-weight:700">Rs.${gst.cgst.toLocaleString()}</span></div>
           <div class="gst-row"><span>SGST @ 9%</span><span style="font-weight:700">Rs.${gst.sgst.toLocaleString()}</span></div>
           <div style="font-size:10px;color:#92400e;margin-top:6px">GSTIN of recipient: ___________________________</div>
         </div>`
      : `<div class="gst-exempt">GST Exempt / Nil Rated</div>`;

    w.document.write(`<!DOCTYPE html><html><head><title>${invoiceNo}</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:'Segoe UI',sans-serif;margin:0;padding:32px;color:#111;font-size:13px;background:#fff}
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #1B4332;margin-bottom:24px}
      .venue-name{font-size:22px;font-weight:800;color:#1B4332;margin:0 0 4px}
      .venue-sub{font-size:11px;color:#6b7280;margin:2px 0}
      .inv-title{font-size:26px;font-weight:800;color:#1B4332;text-align:right}
      .inv-meta{font-size:11px;color:#6b7280;text-align:right;margin-top:4px}
      .bill-row{display:flex;gap:12px;margin-bottom:20px}
      .bill-box{background:#f9fafb;border-radius:10px;padding:14px 18px;flex:1}
      .bill-label{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
      .bill-val{font-size:13px;font-weight:600;color:#111}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th{background:#1B4332;color:#fff;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase}
      td{padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:12px}
      .gst-box{background:#fffbeb;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;margin:12px 0}
      .gst-row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px}
      .gst-exempt{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 16px;margin:12px 0;font-size:12px;color:#15803d}
      .total-row{display:flex;justify-content:flex-end;gap:160px;font-size:13px;margin-bottom:6px}
      .grand{font-size:17px;font-weight:800;color:#1B4332;border-top:2px solid #1B4332;padding-top:10px;margin-top:4px}
      .balance{color:#b91c1c;font-weight:800}.paid{color:#15803d;font-weight:700}
      .footer{margin-top:32px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px}
      .stamp{display:inline-block;border:2px solid #1B4332;border-radius:8px;padding:8px 20px;color:#1B4332;font-weight:700;font-size:14px;margin-top:20px}
      @media print{body{padding:12px}}
    </style></head><body>
    <div class="header">
      <div>
        <div class="venue-name">&#127963; ${auditoriumInfo.name}</div>
        <div class="venue-sub">&#128205; ${auditoriumInfo.location}</div>
        <div class="venue-sub">&#128222; ${auditoriumInfo.phone}</div>
        <div class="venue-sub">GSTIN: ${auditoriumInfo.gstin}</div>
        <div class="venue-sub">SAC Code: 997212 (Renting of Immovable Property)</div>
      </div>
      <div>
        <div class="inv-title">TAX INVOICE</div>
        <div class="inv-meta">Invoice No: <b>${invoiceNo}</b></div>
        <div class="inv-meta">Date: ${formattedDate}</div>
        <div class="inv-meta">Booking ID: ${booking.id}</div>
      </div>
    </div>
    <div class="bill-row">
      <div class="bill-box"><div class="bill-label">Billed To</div><div class="bill-val">${booking.customerName}</div><div style="font-size:11px;color:#6b7280;margin-top:3px">${booking.phone}</div></div>
      <div class="bill-box"><div class="bill-label">Event Type</div><div class="bill-val">${booking.eventType}</div><div style="font-size:11px;color:#6b7280;margin-top:3px">${booking.hall} - ${booking.session}</div></div>
      <div class="bill-box"><div class="bill-label">Event Date</div><div class="bill-val">${formattedDate}</div><div style="font-size:11px;color:#6b7280;margin-top:3px">${booking.guests} guests</div></div>
    </div>
    <table>
      <tr><th>#</th><th>Description</th><th>SAC</th><th>Qty</th><th style="text-align:right">Rate (Rs.)</th><th style="text-align:right">Amount (Rs.)</th></tr>
      <tr><td>1</td><td>Hall Rental - ${booking.hall} (${booking.session})</td><td>997212</td><td>1</td><td style="text-align:right">${hallRental.toLocaleString()}</td><td style="text-align:right">${hallRental.toLocaleString()}</td></tr>
      <tr><td>2</td><td>Extra Chairs (50 nos @ Rs.50)</td><td>997212</td><td>50</td><td style="text-align:right">50</td><td style="text-align:right">2,500</td></tr>
      <tr><td>3</td><td>Generator Backup Charges</td><td>997212</td><td>1</td><td style="text-align:right">1,000</td><td style="text-align:right">1,000</td></tr>
    </table>
    <div class="total-row" style="margin-top:16px"><span style="color:#6b7280">Taxable Value (Base Amount)</span><span>Rs.${gst.base.toLocaleString()}</span></div>
    ${gstBlock}
    <div class="total-row grand"><span>GRAND TOTAL</span><span>Rs.${gst.grandTotal.toLocaleString()}</span></div>
    <div class="total-row paid" style="margin-top:8px"><span>Advance Received</span><span>- Rs.${advance.toLocaleString()}</span></div>
    <div class="total-row balance" style="border-top:1px dashed #e5e7eb;padding-top:8px;margin-top:4px"><span>BALANCE DUE</span><span>Rs.${balance.toLocaleString()}</span></div>
    <div class="footer">
      <div>Thank you for choosing ${auditoriumInfo.name}!</div>
      <div style="margin-top:4px">Computer-generated Tax Invoice. No signature required. Subject to Taliparamba jurisdiction.</div>
      <div class="stamp">${booking.status}</div>
    </div>
    <script>window.onload=function(){window.print();}</` + `script>
    </body></html>`);
    w.document.close();
  };

  const handleWhatsApp = () => {
    const gstLine = gst.cgst > 0
      ? `\nCGST (9%): Rs.${gst.cgst.toLocaleString()}\nSGST (9%): Rs.${gst.sgst.toLocaleString()}\nGrand Total (incl. GST 18%): Rs.${gst.grandTotal.toLocaleString()}`
      : "\nGST Exempt";
    const msg = encodeURIComponent(
      `Dear ${booking.customerName},\n\nTax Invoice from ${auditoriumInfo.name}:\n\nInvoice: ${invoiceNo}\nEvent: ${booking.eventType} - ${formattedDate}\nHall: ${booking.hall} (${booking.session})\nBase Amount: Rs.${gst.base.toLocaleString()}${gstLine}\nAdvance Paid: Rs.${advance.toLocaleString()}\nBalance Due: Rs.${balance.toLocaleString()}\n\nThank you! - ${auditoriumInfo.name}`
    );
    window.open(`https://wa.me/91${booking.phone}?text=${msg}`, "_blank");
    addToast("Tax Invoice shared on WhatsApp! 📱", "success");
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.25)", width: "100%", maxWidth: 540, maxHeight: "92vh", overflowY: "auto", fontFamily: "'DM Sans', sans-serif" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "#0D2418", borderRadius: "20px 20px 0 0" }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>Tax Invoice</h3>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{invoiceNo} · GSTIN: {auditoriumInfo.gstin}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {booking.gstApplicable !== false
              ? <span style={{ fontSize: 10, fontWeight: 700, background: "#fffbeb", color: "#92400e", padding: "3px 10px", borderRadius: 12, border: "1px solid #fed7aa" }}>GST 18%</span>
              : <span style={{ fontSize: 10, fontWeight: 700, background: "#f0fdf4", color: "#15803d", padding: "3px 10px", borderRadius: 12, border: "1px solid #bbf7d0" }}>GST Exempt</span>
            }
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div style={{ textAlign: "center", paddingBottom: 14, borderBottom: "2px dashed #e5e7eb", marginBottom: 14 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#1B4332", fontFamily: "'Playfair Display', serif", margin: 0 }}>🏛️ {auditoriumInfo.name}</p>
            <p style={{ fontSize: 11, color: "#6b7280", margin: "3px 0 0" }}>{auditoriumInfo.location}</p>
            <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0" }}>Ph: {auditoriumInfo.phone} · GSTIN: {auditoriumInfo.gstin}</p>
            <p style={{ fontSize: 10, color: "#9ca3af", margin: "2px 0 0" }}>SAC: 997212 — Renting of Immovable Property</p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 12 }}>
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

          <div style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 11 }}>
            <p style={{ fontWeight: 700, color: "#374151", marginBottom: 6 }}>Event Details</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 0", color: "#6b7280" }}>
              <span>Event Type:</span><span style={{ fontWeight: 600, color: "#111" }}>{booking.eventType}</span>
              <span>Hall:</span><span style={{ fontWeight: 600, color: "#111" }}>{booking.hall}</span>
              <span>Date:</span><span style={{ fontWeight: 600, color: "#111" }}>{formattedDate}</span>
              <span>Session:</span><span style={{ fontWeight: 600, color: "#111" }}>{booking.session}</span>
              <span>Guests:</span><span style={{ fontWeight: 600, color: "#111" }}>{booking.guests}</span>
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: 12, marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Line Items</p>
            {[
              { desc: `Hall Rental (${booking.hall}) — ${booking.session}`, amt: hallRental },
              { desc: "Extra Chairs (50 nos @ ₹50)", amt: 2500 },
              { desc: "Generator Backup", amt: 1000 },
            ].map(item => (
              <div key={item.desc} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 12, color: "#374151" }}>
                <span>{item.desc}</span>
                <span style={{ fontWeight: 600 }}>₹{item.amt.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: "#6b7280" }}>
              <span>Taxable Value (Base)</span>
              <span style={{ fontWeight: 600, color: "#111" }}>₹{gst.base.toLocaleString()}</span>
            </div>

            {booking.gstApplicable !== false ? (
              <div style={{ background: "#fffbeb", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: "#92400e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⚡ GST @ 18% — SAC 997212</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: "#6b7280" }}>CGST @ 9%</span>
                  <span style={{ fontWeight: 700, color: "#92400e" }}>₹{gst.cgst.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#6b7280" }}>SGST @ 9%</span>
                  <span style={{ fontWeight: 700, color: "#92400e" }}>₹{gst.sgst.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                <p style={{ fontSize: 12, color: "#15803d", fontWeight: 600, margin: 0 }}>✅ GST Exempt / Nil Rated (0%)</p>
                <p style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>No GST applicable on this booking.</p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#1B4332", borderTop: "2px solid #1B4332", paddingTop: 10, marginBottom: 8 }}>
              <span>GRAND TOTAL</span><span>₹{gst.grandTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#15803d", marginBottom: 6 }}>
              <span>Advance Received</span><span style={{ fontWeight: 700 }}>– ₹{advance.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: balance > 0 ? "#b91c1c" : "#15803d", borderTop: "1px dashed #e5e7eb", paddingTop: 8 }}>
              <span>{balance > 0 ? "BALANCE DUE" : "FULLY PAID"}</span>
              <span>₹{balance.toLocaleString()}</span>
            </div>
          </div>

          <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 14, textAlign: "center" }}>
            Computer-generated Tax Invoice · No signature required · Taliparamba Jurisdiction
          </p>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 10 }}>
          <button onClick={handlePrint}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <Printer size={15} /> Print / PDF
          </button>
          <button onClick={handleWhatsApp}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", borderRadius: 12, background: "#22c55e", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#16a34a"}
            onMouseLeave={e => e.currentTarget.style.background = "#22c55e"}>
            <MessageCircle size={15} /> Send WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
