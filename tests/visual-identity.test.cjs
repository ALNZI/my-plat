const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Load the pure TypeScript helpers without adding a test-runner dependency.
const source = fs.readFileSync(path.join(__dirname, '../lib/visual-identity.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = { exports: {} };
new Function('exports', 'require', 'module', compiled)(mod.exports, require, mod);
const { visualIdentityFields, visualIdentityText, validateImageFileInfo, getVisualIdentityUrl, MAX_IMAGE_BYTES } = mod.exports;

test('all five fields have required dimensions, formats and both labels', () => {
  assert.deepEqual(visualIdentityFields.map(f => [f.width, f.height]), [
    [1920, 1080], [96, 96], [192, 192], [32, 32], [180, 180],
  ]);
  for (const field of visualIdentityFields) {
    assert.ok(field.en && field.ar && field.formats);
    for (const extension of field.extensions) {
      assert.equal(validateImageFileInfo(field.key, { name: `image.${extension}`, size: MAX_IMAGE_BYTES }), extension);
    }
  }
});

test('file limits reject empty and oversized images for every field', () => {
  for (const field of visualIdentityFields) {
    for (const size of [0, MAX_IMAGE_BYTES + 1]) {
      assert.throws(() => validateImageFileInfo(field.key, { name: `image.${field.extensions[0]}`, size }), /tooLarge/);
    }
  }
});

test('formats are enforced per field, not just globally', () => {
  assert.throws(() => validateImageFileInfo('hero_background_path', { name: 'logo.svg', size: 30 }), /invalid/);
  assert.throws(() => validateImageFileInfo('apple_touch_icon_path', { name: 'icon.ico', size: 30 }), /invalid/);
  assert.equal(validateImageFileInfo('portfolio_logo_path', { name: 'LOGO.PNG', size: 30 }), 'png');
});

test('URLs only reference generated Storage paths', () => {
  const base = 'https://example.supabase.co';
  const valid = '11111111-1111-4111-8111-111111111111/portfolio_logo_path/22222222-2222-4222-8222-222222222222.png';
  assert.equal(getVisualIdentityUrl(valid, base), `${base}/storage/v1/object/public/visual-identity/${valid}`);
  for (const invalid of ['', '../secret.png', 'https://example.com/a.png', 'data:image/png;base64,abc', '<svg/>']) {
    assert.equal(getVisualIdentityUrl(invalid, base), undefined);
  }
});

test('Arabic and English contain identical non-empty translation keys', () => {
  assert.deepEqual(Object.keys(visualIdentityText.ar), Object.keys(visualIdentityText.en));
  for (const value of Object.values(visualIdentityText.ar)) assert.ok(value.length);
});