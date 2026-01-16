# Chatbot Platform - Node.js Backend

This is the backend server for the Chatbot Platform. Run this separately from the React frontend.

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- OpenRouter API key

## Quick Setup

1. Create a new folder for the backend:
```bash
mkdir chatbot-backend
cd chatbot-backend
npm init -y
```

2. Install dependencies:
```bash
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
```

3. Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatbot-platform
JWT_SECRET=your-super-secret-jwt-key-change-this
OPENROUTER_API_KEY=your-openrouter-api-key
```

4. Create `server.js`:

```javascript
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Project Schema
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  systemPrompt: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});
const Project = mongoose.model('Project', projectSchema);

// Auth Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Project
app.post('/projects', auth, async (req, res) => {
  try {
    const { name, systemPrompt } = req.body;
    const project = new Project({ name, systemPrompt, userId: req.userId });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User Projects
app.get('/projects', auth, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Chat with LLM
app.post('/chat', auth, async (req, res) => {
  try {
    const { projectId, messages } = req.body;
    
    const project = await Project.findOne({ _id: projectId, userId: req.userId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: project.systemPrompt },
          ...messages
        ]
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ message: data.error.message || 'LLM error' });
    }
    
    res.json({ message: data.choices[0].message.content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Failed to get response' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

5. Run the server:
```bash
node server.js
```

## Sample .env File

```env
# Server Configuration
PORT=5000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/chatbot-platform
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot-platform

# JWT Secret (change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# OpenRouter API Key
# Get yours at https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

## Frontend Configuration

In your React frontend, create a `.env` file:
```env
VITE_API_URL=http://localhost:5000
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /auth/register | Register new user | No |
| POST | /auth/login | Login user | No |
| GET | /projects | List user projects | Yes |
| POST | /projects | Create new project | Yes |
| POST | /chat | Send message to LLM | Yes |

## Data Models

### User
- `email` (String, unique)
- `password` (String, hashed)

### Project
- `name` (String)
- `systemPrompt` (String)
- `userId` (ObjectId, ref to User)
- `createdAt` (Date)

## Production Notes

1. Use environment variables for all secrets
2. Enable HTTPS in production
3. Add rate limiting (consider express-rate-limit)
4. Add input validation (consider express-validator)
5. Set up proper MongoDB indexes
6. Consider adding request logging (morgan)
