FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    dnsutils \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p data static/uploads static/files

EXPOSE 5000

CMD ["python", "-c", "from app import init_db; init_db(); import subprocess; subprocess.run(['python','app.py'])"]
