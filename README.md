# Metaflow Shortcuts for VSCode

This lightweight VS Code extension supercharges your Metaflow dev workflow:

1. Develop a flow
2. Run the flow with **Ctrl + Opt + R**
3. Point at a step, edit it, and _spin_ it with **Ctrl + Opt + S** for quick results ⚡
4. Rinse and repeat 2-3

The extension automatically:

* Validates that the active file contains a Metaflow `FlowSpec` class before running
* Detects `Parameter(...)` definitions and prompts you for values before execution
* Pre-fills default values and validates input types (int, float, bool, JSON)
* Detects the current function name (`def` or `async def`)
* Saves the file before running
* Executes the command in the file’s directory
* Reuses a shared terminal session

## Smart Parameter Prompts

When you run a flow (Ctrl + Alt + R), the extension parses your Python file for `Parameter(...)` definitions and shows an input prompt for each one. Default values are pre-filled, required parameters are enforced, and type validation is applied automatically.

The final command is built as `python flow.py run --param1=value1 --param2=value2` and sent to the terminal.

### Current Limitations

* Parameter detection uses static AST parsing — it does not import or execute your code.
* Dynamic parameters (created in loops or conditionals), renamed imports (e.g. `P = Parameter`), and deploy-time callable defaults are not detected.
* `IncludeFile` parameters are not yet supported.
* The extension uses `python` as the interpreter; custom virtualenv paths are not yet supported (see [#3](https://github.com/outerbounds/metaflow-dev-vscode/issues/3)).

You can always fall back to running flows manually via the terminal if the prompt does not detect your parameters.

## Running Tests

```bash
npm test
```

This runs all tests using Node's built-in test runner. Tests cover flow detection, parameter extraction, and command construction.

##  Installation

1. **Clone or copy** this repository to a local folder

2. **Install the VSCE packager** (if not already):

   ```bash
   npm install -g @vscode/vsce
   ```

3. **Build the `.vsix` package:**

   ```bash
   vsce package
   ```

   This creates a file like:

   ```
   metaflow-dev-0.0.7.vsix
   ```

4. **Install it in VS Code:**

   * Open **Command Palette → Extensions: Install from VSIX...**
   * Choose the generated `.vsix` file
     or run in terminal:

     ```bash
     code --install-extension metaflow-dev-0.0.7.vsix
     ```

5. Reload VS Code window. You’re good to go.

## Optional Customization

You can modify the script names or keybindings in `package.json`:

```json
"keybindings": [
  { "command": "extension.runPythonFunction", "key": "ctrl+alt+r" },
  { "command": "extension.spinPythonFunction", "key": "ctrl+alt+s" }
]
```

