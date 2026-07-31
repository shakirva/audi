import React, { useState, useEffect } from "react";
import { AlertTriangle, X, Loader, ShieldAlert, IndianRupee, Trash2, Ban, Briefcase, ScrollText, Wallet, FileX, Users } from "lucide-react";
import { deleteChecksAPI, bookingsAPI, customersAPI, enquiriesAPI } from "../services/api";

const ov = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const md = { background: "#fff", borderRadius: 20, width: "95%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" };
const hd = { background: "linear-gradient(135deg,#fef2f2,#fff1f2)", borderBottom: "1px solid #fecaca", padding: "24px 28px", borderRadius: "20px 20px 0 0", display: "flex", gap: 16, alignItems: "flex-start" };
const st = { fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 };
const ir = { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13, fontWeight: 600 };
const bb = { padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", transition: "all 0.15s" };
const optBtn = (selected) => ({
  padding: "12px 16px", borderRadius: 12, cursor: "pointer", width: "100%", textAlign: "left",
  border: `2px solid ${selected ? "#1B4332" : "#e5e7eb"}`, background: selected ? "#f0fdf4" : "#fff",
  fontWeight: 700, fontSize: 13, color: selected ? "#1B4332" : "#374151", transition: "all 0.15s", marginBottom: 8,
});

export default function SafeDeleteModal({ type, id, name, open, onClose, onDeleted, addToast }) {
  const [loading, setLoading] = useState(true);
  const [checkData, setCheckData] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [refundAction, setRefundAction] = useState("");
  const [refundAccount, setRefundAccount] = useState("");
  const [expenseAction, setExpenseAction] = useState("");
  const [enquiryAction, setEnquiryAction] = useState(""); // "revert" | "delete"
  const [customerAction, setCustomerAction] = useState(""); // "keep" | "delete"
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !id) return;
    setLoading(true); setError(null); setStep(1); setReason(""); setConfirmText("");
    setRefundAction(""); setRefundAccount(""); setExpenseAction("");
    setEnquiryAction(""); setCustomerAction("");
    const fetch = async () => {
      try {
        const res = type === "booking" ? await deleteChecksAPI.booking(id)
          : type === "customer" ? await deleteChecksAPI.customer(id)
          : await deleteChecksAPI.enquiry(id);
        setCheckData(res.data.data);
      } catch (err) { setError(err.response?.data?.message || "Failed to check dependencies"); }
      finally { setLoading(false); }
    };
    fetch();
  }, [open, id, type]);

  if (!open) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (type === "booking") {
        const d = checkData;
        const hasPayments = d?.financial?.totalPaid > 0;
        if (hasPayments || d?.financial?.totalExpenses > 0) {
          await bookingsAPI.safeDelete(id, { reason, refundAction, refundAccount, expenseAction, enquiryAction, customerAction });
        } else {
          await bookingsAPI.safeDelete(id, { reason, refundAction: "none", expenseAction: "delete", enquiryAction, customerAction });
        }
      } else if (type === "customer") await customersAPI.remove(id);
      else await enquiriesAPI.remove(id);
      addToast?.(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`, "success");
      onDeleted?.(); onClose();
    } catch (err) { addToast?.(err.response?.data?.message || "Delete failed", "error"); }
    finally { setDeleting(false); }
  };

  // ── Calculate total steps for booking ──
  const getActiveSteps = () => {
    if (!checkData || type !== "booking") return [1, 5];
    const { financial, related } = checkData;
    const s = [1, 2];
    if (financial.totalPaid > 0 && refundAction === "refund") s.push(3);
    s.push(4);
    if (related.hasEnquiry || related.hasCustomer) s.push('crm');
    s.push('warning');
    s.push(5);
    return s;
  };

  const activeSteps = getActiveSteps();
  const currentStepNum = activeSteps.indexOf(step) + 1;
  const totalSteps = activeSteps.length;

  // ── BOOKING FLOW ──
  const renderBooking = () => {
    const d = checkData;
    if (!d) return null;
    const { booking, financial, related } = d;
    const hasPayments = financial.totalPaid > 0;
    const hasExpenses = financial.totalExpenses > 0;

    // Step 1: Impact overview
    if (step === 1) return (
      <div style={{ padding: 28 }}>
        <div style={st}><Briefcase size={13} /> Financial Impact Summary</div>
        <div style={{ background: "#f8fafc", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
          <div style={ir}><span>Booking Amount</span><span style={{ fontWeight: 800 }}>₹{booking.totalAmount?.toLocaleString() || 0}</span></div>
          <div style={ir}><span>Payments Collected</span><span style={{ color: hasPayments ? "#059669" : "#64748b" }}>₹{financial.totalPaid.toLocaleString()}</span></div>
          <div style={ir}><span>Linked Expenses</span><span style={{ color: hasExpenses ? "#dc2626" : "#64748b" }}>₹{financial.totalExpenses.toLocaleString()}</span></div>
          <div style={{ ...ir, borderBottom: "none", paddingBottom: 0 }}>
            <span>Accounting Entries</span>
            <span>{financial.journalCount} Journals · {financial.voucherCount} Vouchers</span>
          </div>
        </div>
        {(related.hasAgreement || related.hasJob) && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#92400e", fontWeight: 600 }}>
              ⚠️ {related.hasAgreement ? `Agreement (${related.agreementStatus}) ` : ""}{related.hasJob ? `Job (${related.jobStatus})` : ""} will also be removed.
            </p>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...bb, flex: 1, background: "#f1f5f9", color: "#374151" }}>Cancel</button>
          <button onClick={() => setStep(2)} style={{ ...bb, flex: 1, background: "#dc2626", color: "#fff" }}>
            <AlertTriangle size={15} /> I Understand, Continue
          </button>
        </div>
      </div>
    );

    // Step 2: Refund question (always show for friction)
    if (step === 2) return (
      <div style={{ padding: 28 }}>
        <div style={st}><Wallet size={13} /> Advance / Payment Handling</div>
        {hasPayments ? (
          <>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
              <strong>₹{financial.totalPaid.toLocaleString()}</strong> has been collected in {financial.payments.length} payment(s). What should happen to this money?
            </p>
            <button style={optBtn(refundAction === "refund")} onClick={() => setRefundAction("refund")}>
              💸 Refund to Customer — Record a refund entry in your Cash/Bank Book
            </button>
            <button style={optBtn(refundAction === "writeOff")} onClick={() => setRefundAction("writeOff")}>
              ❌ Write Off (No Refund) — Money stays in your account, no refund processed
            </button>
            <button style={optBtn(refundAction === "alreadyRefunded")} onClick={() => setRefundAction("alreadyRefunded")}>
              ✅ Already Refunded Externally — Refund was done outside this system
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
              <strong>₹0</strong> has been collected for this booking. No refund or payment handling is required.
            </p>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 14, borderRadius: 12, color: "#166534", fontSize: 13, fontWeight: 600 }}>
              ✓ Cleared to proceed
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={() => setStep(1)} style={{ ...bb, flex: 1, background: "#f1f5f9", color: "#374151" }}>Back</button>
          <button onClick={() => setStep(hasPayments && refundAction === "refund" ? 3 : 4)} disabled={hasPayments && !refundAction}
            style={{ ...bb, flex: 1, background: (!hasPayments || refundAction) ? "#1B4332" : "#94a3b8", color: "#fff", opacity: (!hasPayments || refundAction) ? 1 : 0.5 }}>
            Next →
          </button>
        </div>
      </div>
    );

    // Step 3: Refund account (only if refund selected)
    if (step === 3) return (
      <div style={{ padding: 28 }}>
        <div style={st}><Wallet size={13} /> Refund Account</div>
        <p style={{ fontSize: 14, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
          Which account should the <strong>₹{financial.totalPaid.toLocaleString()}</strong> refund be deducted from?
        </p>
        <button style={optBtn(refundAccount === "Cash")} onClick={() => setRefundAccount("Cash")}>
          💵 Cash — Deduct from Cash Book
        </button>
        <button style={optBtn(refundAccount === "Bank")} onClick={() => setRefundAccount("Bank")}>
          🏦 Bank Account — Deduct from Bank Book
        </button>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={() => setStep(2)} style={{ ...bb, flex: 1, background: "#f1f5f9", color: "#374151" }}>Back</button>
          <button onClick={() => setStep(4)} disabled={!refundAccount}
            style={{ ...bb, flex: 1, background: refundAccount ? "#1B4332" : "#94a3b8", color: "#fff", opacity: refundAccount ? 1 : 0.5 }}>
            Next →
          </button>
        </div>
      </div>
    );

    // Step 4: Expense handling (always show for friction)
    if (step === 4) return (
      <div style={{ padding: 28 }}>
        <div style={st}><FileX size={13} /> Expense Handling</div>
        {hasExpenses ? (
          <>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
              <strong>₹{financial.totalExpenses.toLocaleString()}</strong> in expenses are linked to this booking ({financial.expenses.length} item{financial.expenses.length > 1 ? "s" : ""}). What should happen?
            </p>
            {financial.expenses.map((e, i) => (
              <div key={i} style={{ ...ir, fontSize: 12, color: "#64748b" }}>
                <span>{e.category || "Expense"} — {e.description || ""}</span><span>₹{e.amount.toLocaleString()}</span>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <button style={optBtn(expenseAction === "delete")} onClick={() => setExpenseAction("delete")}>
                🗑️ Delete all linked expenses — Remove them from your expense records
              </button>
              <button style={optBtn(expenseAction === "unlink")} onClick={() => setExpenseAction("unlink")}>
                🔗 Keep but unlink — Expenses stay in your records as general expenses
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
              <strong>₹0</strong> expenses are linked to this booking. No expense handling is required.
            </p>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 14, borderRadius: 12, color: "#166534", fontSize: 13, fontWeight: 600 }}>
              ✓ Cleared to proceed
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={() => setStep(hasPayments && refundAction === "refund" ? 3 : 2)} style={{ ...bb, flex: 1, background: "#f1f5f9", color: "#374151" }}>Back</button>
          <button onClick={() => setStep(related.hasEnquiry || related.hasCustomer ? 'crm' : 'warning')} disabled={hasExpenses && !expenseAction}
            style={{ ...bb, flex: 1, background: (!hasExpenses || expenseAction) ? "#1B4332" : "#94a3b8", color: "#fff", opacity: (!hasExpenses || expenseAction) ? 1 : 0.5 }}>
            Next →
          </button>
        </div>
      </div>
    );

    // Step CRM: CRM Data handling
    if (step === 'crm') return (
      <div style={{ padding: 28 }}>
        <div style={st}><Users size={13} /> CRM Data Handling</div>
        <p style={{ fontSize: 14, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
          This booking is linked to CRM records. What should happen to them?
        </p>

        {related.hasEnquiry && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Enquiry Record:</div>
            <button style={optBtn(enquiryAction === "revert")} onClick={() => setEnquiryAction("revert")}>
              ↩️ Revert to "Interested" — Keep the enquiry active in your pipeline
            </button>
            <button style={optBtn(enquiryAction === "delete")} onClick={() => setEnquiryAction("delete")}>
              🗑️ Delete Enquiry — Remove the enquiry entirely
            </button>
          </div>
        )}

        {related.hasCustomer && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Customer ({related.customerName}):</div>
            <button style={optBtn(customerAction === "keep")} onClick={() => setCustomerAction("keep")}>
              👤 Keep Customer — They stay in your directory
            </button>
            <button style={optBtn(customerAction === "delete")} onClick={() => setCustomerAction("delete")}>
              🗑️ Delete Customer — Remove customer (if no other bookings)
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={() => setStep(4)} style={{ ...bb, flex: 1, background: "#f1f5f9", color: "#374151" }}>Back</button>
          <button onClick={() => setStep('warning')} disabled={(related.hasEnquiry && !enquiryAction) || (related.hasCustomer && !customerAction)}
            style={{ ...bb, flex: 1, background: ((related.hasEnquiry && !enquiryAction) || (related.hasCustomer && !customerAction)) ? "#94a3b8" : "#1B4332", color: "#fff", opacity: ((related.hasEnquiry && !enquiryAction) || (related.hasCustomer && !customerAction)) ? 0.5 : 1 }}>
            Next →
          </button>
        </div>
      </div>
    );

    // Step warning: Friction step to discourage deletion
    if (step === 'warning') return (
      <div style={{ padding: 28 }}>
        <div style={st}><AlertTriangle size={13} /> Final Warning</div>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 14, color: "#991b1b", lineHeight: 1.6, fontWeight: 600 }}>
            You are about to permanently delete a <strong>{booking.status}</strong> booking.
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 }}>
            This action is entirely irreversible and all related financial, CRM, and accounting data will be permanently destroyed.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setStep((related.hasEnquiry || related.hasCustomer) ? 'crm' : 4)} style={{ ...bb, flex: 1, background: "#f1f5f9", color: "#374151" }}>Back</button>
          <button onClick={() => setStep(5)} style={{ ...bb, flex: 1, background: "#dc2626", color: "#fff" }}>
            I understand the risks →
          </button>
        </div>
      </div>
    );

    // Step 5: Final — reason + type confirm
    if (step === 5) return (
      <div style={{ padding: 28 }}>
        <div style={st}><ScrollText size={13} /> Reason for Deletion</div>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this booking being deleted? (required)" rows={3}
          style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 500, resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 16 }} />

        {/* Summary of choices */}
        {(hasPayments || hasExpenses) && (
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", marginBottom: 8 }}>YOUR SELECTIONS</div>
            {hasPayments && <div style={{ fontSize: 12, color: "#374151", marginBottom: 4, fontWeight: 600 }}>
              💰 Payments (₹{financial.totalPaid.toLocaleString()}): {refundAction === "refund" ? `Refund via ${refundAccount}` : refundAction === "writeOff" ? "Write off" : "Already refunded"}
            </div>}
            {hasExpenses && <div style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>
              📦 Expenses (₹{financial.totalExpenses.toLocaleString()}): {expenseAction === "delete" ? "Delete" : "Keep & unlink"}
            </div>}
          </div>
        )}

        <div style={st}><ShieldAlert size={13} /> Type Confirmation</div>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
          Type <strong style={{ color: "#dc2626" }}>DELETE {booking.bookingId}</strong> to confirm:
        </p>
        <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={`DELETE ${booking.bookingId}`}
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 700, fontFamily: "monospace", outline: "none", boxSizing: "border-box", marginBottom: 20 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setStep('warning')} style={{ ...bb, flex: 1, background: "#f1f5f9", color: "#374151" }}>Back</button>
          <button onClick={handleDelete}
            disabled={!reason.trim() || confirmText !== `DELETE ${booking.bookingId}` || deleting}
            style={{ ...bb, flex: 1, background: (!reason.trim() || confirmText !== `DELETE ${booking.bookingId}`) ? "#fca5a5" : "#dc2626", color: "#fff", opacity: (!reason.trim() || confirmText !== `DELETE ${booking.bookingId}`) ? 0.6 : 1 }}>
            {deleting ? <Loader size={15} /> : <Trash2 size={15} />}
            {deleting ? "Deleting..." : "Permanently Delete"}
          </button>
        </div>
      </div>
    );

    // Fallback: skip to final
    return setStep(5) || null;
  };

  // ── CUSTOMER FLOW ──
  const renderCustomer = () => {
    const d = checkData;
    if (!d) return null;
    if (d.hasActiveBookings) return (
      <div style={{ padding: 28 }}>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}><Ban size={20} color="#dc2626" /><span style={{ fontSize: 15, fontWeight: 800, color: "#dc2626" }}>Deletion Blocked</span></div>
          <p style={{ margin: 0, fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 }}>
            <strong>{d.customer.name}</strong> has <strong>{d.activeBookingCount} active booking(s)</strong>. Cancel or close all bookings first.
          </p>
        </div>
        <button onClick={onClose} style={{ ...bb, width: "100%", background: "#f1f5f9", color: "#374151" }}>Go Back</button>
      </div>
    );
    return (
      <div style={{ padding: 28 }}>
        {step === 1 && (<>
          <div style={st}><IndianRupee size={13} /> Customer Summary</div>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={ir}><span style={{ color: "#64748b" }}>Total Bookings</span><span>{d.totalBookings}</span></div>
            <div style={ir}><span style={{ color: "#64748b" }}>Total Paid</span><span>₹{d.totalPaid.toLocaleString()}</span></div>
            <div style={{ ...ir, borderBottom: "none" }}><span style={{ color: "#64748b" }}>Lifetime Value</span><span style={{ color: "#f97316", fontWeight: 800 }}>₹{d.totalBookingValue.toLocaleString()}</span></div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ ...bb, flex: 1, background: "#f1f5f9", color: "#374151" }}>Cancel</button>
            <button onClick={() => setStep(2)} style={{ ...bb, flex: 1, background: "#dc2626", color: "#fff" }}><AlertTriangle size={15} /> Continue</button>
          </div>
        </>)}
        {step === 2 && (<>
          <div style={st}><ShieldAlert size={13} /> Confirm Deletion</div>
          <p style={{ fontSize: 13, color: "#374151", marginBottom: 16 }}>Type <strong style={{ color: "#dc2626" }}>DELETE</strong> to permanently remove <strong>{d.customer.name}</strong>:</p>
          <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="DELETE"
            style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 700, fontFamily: "monospace", outline: "none", boxSizing: "border-box", marginBottom: 20 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(1)} style={{ ...bb, flex: 1, background: "#f1f5f9", color: "#374151" }}>Back</button>
            <button onClick={handleDelete} disabled={confirmText !== "DELETE" || deleting}
              style={{ ...bb, flex: 1, background: confirmText !== "DELETE" ? "#fca5a5" : "#dc2626", color: "#fff", opacity: confirmText !== "DELETE" ? 0.6 : 1 }}>
              {deleting ? <Loader size={15} /> : <Trash2 size={15} />} {deleting ? "Deleting..." : "Permanently Delete"}
            </button>
          </div>
        </>)}
      </div>
    );
  };

  // ── ENQUIRY FLOW ──
  const renderEnquiry = () => {
    const d = checkData;
    if (!d) return null;
    if (d.isConverted) return (
      <div style={{ padding: 28 }}>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}><Ban size={20} color="#dc2626" /><span style={{ fontSize: 15, fontWeight: 800, color: "#dc2626" }}>Deletion Blocked</span></div>
          <p style={{ margin: 0, fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 }}>This enquiry is <strong>converted to a booking</strong>{d.linkedBooking ? ` (${d.linkedBooking.bookingId})` : ""}. Delete the linked booking first.</p>
        </div>
        <button onClick={onClose} style={{ ...bb, width: "100%", background: "#f1f5f9", color: "#374151" }}>Go Back</button>
      </div>
    );
    return (
      <div style={{ padding: 28 }}>
        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 20 }}>
          Enquiry <strong>{d.enquiry.enquiryNumber || `#${d.enquiry.id}`}</strong> ({d.enquiry.status}) has no linked bookings. Safe to delete.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...bb, flex: 1, background: "#f1f5f9", color: "#374151" }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} style={{ ...bb, flex: 1, background: "#dc2626", color: "#fff" }}>
            {deleting ? <Loader size={15} /> : <Trash2 size={15} />} {deleting ? "Deleting..." : "Delete Enquiry"}
          </button>
        </div>
      </div>
    );
  };

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <div style={ov} onClick={onClose}>
      <div style={md} onClick={e => e.stopPropagation()}>
        <div style={hd}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={22} color="#dc2626" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#991b1b", display: "flex", alignItems: "center", gap: 10 }}>
              Delete {typeLabel}?
              {!loading && !error && type === "booking" && (
                <span style={{ fontSize: 11, fontWeight: 800, background: "#fecaca", color: "#991b1b", padding: "2px 8px", borderRadius: 10, letterSpacing: 0.5 }}>
                  STEP {currentStepNum} OF {totalSteps}
                </span>
              )}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#7f1d1d", fontWeight: 500 }}>{name || "This record"}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", padding: 4 }}><X size={20} /></button>
        </div>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Loader size={28} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#94a3b8", fontSize: 14, fontWeight: 600, marginTop: 12 }}>Checking dependencies...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: 28, textAlign: "center" }}>
            <p style={{ color: "#dc2626", fontWeight: 600 }}>{error}</p>
            <button onClick={onClose} style={{ ...bb, margin: "12px auto 0", background: "#f1f5f9", color: "#374151" }}>Close</button>
          </div>
        ) : type === "booking" ? renderBooking() : type === "customer" ? renderCustomer() : renderEnquiry()}
      </div>
    </div>
  );
}
