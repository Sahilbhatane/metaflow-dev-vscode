const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { execFilePythonSync } = require('../pythonRunner');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'inspectFlowFile.py');
const FIXTURES = path.join(__dirname, '..', 'test_fixtures');

function inspectFixture(name) {
  const stdout = execFilePythonSync([SCRIPT, path.join(FIXTURES, name)], {
    encoding: 'utf-8',
  });
  return JSON.parse(stdout);
}

describe('inspectFlowFile.py', () => {
  it('returns syntaxOk and hasFlowSpec for sample flow with parameters', () => {
    const j = inspectFixture('sample_flow.py');
    assert.equal(j.syntaxOk, true);
    assert.equal(j.hasFlowSpec, true);
    assert.equal(j.parameters.length, 4);
    assert.equal(j.error, null);
  });

  it('returns hasFlowSpec false for non-flow file', () => {
    const j = inspectFixture('not_a_flow.py');
    assert.equal(j.syntaxOk, true);
    assert.equal(j.hasFlowSpec, false);
    assert.deepEqual(j.parameters, []);
  });

  it('returns syntaxOk false for invalid Python', () => {
    const j = inspectFixture('syntax_error_flow.py');
    assert.equal(j.syntaxOk, false);
    assert.equal(j.hasFlowSpec, false);
    assert.ok(j.error && j.error.includes('Syntax error'));
  });

  it('matches extractParameters list for sample_flow', () => {
    const extractScript = path.join(__dirname, '..', 'scripts', 'extractFlowParameters.py');
    const extractOut = execFilePythonSync([extractScript, path.join(FIXTURES, 'sample_flow.py')], {
      encoding: 'utf-8',
    });
    const paramsExtract = JSON.parse(extractOut);
    const j = inspectFixture('sample_flow.py');
    assert.deepEqual(j.parameters, paramsExtract);
  });
});
