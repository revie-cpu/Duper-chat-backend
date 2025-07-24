// 📦 Dependencies
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// 📁 Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// 🔐 Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 💾 Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// 🚀 Socket.io events
const users = new Set();
io.on("connection", (socket) => {
  socket.on("join", (username) => {
    if (users.has(username)) {
      socket.emit("username-taken");
    } else {
      users.add(username);
      socket.username = username;
      io.emit("user-joined", username);
    }
  });

  socket.on("chat-message", (data) => {
    io.emit("chat-message", data);
  });

  socket.on("file-message", (data) => {
    io.emit("file-message", data);
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      users.delete(socket.username);
      io.emit("user-left", socket.username);
    }
  });
});

// 📤 Upload route
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ file: fileUrl, original: req.file.originalname });
});

// ✅ Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
