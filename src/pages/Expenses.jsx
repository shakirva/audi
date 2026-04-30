import { useState, useMemo } from "react";
import {
  Wallet, Plus, Trash2, Pencil, X, Check, TrendingDown,
  Users, Wrench, Zap, UtensilsCrossed, MoreHorizontal, ChevronDown,
} from "lucide-react";

/* ── Dummy initial expenses ── */
const INITIAL_EXPENSES = [
  { id: 1,  category: "Staff Salaries",  description: "Hall Manager – Rajan P.K.",         amount: 35000, date: "2026-04-01", recurring: true  },
  { id: 2,  category: "Staff Salaries",  description: "Caretaker – Suresh Kumar",            amount: 18000, date: "2026-04-01", recurring: true  },
  { id: 3,  category: "Staff Salaries",  description: "Security Guard (2 staff)",             amount: 24000, date: "2026-04-01", recurring: true  },
  { id: 4,  category: "Staff Salaries",  description: "Cleaning Staff (3 members)",           amount: 21000, date: "2026-04-01", recurring: true  },
  { id: 5,  category: "Maintenance",     description: "AC Service – Main Hall",               amount: 8500,  date: "2026-04-05", recurring: false },
  { id: 6,  category: "Maintenance",     description: "Generator Fuel & Service",             amount: 12000, date: "2026-04-08", recurring: false },
  { id: 7,  category: "Maintenance",     description: "Electrical Repair – Stage Lights",     amount: 4500,  date: "2026-04-14", recurring: false },
  { id: 8,  category: "Utilities",       description: "Electricity Bill – April",             amount: 22000, date: "2026-04-10", recurring: true  },
  { id: 9,  category: "Utilities",       description: "Water Bill – April",                   amount: 3500,  date: "2026-04-10", recurring: true  },
  { id: 10, category: "Utilities",       description: "Internet & Phone",                     amount: 1800,  date: "2026-04-10", recurring: true  },
  { id: 11, category: "Catering Prep",   description: "Catering Equipment Restock",           amount: 6500,  date: "2026-04-18", recurring: false },
  { id: 12, category: "Miscellaneous",   description: "Office Supplies & Stationery",         amount: 2200,  date: "2026-04-20", recurring: false },
  { id: 13, category: "Miscellaneous",   description: "Flower Decoration (event support)",    amount: 3800,  date: "2026-04-22", recurring: false },
  { id: 14, category: "Maintenance",     description: "Plumbing Repair – Restrooms",          amount: 5500,  date: "2026-04-26", recurring: false },
];

const CATEGORIES = [
  { label: "Staff Salaries",  icon: Users,          color: "#4f46e5", bg: "#eef2ff" },
  { label: "Maintenance",     icon: Wrench,         color: "#d97706", bg: "#fffbeb" },
  { label: "Utilities",       icon: Zap,            color: "#0891b2", bg: "#ecfeff" },
  { label: "Catering Prep",   icon: UtensilsCrossed,color: "#059669", bg: "#ecfdf5" },
  { label: "Miscellaneous",   icon: MoreHorizontal, color: "#9ca3af", bg: "#f3f4f6" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const catMeta = (label) => CATEGORIES.find(c => c.label === label) || CATEGORIES[4];

function formatINR(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

const EMPTY_FORM = { category: "Staff Salaries", description: "", amount: "", date: new Date().toISOString().split("T")[0], recurring: false };

export default function Expenses() {
  const now = new Date();
  const [expenses, setExpenses]       = useState(INITIAL_EXPENSES);
  const [filterCat, setFilterCat]     = useState("All");
  const [filterMonth, setFilterMonth] = useState(now.getMonth()); // 0-based
  const [filterYear, setFilterYear]   = useState(now.getFullYear());
  const [showModal, setShowModal]     = useState(false);
  const [editId, setEditId]           = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [deleteId, setDeleteId]       = useState(null);

  /* ── Filtered list ── */
  const monthStr = `${filterYear}-${String(filterMonth + 1).padStart(2, "0")}`;
  const filtered = useMemo(() =>
    expenses.filter(e => {
      const catOk  = filterCat === "All" || e.category === filterCat;
      const monOk  = e.date.startsWith(monthStr);
      return catOk && monOk;
    }),
    [expenses, filterCat, monthStr]
  );

  /* ── Summary cards ── */
  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const byCat = CATEGORIES.map(c => ({
    ...c,
    total: filtered.filter(e => e.category === c.label).reduce((s, e) => s + Number(e.amount), 0),
  }));

  /* ── Handlers ── */
  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); };
  const openEdit = (exp) => { setForm({ ...exp }); setEditId(exp.id); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditId(null); };

  const handleSave = () => {
    if (!form.description.trim() || !form.amount || !form.date) return;
    if (editId) {
      setExpenses(prev => prev.map(e => e.id === editId ? { ...form, id: editId, amount: Number(form.amount) } : e));
    } else {
      setExpenses(prev => [...prev, { ...form, id: Date.now(), amount: Number(form.amount) }]);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setDeleteId(null);
  };

  /* ── Month navigation ── */
  const prevMonth = () => { if (filterMonth === 0) { setFilterMonth(11); setFilterYear(y => y - 1); } else setFilterMonth(m => m - 1); };
  const nextMonth = () => { if (filterMonth === 11) { setFilterMonth(0); setFilterYear(y => y + 1); } else setFilterMonth(m => m + 1); };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 1100 }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
            Expense Management
          </h2>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Track all auditorium operating expenses</p>
        </div>
        <button onClick={openAdd} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
          background: "linear-gradient(135deg,#1B4332,#2D6A4F)", color: "#fff",
          border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 14px rgba(27,67,50,0.35)",
        }}>
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* ── Month navigator ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={prevMonth} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: "#111827", minWidth: 150, textAlign: "center" }}>
          {MONTHS[filterMonth]} {filterYear}
        </span>
        <button onClick={nextMonth} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
        {/* Total */}
        <div style={{ background: "linear-gradient(135deg,#0D2418,#1B4332)", borderRadius: 14, padding: "16px 18px", color: "#fff", gridColumn: "1 / span 2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <TrendingDown size={16} style={{ color: "#D4A017" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1, textTransform: "uppercase" }}>Total Expenses</span>
          </div>
          <p style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#D4A017" }}>{formatINR(totalFiltered)}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{filtered.length} entries · {MONTHS[filterMonth]} {filterYear}</p>
        </div>

        {byCat.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderTop: `3px solid ${c.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={14} style={{ color: c.color }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</span>
              </div>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: 0 }}>{formatINR(c.total)}</p>
            </div>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["All", ...CATEGORIES.map(c => c.label)].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: filterCat === cat ? "none" : "1px solid #e5e7eb",
            background: filterCat === cat ? "#1B4332" : "#fff",
            color: filterCat === cat ? "#fff" : "#6b7280",
            cursor: "pointer", transition: "all 0.15s",
          }}>{cat}</button>
        ))}
      </div>

      {/* ── Expense Table ── */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 120px 110px 90px", padding: "12px 20px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
          {["Category", "Description", "Amount", "Date", "Actions"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>💰</p>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>No expenses recorded for this period</p>
            <button onClick={openAdd} style={{ marginTop: 12, padding: "8px 18px", borderRadius: 8, background: "#1B4332", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              + Add First Expense
            </button>
          </div>
        ) : (
          filtered.map((exp, idx) => {
            const meta = catMeta(exp.category);
            const Icon = meta.icon;
            return (
              <div key={exp.id} style={{
                display: "grid", gridTemplateColumns: "1fr 2fr 120px 110px 90px",
                padding: "13px 20px", borderBottom: idx < filtered.length - 1 ? "1px solid #f9fafb" : "none",
                alignItems: "center", transition: "background 0.12s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                {/* Category badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={13} style={{ color: meta.color }} />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{exp.category}</span>
                    {exp.recurring && <span style={{ display: "block", fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>🔁 recurring</span>}
                  </div>
                </div>

                {/* Description */}
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{exp.description}</span>

                {/* Amount */}
                <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{formatINR(exp.amount)}</span>

                {/* Date */}
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {new Date(exp.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openEdit(exp)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => setDeleteId(exp.id)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #fee2e2", background: "#fff8f8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Total row */}
        {filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 120px 110px 90px", padding: "12px 20px", background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", gridColumn: "1 / span 2" }}>TOTAL ({filtered.length} entries)</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#D4A017" }}>{formatINR(totalFiltered)}</span>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={closeModal}>
          <div style={{ background: "#fff", borderRadius: 18, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>
                {editId ? "Edit Expense" : "Add New Expense"}
              </h3>
              <button onClick={closeModal} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                <X size={14} />
              </button>
            </div>

            {/* Category */}
            <label style={labelStyle}>Category</label>
            <div style={{ position: "relative" }}>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
            </div>

            {/* Description */}
            <label style={labelStyle}>Description</label>
            <input
              type="text"
              placeholder="e.g. AC Service – Main Hall"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={inputStyle}
            />

            {/* Amount */}
            <label style={labelStyle}>Amount (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              style={inputStyle}
            />

            {/* Date */}
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={inputStyle}
            />

            {/* Recurring */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, cursor: "pointer", fontSize: 13, color: "#374151" }}>
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))}
                style={{ width: 15, height: 15, accentColor: "#1B4332" }}
              />
              Recurring monthly expense
            </label>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={closeModal} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
                Cancel
              </button>
              <button onClick={handleSave} style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1B4332,#2D6A4F)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Check size={14} /> {editId ? "Update" : "Save Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setDeleteId(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 360, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>🗑️</p>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111827", textAlign: "center", marginBottom: 6 }}>Delete this expense?</p>
            <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginBottom: 20 }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", background: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared micro styles ── */
const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#374151",
  textTransform: "uppercase", letterSpacing: 0.5, marginTop: 14, marginBottom: 5,
};
const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 9,
  border: "1px solid #e5e7eb", fontSize: 13, color: "#111827",
  outline: "none", background: "#fafafa", boxSizing: "border-box",
  appearance: "none", WebkitAppearance: "none",
};
