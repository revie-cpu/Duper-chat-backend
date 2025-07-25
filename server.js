const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

let users = JSON.parse(fs.existsSync('users.json') ? fs.readFileSync('users.json') : '{}');
let messages = JSON.parse(fs.existsSync('messages.json') ? fs.readFileSync('messages.json') : '{}');

function saveJSON() {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));
}

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.json({ message: 'Username exists' });

  users[username] = { password };
  messages[username] = [];
  saveJSON();
  res.json({ message: 'Registered successfully' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password)
    return res.json({ message: 'Invalid credentials' });

  res.json({ message: 'Login successful' });
});

app.post('/message', upload.single('file'), async (req, res) => {
  const { username, message } = req.body;
  let fileUrl = null;

  if (req.file) {
    try {
      const response = await axios.post('https://api.gofile.io/uploadFile', {}, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: {
          file: fs.createReadStream(req.file.path)
        }
      });
      fileUrl = response.data.data.downloadPage;
    } catch {
      fileUrl = null;
    }

    fs.unlinkSync(req.file.path);
  }

  if (!messages[username]) messages[username] = [];
  messages[username].push({ text: message, fileUrl, timestamp: Date.now() });
  saveJSON();
  res.json({ message: 'Message saved' });
});

app.get('/messages/:username', (req, res) => {
  const userMessages = messages[req.params.username] || [];
  res.json(userMessages);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));