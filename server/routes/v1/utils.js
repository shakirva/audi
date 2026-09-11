const express = require("express");
const router = express.Router();

// POST /api/v1/utils/pdf-echo
// Takes a base64 encoded PDF and a filename, and returns it as a downloadable file.
// This is used to bypass browser extensions (like IDM) that intercept Blob URLs and strip filenames.
router.post("/pdf-echo", (req, res) => {
  try {
    const { filename, base64 } = req.body;
    
    if (!base64 || !filename) {
      return res.status(400).json({ error: "Filename and base64 data required" });
    }

    // Remove the data URI prefix if present (e.g., "data:application/pdf;filename=generated.pdf;base64,")
    const base64Data = base64.replace(/^data:application\/pdf.*?;base64,/, "");
    
    const buffer = Buffer.from(base64Data, "base64");

    // Ensure the filename always has a .pdf extension
    const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

    // Set standard headers for file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
    res.setHeader("Content-Length", buffer.length);
    
    // Send the buffer directly
    res.send(buffer);
  } catch (error) {
    console.error("PDF Echo error:", error);
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

module.exports = router;
