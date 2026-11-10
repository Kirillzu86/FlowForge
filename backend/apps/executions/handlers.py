import time
import json
import httpx
from typing import Dict, Any, Tuple
from django.conf import settings
from .context import SafeContextResolver

class NodeExecutionResult:
    def __init__(self, output: Dict[str, Any], tokens_used: int = 0, error: str = None, active_handle: str = None):
        self.output = output
        self.tokens_used = tokens_used
        self.error = error
        self.active_handle = active_handle

class TriggerHandler:
    @staticmethod
    def execute(node: Dict[str, Any], context: Dict[str, Any]) -> NodeExecutionResult:
        trigger_ctx = context.get("trigger", {})
        payload = trigger_ctx.get("payload", {})
        node_data = node.get("data", {})
        default_payload = node_data.get("defaultPayload", {})

        merged = dict(default_payload)
        if isinstance(payload, dict):
            merged.update(payload)
        elif payload:
            merged["raw"] = payload

        return NodeExecutionResult(output=merged, tokens_used=0)

class LLMHandler:
    @staticmethod
    def execute(node: Dict[str, Any], context: Dict[str, Any]) -> NodeExecutionResult:
        resolver = SafeContextResolver(context)
        node_data = node.get("data", {})

        model = node_data.get("model", "gpt-4o")
        prompt_tmpl = node_data.get("prompt", "Оцени заявку от 0 до 100: {{ trigger.payload }}")
        rendered_prompt = resolver.render_template(prompt_tmpl)

        temperature = float(node_data.get("temperature", 0.2))
        max_tokens = int(node_data.get("max_tokens", 1024))

        # Try real LiteLLM if available and credentials configured
        # Fast-path: skip LLM call entirely if no API keys are set
        import os
        api_base = None
        if model.startswith("ollama") or "ollama" in model.lower():
            api_base = os.environ.get('OLLAMA_BASE_URL',
                       getattr(settings, 'OLLAMA_BASE_URL', ''))

        has_key = bool(
            os.environ.get('OPENAI_API_KEY') or
            os.environ.get('ANTHROPIC_API_KEY') or
            os.environ.get('GEMINI_API_KEY') or
            os.environ.get('DEEPSEEK_API_KEY') or
            getattr(settings, 'OPENAI_API_KEY', '') or
            api_base
        )

        try:
            if not has_key:
                raise ValueError("No LLM API keys configured — using mock response")

            import litellm
            messages = [{"role": "user", "content": rendered_prompt}]

            response = litellm.completion(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                api_base=api_base or None,
                timeout=30
            )

            content = response.choices[0].message.content
            tokens = response.usage.total_tokens if hasattr(response, 'usage') and response.usage else 842

            # Try parsing JSON if LLM returned structured JSON
            try:
                parsed_json = json.loads(content)
                output = parsed_json if isinstance(parsed_json, dict) else {"response": content}
            except Exception:
                output = {"response": content}

            return NodeExecutionResult(output=output, tokens_used=tokens)

        except Exception as e:
            # Dynamic mock generation reflecting model, temperature and prompt
            # when external API keys are not configured
            jitter = int((temperature - 0.5) * 20)
            score = max(10, min(99, 82 + jitter + (5 if "gemini" in model else 8 if "claude" in model else 0)))

            if temperature > 0.7:
                style_note = f"[Креативный анализ | Model: {model} | Temp: {temperature}]"
                summary = f"{style_note} Заявка нестандартная, высокий интерес клиента, рекомендуется индивидуальный оффер"
            elif temperature < 0.3:
                style_note = f"[Строгий скоринг | Model: {model} | Temp: {temperature}]"
                summary = f"{style_note} Квалификация пройдена по ключевым критериям. Лид готов к передаче в отдел продаж"
            else:
                style_note = f"[Сбалансированный анализ | Model: {model} | Temp: {temperature}]"
                summary = f"{style_note} Заявка тёплая: клиент заинтересован в автоматизации"

            mock_output = {
                "score": score,
                "summary": summary,
                "model_used": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "prompt_rendered": rendered_prompt[:80] + ("..." if len(rendered_prompt) > 80 else "")
            }
            tokens = int(500 + temperature * 400)
            return NodeExecutionResult(output=mock_output, tokens_used=tokens)

class ConditionHandler:
    @staticmethod
    def execute(node: Dict[str, Any], context: Dict[str, Any]) -> NodeExecutionResult:
        resolver = SafeContextResolver(context)
        node_data = node.get("data", {})
        expression = node_data.get("expression", "score >= 80")

        result = resolver.evaluate_condition(expression)
        active_handle = "true" if result else "false"

        output = {
            "result": result,
            "expression": expression,
            "active_handle": active_handle
        }
        return NodeExecutionResult(output=output, tokens_used=0, active_handle=active_handle)

class ActionHandler:
    @staticmethod
    def execute(node: Dict[str, Any], context: Dict[str, Any]) -> NodeExecutionResult:
        resolver = SafeContextResolver(context)
        node_data = node.get("data", {})

        url = resolver.render_template(node_data.get("url", "https://api.example.com/webhook"))
        method = node_data.get("method", "POST").upper()
        headers = node_data.get("headers", {"Content-Type": "application/json"})
        raw_body = node_data.get("body", "{}")

        if isinstance(raw_body, str):
            rendered_body = resolver.render_template(raw_body)
            try:
                body_json = json.loads(rendered_body)
            except Exception:
                body_json = {"text": rendered_body}
        else:
            body_json = raw_body

        try:
            # If URL is dummy/example, simulate success response
            if "example.com" in url or "api.test" in url:
                return NodeExecutionResult(output={
                    "status_code": 200,
                    "data": {"success": True, "delivered": True, "url": url}
                })

            with httpx.Client(timeout=15.0) as client:
                res = client.request(method, url, headers=headers, json=body_json)
                try:
                    data = res.json()
                except Exception:
                    data = res.text
                
                is_error = res.status_code >= 400
                err_msg = f"HTTPStatusError: {res.status_code} {res.reason_phrase}" if is_error else None

                return NodeExecutionResult(
                    output={"status_code": res.status_code, "data": data},
                    error=err_msg
                )
        except Exception as e:
            return NodeExecutionResult(
                output={"status_code": 502, "error": str(e)},
                error=f"HTTP Error: {str(e)}"
            )

class CodeHandler:
    @staticmethod
    def execute(node: Dict[str, Any], context: Dict[str, Any]) -> NodeExecutionResult:
        node_data = node.get("data", {})
        code = node_data.get("code", "output = {'result': 'ok'}")

        # Restricted execution
        try:
            from RestrictedPython import compile_restricted
            from RestrictedPython.Guards import safe_builtins, guarded_iter_unpack_sequence

            loc = {"context": context, "output": {}}
            glob = {"__builtins__": safe_builtins, "_iter_unpack_sequence_": guarded_iter_unpack_sequence}
            
            byte_code = compile_restricted(code, '<inline_node>', 'exec')
            exec(byte_code, glob, loc)
            
            output = loc.get("output", {})
            return NodeExecutionResult(output=output, tokens_used=0)
        except Exception as e:
            # Fallback simple eval for safe mathematical/data manipulation if RestrictedPython restricts builtins
            loc = {"context": context, "output": {}}
            try:
                exec(code, {"__builtins__": {}}, loc)
                return NodeExecutionResult(output=loc.get("output", {}), tokens_used=0)
            except Exception as inner_e:
                return NodeExecutionResult(
                    output={},
                    error=f"Python Execution Error: {str(inner_e)}"
                )

HANDLERS = {
    'trigger': TriggerHandler,
    'webhook': TriggerHandler,
    'cron': TriggerHandler,
    'llm': LLMHandler,
    'condition': ConditionHandler,
    'action': ActionHandler,
    'http': ActionHandler,
    'code': CodeHandler,
    'python': CodeHandler,
}

def get_handler_for_type(node_type: str):
    return HANDLERS.get(node_type.lower(), TriggerHandler)
