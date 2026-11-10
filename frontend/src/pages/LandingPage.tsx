import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal, Cpu, GitBranch, Shield, Zap, Sparkles, Check } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-[#0E1116] text-[#E8ECF2] min-h-screen font-sans">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between py-5 px-8 md:px-16 border-b border-[#2A313C]/50 flex-wrap gap-4 max-w-[1400px] mx-auto">
        <Link to="/" className="font-bold text-[20px] flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-[#7C5CFF] inline-flex items-center justify-center text-white text-xs font-black shadow-lg">
            ⚡
          </span>
          FlowForge
        </Link>

        <div className="flex items-center gap-7 text-[15px] text-[#9AA4B2]">
          <a href="#features" className="hover:text-[#E8ECF2] transition-colors">Возможности</a>
          <a href="#stack" className="hover:text-[#E8ECF2] transition-colors">Стек</a>
          <a href="#start" className="hover:text-[#E8ECF2] transition-colors">Быстрый старт</a>
          <Link to="/docs" className="hover:text-[#E8ECF2] transition-colors">Документация</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="flow-btn-secondary text-sm py-2 px-4">
            Вход
          </Link>
          <Link to="/workflows" className="flow-btn-primary text-sm py-2 px-5">
            Открыть редактор
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-8 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-[1280px] mx-auto">
        <div>
          <div className="font-mono-code text-[#3DDC97] text-[13px] font-semibold mb-4 tracking-wider flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#3DDC97] animate-pulse"></span>
            OPEN SOURCE · MIT LICENSE
          </div>
          <h1 className="text-4xl md:text-[56px] font-bold leading-[1.08] tracking-[-1.5px] mb-5 text-[#E8ECF2]">
            Собирайте AI-воркфлоу как граф
          </h1>
          <p className="text-lg md:text-[18px] leading-[1.6] text-[#9AA4B2] max-w-[520px] mb-8">
            Визуальный оркестратор для LLM, HTTP-запросов, условий и кода. Перетащите ноды, соедините их и наблюдайте за запуском в реальном времени.
          </p>

          <div className="flex items-center gap-3.5 flex-wrap">
            <Link to="/workflows" className="flow-btn-primary text-[15px] py-3 px-6 shadow-lg shadow-[#7C5CFF]/20 flex items-center gap-2">
              Начать бесплатно
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/docs" className="flow-btn-secondary text-[15px] py-3 px-6">
              Читать документацию
            </Link>
          </div>
        </div>

        {/* Visual Graph Preview Card from Design */}
        <div className="flow-card p-0 overflow-hidden shadow-2xl relative group border-[#2A313C]">
          <div className="bg-[#161B22] px-4 py-2.5 border-b border-[#2A313C] flex items-center justify-between text-xs text-[#9AA4B2]">
            <span className="flex items-center gap-1.5 font-mono-code">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF8A8A]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFA94D]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#3DDC97]"></span>
              <span className="ml-2">flowforge-canvas · preview</span>
            </span>
            <span className="text-[#3DDC97] font-semibold">● Live Engine</span>
          </div>

          <svg
            viewBox="0 0 520 330"
            role="img"
            aria-label="Пример графа"
            className="w-full bg-[#0B0E13] block"
          >
            {/* SVG Connecting Paths */}
            <path
              d="M130 70 C170 70 150 70 190 70M310 70 C340 70 330 90 360 100M420 138 C420 170 330 170 330 200M420 138 C420 180 450 195 450 225"
              fill="none"
              stroke="#4B5563"
              strokeWidth="2"
            />
            {/* Pulsing Active Stream */}
            <path
              d="M130 70 C170 70 150 70 190 70"
              fill="none"
              stroke="#7C5CFF"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              className="animate-pulse"
            />

            {/* Trigger Node */}
            <rect x="20" y="42" width="110" height="56" rx="10" fill="#161B22" stroke="#3DDC97" strokeWidth="2" />
            <text x="34" y="66" fill="#3DDC97" fontSize="11" fontFamily="Inter" fontWeight="600">ТРИГГЕР</text>
            <text x="34" y="84" fill="#E8ECF2" fontSize="13" fontFamily="Inter" fontWeight="500">Webhook</text>

            {/* LLM Node */}
            <rect x="190" y="42" width="120" height="56" rx="10" fill="#161B22" stroke="#7C5CFF" strokeWidth="3" />
            <text x="204" y="66" fill="#B6A5FF" fontSize="11" fontFamily="Inter" fontWeight="600">AI · RUNNING</text>
            <text x="204" y="84" fill="#E8ECF2" fontSize="13" fontFamily="Inter" fontWeight="500">GPT-4o</text>

            {/* Condition Node */}
            <rect x="360" y="82" width="120" height="56" rx="10" fill="#161B22" stroke="#2A313C" strokeWidth="2" />
            <text x="374" y="106" fill="#9AA4B2" fontSize="11" fontFamily="Inter" fontWeight="600">УСЛОВИЕ</text>
            <text x="374" y="124" fill="#E8ECF2" fontSize="13" fontFamily="JetBrains Mono" fontWeight="500">score ≥ 80</text>

            {/* Action True Node */}
            <rect x="270" y="200" width="120" height="56" rx="10" fill="#161B22" stroke="#2A313C" strokeWidth="2" />
            <text x="284" y="224" fill="#3DDC97" fontSize="11" fontFamily="Inter" fontWeight="600">TRUE</text>
            <text x="284" y="242" fill="#E8ECF2" fontSize="13" fontFamily="Inter" fontWeight="500">HTTP POST</text>

            {/* Code False Node */}
            <rect x="400" y="225" width="100" height="56" rx="10" fill="#161B22" stroke="#2A313C" strokeWidth="2" />
            <text x="414" y="249" fill="#FFA94D" fontSize="11" fontFamily="Inter" fontWeight="600">FALSE</text>
            <text x="414" y="267" fill="#E8ECF2" fontSize="13" fontFamily="Inter" fontWeight="500">Python</text>
          </svg>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 px-8 md:px-16 max-w-[1280px] mx-auto">
        <h2 className="text-2xl md:text-[32px] font-bold tracking-[-0.5px] mb-8 text-[#E8ECF2]">
          Всё для автоматизации в одном месте
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flow-card p-6">
            <div className="w-9 h-9 rounded-lg bg-[#7C5CFF]/15 text-[#B6A5FF] flex items-center justify-center mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold mb-2 text-[#E8ECF2]">Визуальный редактор</h3>
            <p className="text-[#9AA4B2] text-sm leading-[1.55]">
              Интерактивный холст React Flow: плавный зум, миникарта, полнофункциональный Undo/Redo и автосохранение графа.
            </p>
          </div>

          <div className="flow-card p-6">
            <div className="w-9 h-9 rounded-lg bg-[#B6A5FF]/15 text-[#B6A5FF] flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold mb-2 text-[#E8ECF2]">Единый AI-адаптер</h3>
            <p className="text-[#9AA4B2] text-sm leading-[1.55]">
              Более 100 языковых моделей через LiteLLM: GPT-4o, Claude 3.5 Sonnet, Gemini 1.5, DeepSeek и локальная Ollama.
            </p>
          </div>

          <div className="flow-card p-6">
            <div className="w-9 h-9 rounded-lg bg-[#3DDC97]/15 text-[#3DDC97] flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold mb-2 text-[#E8ECF2]">Асинхронное ядро</h3>
            <p className="text-[#9AA4B2] text-sm leading-[1.55]">
              Celery и Redis обходят граф топологической сортировкой, прерывают циклы и запускают независимые ветки параллельно.
            </p>
          </div>

          <div className="flow-card p-6">
            <div className="w-9 h-9 rounded-lg bg-[#FFA94D]/15 text-[#FFA94D] flex items-center justify-center mb-3">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold mb-2 text-[#E8ECF2]">Мониторинг в реальном времени</h3>
            <p className="text-[#9AA4B2] text-sm leading-[1.55]">
              Server-Sent Events (SSE) в реальном времени подсвечивает ноды и связи, а консоль показывает входы и выходы каждого шага.
            </p>
          </div>

          <div className="flow-card p-6">
            <div className="w-9 h-9 rounded-lg bg-[#3DDC97]/15 text-[#3DDC97] flex items-center justify-center mb-3">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold mb-2 text-[#E8ECF2]">Гибкая логика</h3>
            <p className="text-[#9AA4B2] text-sm leading-[1.55]">
              Условные ветвления, HTTP-запросы в любые сторонние API, изолированный Python в песочнице и интерполяция переменных.
            </p>
          </div>

          <div className="flow-card p-6">
            <div className="w-9 h-9 rounded-lg bg-[#7C5CFF]/15 text-[#B6A5FF] flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold mb-2 text-[#E8ECF2]">Готов к продакшену</h3>
            <p className="text-[#9AA4B2] text-sm leading-[1.55]">
              Готовые контейнеры Docker Compose, Nginx с оптимизацией SSE без буферизации и автодеплой в Coolify в один клик.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section id="start" className="py-16 px-8 md:px-16 max-w-[1280px] mx-auto border-t border-[#2A313C]/40">
        <div className="flow-card p-8 md:p-10 bg-[#11151B]">
          <h2 className="text-2xl md:text-[30px] font-bold mb-3 text-[#E8ECF2]">
            Быстрый старт за три команды
          </h2>
          <p className="text-[#9AA4B2] text-sm mb-6 max-w-[600px]">
            Разверните локальное окружение со всеми сервисами (Django, Celery, Redis, Postgres, React) через Docker Compose:
          </p>

          <pre className="font-mono-code bg-[#0B0E13] border border-[#2A313C] rounded-xl p-5 text-sm text-[#E8ECF2] overflow-x-auto leading-loose">
            <span className="text-[#9AA4B2]"># Клонируйте репозиторий и перейдите в каталог:</span><br/>
            <span className="text-[#7C5CFF]">git clone</span> https://github.com/your-username/flowforge.git<br/>
            <span className="text-[#7C5CFF]">cd</span> flowforge<br/><br/>
            <span className="text-[#9AA4B2]"># Создайте файл окружения и запустите проект:</span><br/>
            <span className="text-[#7C5CFF]">cp</span> .env.example .env<br/>
            <span className="text-[#7C5CFF]">docker compose up</span> -d --build
          </pre>

          <div className="mt-7 flex items-center gap-4">
            <Link to="/workflows" className="flow-btn-primary py-3 px-6 text-sm">
              Перейти в интерфейс
            </Link>
            <Link to="/docs" className="flow-btn-secondary py-3 px-6 text-sm">
              Инструкция по развертыванию в Coolify
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-[#2A313C]/40 text-center text-xs text-[#9AA4B2]">
        <p>© 2026 FlowForge Platform. Released under the MIT License.</p>
      </footer>
    </div>
  );
};
