module.exports = {
  apps: [
    {
      name: "np-web",
      script: "npm",
      args: "start",
      cwd: "/home/rizki/np-automation",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Restart otomatis kalau crash
      autorestart: true,
      // Restart kalau pakai lebih dari 1GB RAM (memory leak protection)
      max_memory_restart: "1G",
      // Simpan log
      out_file: "/home/rizki/logs/web-out.log",
      error_file: "/home/rizki/logs/web-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "np-worker",
      script: "npm",
      args: "run worker",
      cwd: "/home/rizki/np-automation",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_memory_restart: "800M",
      out_file: "/home/rizki/logs/worker-out.log",
      error_file: "/home/rizki/logs/worker-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
