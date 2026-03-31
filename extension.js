const vscode = require('vscode');
const path = require('path');
const { validateEditorForFlowCommands, reportFlowInspectFailure } = require('./flowDetection');
const { inspectFlowFile, promptForParameters } = require('./parameterPrompt');
const { buildRunCommand, quoteForTerminal, detectShellType } = require('./buildRunCommand');

let sharedTerminal = null;

function getShellType() {
  return detectShellType(vscode.env.shell);
}

function getOrCreateTerminal() {
  if (!sharedTerminal || sharedTerminal.exitStatus !== undefined) {
    sharedTerminal = vscode.window.createTerminal('Metaflow Runner');
  }
  return sharedTerminal;
}

function sendToTerminal(fileDir, command) {
  const shell = getShellType();
  const terminal = getOrCreateTerminal();
  terminal.show();
  terminal.sendText(`cd ${quoteForTerminal(fileDir, shell)}`);
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

/**
 * @param {import('vscode').TextDocument} doc
 * @param {{ parameters: Array<Record<string, unknown>> }} inspectResult
 */
async function runFlow(doc, inspectResult) {
  const filePath = doc.fileName;
  const fileDir = path.dirname(filePath);
  const shell = getShellType();

  const params = inspectResult.parameters || [];
  let flagArgs = [];

  if (params.length > 0) {
    const values = await promptForParameters(params);
    if (values === null) return;
    flagArgs = values;
  }

  try {
    const command = buildRunCommand(filePath, flagArgs, shell);
    sendToTerminal(fileDir, command);
  } catch (err) {
    console.error('Failed to build or run Metaflow command:', err);
    vscode.window.showErrorMessage(
      err instanceof Error ? err.message : 'Failed to run Metaflow flow.'
    );
  }
}

async function spinStep(doc, editor) {
  const funcName = findEnclosingFunction(doc, editor.selection.active.line);
  if (!funcName) {
    vscode.window.showErrorMessage('No enclosing Python function found.');
    return;
  }

  const filePath = doc.fileName;
  const fileDir = path.dirname(filePath);
  const shell = getShellType();
  const command = `python ${quoteForTerminal(filePath, shell)} spin ${funcName}`;
  sendToTerminal(fileDir, command);
}

async function runPythonCommand(scriptName) {
  const editor = vscode.window.activeTextEditor;
  const doc = validateEditorForFlowCommands(editor);
  if (!doc) return;

  await doc.save();

  const inspect = await inspectFlowFile(doc.fileName);
  if (reportFlowInspectFailure(inspect)) return;

  if (scriptName === 'spin_func') {
    await spinStep(doc, editor);
  } else {
    await runFlow(doc, inspect);
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
