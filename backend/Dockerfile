FROM python:3.11-slim

WORKDIR /backend

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# DEV (WATCH FOR FILE CHANGES)

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# PROD (NO FILE CHANGES)

# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]