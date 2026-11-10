import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
  const [workspaceName, setWorkspaceName] = useState('My Team');
  const [email, setEmail] = useState('you@company.com');
  const [password, setPassword] = useState('password');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/workflows');
  };

  return (
    <div className="bg-[#0E1116] text-[#E8ECF2] min-h-screen font-sans grid grid-cols-1 md:grid-cols-2">
      {/* Left Form Area */}
      <div className="flex items-center justify-center p-8 md:p-12">
        <form onSubmit={handleSubmit} className="w-full max-w-[360px]">
          <Link to="/" className="font-bold text-[20px] mb-8 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#7C5CFF] inline-flex items-center justify-center text-white text-xs font-black shadow-lg">
              ⚡
            </span>
            FlowForge
          </Link>

          <h1 className="text-3xl font-bold mb-2 text-[#E8ECF2]">
            Создать аккаунт
          </h1>
          <p className="text-[#9AA4B2] text-sm mb-6">
            Создайте рабочую область FlowForge.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[#9AA4B2] text-xs font-medium mb-1.5">
                Название рабочей области
              </label>
              <input
                type="text"
                required
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-sm text-[#E8ECF2] outline-none focus:border-[#7C5CFF]"
              />
            </div>

            <div>
              <label className="block text-[#9AA4B2] text-xs font-medium mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-sm text-[#E8ECF2] outline-none focus:border-[#7C5CFF]"
              />
            </div>

            <div>
              <label className="block text-[#9AA4B2] text-xs font-medium mb-1.5">
                Пароль
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2A313C] rounded-lg p-2.5 text-sm text-[#E8ECF2] outline-none focus:border-[#7C5CFF]"
              />
            </div>

            <button
              type="submit"
              className="flow-btn-primary w-full py-3 text-sm font-semibold mt-4 shadow-lg shadow-[#7C5CFF]/20"
            >
              Зарегистрироваться
            </button>
          </div>

          <p className="mt-5 text-sm text-[#9AA4B2]">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-[#B6A5FF] hover:underline font-medium">
              Войти
            </Link>
          </p>
        </form>
      </div>

      {/* Right Visual Graphic Area */}
      <div className="hidden md:flex bg-[#0B0E13] border-l border-[#2A313C] items-center justify-center p-12">
        <svg viewBox="0 0 360 260" role="img" aria-label="Граф из трёх нод" className="w-full max-w-[420px]">
          <path d="M110 60 C150 60 130 130 170 130M110 200 C150 200 130 130 170 130M260 130 L290 130" fill="none" stroke="#4B5563" strokeWidth="2" />
          <rect x="20" y="36" width="90" height="48" rx="8" fill="#161B22" stroke="#3DDC97" strokeWidth="2" />
          <text x="32" y="66" fill="#E8ECF2" fontSize="12" fontFamily="Inter" fontWeight="600">Trigger</text>
          <rect x="20" y="176" width="90" height="48" rx="8" fill="#161B22" stroke="#2A313C" strokeWidth="2" />
          <text x="32" y="206" fill="#E8ECF2" fontSize="12" fontFamily="Inter" fontWeight="600">Webhook</text>
          <rect x="170" y="106" width="90" height="48" rx="8" fill="#161B22" stroke="#7C5CFF" strokeWidth="2" />
          <text x="182" y="136" fill="#B6A5FF" fontSize="12" fontFamily="Inter" fontWeight="600">GPT-4o</text>
          <rect x="290" y="106" width="50" height="48" rx="8" fill="#161B22" stroke="#3DDC97" strokeWidth="2" />
          <text x="302" y="136" fill="#3DDC97" fontSize="12" fontFamily="Inter" fontWeight="600">✓</text>
        </svg>
      </div>
    </div>
  );
};
