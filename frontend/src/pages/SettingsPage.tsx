import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Save, Key, Bell, Globe, Shield, User } from 'lucide-react';

type Tab = 'profile' | 'api' | 'notifications' | 'security';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saved, setSaved] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'api', label: 'API ключи', icon: Key },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'security', label: 'Безопасность', icon: Shield },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-[#0E1116] text-[#E8ECF2] min-h-screen flex font-sans">
      <Sidebar />

      <main className="flex-1 p-8 md:p-10 min-w-0 overflow-y-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-[#E8ECF2] mb-8">Настройки</h1>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 border-b border-[#2A313C]">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-[#E8ECF2] border-[#7C5CFF]'
                    : 'text-[#9AA4B2] border-transparent hover:text-[#E8ECF2]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flow-card p-6">
              <h2 className="text-[16px] font-semibold text-[#E8ECF2] mb-5">Личные данные</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Имя</label>
                  <input
                    type="text"
                    defaultValue="Команда FlowForge"
                    className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[14px] outline-none focus:border-[#7C5CFF]"
                  />
                </div>
                <div>
                  <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Email</label>
                  <input
                    type="email"
                    defaultValue="team@flowforge.dev"
                    className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[14px] outline-none focus:border-[#7C5CFF]"
                  />
                </div>
                <div>
                  <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Организация</label>
                  <input
                    type="text"
                    defaultValue="FlowForge Inc."
                    className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[14px] outline-none focus:border-[#7C5CFF]"
                  />
                </div>
              </div>
            </div>

            <div className="flow-card p-6">
              <h2 className="text-[16px] font-semibold text-[#E8ECF2] mb-2">Тарифный план</h2>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#B6A5FF] font-semibold text-[15px]">Pro Plan</span>
                  <p className="text-[#9AA4B2] text-[13px] mt-1">До 50 воркфлоу · 1M токенов/мес · 5 пользователей</p>
                </div>
                <span className="text-[#3DDC97] text-[13px] font-semibold bg-[#3DDC97]/10 px-3 py-1 rounded-full">Активен</span>
              </div>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="flow-card p-6">
              <h2 className="text-[16px] font-semibold text-[#E8ECF2] mb-2">Webhook Base URL</h2>
              <p className="text-[#9AA4B2] text-[13px] mb-4">Базовый URL для входящих вебхуков</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/api/v1/workflows/webhook/`}
                  className="w-full font-mono-code bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[12px] text-[#9AA4B2] outline-none"
                />
              </div>
            </div>

            <div className="flow-card p-6">
              <h2 className="text-[16px] font-semibold text-[#E8ECF2] mb-2">Personal Access Token</h2>
              <p className="text-[#9AA4B2] text-[13px] mb-4">Используйте для доступа к REST API</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  defaultValue="ff-pat-xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full font-mono-code bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[12px] text-[#9AA4B2] outline-none"
                />
                <button className="flow-btn-secondary px-4 text-sm shrink-0">Обновить</button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="flow-card p-6 space-y-5">
            <h2 className="text-[16px] font-semibold text-[#E8ECF2] mb-1">Уведомления</h2>
            {[
              { label: 'Уведомлять об ошибках выполнения', defaultChecked: true },
              { label: 'Еженедельный дайджест запусков', defaultChecked: false },
              { label: 'Уведомления о достижении лимитов токенов', defaultChecked: true },
              { label: 'Новости и обновления платформы', defaultChecked: false },
            ].map((item, i) => (
              <label key={i} className="flex items-center justify-between cursor-pointer group">
                <span className="text-[#E8ECF2] text-[14px] group-hover:text-white transition-colors">{item.label}</span>
                <input
                  type="checkbox"
                  defaultChecked={item.defaultChecked}
                  className="accent-[#7C5CFF] w-4 h-4"
                />
              </label>
            ))}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="flow-card p-6">
              <h2 className="text-[16px] font-semibold text-[#E8ECF2] mb-5">Смена пароля</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Текущий пароль</label>
                  <input type="password" className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[14px] outline-none focus:border-[#7C5CFF]" />
                </div>
                <div>
                  <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Новый пароль</label>
                  <input type="password" className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[14px] outline-none focus:border-[#7C5CFF]" />
                </div>
                <div>
                  <label className="block text-[#9AA4B2] text-[12px] mb-1.5 font-medium">Подтверждение пароля</label>
                  <input type="password" className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-[#E8ECF2] text-[14px] outline-none focus:border-[#7C5CFF]" />
                </div>
              </div>
            </div>

            <div className="flow-card p-6 border-[#FF8A8A]/30">
              <h2 className="text-[16px] font-semibold text-[#FF8A8A] mb-2">Опасная зона</h2>
              <p className="text-[#9AA4B2] text-[13px] mb-4">Удаление аккаунта необратимо. Все данные будут потеряны.</p>
              <button className="text-[#FF8A8A] border border-[#FF8A8A]/30 hover:bg-[#FF8A8A]/10 px-4 py-2 rounded-lg text-[13px] transition-colors">
                Удалить аккаунт
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8">
          <button
            onClick={handleSave}
            className="flow-btn-primary px-6 py-2.5 flex items-center gap-2 text-[14px]"
          >
            <Save className="w-4 h-4" />
            {saved ? '✓ Сохранено' : 'Сохранить изменения'}
          </button>
        </div>
      </main>
    </div>
  );
};
