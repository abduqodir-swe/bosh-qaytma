# Bo'sh Qaytma — Backend (FastAPI)

## Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run
```bash
uvicorn app.main:app --reload --port 8000
```

Then open:
- API root: http://localhost:8000/health
- Interactive docs: http://localhost:8000/docs

The SQLite database file `bosqaytma.db` is created automatically on first start.

## Frontend
The Vite dev server (port 5174) talks to this API at `http://localhost:8000`.
No extra config needed for local development.
