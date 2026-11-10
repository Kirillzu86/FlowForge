import React from 'react';
import { Link } from 'react-router-dom';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { Play, RotateCcw, RotateCw, LayoutGrid, Check, AlertCircle } from 'lucide-react';

export const EditorHeader: React.FC = () => {
  const {
    workflow,
    saveStatus,
    undo,
    redo,
    autoLayout,
    runWorkflow,
    executionStatus,
    saveToBackend,
    updateWorkflowTitle,
  } = useWorkflowStore();

  const isRunning = executionStatus === 'running';

  return (
    <header
      className="flex items-center justify-between px-5 h-14 border-b border-[#2A313C] bg-[#0E1116] shrink-0 gap-3 z-10"
      style={{ height: 56 }}
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-3 text-sm">
        <Link to="/workflows" className="text-[#9AA4B2] hover:text-[#E8ECF2] transition-colors">
          Автоматизации
        </Link>
        <span className="text-[#9AA4B2]">/</span>
        <input
          type="text"
          value={workflow?.title || 'Воркфлоу'}
          onChange={e => updateWorkflowTitle(e.target.value)}
          className="bg-transparent font-bold text-[#E8ECF2] border-none outline-none focus:ring-1 focus:ring-[#7C5CFF] rounded px-1.5 py-0.5"
        />

        {/* Save Status Badge */}
        <span className="flex items-center gap-1.5 text-xs ml-1">
          {saveStatus === 'saved' && (
            <span className="text-[#3DDC97] flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#3DDC97]"></span>
              Saved
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-[#FFA94D] flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FFA94D] animate-ping"></span>
              Saving...
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="text-[#9AA4B2] flex items-center gap-1 cursor-pointer hover:text-white" onClick={saveToBackend}>
              <span className="inline-block w-2 h-2 rounded-full bg-[#9AA4B2]"></span>
              Unsaved
            </span>
          )}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          title="Отменить действие (Ctrl+Z)"
          className="flow-btn-secondary text-[13px] py-1.5 px-3 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Undo
        </button>

        <button
          onClick={redo}
          title="Повторить действие (Ctrl+Y)"
          className="flow-btn-secondary text-[13px] py-1.5 px-3 flex items-center gap-1.5"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Redo
        </button>

        <button
          onClick={autoLayout}
          title="Автоматическое выравнивание блоков"
          className="flow-btn-secondary text-[13px] py-1.5 px-3 flex items-center gap-1.5"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Auto-layout
        </button>

        <button
          onClick={runWorkflow}
          disabled={isRunning}
          title="Запустить выполнение сценария"
          className="flow-btn-secondary text-[13px] py-1.5 px-3.5 flex items-center gap-1.5 border-[#7C5CFF] text-[#B6A5FF] hover:bg-[#7C5CFF]/10"
        >
          <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running...' : 'Test Run'}
        </button>

        <button
          onClick={saveToBackend}
          className="flow-btn-primary text-[13px] py-1.5 px-4 flex items-center gap-1.5"
        >
          Publish
        </button>
      </div>
    </header>
  );
};
