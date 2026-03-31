const { execFile, execFileSync } = require('child_process');

/**
 * Interpreters to try when PYTHON is unset: many Linux images only ship `python3`.
 */
const DEFAULT_PYTHON_CANDIDATES = ['python', 'python3'];

function isMissingInterpreterError(err) {
  return err && (err.code === 'ENOENT' || err.errno === -4058);
}

/**
 * Ordered list of Python executables: env PYTHON, then defaults.
 */
function pythonCandidates() {
  if (process.env.PYTHON && String(process.env.PYTHON).trim()) {
    return [process.env.PYTHON.trim()];
  }
  return DEFAULT_PYTHON_CANDIDATES.slice();
}

/**
 * Run a Python binary with args; on missing interpreter, try next candidate.
 * @param {string[]} args
 * @param {import('child_process').ExecFileOptionsWithStringEncoding} opts
 * @param {(err: Error | null, stdout: string, stderr: string) => void} callback
 */
function execFilePythonChain(args, opts, callback) {
  const chain = pythonCandidates();
  function attempt(i) {
    if (i >= chain.length) {
      callback(
        new Error(
          'No Python interpreter found. Install Python or set the PYTHON environment variable.'
        ),
        '',
        ''
      );
      return;
    }
    execFile(chain[i], args, opts, (err, stdout, stderr) => {
      if (err && isMissingInterpreterError(err)) {
        attempt(i + 1);
        return;
      }
      callback(err, stdout, stderr);
    });
  }
  attempt(0);
}

/**
 * Sync variant for tests: PYTHON, then python, then python3.
 * @param {string[]} args
 * @param {import('child_process').ExecSyncOptionsWithStringEncoding} opts
 */
function execFilePythonSync(args, opts) {
  const chain = pythonCandidates();
  let lastErr;
  for (let i = 0; i < chain.length; i++) {
    try {
      return execFileSync(chain[i], args, opts);
    } catch (err) {
      lastErr = err;
      if (isMissingInterpreterError(err) && i < chain.length - 1) continue;
      throw err;
    }
  }
  throw lastErr;
}

module.exports = {
  pythonCandidates,
  execFilePythonChain,
  execFilePythonSync,
  isMissingInterpreterError,
};
