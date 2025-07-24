// index.js
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const app = express();

const uploadFolder = path.join(__dirname, "uploads");

// Ensure uploads folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

const upload = multer({ dest: uploadFolder });

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path));
    form.append("expires", "7d");

    const response = await axios.post("https://file.io", form, {
      headers: form.getHeaders(),
    });

    fs.unlinkSync(req.file.path); // Clean temp file

    if (response.data.success) {
      return res.json({ fileUrl: response.data.link });
    } else {
      return res.status(500).json({ error: "Upload failed to file.io" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
