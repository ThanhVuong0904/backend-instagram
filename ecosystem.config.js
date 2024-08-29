const DEFAULT_OPTIONS = {
  node_args: '--max_old_space_size=4096 --async-stack-traces',
  instances: 1,
  kill_timeout: 12000,
  autorestart: true,
  watch: false,
  min_uptime: 10000,
  max_restarts: 5,
  max_memory_restart: '6G',
};

module.exports = {
  apps: [
    {
      name: 'APP',
      script: 'index.js',
      ...DEFAULT_OPTIONS,
    },
  ],
};
