import React from 'react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { Radio, Clock, Sparkles, GitBranch, Globe, Terminal } from 'lucide-react';

interface PaletteItem {
  type: string;
  title: string;
  subtitle: string;
  category: string;
  icon: React.ReactNode;
  color: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'trigger', title: 'Webhook', subtitle: 'HTTP входящий', category: 'TRIGGERS', color: '#3DDC97', icon: <Radio className="w-3.5 h-3.5" /> },
  { type: 'trigger', title: 'Cron', subtitle: 'По расписанию', category: 'TRIGGERS', color: '#3DDC97', icon: <Clock className="w-3.5 h-3.5" /> },
  { type: 'llm', title: 'AI Model', subtitle: 'GPT / Claude / Gemini', category: 'AI · MODELS', color: '#B6A5FF', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { type: 'condition', title: 'Condition', subtitle: 'if / else ветвление', category: 'LOGIC', color: '#FFA94D', icon: <GitBranch className="w-3.5 h-3.5" /> },
  { type: 'action', title: 'HTTP Request', subtitle: 'GET / POST / PUT', category: 'ACTIONS', color: '#60A5FA', icon: <Globe className="w-3.5 h-3.5" /> },
  { type: 'code', title: 'Python', subtitle: 'Произвольный код', category: 'ACTIONS', color: '#F59E0B', icon: <Terminal className="w-3.5 h-3.5" /> },
];

export const NodePalette: React.FC = () => {
  const { addNode, nodes } = useWorkflowStore();

  const handleAdd = (item: PaletteItem) => {
    const lastNode = nodes[nodes.length - 1];
    const x = lastNode ? lastNode.position.x + 200 : 80;
    const y = lastNode ? lastNode.position.y : 100;
    addNode(item.type, { x, y }, item.title === 'Cron' ? 'Cron' : item.title);
  };

  const onDragStart = (e: React.DragEvent, item: PaletteItem) => {
    e.dataTransfer.setData('application/reactflow/type', item.type);
    e.dataTransfer.setData('application/reactflow/title', item.title);
    e.dataTransfer.effectAllowed = 'move';
  };

  const categories = ['TRIGGERS', 'AI · MODELS', 'LOGIC', 'ACTIONS'];

  return (
    <aside className="w-[196px] shrink-0 border-r border-[#2A313C] p-4 text-sm bg-[#0E1116] overflow-y-auto select-none">
      <div className="text-[11px] font-semibold text-[#9AA4B2] tracking-wider mb-3 flex items-center gap-1.5">
        <span>БЛОКИ</span>
        <span className="text-[9px] text-[#4B5563] font-normal">· drag или клик</span>
      </div>

      {categories.map(cat => {
        const items = PALETTE_ITEMS.filter(it => it.category === cat);
        return (
          <div key={cat} className="mb-4">
            <div className="text-[10px] font-semibold text-[#4B5563] tracking-widest mb-1.5 uppercase">
              {cat}
            </div>
            <div className="space-y-1">
              {items.map(item => (
                <div
                  key={item.title}
                  draggable
                  onDragStart={e => onDragStart(e, item)}
                  onClick={() => handleAdd(item)}
                  className="flow-card p-2.5 px-3 flex items-center gap-2.5 text-[#E8ECF2] hover:border-[#7C5CFF]/60 hover:bg-[#1A202A] transition-all cursor-grab active:cursor-grabbing group"
                >
                  <span style={{ color: item.color }} className="shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium leading-tight">{item.title}</div>
                    <div className="text-[11px] text-[#9AA4B2] leading-tight truncate">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </aside>
  );
};
