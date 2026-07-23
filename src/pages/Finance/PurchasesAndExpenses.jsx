import React, { useState, useEffect } from "react";
import { Receipt, Search, Plus } from "lucide-react";
import { expensesAPI } from "../../services/api";
import { useToast } from "../../components/Toast";
import AddExpenseModal from "./AddExpenseModal";

export default function PurchasesAndExpenses() {
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expensesAPI.getAll({ limit: 100 });
      setExpenses(res.data.data?.data || res.data.data || []);
    } catch (error) {
      addToast("Failed to fetch expenses", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = expenses.filter(e => 
    e.category?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0D2418" }}>Purchases & Expenses</h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Manage vendor purchases, bills, and all business expenses.</p>
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "10px 16px 10px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", width: 250 }}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ background: "#0f172a", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={16} /> New Expense
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Date</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Category</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Vendor / Description</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Mode</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading expenses...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No expenses found.</td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 24px", color: "#475569", fontWeight: 600 }}>
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "16px 24px", color: "#475569" }}>
                      <span style={{ display: "inline-block", padding: "4px 8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#475569" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{e.description || "-"}</div>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#475569" }}>{e.paymentMode || "Cash"}</td>
                    <td style={{ padding: "16px 24px", color: "#ef4444", fontWeight: 700 }}>₹{Number(e.amount).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AddExpenseModal 
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchExpenses();
          }}
        />
      )}
    </div>
  );
}
