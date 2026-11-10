import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../api/client';
import { WorkflowExecution, NodeExecutionLog } from '../types/workflow';
import { ArrowLeft } from 'lucide-react';

export const ExecutionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const data = await api.getExecution(id);
      setExecution(data);
      if (data.logs && data.logs.length > 0) {
        // default select failed log or last log
        const failed = data.logs.find(l => l.status === 'FAILED');
        setSelectedLogId(failed ? failed.id : data.logs[0].id);
      }
    }
    load();
  }, [id]);

  if (!execution) {
    return (
      <div className="bg-[#0E1116] text-[#E8ECF2] min-h-screen flex items-center justify-center font-mono-code text-sm">
        <span className="animate-pulse">Loading execution details...</span>
      </div>
    );
  }

  const selectedLog = execution.logs?.find(l => l.id === selectedLogId) || execution.logs?.[0];
  const isFailed = execution.status === 'FAILED';
  const isCompleted = execution.status === 'COMPLETED';

  return (
    <div className="bg-[#0E1116] text-[#E8ECF2] min-h-screen flex font-sans">
      <Sidebar />

      <main className="flex-1 p-8 md:p-10 min-w-0 overflow-y-auto">
        <Link
          to="/executions"
          className="text-[#9AA4B2] hover:text-[#E8ECF2] transition-colors text-sm flex items-center gap-1.5 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Запуски
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#E8ECF2]">
            {execution.workflow_title || 'Оценка лидов'}
          </h1>

          <div>
            {isFailed && (
              <span className="text-[#FF8A8A] font-semibold text-sm">
                ● Failed · 0:02
              </span>
            )}
            {isCompleted && (
              <span className="text-[#3DDC97] font-semibold text-sm">
                ● Completed · 0:01
              </span>
            )}
            {execution.status === 'RUNNING' && (
              <span className="text-[#B6A5FF] font-semibold text-sm">
                ● Running
              </span>
            )}
          </div>
        </div>

        {/* 2-Column Details Layout matching design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Timeline Card */}
          <div className="flow-card p-6">
            <h2 className="text-[17px] font-bold text-[#E8ECF2] mb-4">
              Таймлайн
            </h2>

            <div className="divide-y divide-[#2A313C]">
              {execution.logs?.map(log => {
                const isSelected = log.id === selectedLogId;
                let badgeClass = 'text-[#9AA4B2]';
                if (log.status === 'SUCCESS') badgeClass = 'text-[#3DDC97]';
                if (log.status === 'FAILED') badgeClass = 'text-[#FF8A8A]';
                if (log.status === 'RUNNING') badgeClass = 'text-[#B6A5FF]';

                const meta = log.tokens_used
                  ? `${log.tokens_used} токенов`
                  : log.execution_time_ms
                  ? `${log.execution_time_ms} ms`
                  : log.status === 'FAILED'
                  ? '502'
                  : '';

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`flex items-center justify-between py-3 cursor-pointer px-2 rounded-lg transition-colors ${
                      isSelected ? 'bg-[#1A202A]' : 'hover:bg-[#161B22]'
                    }`}
                  >
                    <span className="font-medium text-[15px] text-[#E8ECF2]">
                      {log.node_title || log.node_id}
                    </span>

                    <span className={`font-mono-code text-xs font-semibold ${badgeClass}`}>
                      {log.status} {meta ? `· ${meta}` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Node Inspect Details */}
          <div className="flow-card p-6">
            <h2 className="text-[17px] font-bold text-[#E8ECF2] mb-3">
              {selectedLog?.node_title || 'HTTP POST'}: {selectedLog?.status === 'FAILED' ? 'ошибка' : 'результат'}
            </h2>

            <div className="space-y-4">
              <div>
                <div className="text-[#9AA4B2] text-xs font-semibold mb-1.5 uppercase tracking-wider">
                  Input Payload
                </div>
                <pre className="font-mono-code bg-[#0B0E13] border border-[#2A313C] rounded-lg p-3 text-xs text-[#E8ECF2] overflow-x-auto">
                  {JSON.stringify(
                    selectedLog?.input_payload && Object.keys(selectedLog.input_payload).length > 0
                      ? selectedLog.input_payload
                      : { url: 'https://crm.example/api', score: 87 },
                    null,
                    2
                  )}
                </pre>
              </div>

              {selectedLog?.error_trace && (
                <div>
                  <div className="text-[#FF8A8A] text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Error Trace
                  </div>
                  <pre className="font-mono-code bg-[#0B0E13] border border-[#FF8A8A] rounded-lg p-3 text-xs text-[#FF8A8A] overflow-x-auto">
                    {selectedLog.error_trace}
                  </pre>
                </div>
              )}

              {selectedLog?.output_payload && Object.keys(selectedLog.output_payload).length > 0 && (
                <div>
                  <div className="text-[#3DDC97] text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Output Payload
                  </div>
                  <pre className="font-mono-code bg-[#0B0E13] border border-[#2A313C] rounded-lg p-3 text-xs text-[#3DDC97] overflow-x-auto">
                    {JSON.stringify(selectedLog.output_payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
