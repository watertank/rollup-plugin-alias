import test from 'ava';
import path from 'path';
import { rollup } from 'rollup';
import alias from '../';

test(t => {
  t.is(typeof alias, 'function');
});

test(t => {
  const result = alias();
  t.is(typeof result, 'object');
  t.is(typeof result.resolveId, 'function');
});

test(t => {
  const result = alias({});
  t.is(typeof result, 'object');
  t.is(typeof result.resolveId, 'function');
});

test('Simple aliasing', t => {
  const result = alias({
    foo: 'bar',
    pony: 'paradise',
    './local': 'global',
  });

  const resolved = result.resolveId('foo', '/src/importer.js');
  const resolved2 = result.resolveId('pony', '/src/importer.js');
  const resolved3 = result.resolveId('./local', '/src/importer.js');

  t.is(resolved, 'bar');
  t.is(resolved2, 'paradise');
  t.is(resolved3, 'global');
});

test('Will not confuse modules with similar names', t => {
  const result = alias({
    foo: 'bar',
    './foo': 'bar',
  });

  const resolved = result.resolveId('foo2', '/src/importer.js');
  const resolved2 = result.resolveId('./fooze/bar', '/src/importer.js');
  const resolved3 = result.resolveId('./someFile.foo', '/src/importer.js');

  t.is(resolved, null);
  t.is(resolved2, null);
  t.is(resolved3, null);
});

test('Local aliasing', t => {
  const result = alias({
    foo: './bar',
    pony: './par/a/di/se',
  });

  const resolved = result.resolveId('foo', '/src/importer.js');
  const resolved2 = result.resolveId('foo/baz', '/src/importer.js');
  const resolved3 = result.resolveId('foo/baz.js', '/src/importer.js');
  const resolved4 = result.resolveId('pony', '/src/highly/nested/importer.js');

  t.is(resolved, path.resolve('/src/bar.js'));
  t.is(resolved2, path.resolve('/src/bar/baz.js'));
  t.is(resolved3, path.resolve('/src/bar/baz.js'));
  t.is(resolved4, path.resolve('/src/highly/nested/par/a/di/se.js'));
});

test('Absolute local aliasing', t => {
  const result = alias({
    foo: '/bar',
    pony: '/par/a/di/se.js',
  });

  const resolved = result.resolveId('foo', '/src/importer.js');
  const resolved2 = result.resolveId('foo/baz', '/src/importer.js');
  const resolved3 = result.resolveId('foo/baz.js', '/src/importer.js');
  const resolved4 = result.resolveId('pony', '/src/highly/nested/importer.js');

  t.is(resolved, path.resolve('/bar.js'));
  t.is(resolved2, path.resolve('/bar/baz.js'));
  t.is(resolved3, path.resolve('/bar/baz.js'));
  t.is(resolved4, path.resolve('/par/a/di/se.js'));
});

test('Test for the resolve property', t => {
  const result = alias({
    ember: './folder/hipster',
    resolve: ['.js', '.jsx'],
  });

  const resolved = result.resolveId('ember', './files/index.js');

  t.is(resolved, path.resolve('./files/folder/hipster.jsx'));
});

test(t => {
  const result = alias({
    resolve: 'i/am/a/file',
  });

  const resolved = result.resolveId('resolve', '/src/import.js');

  t.is(resolved, 'i/am/a/file');
});

test(t => {
  const result = alias({
    resolve: './i/am/a/local/file',
  });

  const resolved = result.resolveId('resolve', path.resolve('./files/index.js'));

  t.is(resolved, path.resolve('./files/i/am/a/local/file.js'));
});

test(t => {
  const result = alias({
    aliasIndex: './folder',
  });

  const resolved = result.resolveId('aliasIndex', './files/aliasIndex.js');

  t.is(resolved, path.resolve('./files/folder/index.js'));
});

test(t =>
  rollup({
    entry: './files/aliasIndex.js',
    plugins: [alias({
      aliasIndex: './folder',
    })],
  }).then(stats => {
    t.same(stats.modules[0].id, path.resolve('./files/folder/index.js'));
    t.same(stats.modules[1].id, path.resolve('./files/aliasIndex.js'));
    t.is(stats.modules.length, 2);
  })
);

// Tests in Rollup
test(t =>
  rollup({
    entry: './files/index.js',
    plugins: [alias({
      fancyNumber: './aliasMe',
      './anotherFancyNumber': './localAliasMe',
      numberFolder: './folder',
      './numberFolder': './folder',
    })],
  }).then(stats => {
    t.same(stats.modules[0].id, path.resolve('./files/nonAliased.js'));
    t.is(stats.modules[1].id, path.resolve('./files/aliasMe.js'));
    t.is(stats.modules[2].id, path.resolve('./files/localAliasMe.js'));
    t.is(stats.modules[3].id, path.resolve('./files/folder/anotherNumber.js'));
    t.is(stats.modules[4].id, path.resolve('./files/index.js'));
    t.is(stats.modules.length, 5);
  })
);
