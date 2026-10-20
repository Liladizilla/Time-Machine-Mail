import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('desktop scripts and standalone Next output are configured', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.main, 'electron/main.cjs');
  assert.match(pkg.scripts['desktop:dev'], /electron/);
  assert.match(pkg.scripts['desktop:dist'], /electron-builder --linux AppImage deb/);
  assert.match(pkg.scripts['desktop:dist:win'], /electron-builder --win nsis/);
  assert.match(pkg.scripts['desktop:dist:mac'], /electron-builder --mac dmg/);
  assert.equal(pkg.build.productName, 'Time Machine Mail');
  assert.ok(pkg.build.extraResources.some((item) => item.from === '.next/standalone'));
  assert.match(read('next.config.ts'), /output:\s*'standalone'/);
});

test('Electron renderer is isolated and external navigation is restricted', () => {
  const main = read('electron/main.cjs');
  assert.match(main, /contextIsolation: true/);
  assert.match(main, /nodeIntegration: false/);
  assert.match(main, /sandbox: true/);
  assert.match(main, /setWindowOpenHandler/);
  assert.match(main, /will-navigate/);
  assert.match(main, /utilityProcess\.fork/);
  assert.match(main, /PORT: '43127'/);
});

test('desktop release workflow builds and uploads platform installers', () => {
  const workflow = read('.github/workflows/desktop-release.yml');
  for (const platform of ['ubuntu-latest', 'windows-latest', 'macos-latest']) assert.ok(workflow.includes(platform));
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /softprops\/action-gh-release@v2/);
  assert.ok(existsSync(new URL('../build/icons/icon.png', import.meta.url)));
  assert.ok(existsSync(new URL('../app/runtime-config.js/route.ts', import.meta.url)));
  assert.match(read('lib/supabase.ts'), /runtimeConfig \? runtimeConfig\.supabaseUrl/);
  assert.match(read('electron/main.cjs'), /TMM_SUPABASE_ANON_KEY: desktopConfig\.anonKey/);
});
