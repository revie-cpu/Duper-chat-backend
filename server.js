

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.static('frontend'));

io.on('connection', (socket) => {
  socket.on('chat message', (data) => {
    io.emit('chat message', data);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
