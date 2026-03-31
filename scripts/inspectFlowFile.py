"""
Emit a single JSON object describing syntax, FlowSpec presence, and parameters.

Usage: python inspectFlowFile.py <path_to_flow.py>

Always exits 0 when JSON is printed to stdout so callers can parse reliably.
"""

import json
import sys

from metaflow_flow_ast import analyze_flow_source


def main():
    if len(sys.argv) != 2:
        result = {
            'syntaxOk': False,
            'hasFlowSpec': False,
            'parameters': [],
            'error': 'Usage: python inspectFlowFile.py <flow_file.py>',
        }
        json.dump(result, sys.stdout, indent=2)
        sys.stdout.write('\n')
        sys.exit(0)

    filepath = sys.argv[1]
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            source = f.read()
    except (OSError, IOError) as e:
        result = {
            'syntaxOk': False,
            'hasFlowSpec': False,
            'parameters': [],
            'error': f'Cannot read file: {e}',
        }
        json.dump(result, sys.stdout, indent=2)
        sys.stdout.write('\n')
        sys.exit(0)

    analyzed = analyze_flow_source(source)
    # Normalize: ensure error key exists when syntaxOk is False
    out = {
        'syntaxOk': analyzed['syntaxOk'],
        'hasFlowSpec': analyzed['hasFlowSpec'],
        'parameters': analyzed['parameters'],
        'error': analyzed.get('error'),
    }
    json.dump(out, sys.stdout, indent=2)
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()
