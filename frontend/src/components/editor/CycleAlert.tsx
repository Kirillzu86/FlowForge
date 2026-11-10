import React from 'react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { AlertTriangle, X } from 'lucide-react';

export const CycleAlert: React.FC = () => {
  const { cycleAlert, undo } = useWorkflowStore();

  if (!cycleAlert || !cycleAlert.hasCycle) return null;

  return (
    <div
      role="alert"
      className="flow-card absolute top-4 right-4 w-[320px] p-3.5 px-4 text-[13px] leading-relaxed z-30 shadow-2xl border-[#FF8A8A] bg-[#161B22]"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-[#FF8A8A] shrink-0 mt-0.5" />
        <div className="flex-1">
          <strong className="text-[#FF8A8A] block font-semibold mb-1">
            Цикл запрещён
          </strong>
          <p className="text-[#E8ECF2] text-xs">
            {cycleAlert.error || 'В графе обнаружена циклическая зависимость. Оркестратор поддерживает только направленные ациклические графы (DAG).'}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={undo}
              className="text-xs font-semibold px-2.5 py-1 bg-[#FF8A8A]/10 text-[#FF8A8A] hover:bg-[#FF8A8A]/20 rounded border border-[#FF8A8A]/30 transition-colors"
            >
              Отменить последнее соединение
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
