import re
from typing import Any, Dict
from jinja2.sandbox import SandboxedEnvironment

class SafeContextResolver:
    def __init__(self, context: Dict[str, Any]):
        self.context = context
        self.jinja_env = SandboxedEnvironment()

    def render_template(self, template_str: str) -> str:
        """
        Renders strings containing {{ expression }} against context safely.
        """
        if not template_str or not isinstance(template_str, str):
            return template_str
        if "{{" not in template_str:
            return template_str
        try:
            template = self.jinja_env.from_string(template_str)
            return template.render(**self.context)
        except Exception as e:
            # Fallback to regex replacement if Jinja fails on specific syntax
            def replace_match(match):
                expr = match.group(1).strip()
                val = self.get_path_value(expr)
                return str(val) if val is not None else match.group(0)

            return re.sub(r'\{\{\s*([\w\.\_]+)\s*\}\}', replace_match, template_str)

    def evaluate_condition(self, expression: str) -> bool:
        """
        Safely evaluates condition expression against context.
        E.g. "nodes.node_1.output.score >= 80" or "score >= 80".
        """
        if not expression:
            return True
        expr = expression.strip()

        # Render any embedded template tags first: {{ nodes.node_1.output.score }} >= 80
        expr = self.render_template(expr)

        # Context flattening for easy access
        eval_locals = {}
        for k, v in self.context.items():
            eval_locals[k] = v

        # If condition references node output directly (e.g. score >= 80), check trigger and node outputs
        if "nodes" in self.context and isinstance(self.context["nodes"], dict):
            for _, node_data in self.context["nodes"].items():
                if isinstance(node_data, dict) and "output" in node_data and isinstance(node_data["output"], dict):
                    for out_k, out_v in node_data["output"].items():
                        if out_k not in eval_locals:
                            eval_locals[out_k] = out_v

        if "trigger" in self.context and isinstance(self.context["trigger"], dict):
            payload = self.context["trigger"].get("payload", {})
            if isinstance(payload, dict):
                for p_k, p_v in payload.items():
                    if p_k not in eval_locals:
                        eval_locals[p_k] = p_v

        # Safe evaluation of boolean comparisons
        try:
            # We can compile and evaluate with Jinja's sandbox
            result = self.jinja_env.compile_expression(expr)(**eval_locals)
            return bool(result)
        except Exception:
            # Simple fallback comparison parser
            return self._fallback_eval(expr, eval_locals)

    def _fallback_eval(self, expr: str, local_vars: Dict[str, Any]) -> bool:
        # Handles basic operators: >=, <=, ==, !=, >, <, in
        ops = ['>=', '<=', '==', '!=', '>', '<', ' in ']
        for op in ops:
            if op in expr:
                left, right = expr.split(op, 1)
                left_val = self._resolve_val(left.strip(), local_vars)
                right_val = self._resolve_val(right.strip(), local_vars)
                try:
                    if op == '>=': return float(left_val) >= float(right_val)
                    if op == '<=': return float(left_val) <= float(right_val)
                    if op == '==': return left_val == right_val
                    if op == '!=': return left_val != right_val
                    if op == '>': return float(left_val) > float(right_val)
                    if op == '<': return float(left_val) < float(right_val)
                    if op == ' in ': return str(left_val) in str(right_val)
                except Exception:
                    return False
        # If bare variable or boolean literal
        val = self._resolve_val(expr, local_vars)
        return bool(val)

    def _resolve_val(self, token: str, local_vars: Dict[str, Any]) -> Any:
        token = token.strip().strip("'\"")
        if token.lower() == 'true': return True
        if token.lower() == 'false': return False
        if token.isdigit(): return int(token)
        try:
            return float(token)
        except ValueError:
            pass
        return self.get_path_value(token, local_vars)

    def get_path_value(self, path: str, root: Dict[str, Any] = None) -> Any:
        curr = root if root is not None else self.context
        parts = path.split('.')
        for part in parts:
            if isinstance(curr, dict) and part in curr:
                curr = curr[part]
            else:
                return None
        return curr
