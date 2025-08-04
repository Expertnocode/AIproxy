const { spawn } = require('child_process');

console.log('Starting backend with debug logs...');

const backend = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: { ...process.env, DEBUG: '*', LOG_LEVEL: 'debug' }
});

backend.on('error', (error) => {
  console.error('Backend failed to start:', error);
});

backend.on('exit', (code) => {
  console.log(`Backend exited with code ${code}`);
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('Stopping backend...');
  backend.kill();
  process.exit();
});