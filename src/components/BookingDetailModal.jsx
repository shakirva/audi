import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, FileText, IndianRupee, Users, ArrowRight, Settings, CheckCircle2 } from "lucide-react";

export default function BookingDetailModal({ booking, onClose }) {
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#a16207", background: "#fef08a", padding: "6px 12px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a16207" }} />
                {(booking.status || "Draft").toUpperCase()}
              </div>
              <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#0f172a", letterSpacing: "-1px" }}>{booking.eventType}</h2>
              <p style={{ margin: "8px 0 0", fontSize: 16, color: "#64748b", fontWeight: 600 }}>{booking.customerName} • {new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <motion.button onClick={generateReceipt} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "10px 16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, color: "#0f172a", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <FileText size={16} /> Download Receipt
              </motion.button>
              <motion.button whileHover={{ scale: 1.1, background: "#e2e8f0" }} whileTap={{ scale: 0.9 }} onClick={onClose} style={{ background: "#f1f5f9", border: "none", width: 44, height: 44, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </motion.button>
            </div>
          </div>

          {/* AI Recommended Next Action (Framer Motion Animated) */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ background: "linear-gradient(135deg, #0f172a, #334155)", borderRadius: 24, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", boxShadow: "0 10px 30px rgba(15,23,42,0.15)" }}>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.7)", marginBottom: 8, fontWeight: 800 }}>Next Recommended Action</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Receive Advance Payment</div>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ background: "#fff", color: "#0f172a", border: "none", padding: "12px 20px", borderRadius: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              Collect <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>

        {/* ── IOS SETTINGS MENU ── */}
        <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 40, flex: 1 }}>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ display: "flex", flexDirection: "column", gap: 1, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 24, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
            
            {/* Customer Section */}
            <motion.div whileHover={{ background: "#f8fafc" }} onClick={() => setActiveView("customer")} style={{ background: "#fff", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={24} /></div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Customer Profile</div>
                  <div style={{ fontSize: 14, color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={14}/> Completed</div>
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
                  <div style={{ fontSize: 14, color: "#ef4444", fontWeight: 700 }}>₹75,000 Advance Pending</div>
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
                  <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>5 Selected</div>
                </div>
              </div>
              <ChevronRight size={24} color="#cbd5e1" />
            </motion.div>

            {/* Documents Section */}
            <motion.div whileHover={{ background: "#f8fafc" }} onClick={() => setActiveView("documents")} style={{ background: "#fff", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={24} /></div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Documents & Contracts</div>
                  <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>3 Uploaded</div>
                </div>
              </div>
              <ChevronRight size={24} color="#cbd5e1" />
            </motion.div>

          </motion.div>

          {/* ── ACTIVITY TIMELINE ── */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 32px", textTransform: "uppercase", letterSpacing: 1 }}>Activity Log</h3>
            <div style={{ paddingLeft: 16, borderLeft: "2px dashed #cbd5e1", display: "flex", flexDirection: "column", gap: 32 }}>
              {[
                { time: "Today, 10:00 AM", title: "Advance Payment Requested", desc: "System auto-reminder sent to customer via SMS.", color: "#f59e0b" },
                { time: "Yesterday, 2:00 PM", title: "Agreement Signed", desc: "Digital signature verified. Event officially confirmed.", color: "#10b981" },
                { time: "2 Days Ago", title: "Converted to Booking", desc: "Converted from CRM Enquiry ENQ004 by Sarah.", color: "#3b82f6" },
              ].map((evt, i) => (
                <motion.div key={i} whileHover={{ x: 10 }} style={{ position: "relative", cursor: "pointer" }}>
                  <div style={{ position: "absolute", left: -25, top: 2, width: 16, height: 16, borderRadius: "50%", background: evt.color, border: "4px solid #f8fafc", boxShadow: "0 0 0 1px #cbd5e1" }} />
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{evt.time}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{evt.title}</div>
                  <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{evt.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
