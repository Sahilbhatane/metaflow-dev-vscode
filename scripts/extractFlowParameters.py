"""
Extract Metaflow Parameter definitions from a Python flow file using AST only.
Never imports or executes user code.

Usage: python extractFlowParameters.py <path_to_flow.py>

Outputs a JSON array to stdout, e.g.:
[
  {"name": "epochs", "attribute": "epochs", "default": 10, "type": "int", "required": false, "help": "Number of training epochs"},
  {"name": "lr", "attribute": "learning_rate", "default": null, "type": "float", "required": true, "help": null}
]
"""

import json
import sys

from metaflow_flow_ast import extract_parameters


def main():
    if len(sys.argv) != 2:
        print('Usage: python extractFlowParameters.py <flow_file.py>', file=sys.stderr)
        sys.exit(1)

    filepath = sys.argv[1]
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            source = f.read()
    except (OSError, IOError) as e:
        print(f'Cannot read file: {e}', file=sys.stderr)
        sys.exit(1)

    try:
        params = extract_parameters(source)
    except SyntaxError as e:
        print(f'Syntax error in {filepath}: {e}', file=sys.stderr)
        sys.exit(1)

    json.dump(params, sys.stdout, indent=2)
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()
