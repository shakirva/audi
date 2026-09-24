import React, { useState } from 'react';
import { Link, Copy, ImagePlus, Trash2, Film, Image as ImageIcon, Upload } from "lucide-react";
import { settingsAPI } from "../../services/api";
import { useRole } from "../../context/RoleContext";
import { useConfirm } from "../../components/ConfirmProvider";

export default function OnlinePresenceTab({
  settingsId,
  galleryItems,
  setGalleryItems,
  addToast
}) {
  const { confirm } = useConfirm();
  const { tenant } = useRole();
  
  const [newMedia, setNewMedia] = useState({ type: "upload", src: "", file: null, label: "", category: "Halls" });
  const [mediaError, setMediaError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const GALLERY_CATEGORIES = ["Halls", "Events", "Decor"];
  const tenantSlug = tenant?.slug;
  const publicBookingUrl = tenantSlug ? `https://venueza.cloud/book/${tenantSlug}` : "https://venueza.cloud/book/...";

  const getYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleAddMedia = async () => {
    setMediaError("");
    if (newMedia.type === "upload" && !newMedia.file) { setMediaError("Please select a file to upload."); return; }
    if (newMedia.type !== "upload" && !newMedia.src.trim()) { setMediaError("Please enter a URL."); return; }
    if (!newMedia.label.trim()) { setMediaError("Please enter a label."); return; }
    
    let finalSrc = newMedia.src;
    let finalType = newMedia.type === "upload" ? "image" : newMedia.type;
    let newItems = [];

    if (newMedia.type === "upload" && newMedia.file) {
       setIsUploading(true);
       try {
         const formData = new FormData();
         formData.append("logo", newMedia.file);
         const uploadRes = await settingsAPI.uploadLogo(formData);
         if (uploadRes.data?.success) {
           finalSrc = uploadRes.data.url;
         } else {
           setMediaError("Failed to upload image.");
           setIsUploading(false);
           return;
         }
       } catch (err) {
         setMediaError("Upload error: " + err.message);
         setIsUploading(false);
         return;
       }
       setIsUploading(false);
    }

    if (finalType === "video") {
      const ytId = getYouTubeId(finalSrc);
      if (!ytId) { setMediaError("Please enter a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)."); return; }
      const embedSrc = `https://www.youtube.com/embed/${ytId}`;
      const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      newItems = [...galleryItems, { id: Date.now(), type: "video", src: embedSrc, thumb, label: newMedia.label, category: newMedia.category }];
    } else {
      newItems = [...galleryItems, { id: Date.now(), type: "image", src: finalSrc.trim(), label: newMedia.label, category: newMedia.category }];
    }
    setGalleryItems(newItems);
    setNewMedia({ type: "upload", src: "", file: null, label: "", category: "Halls" });
    try {
      await settingsAPI.update({ gallery: newItems });
      addToast("Media added to gallery! 🖼️", "success");
    } catch (e) { addToast("Failed to save gallery", "error"); }
  };

  const handleDeleteMedia = async (id) => {
    if (!(await confirm("Remove this media from the gallery?"))) return;
    const newItems = galleryItems.filter(g => g.id !== id);
    setGalleryItems(newItems);
    try {
      await settingsAPI.update({ gallery: newItems });
      addToast("Removed from gallery.", "info");
    } catch (e) { addToast("Failed to save gallery", "error"); }
  };

  const iStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: "1px solid #e5e7eb", fontSize: 13, color: "#374151",
    background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
  };
  const cardSt = {
    background: "#fff", borderRadius: 12,
    boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 24, marginBottom: 16,
  };
  const sectionTitle = {
    fontFamily: "'Playfair Display', serif", fontSize: 16,
    fontWeight: 700, color: "#111827", marginBottom: 4, margin: 0,
  };

  return (
    <>
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link size={20} color="#15803d" />
          </div>
          <div>
            <p style={sectionTitle}>Online Booking Link</p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Share this link with customers to accept enquiries</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0", padding: "32px 20px" }}>
          
          <div style={{ padding: 12, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${publicBookingUrl}&bgcolor=ffffff&color=1B4332&margin=10`}
              alt="QR Code for booking page"
              style={{ width: 140, height: 140, display: "block" }} 
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", minWidth: 280 }}>
              <span style={{ padding: "10px 16px", fontSize: 13, color: "#475569", flex: 1, fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {publicBookingUrl}
              </span>
              <button 
                onClick={() => { navigator.clipboard.writeText(publicBookingUrl); addToast("Link copied!", "success"); }}
                style={{ padding: "10px 16px", background: "#f1f5f9", border: "none", borderLeft: "1px solid #cbd5e1", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#334155", fontWeight: 600, fontSize: 12 }}
              >
                <Copy size={14} /> Copy
              </button>
            </div>
            
            <a href={publicBookingUrl} target="_blank" rel="noreferrer" style={{ padding: "10px 20px", background: "#1e293b", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Open Form
            </a>

            <button 
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Book your event at our venue 🏛️\n" + publicBookingUrl)}`, "_blank")}
              style={{ padding: "10px 20px", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              Share on WhatsApp
            </button>
          </div>

        </div>
      </div>

      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImagePlus size={20} color="#c026d3" />
          </div>
          <div>
            <p style={sectionTitle}>Gallery Management</p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Images and videos shown on your public booking page</p>
          </div>
        </div>

        <div style={{ background: "#f8fafc", padding: "20px", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: "0 0 16px 0" }}>Add New Media</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            
            <div style={{ display: "flex", background: "#e2e8f0", borderRadius: 8, padding: 4 }}>
              <button onClick={() => setNewMedia({ ...newMedia, type: "upload", src: "", file: null })} style={{ padding: "6px 16px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", background: newMedia.type === "upload" ? "#fff" : "transparent", color: newMedia.type === "upload" ? "#1e293b" : "#64748b", boxShadow: newMedia.type === "upload" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", display: "flex", alignItems: "center", gap: 6 }}>
                <Upload size={14} /> Upload Image
              </button>
              <button onClick={() => setNewMedia({ ...newMedia, type: "image", src: "", file: null })} style={{ padding: "6px 16px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", background: newMedia.type === "image" ? "#fff" : "transparent", color: newMedia.type === "image" ? "#1e293b" : "#64748b", boxShadow: newMedia.type === "image" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", display: "flex", alignItems: "center", gap: 6 }}>
                <ImageIcon size={14} /> Image URL
              </button>
              <button onClick={() => setNewMedia({ ...newMedia, type: "video", src: "", file: null })} style={{ padding: "6px 16px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", background: newMedia.type === "video" ? "#fff" : "transparent", color: newMedia.type === "video" ? "#1e293b" : "#64748b", boxShadow: newMedia.type === "video" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", display: "flex", alignItems: "center", gap: 6 }}>
                <Film size={14} /> YouTube
              </button>
            </div>

            <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 8 }}>
              {newMedia.type === "upload" ? (
                <input 
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      setNewMedia({ ...newMedia, file, src: URL.createObjectURL(file) });
                    }
                  }}
                  style={iStyle} 
                />
              ) : (
                <input 
                  placeholder={newMedia.type === "video" ? "YouTube Video URL (e.g. https://youtube.com/watch?v=...)" : "Image URL (e.g. https://.../image.jpg)"} 
                  value={newMedia.src} 
                  onChange={e => setNewMedia({ ...newMedia, src: e.target.value })} 
                  style={iStyle} 
                />
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder="Caption / Title" value={newMedia.label} onChange={e => setNewMedia({ ...newMedia, label: e.target.value })} style={{ ...iStyle, flex: 2 }} />
                <select value={newMedia.category} onChange={e => setNewMedia({ ...newMedia, category: e.target.value })} style={{ ...iStyle, flex: 1, background: "#fff" }}>
                  {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button disabled={isUploading} onClick={handleAddMedia} style={{ padding: "0 20px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: isUploading ? "not-allowed" : "pointer", opacity: isUploading ? 0.7 : 1 }}>
                  {isUploading ? "..." : "Add"}
                </button>
              </div>
              {mediaError && <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>{mediaError}</span>}
            </div>

            {newMedia.src && (newMedia.type === "image" || newMedia.type === "upload") && (
              <img src={newMedia.src} alt="Preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #cbd5e1" }} onError={(e) => { e.target.style.display = "none"; setMediaError("Invalid image URL"); }} onLoad={(e) => { e.target.style.display = "block"; setMediaError(""); }} />
            )}
            {newMedia.src && newMedia.type === "video" && getYouTubeId(newMedia.src) && (
              <img src={`https://img.youtube.com/vi/${getYouTubeId(newMedia.src)}/hqdefault.jpg`} alt="Preview" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #cbd5e1" }} />
            )}
          </div>
        </div>

        {galleryItems.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1", color: "#64748b", fontSize: 14 }}>
            No media added yet. Add images or videos to showcase your venue!
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {galleryItems.map(item => (
              <div key={item.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", background: "#fff", position: "relative", group: "true", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ height: 140, width: "100%", background: "#f1f5f9", position: "relative" }}>
                  <img src={item.type === "video" ? item.thumb : item.src} alt={item.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {item.type === "video" && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)" }}>
                      <Film size={24} color="#fff" />
                    </div>
                  )}
                  <button onClick={() => handleDeleteMedia(item.id)} style={{ position: "absolute", top: 8, right: 8, background: "#fff", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", color: "#dc2626", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#6d28d9", background: "#f5f3ff", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>{item.category}</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "6px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
