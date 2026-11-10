import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { BookOpen, Rocket, Server, Layout, Cloud, AlertCircle, Copy, Check } from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'quickstart' | 'backend' | 'frontend' | 'coolify' | 'troubleshooting'>('quickstart');
  const [copied, setCopied] = useState(false);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0E1116] text-[#E8ECF2] min-h-screen flex font-sans">
      <Sidebar />

      {/* Docs Submenu */}
      <aside className="w-[240px] shrink-0 border-r border-[#2A313C] p-7 px-5 text-sm flex flex-col gap-2.5 bg-[#0E1116] select-none">
        <div className="font-bold text-[18px] text-[#E8ECF2] mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#7C5CFF]" />
          Документация
        </div>

        <button
          onClick={() => setActiveSection('quickstart')}
          className={`text-left px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'quickstart' ? 'bg-[#161B22] text-[#E8ECF2] font-semibold border border-[#2A313C]' : 'text-[#9AA4B2] hover:text-[#E8ECF2]'
          }`}
        >
          Быстрый старт
        </button>

        <button
          onClick={() => setActiveSection('backend')}
          className={`text-left px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'backend' ? 'bg-[#161B22] text-[#E8ECF2] font-semibold border border-[#2A313C]' : 'text-[#9AA4B2] hover:text-[#E8ECF2]'
          }`}
        >
          Бэкенд & DAG Engine
        </button>

        <button
          onClick={() => setActiveSection('frontend')}
          className={`text-left px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'frontend' ? 'bg-[#161B22] text-[#E8ECF2] font-semibold border border-[#2A313C]' : 'text-[#9AA4B2] hover:text-[#E8ECF2]'
          }`}
        >
          Фронтенд & React Flow
        </button>

        <button
          onClick={() => setActiveSection('coolify')}
          className={`text-left px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'coolify' ? 'bg-[#161B22] text-[#E8ECF2] font-semibold border border-[#2A313C]' : 'text-[#9AA4B2] hover:text-[#E8ECF2]'
          }`}
        >
          Деплой в Coolify
        </button>

        <button
          onClick={() => setActiveSection('troubleshooting')}
          className={`text-left px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'troubleshooting' ? 'bg-[#161B22] text-[#E8ECF2] font-semibold border border-[#2A313C]' : 'text-[#9AA4B2] hover:text-[#E8ECF2]'
          }`}
        >
          Troubleshooting
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 px-14 max-w-[860px] min-w-0 overflow-y-auto">
        {activeSection === 'quickstart' && (
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#E8ECF2] mb-3">
              Быстрый старт
            </h1>
            <p className="text-[#9AA4B2] text-base leading-relaxed mb-6">
              Поднимите FlowForge локально за несколько минут. Для работы требуются Docker Compose v2 и Git.
            </p>

            <div className="relative mb-8">
              <pre className="font-mono-code bg-[#0B0E13] border border-[#2A313C] rounded-xl p-5 text-[13px] text-[#E8ECF2] leading-[1.8] overflow-x-auto">
                cp .env.example .env{'\n'}
                docker compose up --build -d{'\n'}
                docker compose exec backend python manage.py migrate{'\n'}
                docker compose exec backend python manage.py seed_data
              </pre>
              <button
                onClick={() => copyCode("cp .env.example .env\ndocker compose up --build -d\ndocker compose exec backend python manage.py migrate\ndocker compose exec backend python manage.py seed_data")}
                className="absolute top-4 right-4 text-[#9AA4B2] hover:text-[#E8ECF2] p-1.5 bg-[#161B22] rounded-md border border-[#2A313C]"
              >
                {copied ? <Check className="w-4 h-4 text-[#3DDC97]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <h2 className="text-2xl font-bold text-[#E8ECF2] mb-3">
              Точки входа
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <div className="flow-card p-4 px-5 flex items-center justify-between">
                <span className="font-medium text-sm text-[#E8ECF2]">Frontend UI</span>
                <span className="font-mono-code text-sm text-[#B6A5FF]">http://localhost:5173</span>
              </div>
              <div className="flow-card p-4 px-5 flex items-center justify-between">
                <span className="font-medium text-sm text-[#E8ECF2]">API Health & Docs</span>
                <span className="font-mono-code text-sm text-[#B6A5FF]">http://localhost:8000/api/health/</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#E8ECF2] mb-3">
              Частая ошибка
            </h2>
            <div className="flow-card p-5 border-l-4 border-l-[#FFA94D]">
              <strong className="text-[15px] font-bold text-[#E8ECF2] block mb-1">
                SSE-события приходят пачкой
              </strong>
              <p className="text-[#9AA4B2] text-sm leading-relaxed">
                Прокси буферизирует потоковый ответ. Отключите буферизацию в Nginx директивой <code className="text-[#FFA94D]">proxy_buffering off;</code> и передайте заголовок <code className="text-[#FFA94D]">X-Accel-Buffering: no</code>.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'backend' && (
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#E8ECF2] mb-3">
              Бэкенд и Ядро DAG Engine
            </h1>
            <p className="text-[#9AA4B2] text-base leading-relaxed mb-6">
              Построен на Python 3.12, Django 5, Celery 5, Redis 7 и LiteLLM.
            </p>

            <div className="space-y-5 text-sm text-[#9AA4B2] leading-relaxed">
              <div className="flow-card p-5">
                <h3 className="text-lg font-bold text-[#E8ECF2] mb-2">Алгоритм Кана (Kahn's Algorithm)</h3>
                <p>
                  Каждый граф перед запуском валидируется на ацикличность. Узлы со степенью входа 0 помещаются в очередь. Если число обработанных узлов меньше общего числа нод, вызывается исключение CyclicDependencyError.
                </p>
              </div>

              <div className="flow-card p-5">
                <h3 className="text-lg font-bold text-[#E8ECF2] mb-2">Интерполяция переменных</h3>
                <p>
                  Контекст выполнения сохраняется в изолированном объекте. В нодах доступны переменные вида <code className="text-[#B6A5FF]">{`{{ nodes.node_id.output.score }}`}</code> или <code className="text-[#B6A5FF]">{`{{ trigger.payload.name }}`}</code>.
                </p>
              </div>

              <div className="flow-card p-5">
                <h3 className="text-lg font-bold text-[#E8ECF2] mb-2">LiteLLM Универсальный Адаптер</h3>
                <p>
                  Единая точка вызова для OpenAI, Anthropic, Google Gemini и локальной Ollama. Поддерживает fallback модели и экспоненциальный retry при Rate Limits (429).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'frontend' && (
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#E8ECF2] mb-3">
              Фронтенд и React Flow
            </h1>
            <p className="text-[#9AA4B2] text-base leading-relaxed mb-6">
              Построен на React 19, TypeScript, Vite, Tailwind CSS и @xyflow/react.
            </p>
            <div className="flow-card p-5 text-sm text-[#9AA4B2] leading-relaxed">
              <p className="mb-3">
                Холст поддерживает масштабирование, перетаскивание узлов из левой палитры, автоматическое сохранение (debounce 1000ms), Undo/Redo историю (Ctrl+Z / Ctrl+Y), а также визуализацию выполнения нод в реальном времени.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[#E8ECF2]">
                <li>TriggerNode: точка входа по Webhook / Cron</li>
                <li>LLMNode: вызов нейросетей с бейджами и индикатором активности</li>
                <li>ConditionNode: булево ветвление с выходами True и False</li>
                <li>ActionNode: HTTP POST / GET запросы</li>
                <li>CodeNode: изолированный Python скрипт</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'coolify' && (
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#E8ECF2] mb-3">
              Деплой в Coolify
            </h1>
            <p className="text-[#9AA4B2] text-base leading-relaxed mb-6">
              FlowForge оптимизирован для запуска через встроенный Docker Compose провайдер Coolify.
            </p>

            <ol className="list-decimal pl-5 space-y-3 text-sm text-[#9AA4B2] leading-relaxed">
              <li>Подключите ваш GitHub репозиторий в панели управления Coolify.</li>
              <li>Выберите тип развертывания: <strong className="text-[#E8ECF2]">Docker Compose</strong>.</li>
              <li>Укажите файл: <code className="text-[#B6A5FF]">docker-compose.prod.yml</code>.</li>
              <li>Задайте переменные окружения: <code className="text-[#B6A5FF]">POSTGRES_PASSWORD</code>, <code className="text-[#B6A5FF]">REDIS_PASSWORD</code>, <code className="text-[#B6A5FF]">SECRET_KEY</code>.</li>
              <li>Укажите доменное имя: Traefik автоматически выпустит бесплатный SSL-сертификат Let's Encrypt.</li>
            </ol>
          </div>
        )}

        {activeSection === 'troubleshooting' && (
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#E8ECF2] mb-3">
              Troubleshooting (Ошибки и решения)
            </h1>

            <div className="space-y-4 text-sm">
              <div className="flow-card p-5 border-l-4 border-l-[#FF8A8A]">
                <strong className="text-[#FF8A8A] block font-bold mb-1">
                  Ошибка подключения к Ollama (Connection Refused)
                </strong>
                <p className="text-[#9AA4B2] leading-relaxed">
                  Внутри контейнеров localhost указывает на сам контейнер. Используйте <code className="text-[#B6A5FF]">http://host.docker.internal:11434</code> и флаг <code className="text-[#B6A5FF]">extra_hosts: ["host.docker.internal:host-gateway"]</code> в docker-compose.
                </p>
              </div>

              <div className="flow-card p-5 border-l-4 border-l-[#FFA94D]">
                <strong className="text-[#FFA94D] block font-bold mb-1">
                  Обнаружена циклическая зависимость (CyclicDependencyError)
                </strong>
                <p className="text-[#9AA4B2] leading-relaxed">
                  Граф замкнут сам на себя. Удалите обратные связи или нажмите кнопку Undo в редакторе.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
