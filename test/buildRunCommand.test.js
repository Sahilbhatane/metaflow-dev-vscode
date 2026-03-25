const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildRunCommand, quoteForTerminal, CLI_NAME_RE } = require('../buildRunCommand');

describe('quoteForTerminal', () => {
  it('wraps simple strings in double quotes', () => {
    assert.equal(quoteForTerminal('hello'), '"hello"');
  });

  it('escapes double quotes', () => {
    assert.equal(quoteForTerminal('say "hi"'), '"say \\"hi\\""');
  });

  it('escapes backslashes', () => {
    assert.equal(quoteForTerminal('C:\\Users\\me'), '"C:\\\\Users\\\\me"');
  });

  it('escapes dollar signs and backticks', () => {
    assert.equal(quoteForTerminal('$HOME'), '"\\$HOME"');
    assert.equal(quoteForTerminal('`cmd`'), '"\\`cmd\\`"');
  });
});

describe('CLI_NAME_RE', () => {
  it('accepts valid Python identifiers', () => {
    assert.ok(CLI_NAME_RE.test('epochs'));
    assert.ok(CLI_NAME_RE.test('learning_rate'));
    assert.ok(CLI_NAME_RE.test('_private'));
  });

  it('rejects invalid names', () => {
    assert.ok(!CLI_NAME_RE.test(''));
    assert.ok(!CLI_NAME_RE.test('123abc'));
    assert.ok(!CLI_NAME_RE.test('my-param'));
    assert.ok(!CLI_NAME_RE.test('my param'));
  });
});

describe('buildRunCommand', () => {
  it('builds a bare run command with no flags', () => {
    const cmd = buildRunCommand('/path/to/flow.py', []);
    assert.equal(cmd, 'python "/path/to/flow.py" run');
  });

  it('appends --name=value flags', () => {
    const cmd = buildRunCommand('/flow.py', [
      { name: 'epochs', value: '20' },
      { name: 'lr', value: '0.001' },
    ]);
    assert.equal(cmd, 'python "/flow.py" run --epochs="20" --lr="0.001"');
  });

  it('quotes values with spaces', () => {
    const cmd = buildRunCommand('/flow.py', [
      { name: 'model', value: 'my model' },
    ]);
    assert.equal(cmd, 'python "/flow.py" run --model="my model"');
  });

  it('throws on invalid parameter names', () => {
    assert.throws(
      () => buildRunCommand('/flow.py', [{ name: 'bad-name', value: '1' }]),
      /Invalid parameter name/
    );
  });

  it('throws on newlines in values', () => {
    assert.throws(
      () => buildRunCommand('/flow.py', [{ name: 'x', value: 'a\nb' }]),
      /newline/
    );
  });
});
