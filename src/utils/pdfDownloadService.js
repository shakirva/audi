export const robustDownloadPDF = async (doc, filename) => {
  try {
    const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    
    // Convert PDF to Base64
    const base64Data = doc.output('datauristring');
    
    // We must use a native form POST to trigger a browser-level download without Ajax/Fetch.
    // This totally bypasses download managers (like IDM) interfering with Blob URLs,
    // because it treats it like a normal file download from a server.
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/v1/utils/pdf-echo';
    form.style.display = 'none';
    form.target = '_blank'; // Open in a new tab if needed, but normally it just triggers a download

    const base64Input = document.createElement('input');
    base64Input.type = 'hidden';
    base64Input.name = 'base64';
    base64Input.value = base64Data;
    form.appendChild(base64Input);

    const filenameInput = document.createElement('input');
    filenameInput.type = 'hidden';
    filenameInput.name = 'filename';
    filenameInput.value = safeFilename;
    form.appendChild(filenameInput);

    document.body.appendChild(form);
    form.submit();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(form);
    }, 1000);
  } catch (error) {
    console.error("PDF Download Error:", error);
    alert("Failed to download PDF. Please try again.");
  }
};
