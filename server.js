const express = require("express");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const FormData = require("form-data");
const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

// Data files
const USERS_FILE = "users.json";
const MESSAGES_FILE = "messages.json";

// Load data
const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : {};
const messages = fs.existsSync(MESSAGES_FILE) ? JSON.parse(fs.readFileSync(MESSAGES_FILE)) : [];

// Save functions
const saveUsers = () => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
const saveMessages = () => fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

// Auth routes
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.status(400).json({ error: "User exists" });
  users[username] = { password };
  saveUsers();
  res.json({ success: true });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ success: true });
});

// Message send
app.post("/message", upload.single("file"), async (req, res) => {
  const { username, message } = req.body;
  let fileUrl = null;

  if (req.file) {
    try {
      const form = new FormData();
      form.append("file", fs.createReadStream(req.file.path), req.file.originalname);

      const response = await axios.post("https://api.bayfiles.com/upload", form, {
        headers: form.getHeaders()
      });

      fileUrl = response.data.data.file.url.full;
    } catch (err) {
      console.error("Upload error:", err.message);
    }
    fs.unlinkSync(req.file.path);
  }

  const entry = { username, text: message, timestamp: Date.now(), fileUrl };
  messages.push(entry);
  saveMessages();
  res.json(entry);
});

// Get messages by user
app.get("/messages/:user", (req, res) => {
  res.json(messages.filter(m => m.username === req.params.user));
});

app.listen(3000, () => console.log("Server on port 3000"));