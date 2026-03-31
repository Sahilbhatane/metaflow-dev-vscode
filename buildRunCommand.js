/** Metaflow/Click long-option style: letters, digits, underscore, hyphen (not whitespace or '='). */
const CLI_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;

/**
 * Single-quote for bash/zsh: prevents all expansion.
 * Only ' needs escaping, done by ending the string, adding an escaped
 * literal quote, and reopening:  it's  →  'it'\''s'
 */
function quoteForBash(value) {
  return "'" + value.replace(/'/g, "'\\''" ) + "'";
}

/**
 * Single-quote for PowerShell: prevents all expansion.
 * Only ' needs escaping, done by doubling:  it's  →  'it''s'
 */
function quoteForPowershell(value) {
  return "'" + value.replace(/'/g, "''" ) + "'";
}

/**
 * Double-quote for cmd.exe: the only option since cmd has no single-quote
 * string semantics.  Escape " by doubling and % by doubling.
 */
function quoteForCmd(value) {
  return '"' + value.replace(/"/g, '""').replace(/%/g, '%%') + '"';
}

/**
 * Quote a string for safe use in a terminal command.
 * Uses single quotes for bash/PowerShell (prevents all variable expansion)
 * and double quotes for cmd.exe.
 *
 * @param {string} value - The raw string to quote.
 * @param {'bash'|'powershell'|'cmd'} shell - Target shell type.
 */
function quoteForTerminal(value, shell) {
  if (shell === 'powershell') return quoteForPowershell(value);
  if (shell === 'cmd') return quoteForCmd(value);
  return quoteForBash(value);
}

/**
 * Detect shell type from a shell executable path.
 * @param {string} shellPath - e.g. '/bin/bash' or 'C:\\...\\powershell.exe'
 * @returns {'bash'|'powershell'|'cmd'}
 */
function detectShellType(shellPath) {
  const lower = (shellPath || '').toLowerCase();
  if (lower.includes('powershell') || lower.includes('pwsh')) return 'powershell';
  if (lower.endsWith('cmd.exe') || lower.endsWith('cmd')) return 'cmd';
  return 'bash';
}

/**
 * Build a `python <file> run --flag=value ...` command string.
 *
 * @param {string} filePath - Absolute path to the flow file.
 * @param {Array<{name: string, value: string}>} flagArgs - Parameter name/value pairs.
 * @param {'bash'|'powershell'|'cmd'} shell - Target shell type.
 * @returns {string} The shell command to execute.
 */
function buildRunCommand(filePath, flagArgs, shell) {
  const parts = ['python', quoteForTerminal(filePath, shell), 'run'];

  for (const arg of flagArgs) {
    if (!CLI_NAME_RE.test(arg.name)) {
      throw new Error(`Invalid parameter name: ${arg.name}`);
    }
    if (/[\r\n]/.test(arg.value)) {
      throw new Error(`Parameter value for --${arg.name} contains newline characters.`);
    }
    parts.push(`--${arg.name}=${quoteForTerminal(arg.value, shell)}`);
  }

  return parts.join(' ');
}

module.exports = {
  buildRunCommand,
  quoteForTerminal,
  quoteForBash,
  quoteForPowershell,
  quoteForCmd,
  detectShellType,
  CLI_NAME_RE,
};
