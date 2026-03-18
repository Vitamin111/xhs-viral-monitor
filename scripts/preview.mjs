import { spawn } from 'node:child_process';

const child = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', 'preview'], {
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
