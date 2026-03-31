const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildRunCommand, quoteForTerminal, quoteForBash, quoteForPowershell,
  quoteForCmd, detectShellType, CLI_NAME_RE,
} = require('../buildRunCommand');

describe('quoteForBash', () => {
  it('wraps in single quotes', () => {
    assert.equal(quoteForBash('hello'), "'hello'");
  });

  it('passes through $, `, \\ literally inside single quotes', () => {
    assert.equal(quoteForBash('$HOME'), "'$HOME'");
    assert.equal(quoteForBash('`cmd`'), "'`cmd`'");
    assert.equal(quoteForBash('C:\\Users'), "'C:\\Users'");
  });

  it('escapes single quotes with close-escape-reopen pattern', () => {
    assert.equal(quoteForBash("it's"), "'it'\\''s'");
  });
});

describe('quoteForPowershell', () => {
  it('wraps in single quotes', () => {
    assert.equal(quoteForPowershell('hello'), "'hello'");
  });

  it('passes through $, `, \\ literally inside single quotes', () => {
    assert.equal(quoteForPowershell('$HOME'), "'$HOME'");
    assert.equal(quoteForPowershell('`cmd`'), "'`cmd`'");
    assert.equal(quoteForPowershell('C:\\Users\\me'), "'C:\\Users\\me'");
  });

  it('escapes single quotes by doubling', () => {
    assert.equal(quoteForPowershell("it's"), "'it''s'");
  });
});

describe('quoteForCmd', () => {
  it('wraps in double quotes', () => {
    assert.equal(quoteForCmd('hello'), '"hello"');
  });

  it('escapes double quotes by doubling', () => {
    assert.equal(quoteForCmd('say "hi"'), '"say ""hi"""');
  });

  it('escapes percent signs by doubling', () => {
    assert.equal(quoteForCmd('%PATH%'), '"%%PATH%%"');
  });
});

describe('quoteForTerminal dispatches by shell', () => {
  it('uses bash quoting by default', () => {
    assert.equal(quoteForTerminal('$x', 'bash'), "'$x'");
  });

  it('uses powershell quoting when specified', () => {
    assert.equal(quoteForTerminal("it's", 'powershell'), "'it''s'");
  });

  it('uses cmd quoting when specified', () => {
    assert.equal(quoteForTerminal('%PATH%', 'cmd'), '"%%PATH%%"');
  });
});

describe('detectShellType', () => {
  it('detects PowerShell', () => {
    assert.equal(detectShellType('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'), 'powershell');
    assert.equal(detectShellType('/usr/local/bin/pwsh'), 'powershell');
  });

  it('detects cmd.exe', () => {
    assert.equal(detectShellType('C:\\Windows\\System32\\cmd.exe'), 'cmd');
  });

  it('defaults to bash for other shells', () => {
    assert.equal(detectShellType('/bin/bash'), 'bash');
    assert.equal(detectShellType('/bin/zsh'), 'bash');
    assert.equal(detectShellType(''), 'bash');
    assert.equal(detectShellType(undefined), 'bash');
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
    assert.ok(!CLI_NAME_RE.test('my param'));
    assert.ok(!CLI_NAME_RE.test('a=b'));
  });

  it('accepts hyphenated Click-style names', () => {
    assert.ok(CLI_NAME_RE.test('my-param'));
    assert.ok(CLI_NAME_RE.test('foo-bar_baz'));
  });
});

describe('buildRunCommand', () => {
  it('builds a bare run command with no flags (bash)', () => {
    const cmd = buildRunCommand('/path/to/flow.py', [], 'bash');
    assert.equal(cmd, "python '/path/to/flow.py' run");
  });

  it('appends --name=value flags (bash)', () => {
    const cmd = buildRunCommand('/flow.py', [
      { name: 'epochs', value: '20' },
      { name: 'lr', value: '0.001' },
    ], 'bash');
    assert.equal(cmd, "python '/flow.py' run --epochs='20' --lr='0.001'");
  });

  it('builds command for powershell', () => {
    const cmd = buildRunCommand('C:\\flow.py', [
      { name: 'model', value: "it's a model" },
    ], 'powershell');
    assert.equal(cmd, "python 'C:\\flow.py' run --model='it''s a model'");
  });

  it('quotes values with spaces (bash)', () => {
    const cmd = buildRunCommand('/flow.py', [
      { name: 'model', value: 'my model' },
    ], 'bash');
    assert.equal(cmd, "python '/flow.py' run --model='my model'");
  });

  it('accepts hyphenated parameter names in command', () => {
    const cmd = buildRunCommand('/flow.py', [{ name: 'my-flag', value: '1' }], 'bash');
    assert.equal(cmd, "python '/flow.py' run --my-flag='1'");
  });

  it('throws on invalid parameter names', () => {
    assert.throws(
      () => buildRunCommand('/flow.py', [{ name: 'bad=name', value: '1' }], 'bash'),
      /Invalid parameter name/
    );
  });

  it('throws on newlines in values', () => {
    assert.throws(
      () => buildRunCommand('/flow.py', [{ name: 'x', value: 'a\nb' }], 'bash'),
      /newline/
    );
  });
});
