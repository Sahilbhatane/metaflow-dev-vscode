"""
AST-only helpers for Metaflow flow files. Never imports or executes user code.
"""

from __future__ import annotations

import ast
from typing import Any, Optional, Tuple


def _get_call_name(node: ast.AST) -> Optional[str]:
    """Return the simple name of a Call target, e.g. 'Parameter' or None."""
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def _get_literal(node: ast.AST) -> Any:
    """Return a JSON-safe literal from an AST Constant node, or None."""
    if isinstance(node, ast.Constant) and isinstance(node.value, (str, int, float, bool)):
        return node.value
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        inner = _get_literal(node.operand)
        if isinstance(inner, (int, float)):
            return -inner
    return None


def _get_type_name(node: ast.AST) -> Optional[str]:
    """Return the type name string from a simple Name node like str/int/float/bool."""
    if isinstance(node, ast.Name) and node.id in ('str', 'int', 'float', 'bool', 'JSONType'):
        return node.id
    return None


def _is_flowspec_base(base: ast.AST) -> bool:
    """Check whether a base class node refers to FlowSpec."""
    if isinstance(base, ast.Name) and base.id == 'FlowSpec':
        return True
    if isinstance(base, ast.Attribute) and base.attr == 'FlowSpec':
        return True
    return False


def has_flowspec_subclass(tree: ast.AST) -> bool:
    """True if the module defines at least one class inheriting from FlowSpec."""
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and any(_is_flowspec_base(b) for b in node.bases):
            return True
    return False


def _extract_parameter(call_node: ast.Call, attribute_name: str) -> dict[str, Any]:
    """Extract parameter metadata from a Parameter(...) call AST node."""
    param: dict[str, Any] = {
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


def _parameter_from_class_body_item(item: ast.stmt) -> Optional[Tuple[ast.Call, str]]:
    """
    Match `x = Parameter(...)` or annotated `x: T = Parameter(...)`.
    Returns (call_node, attribute_name) or None.
    """
    if isinstance(item, ast.Assign):
        if len(item.targets) != 1 or not isinstance(item.targets[0], ast.Name):
            return None
        if not isinstance(item.value, ast.Call):
            return None
        if _get_call_name(item.value.func) != 'Parameter':
            return None
        return (item.value, item.targets[0].id)
    if isinstance(item, ast.AnnAssign):
        if not isinstance(item.target, ast.Name):
            return None
        if not isinstance(item.value, ast.Call):
            return None
        if _get_call_name(item.value.func) != 'Parameter':
            return None
        return (item.value, item.target.id)
    return None


def extract_parameters_from_tree(tree: ast.AST) -> list[dict[str, Any]]:
    """Collect Parameter(...) definitions from FlowSpec subclasses in a parsed tree."""
    parameters: list[dict[str, Any]] = []

    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef):
            continue
        if not any(_is_flowspec_base(b) for b in node.bases):
            continue

        for item in node.body:
            got = _parameter_from_class_body_item(item)
            if got is None:
                continue
            call_node, attr_name = got
            parameters.append(_extract_parameter(call_node, attr_name))

    return parameters


def extract_parameters(source: str) -> list[dict[str, Any]]:
    """Parse source and return Parameter definitions from FlowSpec classes."""
    tree = ast.parse(source)
    return extract_parameters_from_tree(tree)


def analyze_flow_source(source: str) -> dict[str, Any]:
    """
    Single parse: syntax validity, FlowSpec presence, and parameters.

    Returns keys: syntaxOk (bool), hasFlowSpec (bool), parameters (list),
    and error (str | None) when syntaxOk is False.
    """
    try:
        tree = ast.parse(source)
    except SyntaxError as e:
        msg = e.msg or 'invalid syntax'
        line = e.lineno
        err = f'Syntax error: {msg}' + (f' (line {line})' if line else '')
        return {
            'syntaxOk': False,
            'hasFlowSpec': False,
            'parameters': [],
            'error': err,
        }

    has_flow = has_flowspec_subclass(tree)
    params = extract_parameters_from_tree(tree)

    return {
        'syntaxOk': True,
        'hasFlowSpec': has_flow,
        'parameters': params,
        'error': None,
    }
