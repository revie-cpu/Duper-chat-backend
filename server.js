// index.js
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path));
    form.append("expires", "7d"); // optional expiration

    const response = await axios.post("https://file.io", form, {
      headers: form.getHeaders(),
    });

    fs.unlinkSync(req.file.path); // clean up local file

    if(response.data.success) {
      res.json({ file: response.data.link });
    } else {
      res.status(500).json({ error: "Upload failed on file.io" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
