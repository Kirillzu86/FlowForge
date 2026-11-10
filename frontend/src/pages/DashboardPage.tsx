import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../api/client';
import { Workflow } from '../types/workflow';
import { Plus, Search, Trash2 } from 'lucide-react';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export const DashboardPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await api.getWorkflows();
      setWorkflows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmpty = async () => {
    const newWf = await api.createWorkflow({
      title: 'Новый воркфлоу',
      description: 'Описание нового сценария автоматизации',
      nodes: [
        {
          id: 'node_trigger',
          type: 'trigger',
          position: { x: 50, y: 100 },
          data: { title: 'Webhook', triggerType: 'webhook', webhookPath: `/webhook/${Date.now().toString(36)}` },
        },
      ],
      edges: [],
    });
    navigate(`/workflows/${newWf.id}`);
  };

  const handleCreatePreset = async (presetType: string) => {
    if (presetType === 'leads') {
      navigate('/workflows/wf-leads-01');
    } else {
      await handleCreateEmpty();
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Удалить этот воркфлоу?')) {
      await api.deleteWorkflow(id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
    }
  };

  const filtered = workflows.filter(w =>
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    (w.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#0E1116] text-[#E8ECF2] min-h-screen flex font-sans">
      <Sidebar />

      <main className="flex-1 p-8 md:p-10 min-w-0 overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#E8ECF2]">
            Автоматизации
          </h1>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA4B2]" />
              <input
                type="text"
                placeholder="Поиск по названию"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-[#161B22] border border-[#2A313C] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E8ECF2] placeholder-[#9AA4B2] w-56 outline-none focus:border-[#7C5CFF]"
              />
            </div>

            <button
              onClick={handleCreateEmpty}
              className="flow-btn-primary py-2.5 px-4 text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Создать воркфлоу
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-[#9AA4B2] text-sm animate-pulse py-8">Загрузка автоматизаций...</div>
        )}

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(wf => {
            const isSuccess = wf.last_run_status === 'SUCCESS';
            const isFailed = wf.last_run_status === 'FAILED';
            const isNever = wf.last_run_status === 'NEVER_RUN';

            return (
              <Link
                key={wf.id}
                to={`/workflows/${wf.id}`}
                className="flow-card p-5 hover:border-[#7C5CFF] transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <h3 className="font-semibold text-[17px] text-[#E8ECF2] group-hover:text-[#B6A5FF] transition-colors truncate">
                      {wf.title}
                    </h3>

                    {/* Status Dot */}
                    <div className="shrink-0 text-xs font-semibold">
                      {isSuccess && (
                        <span className="text-[#3DDC97] flex items-center gap-1">
                          ● Success
                        </span>
                      )}
                      {isFailed && (
                        <span className="text-[#FF8A8A] flex items-center gap-1">
                          ● Failed
                        </span>
                      )}
                      {isNever && (
                        <span className="text-[#9AA4B2] flex items-center gap-1">
                          ● Never run
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[#9AA4B2] text-sm leading-[1.5] mb-4 line-clamp-2">
                    {wf.description || 'Нет описания'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[13px] text-[#9AA4B2] pt-3 border-t border-[#2A313C]/40">
                  <span>Изменён {formatDate(wf.updated_at)}</span>
                  <div className="flex items-center gap-3">
                    <span className={wf.is_active ? 'text-[#E8ECF2] font-medium' : 'text-[#9AA4B2]'}>
                      {wf.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={e => handleDelete(e, wf.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#9AA4B2] hover:text-[#FF8A8A] transition-all p-0.5"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* "+ Из пустого шаблона" Card */}
          <button
            onClick={handleCreateEmpty}
            className="border-2 border-dashed border-[#2A313C] rounded-2xl min-h-[150px] flex items-center justify-center text-[#B6A5FF] font-semibold text-[15px] hover:border-[#7C5CFF] hover:bg-[#161B22]/40 transition-all p-5"
          >
            + Из пустого шаблона
          </button>

          {/* "+ Из готового пресета" Card */}
          <button
            onClick={() => handleCreatePreset('leads')}
            className="border-2 border-dashed border-[#2A313C] rounded-2xl min-h-[150px] flex items-center justify-center text-[#B6A5FF] font-semibold text-[15px] hover:border-[#7C5CFF] hover:bg-[#161B22]/40 transition-all p-5"
          >
            + Из готового пресета
          </button>
        </div>
      </main>
    </div>
  );
};
