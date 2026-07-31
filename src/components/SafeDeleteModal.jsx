import React, { useState, useEffect } from "react";
import { AlertTriangle, X, Loader, ShieldAlert, IndianRupee, FileText, Banknote, Receipt, Briefcase, ScrollText, Trash2, Ban } from "lucide-react";
import { deleteChecksAPI, bookingsAPI, customersAPI, enquiriesAPI } from "../services/api";

const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modal = { background: "#fff", borderRadius: 20, width: "95%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" };
const dangerBanner = { background: "linear-gradient(135deg,#fef2f2,#fff1f2)", borderBottom: "1px solid #fecaca", padding: "24px 28px", borderRadius: "20px 20px 0 0", display: "flex", gap: 16, alignItems: "flex-start" };
const sectionTitle = { fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 };
const impactRow = { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13, fontWeight: 600 };
const btnBase = { padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", transition: "all 0.15s" };

export default function SafeDeleteModal({ type, id, name, open, onClose, onDeleted, addToast }) {
  const [loading, setLoading] = useState(true);
  const [checkData, setCheckData] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1=impact, 2=confirmation, 3=reason
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !id) return;
    setLoading(true); setError(null); setStep(1); setReason(""); setConfirmText("");
    const fetchCheck = async () => {
      try {
        const res = type === "booking" ? await deleteChecksAPI.booking(id)
          : type === "customer" ? await deleteChecksAPI.customer(id)
          : await deleteChecksAPI.enquiry(id);
        setCheckData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to check dependencies");
      } finally {
        setLoading(false);
      }
    };
    fetchCheck();
  }, [open, id, type]);

  if (!open) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (type === "booking") await bookingsAPI.remove(id);
      else if (type === "customer") await customersAPI.remove(id);
      else await enquiriesAPI.remove(id);
      addToast?.(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`, "success");
      onDeleted?.();
      onClose();
    } catch (err) {
      addToast?.(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── BOOKING ──
  const renderBookingImpact = () => {
    const d = checkData;
    if (!d) return null;
    const { booking, isConfirmed, financial, related } = d;
    const hasFinancial = financial.totalPaid > 0 || financial.totalExpenses > 0 || financial.journalCount > 0;

    // BLOCK deletion for confirmed bookings with payments
    if (isConfirmed && financial.totalPaid > 0 && step === 1) {
      return (
        <div style={{ padding: 28 }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <Ban size={20} color="#dc2626" />
              <span style={{ fontSize: 15, fontWeight: 800, color: "#dc2626" }}>Deletion Blocked</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 }}>
              This booking is <strong>{booking.status}</strong> with <strong>₹{financial.totalPaid.toLocaleString()}</strong> already collected in payments. 
              Deleting it directly would corrupt your accounting records (Cash Book, Bank Book, Journal Entries, Vouchers, and Receipts).
            </p>
          </div>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#92400e", lineHeight: 1.6, fontWeight: 600 }}>
              💡 <strong>Instead of deleting,</strong> please change the booking status to <strong>"Cancelled"</strong> from the Edit screen. 
              This preserves all financial audit trails. If you still need to permanently remove it, you must first:
            </p>
            <ul style={{ margin: "10px 0 0", paddingLeft: 20, fontSize: 13, color: "#92400e", lineHeight: 1.8 }}>
              <li>Process refunds for all {financial.payments.length} payment(s)</li>
              <li>Reverse {financial.journalCount} journal entries</li>
              {financial.totalExpenses > 0 && <li>Handle ₹{financial.totalExpenses.toLocaleString()} in linked expenses</li>}
              {related.hasAgreement && <li>Cancel the signed agreement ({related.agreementStatus})</li>}
              {related.hasJob && <li>Close the linked job ({related.jobStatus})</li>}
            </ul>
          </div>
          <button onClick={onClose} style={{ ...btnBase, width: "100%", background: "#f1f5f9", color: "#374151" }}>
            Go Back — I'll Cancel the Booking Instead
          </button>
        </div>
      );
    }

    // For Draft/non-financial bookings, show impact and allow
    return (
      <div style={{ padding: 28 }}>
        {step === 1 && (
          <>
            <div style={sectionTitle}><IndianRupee size={13} /> Financial Impact</div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={impactRow}><span style={{ color: "#64748b" }}>Total Amount</span><span>₹{(booking.totalAmount || 0).toLocaleString()}</span></div>
              <div style={impactRow}><span style={{ color: "#64748b" }}>Payments Collected</span><span style={{ color: financial.totalPaid > 0 ? "#dc2626" : "#10b981" }}>₹{financial.totalPaid.toLocaleString()}</span></div>
              <div style={impactRow}><span style={{ color: "#64748b" }}>Linked Expenses</span><span>₹{financial.totalExpenses.toLocaleString()}</span></div>
              <div style={{ ...impactRow, borderBottom: "none" }}><span style={{ color: "#64748b" }}>Accounting Entries</span><span>{financial.journalCount} Journals · {financial.voucherCount} Vouchers</span></div>
            </div>
            {(related.hasAgreement || related.hasJob) && (
              <>
                <div style={sectionTitle}><Briefcase size={13} /> Linked Records</div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  {related.hasAgreement && <div style={impactRow}><span style={{ color: "#64748b" }}>Agreement</span><span>{related.agreementStatus}</span></div>}
                  {related.hasJob && <div style={{ ...impactRow, borderBottom: "none" }}><span style={{ color: "#64748b" }}>Job</span><span>{related.jobStatus}</span></div>}
                </div>
              </>
            )}
            {hasFinancial && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#991b1b", lineHeight: 1.6, fontWeight: 600 }}>
                  ⚠️ All the above records will be permanently removed from your accounts. This cannot be undone.
                </p>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ ...btnBase, flex: 1, background: "#f1f5f9", color: "#374151" }}>Cancel</button>
              <button onClick={() => setStep(2)} style={{ ...btnBase, flex: 1, background: "#dc2626", color: "#fff" }}>
                <AlertTriangle size={15} /> I Understand, Continue
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div style={sectionTitle}><ScrollText size={13} /> Reason for Deletion</div>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Please provide a reason for deleting this booking (required)..."
              rows={3}
              style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 500, resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 16 }}
            />
            <div style={sectionTitle}><ShieldAlert size={13} /> Type Confirmation</div>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
              Type <strong style={{ color: "#dc2626" }}>DELETE {booking.bookingId}</strong> to confirm:
            </p>
            <input
              value={confirmText} onChange={e => setConfirmText(e.target.value)}
              placeholder={`DELETE ${booking.bookingId}`}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 700, fontFamily: "monospace", outline: "none", boxSizing: "border-box", marginBottom: 20 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ ...btnBase, flex: 1, background: "#f1f5f9", color: "#374151" }}>Back</button>
              <button
                onClick={handleDelete}
                disabled={!reason.trim() || confirmText !== `DELETE ${booking.bookingId}` || deleting}
                style={{ ...btnBase, flex: 1, background: (!reason.trim() || confirmText !== `DELETE ${booking.bookingId}`) ? "#fca5a5" : "#dc2626", color: "#fff", opacity: (!reason.trim() || confirmText !== `DELETE ${booking.bookingId}`) ? 0.6 : 1 }}
              >
                {deleting ? <Loader size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── CUSTOMER ──
  const renderCustomerImpact = () => {
    const d = checkData;
    if (!d) return null;

    if (d.hasActiveBookings) {
      return (
        <div style={{ padding: 28 }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <Ban size={20} color="#dc2626" />
              <span style={{ fontSize: 15, fontWeight: 800, color: "#dc2626" }}>Deletion Blocked</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 }}>
              <strong>{d.customer.name}</strong> has <strong>{d.activeBookingCount} active booking(s)</strong>. 
              You cannot delete a customer while they have ongoing bookings. Please cancel or close all bookings first.
            </p>
          </div>
          <div style={sectionTitle}><Briefcase size={13} /> Active Bookings</div>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            {d.bookings.filter(b => !["Cancelled", "Closed"].includes(b.status)).map(b => (
              <div key={b.bookingId} style={impactRow}>
                <span style={{ color: "#1B4332", fontWeight: 700 }}>{b.bookingId}</span>
                <span>{b.eventType} — {b.status}</span>
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{ ...btnBase, width: "100%", background: "#f1f5f9", color: "#374151" }}>Go Back</button>
        </div>
      );
    }

    return (
      <div style={{ padding: 28 }}>
        {step === 1 && (
          <>
            <div style={sectionTitle}><IndianRupee size={13} /> Customer Summary</div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={impactRow}><span style={{ color: "#64748b" }}>Total Bookings</span><span>{d.totalBookings}</span></div>
              <div style={impactRow}><span style={{ color: "#64748b" }}>Total Enquiries</span><span>{d.totalEnquiries}</span></div>
              <div style={impactRow}><span style={{ color: "#64748b" }}>Total Paid</span><span>₹{d.totalPaid.toLocaleString()}</span></div>
              <div style={{ ...impactRow, borderBottom: "none" }}><span style={{ color: "#64748b" }}>Lifetime Value</span><span style={{ color: "#f97316", fontWeight: 800 }}>₹{d.totalBookingValue.toLocaleString()}</span></div>
            </div>
            {d.totalPaid > 0 && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.6, fontWeight: 600 }}>
                  ⚠️ This customer has ₹{d.totalPaid.toLocaleString()} in payment history. Deleting will remove their profile but bookings will be preserved.
                </p>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ ...btnBase, flex: 1, background: "#f1f5f9", color: "#374151" }}>Cancel</button>
              <button onClick={() => setStep(2)} style={{ ...btnBase, flex: 1, background: "#dc2626", color: "#fff" }}>
                <AlertTriangle size={15} /> Continue
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div style={sectionTitle}><ShieldAlert size={13} /> Confirm Deletion</div>
            <p style={{ fontSize: 13, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
              Type <strong style={{ color: "#dc2626" }}>DELETE</strong> to permanently remove <strong>{d.customer.name}</strong>:
            </p>
            <input
              value={confirmText} onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 700, fontFamily: "monospace", outline: "none", boxSizing: "border-box", marginBottom: 20 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ ...btnBase, flex: 1, background: "#f1f5f9", color: "#374151" }}>Back</button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || deleting}
                style={{ ...btnBase, flex: 1, background: confirmText !== "DELETE" ? "#fca5a5" : "#dc2626", color: "#fff", opacity: confirmText !== "DELETE" ? 0.6 : 1 }}
              >
                {deleting ? <Loader size={15} /> : <Trash2 size={15} />}
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── ENQUIRY ──
  const renderEnquiryImpact = () => {
    const d = checkData;
    if (!d) return null;

    if (d.isConverted) {
      return (
        <div style={{ padding: 28 }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <Ban size={20} color="#dc2626" />
              <span style={{ fontSize: 15, fontWeight: 800, color: "#dc2626" }}>Deletion Blocked</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 }}>
              This enquiry has been <strong>converted to a booking</strong>{d.linkedBooking ? ` (${d.linkedBooking.bookingId})` : ""}. 
              You cannot delete an enquiry that has already been converted. If you need to cancel, please manage the linked booking instead.
            </p>
          </div>
          {d.linkedBooking && (
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={impactRow}><span style={{ color: "#64748b" }}>Linked Booking</span><span style={{ fontWeight: 800, color: "#1B4332" }}>{d.linkedBooking.bookingId}</span></div>
              <div style={impactRow}><span style={{ color: "#64748b" }}>Status</span><span>{d.linkedBooking.status}</span></div>
              <div style={{ ...impactRow, borderBottom: "none" }}><span style={{ color: "#64748b" }}>Amount</span><span>₹{(d.linkedBooking.totalAmount || 0).toLocaleString()}</span></div>
            </div>
          )}
          <button onClick={onClose} style={{ ...btnBase, width: "100%", background: "#f1f5f9", color: "#374151" }}>Go Back</button>
        </div>
      );
    }

    // Non-converted enquiries — simple confirm
    return (
      <div style={{ padding: 28 }}>
        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 20 }}>
          This enquiry (<strong>{d.enquiry.enquiryNumber || `#${d.enquiry.id}`}</strong>) is in <strong>{d.enquiry.status}</strong> stage and has no linked bookings. 
          It's safe to delete, but this action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...btnBase, flex: 1, background: "#f1f5f9", color: "#374151" }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} style={{ ...btnBase, flex: 1, background: "#dc2626", color: "#fff" }}>
            {deleting ? <Loader size={15} /> : <Trash2 size={15} />}
            {deleting ? "Deleting..." : "Delete Enquiry"}
          </button>
        </div>
      </div>
    );
  };

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={dangerBanner}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={22} color="#dc2626" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#991b1b" }}>Delete {typeLabel}?</h3>
            <p style={{ margin: 0, fontSize: 13, color: "#7f1d1d", fontWeight: 500 }}>
              {name || "This record"} — Review the impact before proceeding
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Loader size={28} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#94a3b8", fontSize: 14, fontWeight: 600, marginTop: 12 }}>Checking dependencies...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: 28 }}>
            <div style={{ background: "#fef2f2", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <p style={{ color: "#dc2626", fontWeight: 600 }}>{error}</p>
              <button onClick={onClose} style={{ ...btnBase, margin: "12px auto 0", background: "#f1f5f9", color: "#374151" }}>Close</button>
            </div>
          </div>
        ) : (
          type === "booking" ? renderBookingImpact() :
          type === "customer" ? renderCustomerImpact() :
          renderEnquiryImpact()
        )}
      </div>
    </div>
  );
}
