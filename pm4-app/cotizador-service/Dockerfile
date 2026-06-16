FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if any, none needed for typical openpyxl/flask
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy all files
COPY . .

# Expose python service port
EXPOSE 5001

# Run the Flask service
CMD ["python", "app.py"]
