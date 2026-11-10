import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../api/client';
import { Credential } from '../types/workflow';
import { Plus, Trash2, KeyRound, X } from 'lucide-react';

export const SecretsPage: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('OPENAI');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecrets();
  }, []);

  const loadSecrets = async () => {
    try {
      const data = await api.getCredentials();
      setCredentials(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value) return;
    try {
      const newCred = await api.createCredential({ name, provider, value });
      setCredentials(prev => [newCred, ...prev]);
      setIsModalOpen(false);
      setName('');
      setValue('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить секретный ключ?')) {
      await api.deleteCredential(id);
      setCredentials(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="bg-[#0E1116] text-[#E8ECF2] min-h-screen flex font-sans">
      <Sidebar />

      <main className="flex-1 p-8 md:p-10 min-w-0 overflow-y-auto relative">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#E8ECF2]">
            Секреты
          </h1>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flow-btn-primary py-2.5 px-4 text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Добавить ключ
          </button>
        </div>

        {/* Credentials Table */}
        <div className="flow-card p-0 overflow-hidden mb-4">
          <div className="grid grid-cols-5 p-4 px-6 text-[#9AA4B2] text-[12px] font-semibold border-b border-[#2A313C] uppercase tracking-wider">
            <span className="col-span-2">Название</span>
            <span>Провайдер</span>
            <span>Значение</span>
            <span className="text-right">Действия</span>
          </div>

          <div className="divide-y divide-[#2A313C]">
            {credentials.map(c => (
              <div
                key={c.id}
                className="grid grid-cols-5 p-4 px-6 items-center text-sm hover:bg-[#1A202A] transition-colors"
              >
                <div className="col-span-2 font-semibold text-[#E8ECF2] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#7C5CFF]" />
                  {c.name}
                </div>
                <span className="text-xs font-mono-code text-[#9AA4B2]">
                  {c.provider}
                </span>
                <span className="font-mono-code text-[#E8ECF2] text-xs">
                  {c.masked_value}
                </span>
                <div className="text-right">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-[#9AA4B2] hover:text-[#FF8A8A] transition-colors p-1"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[#9AA4B2] text-[13px] leading-relaxed">
          Значения шифруются (Fernet) и после сохранения не показываются в открытом виде.
        </p>

        {/* Add Secret Modal matching design */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="flow-card w-full max-w-[380px] p-6 shadow-2xl bg-[#161B22] border-[#2A313C]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-bold text-[#E8ECF2]">
                  Новый секрет
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#9AA4B2] hover:text-[#E8ECF2]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-[#9AA4B2] text-[12px] font-medium mb-1.5">
                    Название
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. OpenAI production key"
                    className="w-full bg-[#0E1116] border border-[#2A313C] rounded-lg p-2.5 text-sm text-[#E8ECF2] outline-none focus:border-[#7C5CFF]"
                  />
                </div>

                <div>
                  <label className="block text-[#9AA4B2] text-[12px] font-medium mb-1.5">
                    Провайдер
                  </label>
                  <select
                    value={provider}
                    onChange={e => setProvider(e.target.value)}
                    className="w-full bg-[#0E1116] border border-[#2A313C] rounded-lg p-2.5 text-sm text-[#E8ECF2] outline-none focus:border-[#7C5CFF]"
                  >
                    <option value="OPENAI">OpenAI</option>
                    <option value="ANTHROPIC">Anthropic</option>
                    <option value="GEMINI">Google Gemini</option>
                    <option value="DEEPSEEK">DeepSeek</option>
                    <option value="CUSTOM_HEADER">Custom Header (Bearer / Token)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#9AA4B2] text-[12px] font-medium mb-1.5">
                    Ключ / Секрет
                  </label>
                  <input
                    type="password"
                    required
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full font-mono-code bg-[#0E1116] border border-[#2A313C] rounded-lg p-2.5 text-sm text-[#E8ECF2] outline-none focus:border-[#7C5CFF]"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-3">
                  <button
                    type="submit"
                    className="flow-btn-primary flex-1 py-2.5 text-sm"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flow-btn-secondary py-2.5 px-4 text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
