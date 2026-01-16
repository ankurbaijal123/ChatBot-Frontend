# Chatbot Frontend (LLM Agent UI)

This is the frontend application for the chatbot platform. It allows users to authenticate, manage chatbot projects, upload files, and interact with LLM-powered agents.

---

## Features

* User authentication (Login / Register)
* JWT-based session handling
* Create and manage chatbot projects
* Chat interface with streaming-like responses
* PDF upload support
* Clean and responsive UI
* Connects to deployed backend API

---

## Tech Stack

* **React**
* **Vite**
* **JavaScript**
* **CSS**
* **Fetch API**

---
## Project Structure

```
ChatBot-Frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   └── App.jsx
├── public/
├── package.json
└── vite.config.js
```

---

##  Environment Configuration

Create an environment variable for backend API:

```js
export const BASE_URL =
  "https://chatbot-backend-production-1e11.up.railway.app";
```

---

## ▶️ Running Locally

```bash
git clone https://github.com/ankurbaijal123/ChatBot-Frontend.git
cd ChatBot-Frontend
npm install
npm run dev
```

Frontend will run at:

```
http://localhost:8080
```

---

##  Authentication Flow

1. User logs in or registers
2. Backend returns JWT token
3. Token stored in local storage
4. Token sent with every protected request

---

##  Chat Flow

1. User selects a project
2. User sends a message or uploads a PDF
3. Frontend sends request to backend
4. Backend forwards to LLM
5. Response displayed in UI

---

##  Deployment

* Frontend deployed on **Vercel**

Live URL:

```
https://chat-bot-frontend-blond.vercel.app
```

---


MIT
