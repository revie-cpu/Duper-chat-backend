// index.js
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const app = express();

// Make sure upload directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path));
    form.append("expires", "7d");

    const response = await axios.post("https://file.io", form, {
      headers: form.getHeaders(),
    });

    // Delete local file after upload
    fs.unlinkSync(req.file.path);

    if (response.data.success) {
      return res.json({ fileUrl: response.data.link });
    } else {
      return res.status(500).json({ error: "File.io upload failed" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
