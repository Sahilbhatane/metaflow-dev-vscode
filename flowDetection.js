/**
 * Pure predicate: whether AST inspection allows run/spin.
 * @param {{ syntaxOk: boolean, hasFlowSpec: boolean }} inspectResult
 */
function flowInspectAllowsRun(inspectResult) {
  return !!(inspectResult && inspectResult.syntaxOk && inspectResult.hasFlowSpec);
}

/**
 * Validates the active editor: must exist and be a Python document.
 * Shows an error message and returns null when validation fails.
 * @returns {import('vscode').TextDocument | null}
 */
function validateEditorForFlowCommands(editor) {
  const vscode = require('vscode');

  if (!editor) {
    vscode.window.showErrorMessage('No active editor.');
    return null;
  }

  const doc = editor.document;
  if (doc.languageId !== 'python') {
    vscode.window.showErrorMessage('Active file is not a Python file.');
    return null;
  }

  return doc;
}

/**
 * Shows errors when inspect result blocks run/spin.
 * @returns {boolean} true if run/spin should abort (failure reported), false if OK to continue.
 * @param {{ syntaxOk: boolean, hasFlowSpec: boolean, error?: string | null }} inspectResult
 */
function reportFlowInspectFailure(inspectResult) {
  const vscode = require('vscode');

  if (flowInspectAllowsRun(inspectResult)) {
    return false;
  }

  if (!inspectResult.syntaxOk) {
    vscode.window.showErrorMessage(
      inspectResult.error || 'This file has a Python syntax error.'
    );
    return true;
  }

  if (!inspectResult.hasFlowSpec) {
    vscode.window.showErrorMessage(
      'No FlowSpec class found. This file does not appear to be a Metaflow flow.'
    );
    return true;
  }

  return true;
}

module.exports = {
  flowInspectAllowsRun,
  validateEditorForFlowCommands,
  reportFlowInspectFailure,
};
