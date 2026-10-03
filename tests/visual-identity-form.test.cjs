const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');

function compile(file, resolver) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', output)(resolver, mod, mod.exports);
  return mod.exports;
}
const identity = compile('lib/visual-identity.ts', require);

// Render the actual component with controlled hook state and no network side effects.
function render({ lang = 'en', settings = null, loading = false, notice = null } = {}) {
  let stateIndex = 0;
  const states = [settings, loading, notice];
  const hooks = { ...React,
    useState: initial => [stateIndex < states.length ? states[stateIndex++] : initial, () => {}],
    useEffect: () => {}, useCallback: fn => fn, useRef: initial => ({ current: initial }),
  };
  const element = tag => ({ children, ...props }) => React.createElement(tag, props, children);
  const resolver = name => {
    if (name === 'react') return hooks;
    if (name === '@/contexts/app-context') return {
      useAuth: () => ({ session: { user: { id: 'owner' } } }),
      useLanguage: () => ({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', t: () => 'Loading...' }),
    };
    if (name === '@/lib/supabase') return { supabase: {} };
    if (name === '@/lib/visual-identity') return identity;
    if (name === '@/components/ui/card') return {
      Card: element('article'), CardContent: element('div'), CardHeader: element('header'), CardTitle: element('h3'),
    };
    if (name === '@/components/ui/button') return { Button: element('button') };
    if (name === 'sonner') return { toast: {} };
    return require(name);
  };
  const { VisualIdentitySection } = compile('components/admin/visual-identity-section.tsx', resolver);
  return renderToStaticMarkup(React.createElement(VisualIdentitySection));
}

for (const scenario of [
  { name: 'loading', loading: true },
  { name: 'empty settings' },
  { name: 'failed read', notice: 'loadError' },
  { name: 'owner not assigned', settings: { id: true, owner_user_id: null }, notice: 'ownerPending' },
]) {
  test(`all five upload cards remain visible: ${scenario.name}`, () => {
    const html = render(scenario);
    assert.equal((html.match(/<article/g) || []).length, 5);
    assert.equal((html.match(/type="file"/g) || []).length, 5);
    for (const field of identity.visualIdentityFields) assert.ok(html.includes(field.en));
    assert.equal((html.match(/Max 2 MB/g) || []).length, 5);
  });
}

test('Arabic form has RTL direction and all five translated labels', () => {
  const html = render({ lang: 'ar' });
  assert.ok(html.includes('dir="rtl"'));
  for (const field of identity.visualIdentityFields) assert.ok(html.includes(field.ar));
  assert.ok(html.includes(identity.visualIdentityText.ar.upload));
  assert.ok(html.includes(identity.visualIdentityText.ar.remove));
});

test('saved images show replace and delete controls', () => {
  const html = render({ settings: { id: true, owner_user_id: 'owner', portfolio_logo_path: 'saved.png' } });
  assert.ok(html.includes('Replace image'));
  assert.ok(html.includes('Delete image'));
});

test('Visual Identity is independent of the legacy profile query', () => {
  for (const file of ['components/admin/visual-identity-section.tsx', 'contexts/visual-identity-context.tsx', 'app/layout.tsx']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(source.includes('visual_identity_settings'));
    assert.ok(!source.includes("from('profiles')") && !source.includes('/rest/v1/profiles?'));
  }
});
