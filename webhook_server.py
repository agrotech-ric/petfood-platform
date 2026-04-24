#!/usr/bin/env python3
"""
GitHub Webhook сервер для автоматического деплоя
Слушает push события на main ветку и перезапускает контейнеры
"""

import os
import sys
import subprocess
import hmac
import hashlib
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

PROJECT_DIR = Path("/home/iot/PetFood/petfood_platforma")
GITHUB_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET", "your-secret-key")

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/deploy':
            self.send_response(404)
            self.end_headers()
            return

        # Проверяем signature
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        # Проверка HMAC подписи
        signature = self.headers.get('X-Hub-Signature-256', '')
        expected_signature = self._compute_signature(body)

        if not hmac.compare_digest(signature, expected_signature):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b'{"error": "Invalid signature"}')
            return

        try:
            payload = json.loads(body)

            # Проверяем, что это push в main
            if payload.get('ref') != 'refs/heads/main':
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"status": "ignored - not main branch"}')
                return

            # Запускаем деплой
            self._deploy()

            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"status": "deploying"}')

        except Exception as e:
            self._log(f"Error: {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(b'{"error": "Deploy failed"}')

    def _compute_signature(self, body):
        """Вычисляет HMAC SHA256 подпись для GitHub webhook"""
        signature = hmac.new(
            GITHUB_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        return f"sha256={signature}"

    def _deploy(self):
        """Выполняет деплой"""
        commands = [
            f"cd {PROJECT_DIR}",
            "git pull origin main",
            "docker compose down",
            "docker compose up --build -d",
        ]

        cmd = " && ".join(commands)

        self._log("Starting deployment...")
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            self._log("Deployment completed successfully!")
        else:
            self._log(f"Deployment failed!\nStderr: {result.stderr}")

    def _log(self, message):
        """Логирует сообщения в файл"""
        with open(PROJECT_DIR / "deploy.log", "a") as f:
            from datetime import datetime
            timestamp = datetime.now().isoformat()
            f.write(f"[{timestamp}] {message}\n")

    def log_message(self, format, *args):
        """Отключает стандартный логирование HTTP сервера"""
        pass

def main():
    host = "0.0.0.0"
    port = int(os.getenv("WEBHOOK_PORT", "9000"))

    server = HTTPServer((host, port), WebhookHandler)
    print(f"🚀 Webhook server running on {host}:{port}")
    print(f"📝 Logs: {PROJECT_DIR}/deploy.log")
    print(f"⚙️  Configure GitHub webhook to: http://<YOUR_IP>:{port}/deploy")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✋ Server stopped")
        sys.exit(0)

if __name__ == '__main__':
    main()
