import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('api');
const destination = resolve('dist/api');
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true, force: true });
console.log(`API PHP copiada para ${destination}`);
