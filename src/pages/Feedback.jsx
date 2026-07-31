import { useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader";
import { MessageSquarePlus } from "lucide-react";
import { feedbackAPI } from "../services/api";

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const res = await feedbackAPI.getAll();
      setFeedbacks(res.data.data);
    } catch (err) {
      console.error("Failed to load feedback", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <PageHeader 
        title="User Feedback" 
        subtitle="Review feature requests and feedback from tenants" 
        icon={MessageSquarePlus} 
      />

      {loading ? (
        <div>Loading feedback...</div>
      ) : feedbacks.length === 0 ? (
        <div style={{ background: "#fff", padding: 40, textAlign: "center", borderRadius: 12, border: "1px dashed #e5e7eb", color: "#6b7280" }}>
          No feedback has been submitted yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {feedbacks.map(f => (
            <div key={f.id} style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#111827" }}>{f.userName || "Unknown User"} ({f.role || "No Role"})</h4>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    Tenant ID: {f.tenantId || "N/A"} • {new Date(f.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: "4px 8px", background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 600, borderRadius: 6 }}>
                  {f.status}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {f.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
