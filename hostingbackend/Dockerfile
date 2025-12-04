FROM python:3.12-slim

WORKDIR /app

# ✅ Install dependencies INCLUDING nc (netcat)
RUN apt-get update \
 && apt-get install -y libpq-dev build-essential netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*


COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN pip install --no-cache-dir psycopg2-binary uvloop httptools

COPY . .

EXPOSE 8000

CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000","--workers","8","--loop","uvloop","--http","httptools","--timeout-keep-alive","30","--limit-max-requests","10000"]
