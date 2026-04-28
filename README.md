# 🛡️ DeepTrace AI — Live Sports Content Protection

DeepTrace AI is a high-performance, AI-driven piracy detection and media enforcement platform built for live sports broadcasts, premium media rights holders, and streaming networks.

The system combines invisible watermarking, autonomous monitoring agents, AI-powered legal enforcement, and a modern analytics dashboard to detect unauthorized redistribution of protected sports content in real time.

---

# 🌐 Live Demo

**Deployed Application:** https://deeptrace-ai-gmpk.onrender.com/

---

# 🚀 Features

## 🔒 Invisible Watermarking

DeepTrace embeds hidden digital ownership signatures directly into media assets using a dual-layer watermarking system:

* Spatial Domain Watermarking
* DCT (Discrete Cosine Transform) Watermarking
* 48-bit unique fingerprint signatures

This allows ownership verification without affecting visual quality.

---

## 🌐 Autonomous Monitoring Agents

Distributed scraping agents continuously monitor piracy vectors such as:

* Telegram groups
* Discord servers
* Unauthorized streaming websites
* Social media platforms

The system detects reposted or illegally streamed media in real time.

---

## 🤖 AI Legal Enforcement

Integrated with Google Gemini API to automate enforcement workflows:

* Analyze infringement evidence
* Estimate financial damages
* Generate DMCA takedown drafts
* Prioritize threat severity

---

## 📊 Live Operations Dashboard

A modern command center designed with sports-broadcast aesthetics featuring:

* Live ticker banners
* Real-time infringement statistics
* Confidence meters
* Animated data cards
* Dark / Light mode toggle
* Glassmorphism UI

---

# 🏗️ Tech Stack

## Frontend

* React 18
* Vite
* JSX
* CSS3
* Framer Motion
* Recharts

## Backend

* Python 3.11
* FastAPI
* OpenCV
* SciPy
* invisible-watermark

## AI

* Google Gemini API

## Deployment

* Docker
* Render

---

# 📁 Project Structure

```bash id="1j8t4k"
DeepTrace/
│── frontend/                 # React frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
│── services/
│   └── api/
│       └── main.py          # FastAPI backend entry
│
│── requirements.txt
│── Dockerfile
│── render.yaml
│── .dockerignore
│── README.md
```

---

# ⚙️ Installation & Local Setup

## 1️⃣ Clone Repository

```bash id="f6azdr"
git clone https://github.com/yourusername/DeepTrace.git
cd DeepTrace
```

---

## 2️⃣ Backend Setup

Install Python dependencies:

```bash id="7cfdzv"
pip install -r requirements.txt
```

Create `.env` file:

```env id="0h5kh6"
GEMINI_API_KEY=your-api-key-here
ENVIRONMENT=development
```

Run backend:

```bash id="ynclq7"
python -m uvicorn services.api.main:app --reload --port 8000
```

---

## 3️⃣ Frontend Setup

Open a new terminal:

```bash id="kzgr4o"
cd frontend
npm install
npm run dev
```

---

# 🐳 Docker Deployment

Build image:

```bash id="0p9hn4"
docker build -t deeptrace .
```

Run container:

```bash id="73k56r"
docker run -p 8000:8000 deeptrace
```

---

# ☁️ Production Deployment

DeepTrace AI is already live on Render:

**https://deeptrace-ai-gmpk.onrender.com/**

Render uses:

* Multi-stage Docker build
* React frontend static build
* Python backend containerized runtime
* Auto deployment from GitHub

---

# 🧠 How It Works

## Media Protection Pipeline

1. Original sports content uploaded
2. Hidden ownership watermark injected
3. Agents scan piracy sources
4. If stolen copy detected:

   * Watermark extracted
   * Ownership verified
   * AI legal report generated
   * Dashboard updated live

---

# 📈 Example Use Cases

* Sports leagues protecting live streams
* OTT platforms preventing rebroadcast piracy
* Premium PPV event security
* Media rights enforcement teams
* Copyright recovery operations

---

# 🔮 Future Scope

* Blockchain rights ownership logs
* Global takedown automation
* Face/logo detection in pirated streams
* Revenue loss analytics
* Multi-language legal generation
* Real-time stream fingerprint scanning

---

# 👨‍💻 Author

Anukriti Jain

---

# 📜 License

This project is developed for educational, research, and demonstration purposes.
