/// <reference types="node" />
import fs from 'fs';
import path from 'path';

// Metro serves `lucide-react-native` from src/shared/lucideIcons.ts, which only
// exports the icons the app uses. An icon imported but missing there would be
// undefined at runtime and crash the screen, so this fails first.

const root = path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '.expo', 'dist', 'docs', 'assets', 'tmp']);

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [full] : [];
  });
}

function exportedIcons(): Set<string> {
  const barrel = fs.readFileSync(path.join(root, 'src/shared/lucideIcons.ts'), 'utf8');
  return new Set([...barrel.matchAll(/export \{ default as (\w+) \}/g)].map((m) => m[1]));
}

function importedIcons(): Map<string, string> {
  const used = new Map<string, string>();
  const pattern = /import\s+(type\s+)?\{([^}]*)\}\s+from\s+'lucide-react-native'/g;
  for (const file of sourceFiles(root)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(pattern)) {
      if (match[1]) continue; // `import type` is erased at build time
      for (const part of match[2].split(',')) {
        const item = part.trim();
        if (!item || item.startsWith('type ')) continue;
        used.set(item.split(/\s+as\s+/)[0].trim(), path.relative(root, file));
      }
    }
  }
  return used;
}

describe('lucideIcons barrel', () => {
  it('exports every icon the app imports', () => {
    const have = exportedIcons();
    const missing = [...importedIcons()].filter(([name]) => !have.has(name));
    expect(missing.map(([name, file]) => `${name} (used in ${file})`)).toEqual([]);
  });

  it('has no icon the app no longer uses', () => {
    const used = importedIcons();
    const extra = [...exportedIcons()].filter((name) => !used.has(name));
    expect(extra).toEqual([]);
  });

  it('points every icon at a file that exists in lucide-react-native', () => {
    const barrel = fs.readFileSync(path.join(root, 'src/shared/lucideIcons.ts'), 'utf8');
    const missing = [...barrel.matchAll(/from 'lucide-react-native\/icons\/([\w-]+)'/g)]
      .map((m) => m[1])
      .filter((name) => !fs.existsSync(path.join(root, 'node_modules/lucide-react-native/dist/esm/icons', `${name}.mjs`)));
    expect(missing).toEqual([]);
  });
});
