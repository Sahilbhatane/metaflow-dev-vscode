const FLOWSPEC_CLASS_RE = /^class\s+\w+\s*\(.*\bFlowSpec\b.*\)\s*:/m;

/**
 * Returns true if the given document text defines a Metaflow FlowSpec class.
 */
function isFlowSpecFile(text) {
  return FLOWSPEC_CLASS_RE.test(text);
}

/**
 * Validates the active editor document is a Python file containing a FlowSpec.
 * Shows an error message and returns null when validation fails.
 * Returns the TextDocument on success.
 */
function validateFlowFile(editor) {
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

  if (!isFlowSpecFile(doc.getText())) {
    vscode.window.showErrorMessage(
      'No FlowSpec class found. This file does not appear to be a Metaflow flow.'
    );
    return null;
  }

  return doc;
}

module.exports = { isFlowSpecFile, validateFlowFile };
