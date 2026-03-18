import { spawn } from 'node:child_process';

const child = spawn(process.execPath, ['./node_modules/vitest/vitest.mjs', 'run'], {
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
