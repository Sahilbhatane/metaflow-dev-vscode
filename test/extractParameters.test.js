const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');
const path = require('path');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'extractFlowParameters.py');
const FIXTURES = path.join(__dirname, '..', 'test_fixtures');

function runExtractor(fixture) {
  const stdout = execFileSync('python', [SCRIPT, path.join(FIXTURES, fixture)], {
    encoding: 'utf-8',
  });
  return JSON.parse(stdout);
}

describe('extractFlowParameters.py', () => {
  it('extracts parameters from a typical flow', () => {
    const params = runExtractor('sample_flow.py');
    assert.equal(params.length, 4);

    const epochs = params.find((p) => p.name === 'epochs');
    assert.equal(epochs.attribute, 'epochs');
    assert.equal(epochs.default, 10);
    assert.equal(epochs.type, 'int');
    assert.equal(epochs.help, 'Number of training epochs');
    assert.equal(epochs.required, false);

    const lr = params.find((p) => p.name === 'lr');
    assert.equal(lr.attribute, 'learning_rate');
    assert.equal(lr.default, 0.001);
    assert.equal(lr.type, 'float');

    const model = params.find((p) => p.name === 'model');
    assert.equal(model.required, true);
    assert.equal(model.default, null);

    const verbose = params.find((p) => p.name === 'verbose');
    assert.equal(verbose.default, true);
    assert.equal(verbose.type, 'bool');
  });

  it('returns empty array for non-flow files', () => {
    const params = runExtractor('not_a_flow.py');
    assert.deepEqual(params, []);
  });

  it('returns empty array for flow without parameters', () => {
    const params = runExtractor('no_params_flow.py');
    assert.deepEqual(params, []);
  });
});
