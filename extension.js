const vscode = require('vscode');
const path = require('path');
const { validateFlowFile } = require('./flowDetection');
const { extractParameters, promptForParameters } = require('./parameterPrompt');
const { buildRunCommand, quoteForTerminal } = require('./buildRunCommand');

let sharedTerminal = null;

function getOrCreateTerminal() {
  if (!sharedTerminal || sharedTerminal.exitStatus !== undefined) {
    sharedTerminal = vscode.window.createTerminal('Metaflow Runner');
  }
  return sharedTerminal;
}

function sendToTerminal(fileDir, command) {
  const terminal = getOrCreateTerminal();
  terminal.show();
  terminal.sendText(`cd ${quoteForTerminal(fileDir)}`);
  terminal.sendText(command);
}

/**
 * Find the nearest enclosing Python function name above the cursor.
 */
function findEnclosingFunction(doc, line) {
  for (let i = line; i >= 0; i--) {
    const lineText = doc.lineAt(i).text.trim();
    const match = lineText.match(/^(?:async\s+def|def)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (match) return match[1];
  }
  return null;
}

async function runFlow(doc) {
  const filePath = doc.fileName;
  const fileDir = path.dirname(filePath);

  const params = await extractParameters(filePath);
  let flagArgs = [];

  if (params.length > 0) {
    const values = await promptForParameters(params);
    if (values === null) return; // user cancelled
    flagArgs = values;
  }

  const command = buildRunCommand(filePath, flagArgs);
  sendToTerminal(fileDir, command);
}

async function spinStep(doc, editor) {
  const funcName = findEnclosingFunction(doc, editor.selection.active.line);
  if (!funcName) {
    vscode.window.showErrorMessage('No enclosing Python function found.');
    return;
  }

  const filePath = doc.fileName;
  const fileDir = path.dirname(filePath);
  const command = `python ${quoteForTerminal(filePath)} spin ${funcName}`;
  sendToTerminal(fileDir, command);
}

async function runPythonCommand(scriptName) {
  const editor = vscode.window.activeTextEditor;
  const doc = validateFlowFile(editor);
  if (!doc) return;

  await doc.save();

  if (scriptName === 'spin_func') {
    await spinStep(doc, editor);
  } else {
    await runFlow(doc);
  }
}

function activate(context) {
  const runCmd = vscode.commands.registerCommand(
    'extension.runPythonFunction',
    () => runPythonCommand('run_func')
  );

  const spinCmd = vscode.commands.registerCommand(
    'extension.spinPythonFunction',
    () => runPythonCommand('spin_func')
  );

  context.subscriptions.push(runCmd, spinCmd);
}

function deactivate() {
  if (sharedTerminal) {
    sharedTerminal.dispose();
    sharedTerminal = null;
  }
}

module.exports = { activate, deactivate };
