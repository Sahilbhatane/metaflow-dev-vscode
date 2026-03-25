const vscode = require('vscode');
const { execFile } = require('child_process');
const path = require('path');

const EXTRACTOR_SCRIPT = path.join(__dirname, 'scripts', 'extractFlowParameters.py');

/**
 * Spawn the Python AST extractor and return parsed parameter definitions.
 * Returns an empty array on failure (logged to output channel).
 */
function extractParameters(filePath) {
  return new Promise((resolve) => {
    execFile('python', [EXTRACTOR_SCRIPT, filePath], { timeout: 10000 }, (err, stdout, stderr) => {
      if (err) {
        console.error('Parameter extraction failed:', stderr || err.message);
        resolve([]);
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (parseErr) {
        console.error('Failed to parse extractor output:', parseErr.message);
        resolve([]);
      }
    });
  });
}

/**
 * Validate user input against the declared parameter type.
 */
function validateInput(value, paramType, required) {
  if (!value.trim()) {
    return required ? 'This parameter is required.' : undefined;
  }
  const trimmed = value.trim();
  switch (paramType) {
    case 'int':
      return /^-?\d+$/.test(trimmed) ? undefined : 'Expected an integer.';
    case 'float':
      return isNaN(Number(trimmed)) ? 'Expected a number.' : undefined;
    case 'bool':
      return /^(true|false|0|1)$/i.test(trimmed) ? undefined : 'Expected true or false.';
    case 'JSONType':
      try { JSON.parse(trimmed); return undefined; } catch { return 'Expected valid JSON.'; }
    default:
      return undefined;
  }
}

/**
 * Prompt the user for values of each extracted parameter.
 * Returns an array of {name, value} pairs, or null if the user cancelled.
 */
async function promptForParameters(params) {
  const results = [];

  for (const param of params) {
    const defaultStr = param.default !== null && param.default !== undefined
      ? String(param.default)
      : '';

    const typeHint = param.type ? ` (${param.type})` : '';
    const requiredHint = param.required ? ' [required]' : '';
    const helpText = param.help ? ` — ${param.help}` : '';

    const value = await vscode.window.showInputBox({
      title: `Metaflow Parameter: --${param.name}`,
      prompt: `${param.name}${typeHint}${requiredHint}${helpText}`,
      value: defaultStr,
      validateInput: (input) => validateInput(input, param.type, param.required),
    });

    if (value === undefined) {
      return null;
    }

    if (value.trim()) {
      results.push({ name: param.name, value: value.trim() });
    }
  }

  return results;
}

module.exports = { extractParameters, promptForParameters, validateInput };
