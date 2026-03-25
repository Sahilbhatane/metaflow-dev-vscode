const CLI_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Wrap a string in double quotes and escape characters that are dangerous
 * in both bash and PowerShell (double quotes, backticks, dollar signs).
 */
function quoteForTerminal(value) {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
  return `"${escaped}"`;
}

/**
 * Build a `python <file> run --flag=value ...` command string.
 *
 * @param {string} filePath - Absolute path to the flow file.
 * @param {Array<{name: string, value: string}>} flagArgs - Parameter name/value pairs.
 * @returns {string} The shell command to execute.
 */
function buildRunCommand(filePath, flagArgs) {
  const parts = ['python', quoteForTerminal(filePath), 'run'];

  for (const arg of flagArgs) {
    if (!CLI_NAME_RE.test(arg.name)) {
      throw new Error(`Invalid parameter name: ${arg.name}`);
    }
    if (/[\r\n]/.test(arg.value)) {
      throw new Error(`Parameter value for --${arg.name} contains newline characters.`);
    }
    parts.push(`--${arg.name}=${quoteForTerminal(arg.value)}`);
  }

  return parts.join(' ');
}

module.exports = { buildRunCommand, quoteForTerminal, CLI_NAME_RE };
