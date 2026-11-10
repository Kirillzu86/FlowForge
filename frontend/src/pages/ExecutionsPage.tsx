import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../api/client';
import { WorkflowExecution } from '../types/workflow';
import { RefreshCw } from 'lucide-react';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms: number | undefined): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export const ExecutionsPage: React.FC = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.getExecutions();
      setExecutions(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Compute metrics
  const total = executions.length;
  const completed = executions.filter(e => e.status === 'COMPLETED').length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalTokens = executions.reduce((sum, e) => sum + (e.total_tokens || 0), 0);
  const tokensDisplay = totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(0)}k` : String(totalTokens);

  return (
    <div className="bg-[#0E1116] text-[#E8ECF2] min-h-screen flex font-sans">
      <Sidebar />

      <main className="flex-1 p-8 md:p-10 min-w-0 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#E8ECF2]">
            История запусков
          </h1>
          <button
            onClick={load}
            className="flow-btn-secondary p-2.5 text-[#9AA4B2] hover:text-[#E8ECF2]"
            title="Обновить"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="flow-card p-5">
            <div className="text-[#9AA4B2] text-[13px]">Всего запусков</div>
            <div className="text-3xl font-bold mt-1.5 text-[#E8ECF2]">{total || '—'}</div>
          </div>

          <div className="flow-card p-5">
            <div className="text-[#9AA4B2] text-[13px]">Успешных</div>
            <div className={`text-3xl font-bold mt-1.5 ${successRate >= 80 ? 'text-[#3DDC97]' : successRate >= 50 ? 'text-[#FFA94D]' : 'text-[#FF8A8A]'}`}>
              {total > 0 ? `${successRate}%` : '—'}
            </div>
          </div>

          <div className="flow-card p-5">
            <div className="text-[#9AA4B2] text-[13px]">Токенов использовано</div>
            <div className="text-3xl font-bold mt-1.5 text-[#E8ECF2]">{tokensDisplay || '—'}</div>
          </div>
        </div>

        {/* Executions Table */}
        <div className="flow-card p-0 overflow-hidden">
          <div className="grid grid-cols-5 p-4 px-6 text-[#9AA4B2] text-[12px] font-semibold border-b border-[#2A313C] uppercase tracking-wider">
            <span>Воркфлоу</span>
            <span>Статус</span>
            <span>Триггер</span>
            <span>Длительность</span>
            <span>Запущен</span>
          </div>

          <div className="divide-y divide-[#2A313C]">
            {loading && (
              <div className="p-8 text-center text-[#9AA4B2] text-sm animate-pulse">
                Загрузка запусков...
              </div>
            )}
            {!loading && executions.length === 0 && (
              <div className="p-8 text-center text-[#9AA4B2] text-sm">
                Нет запусков. Откройте воркфлоу и нажмите «Test Run».
              </div>
            )}
            {executions.map(exec => {
              const isRunning = exec.status === 'RUNNING';
              const isSuccess = exec.status === 'COMPLETED';
              const isFailed = exec.status === 'FAILED';

              return (
                <Link
                  key={exec.id}
                  to={`/executions/${exec.id}`}
                  className="grid grid-cols-5 p-4 px-6 items-center text-sm hover:bg-[#1A202A] transition-colors"
                >
                  <span className="font-semibold text-[#E8ECF2] hover:text-[#B6A5FF] transition-colors truncate pr-2">
                    {exec.workflow_title || 'Оценка лидов'}
                  </span>

                  <div>
                    {isRunning && (
                      <span className="text-[#B6A5FF] font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#B6A5FF] animate-ping inline-block" />
                        Running
                      </span>
                    )}
                    {isSuccess && (
                      <span className="text-[#3DDC97] font-semibold">● Completed</span>
                    )}
                    {isFailed && (
                      <span className="text-[#FF8A8A] font-semibold">● Failed</span>
                    )}
                    {!isRunning && !isSuccess && !isFailed && (
                      <span className="text-[#9AA4B2]">● {exec.status}</span>
                    )}
                  </div>

                  <span className="font-mono-code text-xs text-[#9AA4B2]">
                    {exec.trigger_type}
                  </span>

                  <span className="font-mono-code text-[#E8ECF2] text-sm">
                    {formatDuration(exec.duration_ms)}
                  </span>

                  <span className="text-[#9AA4B2] text-xs">
                    {formatDate(exec.started_at)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};
