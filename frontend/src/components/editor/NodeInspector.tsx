import React from 'react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { Copy, Check, Trash2 } from 'lucide-react';

export const NodeInspector: React.FC = () => {
  const { nodes, selectedNodeId, updateNodeData, selectNode, onNodesChange } = useWorkflowStore();
  const [copied, setCopied] = React.useState(false);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <aside className="w-[280px] shrink-0 border-l border-[#2A313C] p-5 text-sm bg-[#0E1116] flex flex-col items-center justify-center text-center text-[#9AA4B2]">
        <p>Выберите узел на холсте для настройки его параметров</p>
      </aside>
    );
  }

  const { type, data } = selectedNode;

  const handleDelete = () => {
    onNodesChange([{ type: 'remove', id: selectedNode.id }]);
    selectNode(null);
  };

  const copyWebhook = () => {
    const fullUrl = `${window.location.origin}/api/v1/workflows/webhook${data.webhookPath || '/ab12'}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-[280px] shrink-0 border-l border-[#2A313C] p-4.5 text-sm bg-[#0E1116] overflow-y-auto select-none">
      {/* Category Tag & Delete button */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-[#B6A5FF] tracking-wider uppercase">
          {type?.toUpperCase()} NODE
        </span>
        <button
          onClick={handleDelete}
          className="text-[#9AA4B2] hover:text-[#FF8A8A] transition-colors p-1"
          title="Удалить узел"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <input
        type="text"
        value={data.title || ''}
        onChange={e => updateNodeData(selectedNode.id, { title: e.target.value })}
        className="w-full bg-transparent text-[18px] font-bold text-[#E8ECF2] border-b border-transparent focus:border-[#7C5CFF] outline-none pb-1 mb-4"
      />

      {/* LLM Controls */}
      {type === 'llm' && (
        <div className="space-y-4">
          <div>
            <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Модель</label>
            <select
              value={data.model || 'gpt-4o'}
              onChange={e => updateNodeData(selectedNode.id, { model: e.target.value })}
              className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[13px] outline-none focus:border-[#7C5CFF]"
            >
              <option value="gpt-4o">gpt-4o (OpenAI)</option>
              <option value="gpt-4o-mini">gpt-4o-mini (OpenAI)</option>
              <option value="claude-3-5-sonnet">claude-3-5-sonnet (Anthropic)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (Google)</option>
              <option value="ollama/llama3">ollama/llama3 (Local)</option>
              <option value="deepseek/deepseek-chat">deepseek-chat</option>
            </select>
          </div>

          <div>
            <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Промпт</label>
            <textarea
              rows={4}
              value={data.prompt || ''}
              onChange={e => updateNodeData(selectedNode.id, { prompt: e.target.value })}
              className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[13px] outline-none focus:border-[#7C5CFF] resize-none"
              placeholder="Введите промпт. Доступны переменные {{ trigger.payload }}..."
            />
          </div>

          <div>
            <div className="flex justify-between text-[#9AA4B2] text-[12px] mb-1.5 font-medium">
              <span>Temperature</span>
              <span className="font-mono-code text-[#E8ECF2]">{data.temperature ?? 0.2}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={data.temperature ?? 0.2}
              onChange={e => updateNodeData(selectedNode.id, { temperature: parseFloat(e.target.value) })}
              className="w-full accent-[#7C5CFF]"
            />
          </div>

          <div>
            <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">max_tokens</label>
            <input
              type="number"
              value={data.max_tokens ?? 1024}
              onChange={e => updateNodeData(selectedNode.id, { max_tokens: parseInt(e.target.value) || 512 })}
              className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[13px] outline-none focus:border-[#7C5CFF]"
            />
          </div>
        </div>
      )}

      {/* Condition Controls */}
      {type === 'condition' && (
        <div className="space-y-4">
          <div>
            <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Выражение условия</label>
            <input
              type="text"
              value={data.expression || 'score >= 80'}
              onChange={e => updateNodeData(selectedNode.id, { expression: e.target.value })}
              className="w-full font-mono-code bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[13px] outline-none focus:border-[#7C5CFF]"
              placeholder="e.g. score >= 80"
            />
          </div>
          <p className="text-xs text-[#9AA4B2] leading-relaxed">
            Поддерживаются сравнения чисел и строк (напр. <code className="text-[#B6A5FF]">score &gt;= 80</code> или <code className="text-[#B6A5FF]">status == 'active'</code>).
          </p>
        </div>
      )}

      {/* Trigger Controls */}
      {type === 'trigger' && (
        <div className="space-y-4">
          <div>
            <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Тип запуска</label>
            <select
              value={data.triggerType || 'webhook'}
              onChange={e => updateNodeData(selectedNode.id, { triggerType: e.target.value })}
              className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[13px] outline-none focus:border-[#7C5CFF]"
            >
              <option value="webhook">Webhook (HTTP)</option>
              <option value="manual">Manual (Кнопка запуска)</option>
              <option value="cron">Cron (По расписанию)</option>
            </select>
          </div>

          <div>
            <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Webhook URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/api/v1/workflows/webhook${data.webhookPath || '/ab12'}`}
                className="w-full font-mono-code bg-[#161B22] border border-[#2A313C] rounded-lg p-2 text-[11px] text-[#9AA4B2] outline-none"
              />
              <button
                onClick={copyWebhook}
                className="flow-btn-secondary p-2 shrink-0"
                title="Копировать URL"
              >
                {copied ? <Check className="w-4 h-4 text-[#3DDC97]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Controls */}
      {type === 'action' && (
        <div className="space-y-4">
          <div>
            <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Метод HTTP</label>
            <select
              value={data.method || 'POST'}
              onChange={e => updateNodeData(selectedNode.id, { method: e.target.value })}
              className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[13px] outline-none focus:border-[#7C5CFF]"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">URL эндпоинта</label>
            <input
              type="text"
              value={data.url || ''}
              onChange={e => updateNodeData(selectedNode.id, { url: e.target.value })}
              className="w-full font-mono-code bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[12px] outline-none focus:border-[#7C5CFF]"
              placeholder="https://api.crm.example.com/v1/leads"
            />
          </div>

          <div>
            <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Тело запроса (JSON)</label>
            <textarea
              rows={4}
              value={data.body || '{}'}
              onChange={e => updateNodeData(selectedNode.id, { body: e.target.value })}
              className="w-full font-mono-code bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[12px] outline-none focus:border-[#7C5CFF] resize-none"
            />
          </div>
        </div>
      )}

      {/* Code Controls */}
      {type === 'code' && (
        <div className="space-y-4">
          <div>
            <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Python код</label>
            <textarea
              rows={8}
              value={data.code || "output = {'result': 'ok'}"}
              onChange={e => updateNodeData(selectedNode.id, { code: e.target.value })}
              className="w-full font-mono-code bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[12px] outline-none focus:border-[#7C5CFF] resize-none leading-relaxed"
            />
          </div>
          <p className="text-xs text-[#9AA4B2]">
            Код выполняется в песочнице с безопасными builtins. Записывайте результат в словарь <code className="text-[#FFA94D]">output</code>.
          </p>
        </div>
      )}
    </aside>
  );
};
