<div align="center">
```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗ ██████╗  ██████╗     ██████╗ ███████╗             ║
║  ██╔════╝ ██╔════╝ ██╔═══██╗   ██╔═══██╗██╔════╝             ║
║  ╚█████╗  ██║  ███╗██║   ██║   ██║   ██║███████╗             ║
║   ╚═══██╗ ██║   ██║██║   ██║   ██║   ██║╚════██║             ║
║  ██████╔╝ ╚██████╔╝╚██████╔╝   ╚██████╔╝███████║             ║
║  ╚═════╝   ╚═════╝  ╚═════╝     ╚═════╝ ╚══════╝             ║
║                                                               ║
║         SMART GRID OPTIMIZER // v1.0.0                        ║
║    AI-Powered Wind Energy Forecasting & Grid Stability        ║
╚═══════════════════════════════════════════════════════════════╝
```

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-smart--grid--optimizer.vercel.app-C9A227?style=for-the-badge&logo=vercel&logoColor=white)](https://smart-grid-optimizer.vercel.app)
[![Backend API](https://img.shields.io/badge/BACKEND_API-Railway-1C2E1C?style=for-the-badge&logo=railway&logoColor=white)](https://your-railway-url.up.railway.app/docs)
[![GitHub](https://img.shields.io/badge/SOURCE_CODE-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/gitatharvaa/smart-grid-optimizer)

![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-FF6600?style=flat-square&logo=xgboost&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square&logo=langchain&logoColor=white)
![MLflow](https://img.shields.io/badge/MLflow-0194E2?style=flat-square&logo=mlflow&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)

</div>

---

## ⚡ What Is This?

A production-grade, full-stack ML platform that solves two real-world energy problems:

**Problem 1** — Wind energy is unpredictable. Grid operators need to know how much power will be available hours in advance.

**Problem 2** — Even with a power forecast, will the grid handle the load? Instability causes outages.

**Solution** — A two-model ML pipeline that forecasts hourly wind power generation, distributes it across a 4-node grid architecture, and predicts stability — served via a live API, visualized in a React dashboard, and explained in plain English by an AI assistant.

---

## 🖥️ Live Screenshots

<div align="center">

| Overview Dashboard | Live Simulator |
|:---:|:---:|
| ![Overview](YOUR_SCREENSHOT_URL_1) | ![Simulator](YOUR_SCREENSHOT_URL_2) |

| Grid Stability Heatmap | AI Assistant |
|:---:|:---:|
| ![Heatmap](YOUR_SCREENSHOT_URL_3) | ![AI](YOUR_SCREENSHOT_URL_4) |

</div>

---

## 🏗️ System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  33 raw files (Excel + CSV) · 5 years · Hourly granularity │
│  43,823 training rows · 92,014 total rows in SQLite         │
└──────────────────────┬──────────────────────────────────────┘
                       │ ETL Pipeline (pandas)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    ML PIPELINE                              │
│                                                             │
│  [Wind Speed + Temp + Pressure + Air Density]               │
│                     ↓                                       │
│  ┌─────────────────────────────────┐                        │
│  │  XGBoost Regression             │                        │
│  │  RMSE: 0.357 MW · R²: 1.000    │                        │
│  │  95% better than baseline       │                        │
│  └──────────────────┬──────────────┘                        │
│                     ↓ Power (MW)                            │
│        Node 1: 20% · Node 2: 45% · Node 3: 35%             │
│                     ↓                                       │
│  ┌─────────────────────────────────┐                        │
│  │  XGBoost Classifier             │                        │
│  │  F1: 0.565 · AUC-ROC: 0.735    │                        │
│  │  Handles 64/36 class imbalance  │                        │
│  └──────────────────┬──────────────┘                        │
│                     ↓                                       │
│              STABLE / UNSTABLE                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   API LAYER (FastAPI)                       │
│                                                             │
│  POST /predict/power      → MW prediction + node splits     │
│  POST /predict/stability  → stable/unstable + confidence    │
│  GET  /insights/summary   → aggregated dashboard stats      │
│  POST /insights/narrative → LangChain AI report (Groq)      │
│  POST /chat               → SQL Agent natural language      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               FRONTEND (React + Vite)                       │
│                                                             │
│  Overview · Power Forecast · Grid Stability                 │
│  Live Simulator · AI Assistant                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  DEPLOYED                                   │
│  Frontend → Vercel  ·  Backend → Railway                    │
│  Containerized: Docker  ·  CI/CD: GitHub Actions            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Model Performance

### Wind Power Forecasting (Regression)

| Model | RMSE | MAE | R² | Notes |
|---|---|---|---|---|
| Persistence Baseline | 7.125 MW | 4.493 MW | 0.864 | Always predict previous hour |
| Linear Regression | 5.835 MW | 5.058 MW | 0.909 | Fails to capture non-linearity |
| **XGBoost Final ← Best** | **0.357 MW** | **0.252 MW** | **1.000** | +95% vs baseline |

### Grid Stability Classification

| Model | Accuracy | F1-Score | AUC-ROC | Notes |
|---|---|---|---|---|
| Majority Class Baseline | 0.651 | 0.000 | 0.500 | Accuracy paradox — useless |
| XGBoost (no balancing) | 0.712 | 0.514 | 0.733 | Biased toward unstable |
| **XGBoost Balanced ← Best** | **0.674** | **0.565** | **0.735** | scale_pos_weight applied |

> Note: Accuracy is intentionally misleading for imbalanced data (64% unstable). F1-Score and AUC-ROC are the true evaluation metrics.

---

## 🔑 Key Technical Decisions

**Why XGBoost over Linear Regression?**
Wind power scales with the cube of wind speed — a fundamentally non-linear relationship. Linear regression achieved RMSE of 5.8 MW vs XGBoost's 0.357 MW. The data confirmed what physics predicted.

**Why TimeSeriesSplit over K-Fold?**
Standard K-Fold can train on 2022 data and validate on 2019 data — using the future to predict the past. TimeSeriesSplit enforces temporal ordering: always train on past, validate on future.

**Why class weights for stability?**
A naive classifier achieved 65.1% accuracy by always predicting "unstable." scale_pos_weight (set to 1.76, the class imbalance ratio) forced the model to genuinely learn stable patterns.

**Why air density as a feature?**
Air density directly determines kinetic energy in wind: `ρ = (P × 101325) / (287.05 × T_kelvin)`. It's the actual physical driver of turbine output — pressure and temperature are just proxies.

**Why sequential model pipeline?**
The regression model's power predictions become input features for the classifier (after 20/45/35% node split). Better power predictions directly improve stability classification — a deliberate architectural choice that mirrors real grid systems.

---

## 🛠️ Tech Stack
```
┌─────────────────┬──────────────────────────────────────────┐
│ Layer           │ Technologies                             │
├─────────────────┼──────────────────────────────────────────┤
│ Data & ETL      │ Python · pandas · openpyxl               │
│ Database        │ SQLite · SQLAlchemy                      │
│ ML Models       │ XGBoost · scikit-learn                   │
│ Experiment Track│ MLflow                                   │
│ Explainability  │ SHAP                                     │
│ Backend API     │ FastAPI · Uvicorn · Pydantic             │
│ AI / LLM        │ LangChain · Groq (LLaMA 3.3 70B)        │
│ Frontend        │ React · Vite · Tailwind · Recharts       │
│ Animations      │ Framer Motion                            │
│ Containerization│ Docker · docker-compose                  │
│ CI/CD           │ GitHub Actions                           │
│ Deployment      │ Railway (API) · Vercel (Frontend)        │
└─────────────────┴──────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Option 1 — View Live (Recommended)
```
Open: https://smart-grid-optimizer.vercel.app
```

No setup required.

### Option 2 — Run with Docker
```bash
git clone https://github.com/gitatharvaa/smart-grid-optimizer.git
cd smart-grid-optimizer
cp .env.example .env        # add your API keys
docker-compose up --build
```

Open `http://localhost:3000`

### Option 3 — Run Locally
```bash
# 1. Clone and setup
git clone https://github.com/gitatharvaa/smart-grid-optimizer.git
cd smart-grid-optimizer
python -m venv venv && venv\Scripts\activate     # Windows
pip install -r requirements.txt

# 2. Place dataset files
# Put wind Excel files in: data/raw/wind_power_data/
# Put grid CSV files in:   data/raw/Grid_data/

# 3. Run ETL pipeline
python -m etl.merge_wind_data
python -m etl.merge_grid_data
python -m etl.load_to_db

# 4. Train models (10-15 minutes)
python -m models.train_regression
python -m models.train_classifier

# 5. Start API
uvicorn api.main:app --reload --port 8000

# 6. Start Frontend (new terminal)
cd frontend && npm install && npm run dev

# 7. View MLflow experiments
mlflow ui --port 5000
```

---

## 🌐 API Reference

Base URL: `https://your-railway-url.up.railway.app`

Interactive docs: `/docs`
```
GET  /health
     → API status, model loaded status, DB connection

POST /predict/power
     Body: { wind_speed, temperature, pressure }
     → { predicted_power_mw, power_gen_1/2/3,
          confidence_lower/upper, air_density,
          capacity_utilization_pct }

POST /predict/stability
     Body: { c1, c2, c3, p1, p2, p3,
             power_gen_1, power_gen_2, power_gen_3 }
     → { stability, confidence,
          stable_probability, unstable_probability }

GET  /insights/summary
     → { total_predicted_power_mw, stable_percentage,
          peak_instability_hour, ... }

POST /insights/narrative
     → AI-generated 3-paragraph report via LangChain + Groq

POST /chat
     Body: { message, conversation_history }
     → { response, sql_query }
```

---

## 📁 Project Structure
```
smart-grid-optimizer/
│
├── data/
│   ├── raw/                    # Original dataset files
│   └── processed/              # ETL outputs (CSV)
│
├── etl/
│   ├── merge_wind_data.py      # Merge 20 wind Excel files
│   ├── merge_grid_data.py      # Merge 12 grid CSV files
│   └── load_to_db.py           # Load to SQLite
│
├── models/
│   ├── train_regression.py     # XGBoost power forecasting
│   ├── train_classifier.py     # XGBoost stability classifier
│   ├── evaluate.py             # Shared evaluation utilities
│   └── saved/                  # Trained .joblib model files
│
├── api/
│   ├── main.py                 # FastAPI app + lifespan
│   ├── database.py             # SQLAlchemy engine
│   ├── schemas.py              # Pydantic request/response models
│   └── routes/
│       ├── predict.py          # Power prediction endpoint
│       ├── stability.py        # Stability prediction endpoint
│       ├── insights.py         # Dashboard + LangChain narrative
│       └── chat.py             # SQL Agent chat
│
├── frontend/
│   └── src/
│       ├── pages/              # 5 React pages
│       └── components/         # 10 reusable components
│
├── .github/workflows/ci.yml    # GitHub Actions CI/CD
├── Dockerfile.api
├── Dockerfile.frontend
├── docker-compose.yml
└── requirements.txt
```

---

## 🗺️ Dataset

Source: APSIT Hackathon 2024 — Smart Grid Optimization
```
Wind Power Data (21 Excel files):
  wind_speed_{year}.xlsx          2019–2023
  air_temperature_{year}.xlsx     2019–2023
  pressure_{year}.xlsx            2019–2023
  power_gen_{year}.xlsx           2019–2023
  wind_power_gen_3months_validation_data.xlsx

Grid Data (12 CSV files):
  unit_consumption_{year}.csv     2019–2023
  price_per_unit_{year}.csv       2019–2023
  grid_stability_2019_2023.csv
  grid_stability_3months_validation_data.csv

Statistics:
  Training rows:    43,823 (hourly, 2019–2023)
  Validation rows:   2,184 (Jan–Mar 2024)
  Zero power hours: 25.8% (wind below cut-in speed)
  Class imbalance:  64% unstable / 36% stable
```

---

## 🔮 Future Development

- **Phase 2 — Wind Farm Map:** Interactive Leaflet.js map showing turbine locations with real-time wind data from Open-Meteo API. Click any location to run a live prediction using current weather conditions.

- **Phase 3 — Retraining Pipeline:** Automated model retraining triggered when prediction error exceeds threshold, using Evidently AI for data drift detection.

- **Phase 4 — Multi-Site Generalization:** Transfer learning approach for adapting the site-specific model to new wind farms with limited historical data.

---

## 👤 Author

**Atharva**

[![GitHub](https://img.shields.io/badge/GitHub-gitatharvaa-181717?style=flat-square&logo=github)](https://github.com/gitatharvaa)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/atharva-chavan1505)
[![Live Project](https://img.shields.io/badge/Live_Demo-Visit-C9A227?style=flat-square)](https://smart-grid-optimizer.vercel.app)

---

<div align="center">
```
Built with curiosity, caffeine, and Ganpati Bappa's blessings 🙏
```

⭐ Star this repo if it helped you learn something

</div>