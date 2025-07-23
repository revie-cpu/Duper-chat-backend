const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ file: `/uploads/${req.file.filename}`, original: req.file.originalname });
});

let users = [];

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('new-user', username => {
    users.push({ id: socket.id, name: username });
    io.emit('user-list', users);
  });

  socket.on('chat-message', data => {
    io.emit('chat-message', { name: data.name, message: data.message });
  });

  socket.on('file-message', data => {
    io.emit('file-message', data);
  });

  socket.on('disconnect', () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit('user-list', users);
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
