# 🌱 Class XI Biology Notes Hub

An open community archive of CBSE Class XI Biology notes — built for students, by students. PDFs, sketches, smartboard whiteboard. No paywalls. No ads.

> **Built by Prateek** — Coded with love for every Class XI student.

## ✨ Features

- 📚 Browse community-shared notes (PDFs and pictures)
- 🖼️ Multi-source upload: **Camera · Gallery · Files · WhatsApp · Drive**
- 🎨 Smartboard Whiteboard: pen · highlighter · eraser · text · shapes · grid/ruled backgrounds
- 📁 Folders with one-click add/delete
- 🔍 Global search bar
- 🔐 Passcode-protected uploads (default: `prateeksahu1234`)
- 📱 PWA: installable on any device (phone, tablet, desktop, smartboard)
- 💾 MongoDB GridFS storage — scales to 50GB+
- 🌸 Spring-themed UI: scholarly, friendly, responsive

## 🚀 Quickstart

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Frontend (new terminal)
cd frontend
yarn install
yarn start
```

App runs at `http://localhost:3000`, backend at `http://localhost:8001`.

## 🌐 Deploy for free

See [DEPLOY_FREE.md](DEPLOY_FREE.md) for step-by-step instructions to deploy on:
- **Vercel** (frontend) + **Render** (backend) + **MongoDB Atlas** (database)
- Total cost: ₹0 / $0

## 🔧 Configuration

Backend `.env`:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
JWT_SECRET=<random>
ADMIN_EMAIL=admin@notes.com
ADMIN_PASSWORD=admin123
UPLOAD_PASSCODE=prateeksahu1234
```

Frontend `.env`:
```
REACT_APP_BACKEND_URL=https://your-backend-url
```

## 📜 License

Open for educational use. Made with 🌿 for the love of biology.
