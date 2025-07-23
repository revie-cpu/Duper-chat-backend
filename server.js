// server.js
const express = require("express");
const http = require("http");
const multer = require("multer");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 3000;
const users = new Map(); // socketId => { name }

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ file: "/uploads/" + req.file.filename, original: req.file.originalname });
});

io.on("connection", socket => {
  socket.on("join", name => {
    const nameExists = Array.from(users.values()).some(u => u.name === name);
    if (nameExists) {
      socket.emit("name-error", "Name already taken");
      return;
    }

    users.set(socket.id, { name });
    io.emit("user-list", Array.from(users.values()));

    socket.on("chat-message", data => {
      io.emit("chat-message", data);
    });

    socket.on("file-message", data => {
      io.emit("file-message", data);
    });

    socket.on("disconnect", () => {
      users.delete(socket.id);
      io.emit("user-list", Array.from(users.values()));
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
