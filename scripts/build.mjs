import { spawn } from 'node:child_process';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [command, ...args], {
      stdio: 'inherit',
      shell: false,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
    });
  });
}

try {
  await run('./node_modules/typescript/bin/tsc', ['-b']);
  await run('./node_modules/vite/bin/vite.js', ['build']);
} catch (error) {
  console.error(error);
  process.exit(1);
}
