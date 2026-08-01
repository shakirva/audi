import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, FileText, IndianRupee, Users, ArrowRight, Settings, CheckCircle2, Pencil, Trash2 } from "lucide-react";

export default function BookingDetailModal({ booking, onClose, onEdit, onDelete }) {
  const [activeView, setActiveView] = useState("overview");

  if (!booking) return null;

  const generateReceipt = () => {
    const receiptHTML = `
      <html>
        <head>
          <title>Receipt - ${booking.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #1B4332; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #1B4332; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; }
            .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .details-col { width: 48%; }
            .details-col p { margin: 8px 0; font-size: 15px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #1B4332; color: #fff; text-align: left; padding: 12px; font-size: 14px; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 15px; }
            .total-row { font-weight: bold; background-color: #f8f9fa; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laural Garden Auditorium</h1>
            <p>Official Booking Receipt</p>
          </div>
          
          <div class="details">
            <div class="details-col">
              <p><strong>Booking ID:</strong> ${booking.bookingId || booking.id || "N/A"}</p>
              <p><strong>Customer Name:</strong> ${booking.customerName || "N/A"}</p>
              <p><strong>Phone:</strong> ${booking.phone || "N/A"}</p>
            </div>
            <div class="details-col" style="text-align: right;">
              <p><strong>Receipt Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Event Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
              <p><strong>Hall:</strong> ${booking.hall || "N/A"} (${booking.session || "Full Day"})</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Financial Details</th>
                <th style="text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Contract Value</td>
                <td style="text-align: right;">₹${(booking.totalAmount || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Advance Payment Received</td>
                <td style="text-align: right;">₹${(booking.advance || 0).toLocaleString()}</td>
              </tr>
              <tr class="total-row">
                <td>Balance Remaining</td>
                <td style="text-align: right; color: #d97706;">₹${((booking.totalAmount || 0) - (booking.advance || 0)).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>Thank you for choosing Laural Garden Auditorium. This is a computer-generated receipt.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const sendPaymentReminder = () => {
    const balance = (Number(booking.totalAmount) || 0) - (Number(booking.advance) || 0) - (Number(booking.depositAmount) || 0);
    const msg = `Hello ${booking.customerName},\n\nThis is a gentle reminder regarding your upcoming event '${booking.eventType}' at Laural Garden Auditorium on ${new Date(booking.date).toLocaleDateString("en-IN")}.\n\nYour current pending balance is ₹${balance.toLocaleString()}.\n\nPlease arrange the payment at your earliest convenience. Thank you!`;
    
    const num = (booking.whatsapp || booking.phone || "").replace(/\D/g, "");
    if (num) {
      const phoneNum = num.length === 10 ? `91${num}` : num;
      const text = encodeURIComponent(msg);
      const waUrl = `https://wa.me/${phoneNum}?text=${text}`;
      window.open(waUrl, "_blank");
    } else {
      alert("No phone number available for this customer.");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end", fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} 
      />

      {/* Slide-out Drawer */}
      <motion.div 
        initial={{ x: "100%", boxShadow: "-20px 0 60px rgba(0,0,0,0)" }}
        animate={{ x: 0, boxShadow: "-20px 0 60px rgba(0,0,0,0.15)" }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        style={{ position: "relative", background: "#f8fafc", width: 600, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column" }}
      >

        {/* ── HEADER ── */}
        <div style={{ padding: "40px 40px 32px", background: "#fff", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, zIndex: 10 }}>
          {activeView !== "overview" && (
            <button onClick={() => setActiveView("overview")} style={{ background: "none", border: "none", padding: 0, color: "#64748b", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", marginBottom: 20 }}>
              <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to Overview
            </button>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#a16207", background: "#fef08a", padding: "6px 12px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a16207" }} />
                {(booking.status || "Draft").toUpperCase()}
              </div>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", wordBreak: "break-word", lineHeight: 1.2 }}>{booking.eventType}</h2>
              <p style={{ margin: "6px 0 0", fontSize: 15, color: "#64748b", fontWeight: 600, wordBreak: "break-word" }}>{booking.customerName} • {new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "50%" }}>

              <motion.button whileHover={{ scale: 1.1, background: "#e2e8f0" }} whileTap={{ scale: 0.9 }} onClick={onClose} style={{ background: "#f1f5f9", border: "none", width: 44, height: 44, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </motion.button>
            </div>
          </div>


        </div>

        {/* ── IOS SETTINGS MENU & VIEWS ── */}
        <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 40, flex: 1 }}>
          
          <AnimatePresence mode="wait">
            {activeView === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 24, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
                  
                  {/* Customer Section */}
                  <motion.div whileHover={{ background: "#f8fafc" }} onClick={() => setActiveView("customer")} style={{ background: "#fff", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={24} /></div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Customer Profile</div>
                        <div style={{ fontSize: 14, color: (booking.phone && booking.address) ? "#10b981" : "#f59e0b", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                          {(booking.phone && booking.address) ? <><CheckCircle2 size={14}/> Completed</> : "Incomplete Info"}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={24} color="#cbd5e1" />
                  </motion.div>

                  {/* Financial Section */}
                  <motion.div whileHover={{ background: "#f8fafc" }} onClick={() => setActiveView("financial")} style={{ background: "#fff", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: "#fef08a", color: "#a16207", display: "flex", alignItems: "center", justifyContent: "center" }}><IndianRupee size={24} /></div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Financial & Ledger</div>
                        <div style={{ fontSize: 14, color: ((booking.totalAmount || 0) - (booking.advance || 0) - (booking.depositAmount || 0)) > 0 ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                          {((booking.totalAmount || 0) - (booking.advance || 0) - (booking.depositAmount || 0)) > 0 
                            ? `₹${((booking.totalAmount || 0) - (booking.advance || 0) - (booking.depositAmount || 0)).toLocaleString()} Balance Pending`
                            : "Fully Paid"
                          }
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={24} color="#cbd5e1" />
                  </motion.div>

                  {/* Services Section */}
                  <motion.div whileHover={{ background: "#f8fafc" }} onClick={() => setActiveView("services")} style={{ background: "#fff", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: "#f3e8ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}><Settings size={24} /></div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Services & Logistics</div>
                        <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>
                          {booking.extraArrangements ? "Custom arrangements added" : "No extra arrangements"}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={24} color="#cbd5e1" />
                  </motion.div>

                  {/* Documents Section Removed */}
                </div>

                {/* ── ACTIVITY TIMELINE ── */}
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 32px", textTransform: "uppercase", letterSpacing: 1 }}>Activity Log</h3>
                  <div style={{ paddingLeft: 16, borderLeft: "2px dashed #cbd5e1", display: "flex", flexDirection: "column", gap: 32 }}>
                    {(() => {
                      const acts = [];
                      // Reverse chronological
                      if (booking.updatedAt && new Date(booking.updatedAt).getTime() - new Date(booking.createdAt).getTime() > 2000) {
                        acts.push({
                          time: new Date(booking.updatedAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
                          title: "Booking Updated",
                          desc: "Details or payment info was modified.",
                          color: "#f59e0b"
                        });
                      }
                      if (Number(booking.advance) > 0 || Number(booking.depositAmount) > 0) {
                        acts.push({
                          time: "After Booking",
                          title: "Advance Received",
                          desc: `₹${(Number(booking.advance || 0) + Number(booking.depositAmount || 0)).toLocaleString()} received (${booking.paymentMethod || "Payment"}).`,
                          color: "#10b981"
                        });
                      }
                      acts.push({
                        time: booking.createdAt ? new Date(booking.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently",
                        title: "Booking Created",
                        desc: `Confirmed booking for ${booking.customerName}.`,
                        color: "#3b82f6"
                      });
                      return acts;
                    })().map((evt, i) => (
                      <motion.div key={i} whileHover={{ x: 10 }} style={{ position: "relative", cursor: "pointer" }}>
                        <div style={{ position: "absolute", left: -25, top: 2, width: 16, height: 16, borderRadius: "50%", background: evt.color, border: "4px solid #f8fafc", boxShadow: "0 0 0 1px #cbd5e1" }} />
                        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{evt.time}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{evt.title}</div>
                        <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{evt.desc}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === "customer" && (
              <motion.div key="customer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 24, borderBottom: "2px solid #e2e8f0", paddingBottom: 16 }}>Customer Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Name</div><div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{booking.customerName || "—"}</div></div>
                  <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Phone</div><div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{booking.phone || "—"}</div></div>
                  <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>WhatsApp</div><div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{booking.whatsapp || "—"}</div></div>
                  <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Address</div><div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{booking.address || "—"}</div></div>
                </div>
                {/* Bride / Groom summary if applicable */}
                {(booking.brideName || booking.groomName) && (
                  <div style={{ marginTop: 32 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Event Parties</h4>
                    {booking.brideName && <div style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 12 }}><strong>Bride:</strong> {booking.brideName} {booking.bridePhone ? `(${booking.bridePhone})` : ""}</div>}
                    {booking.groomName && <div style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}><strong>Groom:</strong> {booking.groomName} {booking.groomPhone ? `(${booking.groomPhone})` : ""}</div>}
                  </div>
                )}
              </motion.div>
            )}

            {activeView === "financial" && (
              <motion.div key="financial" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 24, borderBottom: "2px solid #e2e8f0", paddingBottom: 16 }}>Financial & Ledger</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>Total Amount</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>₹{(booking.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>Advance Paid</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>₹{(booking.advance || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>Security Deposit</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>₹{(booking.depositAmount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ background: ((booking.totalAmount || 0) - (booking.advance || 0) - (booking.depositAmount || 0)) > 0 ? "#fef2f2" : "#f0faf4", padding: 20, borderRadius: 16, border: "1px solid", borderColor: ((booking.totalAmount || 0) - (booking.advance || 0) - (booking.depositAmount || 0)) > 0 ? "#fecaca" : "#bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Balance Pending</span>
                    <span style={{ fontSize: 24, fontWeight: 800, color: ((booking.totalAmount || 0) - (booking.advance || 0) - (booking.depositAmount || 0)) > 0 ? "#ef4444" : "#10b981" }}>₹{((booking.totalAmount || 0) - (booking.advance || 0) - (booking.depositAmount || 0)).toLocaleString()}</span>
                  </div>
                </div>
                
                <div style={{ marginTop: 32 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Payment Info</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Payment Method</div><div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{booking.paymentMethod || "—"}</div></div>
                    <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Received By</div><div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{booking.receivedBy || "—"}</div></div>
                  </div>
                  {booking.paymentRemarks && <div style={{ marginTop: 16, background: "#f8fafc", padding: 16, borderRadius: 12, fontSize: 14, color: "#475569" }}><strong>Remarks: </strong>{booking.paymentRemarks}</div>}
                </div>
              </motion.div>
            )}

            {activeView === "services" && (
              <motion.div key="services" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 24, borderBottom: "2px solid #e2e8f0", paddingBottom: 16 }}>Services & Logistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Event Type</div><div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{booking.eventType || "—"}</div></div>
                  <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Date</div><div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{booking.date ? new Date(booking.date).toLocaleDateString() : "—"}</div></div>
                  <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Hall</div><div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{booking.hall || "—"}</div></div>
                  <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Session</div><div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{booking.session || "—"}</div></div>
                  <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Expected Guests</div><div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{booking.guests || "—"}</div></div>
                </div>
                {booking.facilities && booking.facilities.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Facilities & Add-ons</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {booking.facilities.map((fac, idx) => (
                        <div key={idx} style={{ background: "#f0faf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 600, color: "#166534", fontSize: 14 }}>{fac.name}</span>
                          {fac.price > 0 && <span style={{ fontWeight: 700, color: "#1B4332", fontSize: 13 }}>₹{Number(fac.price).toLocaleString()}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {booking.extraArrangements && (
                  <div style={{ marginTop: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Extra Arrangements</h4>
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: 16, borderRadius: 12, color: "#334155", lineHeight: 1.5 }}>
                      {booking.extraArrangements}
                    </div>
                  </div>
                )}
                {booking.specialInstructions && (
                  <div style={{ marginTop: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Special Instructions</h4>
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: 16, borderRadius: 12, color: "#92400e", lineHeight: 1.5 }}>
                      {booking.specialInstructions}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
