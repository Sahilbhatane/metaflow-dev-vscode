const vscode = require('vscode');
const path = require('path');
const { execFilePythonChain } = require('./pythonRunner');

const INSPECT_SCRIPT = path.join(__dirname, 'scripts', 'inspectFlowFile.py');

function parseInspectStdout(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    return {
      syntaxOk: !!parsed.syntaxOk,
      hasFlowSpec: !!parsed.hasFlowSpec,
      parameters: Array.isArray(parsed.parameters) ? parsed.parameters : [],
      error: parsed.error != null ? parsed.error : null,
    };
  } catch (parseErr) {
    console.error('Failed to parse inspect output:', parseErr.message);
    return {
      syntaxOk: false,
      hasFlowSpec: false,
      parameters: [],
      error: 'Invalid inspect output.',
    };
  }
}

/**
 * Run inspectFlowFile.py and return { syntaxOk, hasFlowSpec, parameters, error }.
 * Tries `python` then `python3` when PYTHON is unset. On failure, returns a result object (never throws).
 */
function inspectFlowFile(filePath) {
  return new Promise((resolve) => {
    execFilePythonChain(
      [INSPECT_SCRIPT, filePath],
      { timeout: 10000 },
      (err, stdout, stderr) => {
        if (err) {
          console.error('inspectFlowFile failed:', stderr || err.message);
          resolve({
            syntaxOk: false,
            hasFlowSpec: false,
            parameters: [],
            error: (stderr && String(stderr).trim()) || err.message || 'Failed to inspect flow file.',
          });
          return;
        }
        resolve(parseInspectStdout(stdout));
      }
    );
  });
}

/**
 * Spawn the Python AST extractor and return parsed parameter definitions.
 * Returns an empty array on failure (logged).
 */
function extractParameters(filePath) {
  return inspectFlowFile(filePath).then((inspect) => inspect.parameters);
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

    // Preserve user input (including empty string and intentional spaces) for CLI flags.
    results.push({ name: param.name, value });
  }

  return results;
}

module.exports = {
  inspectFlowFile,
  extractParameters,
  promptForParameters,
  validateInput,
};
