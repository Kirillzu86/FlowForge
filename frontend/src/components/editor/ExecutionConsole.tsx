import React from 'react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react';

export const ExecutionConsole: React.FC = () => {
  const { isConsoleOpen, toggleConsole, executionStatus, executionLogs, nodes } = useWorkflowStore();

  if (!isConsoleOpen) {
    return (
      <div className="absolute left-4 bottom-4 z-20">
        <button
          onClick={toggleConsole}
          className="flow-btn-secondary bg-[#11151B] text-xs py-1.5 px-3 flex items-center gap-2 shadow-lg"
        >
          <Terminal className="w-3.5 h-3.5 text-[#7C5CFF]" />
          Консоль запуска
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Get active or last node output
  const activeLogWithOutput = [...executionLogs].reverse().find(l => l.output_payload && Object.keys(l.output_payload).length > 0)
    || executionLogs.find(l => l.error_trace);

  const displayedJson = activeLogWithOutput
    ? (activeLogWithOutput.error_trace
        ? { error: activeLogWithOutput.error_trace, output: activeLogWithOutput.output_payload }
        : { output: activeLogWithOutput.output_payload })
    : { output: { score: 87, summary: 'Заявка тёплая' } };

  return (
    <div
      className="absolute left-0 right-0 bottom-0 bg-[#11151B] border-t border-[#2A313C] p-3.5 px-5 z-20 transition-all select-none"
      style={{ height: 230 }}
    >
      {/* Console Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#7C5CFF]" />
          <strong className="text-[13px] text-[#E8ECF2]">Консоль запуска</strong>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#9AA4B2] flex items-center gap-1.5">
            Execution ·
            {executionStatus === 'running' && (
              <span className="text-[#B6A5FF] font-semibold animate-pulse">RUNNING</span>
            )}
            {executionStatus === 'completed' && (
              <span className="text-[#3DDC97] font-semibold">SUCCESS</span>
            )}
            {executionStatus === 'failed' && (
              <span className="text-[#FF8A8A] font-semibold">FAILED</span>
            )}
            {executionStatus === 'idle' && (
              <span className="text-[#9AA4B2]">IDLE</span>
            )}
          </span>

          <button
            onClick={toggleConsole}
            className="text-[#9AA4B2] hover:text-[#E8ECF2] p-1"
            title="Свернуть консоль"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[165px]">
        {/* Left: Step logs list */}
        <div className="font-mono-code text-[12px] space-y-1.5 overflow-y-auto pr-2">
          {executionLogs.length === 0 ? (
            <div className="text-[#9AA4B2] space-y-1 py-1">
              <div><span className="text-[#3DDC97] font-semibold">SUCCESS</span> &nbsp;Webhook · 12 ms</div>
              <div><span className="text-[#B6A5FF] font-semibold">RUNNING</span> &nbsp;Оценка заявки · 842 токена</div>
              <div>PENDING &nbsp;score ≥ 80</div>
            </div>
          ) : (
            executionLogs.map(log => {
              let badgeColor = 'text-[#9AA4B2]';
              if (log.status === 'SUCCESS') badgeColor = 'text-[#3DDC97]';
              if (log.status === 'RUNNING') badgeColor = 'text-[#B6A5FF] animate-pulse';
              if (log.status === 'FAILED') badgeColor = 'text-[#FF8A8A]';
              if (log.status === 'SKIPPED') badgeColor = 'text-gray-500';

              const meta = log.tokens_used
                ? `· ${log.tokens_used} токенов`
                : log.execution_time_ms
                ? `· ${log.execution_time_ms} ms`
                : '';

              return (
                <div key={log.id} className="flex items-center gap-2 text-[#9AA4B2]">
                  <span className={`${badgeColor} font-semibold w-16`}>{log.status}</span>
                  <span className="text-[#E8ECF2] truncate">{log.node_title || log.node_id}</span>
                  <span className="text-xs text-[#9AA4B2]">{meta}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Right: JSON Inspector */}
        <div className="overflow-hidden flex flex-col">
          <div className="text-[11px] font-semibold text-[#9AA4B2] mb-1">PAYLOAD OUTPUT</div>
          <pre className="font-mono-code flex-1 bg-[#0B0E13] border border-[#2A313C] rounded-lg p-2.5 text-[12px] text-[#E8ECF2] overflow-auto">
            {JSON.stringify(displayedJson, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
