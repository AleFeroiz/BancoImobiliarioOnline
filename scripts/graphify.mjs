import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const graphifyBinDir = path.join(projectRoot, '.tools', 'graphify', 'bin');
const graphifyExecutable = path.join(
  graphifyBinDir,
  process.platform === 'win32' ? 'graphify.exe' : 'graphify',
);
const [command, ...args] = process.argv.slice(2);

function run(executable, executableArgs, env = process.env) {
  const result = spawnSync(executable, executableArgs, {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`Não foi possível executar ${executable}: ${result.error.message}`);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

if (command === 'install') {
  if (existsSync(graphifyExecutable)) {
    console.log('Graphify já está instalado para este projeto.');
    process.exit(0);
  }

  const env = {
    ...process.env,
    UV_TOOL_DIR: path.join(projectRoot, '.tools', 'graphify', 'tools'),
    UV_TOOL_BIN_DIR: graphifyBinDir,
  };
  run(process.platform === 'win32' ? 'uv.exe' : 'uv', ['tool', 'install', 'graphifyy==0.9.97'], env);
}

if (!existsSync(graphifyExecutable)) {
  console.error('Graphify ainda não está instalado neste checkout. Rode: npm run graphify -- install');
  process.exit(1);
}

if (!command) {
  console.error('Uso: npm run graphify -- <query|path|explain|update> [argumentos]');
  process.exit(2);
}

run(graphifyExecutable, [command, ...args]);
