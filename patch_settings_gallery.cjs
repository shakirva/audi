const fs = require('fs');

const path = './src/pages/Settings.jsx';
let content = fs.readFileSync(path, 'utf8');

// I need to add an upload input and a function to handle the upload.
// In handleAddMedia, it currently pushes newMedia.
// I will just change the UI to include a file input for image type.

const oldGalleryForm = `
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelSt}>{newMedia.type === "image" ? "🖼️ Image URL" : "🎬 YouTube URL"}</label>
              <input
                value={newMedia.src}
                onChange={e => setNewMedia(p => ({ ...p, src: e.target.value }))}
                placeholder={newMedia.type === "image" ? "https://images.unsplash.com/..." : "https://youtube.com/watch?v=..."}
                style={iStyle}
                onFocus={e => e.target.style.borderColor = "#1B4332"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
`;

const newGalleryForm = `
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelSt}>{newMedia.type === "image" ? "🖼️ Upload Image or Enter URL" : "🎬 YouTube URL"}</label>
              {newMedia.type === "image" ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      if (!e.target.files[0]) return;
                      try {
                        const formData = new FormData();
                        formData.append("logo", e.target.files[0]);
                        const res = await settingsAPI.uploadLogo(formData);
                        if (res.data.success && res.data.url) {
                           setNewMedia(p => ({ ...p, src: res.data.url }));
                        }
                      } catch (err) {
                        setMediaError("Failed to upload image");
                      }
                    }}
                    style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: "1.5px dashed #1B4332", background: "#f0faf4", cursor: "pointer", fontSize: 13, color: "#1B4332", fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>OR</span>
                  <input
                    value={newMedia.src}
                    onChange={e => setNewMedia(p => ({ ...p, src: e.target.value }))}
                    placeholder="https://..."
                    style={{ ...iStyle, flex: 2 }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
              ) : (
                <input
                  value={newMedia.src}
                  onChange={e => setNewMedia(p => ({ ...p, src: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  style={iStyle}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
              )}
            </div>
`;

fs.writeFileSync(path, content.replace(oldGalleryForm, newGalleryForm));
console.log('Replaced Settings Gallery Form');
