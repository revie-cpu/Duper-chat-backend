const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
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

  try {
    if (req.file) {
      const form = new FormData();
      form.append('file', fs.createReadStream(req.file.path));

      const response = await axios.post('https://api.gofile.io/uploadFile', form, {
        headers: form.getHeaders()
      });

      console.log("GOFILE RESPONSE:", response.data);
      fileUrl = response.data?.data?.downloadPage || null;

      fs.unlinkSync(req.file.path);
    }
  } catch (err) {
    console.error("Upload failed:", err.message);
  }

  if (!messages[username]) messages[username] = [];
  const newMessage = { text: message, fileUrl, timestamp: Date.now() };
  messages[username].push(newMessage);
  saveJSON();
  res.json({ message: 'Message saved', fileUrl });
});

app.get('/messages/:username', (req, res) => {
  const userMessages = messages[req.params.username] || [];
  res.json(userMessages);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
