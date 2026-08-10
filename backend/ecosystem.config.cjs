module.exports = {
  apps: [
    {
      name: "didar-api",
      cwd: "/var/www/didar-api",
      script: ".venv/bin/uvicorn",
      args: "app.main:app --host 127.0.0.1 --port 8014",
      interpreter: "none",
      env: {
        PYTHONUNBUFFERED: "1",
      },
      max_restarts: 10,
      min_uptime: "5s",
    },
  ],
};
