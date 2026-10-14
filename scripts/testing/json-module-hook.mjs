/**
 * Let Node load Velo JSON imports (`import data from 'backend/data/file.json'`)
 * without an import attribute. Wix does not use this hook.
 */
import { readFile } from 'node:fs/promises';

export async function resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('backend/')) {
        const rel = specifier.slice('backend/'.length);
        const file = new URL('../../src/backend/' + rel, import.meta.url);
        return nextResolve(file.href, context);
    }
    return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
    if (url.endsWith('.json')) {
        const source = await readFile(new URL(url), 'utf8');
        return {
            format: 'module',
            source: `export default ${source};\n`,
            shortCircuit: true
        };
    }
    return nextLoad(url, context);
}
