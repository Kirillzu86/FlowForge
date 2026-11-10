import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Layers, PlayCircle, KeyRound, BookOpen, Settings, LogOut } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Автоматизации', path: '/workflows', icon: Layers },
    { label: 'Запуски', path: '/executions', icon: PlayCircle },
    { label: 'Секреты', path: '/credentials', icon: KeyRound },
    { label: 'Документация', path: '/docs', icon: BookOpen },
    { label: 'Настройки', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-[220px] shrink-0 border-r border-[#2A313C] p-6 px-4 bg-[#0E1116] flex flex-col justify-between select-none">
      <div>
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-[18px] text-[#E8ECF2] mb-7 hover:opacity-90 transition-opacity">
          <span className="w-6 h-6 rounded-[7px] bg-[#7C5CFF] inline-flex items-center justify-center text-white text-xs font-black shadow-md">
            ⚡
          </span>
          FlowForge
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 text-[15px]">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#161B22] text-[#E8ECF2] font-semibold border border-[#2A313C]'
                      : 'text-[#9AA4B2] hover:text-[#E8ECF2] hover:bg-[#161B22]/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Area */}
      <div className="pt-4 border-t border-[#2A313C]/60 flex items-center justify-between text-xs text-[#9AA4B2]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#7C5CFF]/20 text-[#B6A5FF] border border-[#7C5CFF]/30 flex items-center justify-center font-bold">
            U
          </div>
          <div className="truncate">
            <div className="text-[#E8ECF2] font-medium leading-none mb-1">Команда</div>
            <div className="text-[11px] text-[#9AA4B2]">Pro Plan</div>
          </div>
        </div>
        <Link to="/login" title="Выйти" className="p-1 hover:text-[#FF8A8A] transition-colors">
          <LogOut className="w-4 h-4" />
        </Link>
      </div>
    </aside>
  );
};
