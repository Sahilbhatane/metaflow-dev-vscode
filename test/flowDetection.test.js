const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { isFlowSpecFile } = require('../flowDetection');

describe('isFlowSpecFile', () => {
  it('detects a simple FlowSpec class', () => {
    const src = `
from metaflow import FlowSpec, step

class MyFlow(FlowSpec):
    pass
`;
    assert.ok(isFlowSpecFile(src));
  });

  it('detects FlowSpec with multiple bases', () => {
    const src = `class MyFlow(SomeMixin, FlowSpec):\n    pass`;
    assert.ok(isFlowSpecFile(src));
  });

  it('detects fully-qualified metaflow.FlowSpec', () => {
    const src = `class MyFlow(metaflow.FlowSpec):\n    pass`;
    assert.ok(isFlowSpecFile(src));
  });

  it('rejects a file without FlowSpec', () => {
    const src = `
class NotAFlow:
    pass

def hello():
    print("hi")
`;
    assert.ok(!isFlowSpecFile(src));
  });

  it('rejects FlowSpec in a comment', () => {
    const src = `# class MyFlow(FlowSpec):\n#    pass\ndef hello(): pass`;
    assert.ok(!isFlowSpecFile(src));
  });

  it('rejects empty file', () => {
    assert.ok(!isFlowSpecFile(''));
  });
});
