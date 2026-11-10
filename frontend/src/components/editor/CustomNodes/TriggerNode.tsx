import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { WorkflowNodeData } from '../../../types/workflow';

function StatusRing({ status }: { status?: string }) {
  if (status === 'running') return <span className="text-[#7C5CFF] text-[10px] animate-pulse font-bold">● RUN</span>;
  if (status === 'success') return <span className="text-[#3DDC97] text-[10px] font-bold">● OK</span>;
  if (status === 'failed') return <span className="text-[#FF8A8A] text-[10px] font-bold">● ERR</span>;
  if (status === 'skipped') return <span className="text-[#9AA4B2] text-[10px]">● SKIP</span>;
  return null;
}

function nodeBorderStyle(status?: string, selected?: boolean) {
  if (status === 'running') return { borderColor: '#7C5CFF', borderWidth: 2, boxShadow: '0 0 0 4px rgba(124,92,255,0.25)' };
  if (status === 'success') return { borderColor: '#3DDC97', borderWidth: 1 };
  if (status === 'failed') return { borderColor: '#FF8A8A', borderWidth: 2, boxShadow: '0 0 0 3px rgba(255,138,138,0.15)' };
  if (status === 'skipped') return { borderColor: '#2A313C', borderWidth: 1, opacity: 0.55 };
  if (selected) return { borderColor: '#7C5CFF', borderWidth: 2 };
  return { borderColor: '#2A313C', borderWidth: 1 };
}

const handleStyle = (color: string, pos: 'left' | 'right') => ({
  width: 9,
  height: 9,
  backgroundColor: color,
  border: '2px solid #0B0E13',
  [pos]: -5,
});

// ─── Trigger Node ───────────────────────────────────────────────────────────
export const TriggerNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as WorkflowNodeData;
  return (
    <div className="flow-card select-none cursor-pointer transition-all duration-150"
      style={{ width: 155, padding: '11px 12px', background: '#161B22', ...nodeBorderStyle(d.status, selected) }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold tracking-wider text-[#3DDC97] uppercase">Триггер</span>
        <StatusRing status={d.status} />
      </div>
      <div className="text-[14px] font-semibold text-[#E8ECF2] truncate">{d.title || 'Webhook'}</div>
      <div className="font-mono-code text-[11px] text-[#9AA4B2] truncate mt-0.5">
        {d.triggerType === 'cron' ? '⏰ ' + (d.cronExpr || '0 * * * *') : d.webhookPath || '/webhook/ab12'}
      </div>
      {d.execution_time_ms != null && (
        <div className="text-[10px] text-[#9AA4B2] mt-1.5 font-mono-code">{d.execution_time_ms}ms</div>
      )}
      <Handle type="source" position={Position.Right} style={handleStyle('#3DDC97', 'right')} />
    </div>
  );
};

// ─── LLM Node ───────────────────────────────────────────────────────────────
export const LLMNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as WorkflowNodeData;
  const modelShort = (d.model || 'gpt-4o').split('/').pop() || 'gpt-4o';
  return (
    <div className="flow-card select-none cursor-pointer transition-all duration-150"
      style={{ width: 175, padding: '11px 12px', background: '#161B22', ...nodeBorderStyle(d.status, selected) }}>
      <Handle type="target" position={Position.Left} style={handleStyle('#B6A5FF', 'left')} />
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold tracking-wider text-[#B6A5FF] uppercase">AI Model</span>
        <StatusRing status={d.status} />
      </div>
      <div className="text-[14px] font-semibold text-[#E8ECF2] truncate">{d.title || 'Оценка заявки'}</div>
      <div className="font-mono-code text-[11px] text-[#9AA4B2] truncate mt-0.5">
        {modelShort} · t={d.temperature ?? 0.2}
      </div>
      {d.tokens_used != null && d.tokens_used > 0 && (
        <div className="text-[10px] text-[#B6A5FF] mt-1.5 font-mono-code">
          {d.tokens_used} tok · {d.execution_time_ms}ms
        </div>
      )}
      {d.output && d.status === 'success' && (
        <div className="mt-2 text-[10px] font-mono-code bg-[#0E1116] rounded p-1.5 text-[#3DDC97] truncate">
          {JSON.stringify(d.output).slice(0, 50)}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={handleStyle('#7C5CFF', 'right')} />
    </div>
  );
};

// ─── Condition Node ──────────────────────────────────────────────────────────
export const ConditionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as WorkflowNodeData;
  const result = d.output?.result;
  return (
    <div className="flow-card select-none cursor-pointer transition-all duration-150"
      style={{ width: 155, padding: '11px 12px', background: '#161B22', ...nodeBorderStyle(d.status, selected) }}>
      <Handle type="target" position={Position.Left} style={handleStyle('#9AA4B2', 'left')} />
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold tracking-wider text-[#FFA94D] uppercase">Условие</span>
        <StatusRing status={d.status} />
      </div>
      <div className="font-mono-code text-[13px] font-medium text-[#E8ECF2] truncate">{d.expression || 'score ≥ 80'}</div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className={`text-[11px] font-semibold ${result === true ? 'text-[#3DDC97]' : 'text-[#9AA4B2]'}`}>● true</span>
        <span className={`text-[11px] font-semibold ${result === false ? 'text-[#FFA94D]' : 'text-[#9AA4B2]'}`}>● false</span>
      </div>
      {/* true → top handle, false → bottom handle */}
      <Handle type="source" position={Position.Right} id="true"
        style={{ ...handleStyle('#3DDC97', 'right'), top: '35%' }} />
      <Handle type="source" position={Position.Right} id="false"
        style={{ ...handleStyle('#FFA94D', 'right'), top: '72%' }} />
    </div>
  );
};

// ─── Action Node ─────────────────────────────────────────────────────────────
export const ActionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as WorkflowNodeData;
  const urlShort = (d.url || '').replace(/^https?:\/\//, '').slice(0, 28);
  return (
    <div className="flow-card select-none cursor-pointer transition-all duration-150"
      style={{ width: 165, padding: '11px 12px', background: '#161B22', ...nodeBorderStyle(d.status, selected) }}>
      <Handle type="target" position={Position.Left} style={handleStyle('#60A5FA', 'left')} />
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold tracking-wider text-[#60A5FA] uppercase">HTTP {d.method || 'POST'}</span>
        <StatusRing status={d.status} />
      </div>
      <div className="text-[14px] font-semibold text-[#E8ECF2] truncate">{d.title || 'HTTP Request'}</div>
      {urlShort && (
        <div className="font-mono-code text-[11px] text-[#9AA4B2] truncate mt-0.5">{urlShort}</div>
      )}
      {d.output?.status_code && (
        <div className={`text-[10px] mt-1.5 font-mono-code font-semibold ${d.output.status_code < 300 ? 'text-[#3DDC97]' : 'text-[#FF8A8A]'}`}>
          HTTP {d.output.status_code} · {d.execution_time_ms}ms
        </div>
      )}
      <Handle type="source" position={Position.Right} style={handleStyle('#60A5FA', 'right')} />
    </div>
  );
};

// ─── Code Node ───────────────────────────────────────────────────────────────
export const CodeNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as WorkflowNodeData;
  const preview = (d.code || 'output = {}').split('\n')[0].slice(0, 32);
  return (
    <div className="flow-card select-none cursor-pointer transition-all duration-150"
      style={{ width: 165, padding: '11px 12px', background: '#161B22', ...nodeBorderStyle(d.status, selected) }}>
      <Handle type="target" position={Position.Left} style={handleStyle('#F59E0B', 'left')} />
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold tracking-wider text-[#F59E0B] uppercase">Python</span>
        <StatusRing status={d.status} />
      </div>
      <div className="text-[14px] font-semibold text-[#E8ECF2] truncate">{d.title || 'Code'}</div>
      <div className="font-mono-code text-[11px] text-[#9AA4B2] truncate mt-0.5">{preview}</div>
      {d.execution_time_ms != null && d.status !== 'skipped' && (
        <div className="text-[10px] text-[#F59E0B] mt-1.5 font-mono-code">{d.execution_time_ms}ms</div>
      )}
      <Handle type="source" position={Position.Right} style={handleStyle('#F59E0B', 'right')} />
    </div>
  );
};
