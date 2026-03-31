const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { flowInspectAllowsRun } = require('../flowDetection');

describe('flowInspectAllowsRun', () => {
  it('allows when syntaxOk and hasFlowSpec', () => {
    assert.ok(flowInspectAllowsRun({ syntaxOk: true, hasFlowSpec: true }));
  });

  it('blocks when syntaxOk is false', () => {
    assert.ok(!flowInspectAllowsRun({ syntaxOk: false, hasFlowSpec: false }));
  });

  it('blocks when hasFlowSpec is false', () => {
    assert.ok(!flowInspectAllowsRun({ syntaxOk: true, hasFlowSpec: false }));
  });

  it('blocks on null or missing fields', () => {
    assert.ok(!flowInspectAllowsRun(null));
    assert.ok(!flowInspectAllowsRun({}));
  });
});
