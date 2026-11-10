import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { api, getDemoWorkflows } from '../api/client';
import { EditorHeader } from '../components/editor/EditorHeader';
import { NodePalette } from '../components/editor/NodePalette';
import { Canvas } from '../components/editor/Canvas';
import { NodeInspector } from '../components/editor/NodeInspector';

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { setWorkflow, undo, redo, saveToBackend } = useWorkflowStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const wf = await api.getWorkflow(id);
        setWorkflow(wf);
      } catch (err) {
        console.warn('Fallback to demo workflow for editor', err);
        const demo = getDemoWorkflows().find(w => w.id === id) || getDemoWorkflows()[0];
        setWorkflow(demo);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, setWorkflow]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      // Don't fire in input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      } else if (e.key === 's') {
        e.preventDefault();
        saveToBackend();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveToBackend]);

  if (loading) {
    return (
      <div className="bg-[#0E1116] text-[#E8ECF2] h-screen flex items-center justify-center font-mono-code text-sm">
        <div className="flex flex-col items-center gap-3">
          <span className="w-6 h-6 rounded-[7px] bg-[#7C5CFF] inline-flex items-center justify-center text-white text-xs font-black animate-pulse">⚡</span>
          <span className="text-[#9AA4B2] animate-pulse">Loading FlowForge Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0E1116] text-[#E8ECF2] font-sans h-screen flex flex-col overflow-hidden">
      {/* Top Header */}
      <EditorHeader />

      {/* Main Studio Area */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Palette */}
        <NodePalette />

        {/* Center Canvas */}
        <Canvas />

        {/* Right Inspector Drawer */}
        <NodeInspector />
      </div>
    </div>
  );
};
