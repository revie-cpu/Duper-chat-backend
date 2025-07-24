const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });
const users = new Set(); // store usernames

// Check username uniqueness
app.post("/username", (req, res) => {
  const { username } = req.body;
  if (users.has(username)) {
    return res.status(409).json({ error: "Username already taken" });
  }
  users.add(username);
  res.json({ success: true });
});

// Handle uploads to File.io
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const formData = new FormData();
  formData.append("file", fs.createReadStream(req.file.path));

  try {
    const response = await axios.post("https://file.io", formData, {
      headers: formData.getHeaders(),
    });

    // delete temp file
    fs.unlink(req.file.path, () => {});
    res.json({ link: response.data.link });
  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
