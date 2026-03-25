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

import ast
import json
import sys


def _get_call_name(node):
    """Return the simple name of a Call target, e.g. 'Parameter' or None."""
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def _get_literal(node):
    """Return a JSON-safe literal from an AST Constant node, or None."""
    if isinstance(node, ast.Constant) and isinstance(node.value, (str, int, float, bool)):
        return node.value
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        inner = _get_literal(node.operand)
        if isinstance(inner, (int, float)):
            return -inner
    return None


def _get_type_name(node):
    """Return the type name string from a simple Name node like str/int/float/bool."""
    if isinstance(node, ast.Name) and node.id in ('str', 'int', 'float', 'bool', 'JSONType'):
        return node.id
    return None


def _is_flowspec_base(base):
    """Check whether a base class node refers to FlowSpec."""
    if isinstance(base, ast.Name) and base.id == 'FlowSpec':
        return True
    if isinstance(base, ast.Attribute) and base.attr == 'FlowSpec':
        return True
    return False


def _extract_parameter(call_node, attribute_name):
    """Extract parameter metadata from a Parameter(...) call AST node."""
    param = {
        'name': None,
        'attribute': attribute_name,
        'default': None,
        'type': None,
        'required': False,
        'help': None,
    }

    if call_node.args:
        name_val = _get_literal(call_node.args[0])
        if isinstance(name_val, str):
            param['name'] = name_val

    if param['name'] is None:
        param['name'] = attribute_name

    for kw in call_node.keywords:
        if kw.arg == 'default':
            param['default'] = _get_literal(kw.value)
        elif kw.arg == 'type':
            param['type'] = _get_type_name(kw.value)
        elif kw.arg == 'required':
            if isinstance(kw.value, ast.Constant) and kw.value.value is True:
                param['required'] = True
        elif kw.arg == 'help':
            help_val = _get_literal(kw.value)
            if isinstance(help_val, str):
                param['help'] = help_val

    return param


def extract_parameters(source):
    """Parse source and return a list of parameter dicts from FlowSpec classes."""
    tree = ast.parse(source)
    parameters = []

    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef):
            continue
        if not any(_is_flowspec_base(b) for b in node.bases):
            continue

        for item in node.body:
            if not isinstance(item, ast.Assign):
                continue
            if len(item.targets) != 1 or not isinstance(item.targets[0], ast.Name):
                continue
            if not isinstance(item.value, ast.Call):
                continue
            if _get_call_name(item.value.func) != 'Parameter':
                continue

            attr_name = item.targets[0].id
            parameters.append(_extract_parameter(item.value, attr_name))

    return parameters


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
