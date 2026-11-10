import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '../../store/useWorkflowStore';
import { TriggerNode } from './CustomNodes/TriggerNode';
import { LLMNode } from './CustomNodes/LLMNode';
import { ConditionNode } from './CustomNodes/ConditionNode';
import { ActionNode } from './CustomNodes/ActionNode';
import { CodeNode } from './CustomNodes/CodeNode';
import { CycleAlert } from './CycleAlert';
import { ExecutionConsole } from './ExecutionConsole';

export const Canvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    addNode,
  } = useWorkflowStore();

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      llm: LLMNode,
      condition: ConditionNode,
      action: ActionNode,
      code: CodeNode,
    }),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const title = event.dataTransfer.getData('application/reactflow/title');

      if (!type) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 30,
      };

      addNode(type, position, title);
    },
    [addNode]
  );

  return (
    <div
      className="flex-1 relative min-w-0 bg-[#0B0E13] overflow-hidden"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={2.5}
        deleteKeyCode="Delete"
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#3D4654', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3D4654',
            width: 14,
            height: 14,
          },
          animated: false,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#1E2530"
          className="bg-[#0B0E13]"
        />
        <Controls
          className="bg-[#161B22] border border-[#2A313C] rounded-lg overflow-hidden"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={n => {
            if (n.type === 'trigger') return '#3DDC97';
            if (n.type === 'llm') return '#7C5CFF';
            if (n.type === 'condition') return '#FFA94D';
            if (n.type === 'action') return '#3B82F6';
            if (n.type === 'code') return '#F59E0B';
            return '#4B5563';
          }}
          className="bg-[#161B22] border border-[#2A313C] rounded-lg overflow-hidden"
          maskColor="rgba(11, 14, 19, 0.75)"
          style={{ bottom: 16, right: 16 }}
        />
      </ReactFlow>

      {/* Floating Cycle Alert (Screen 11) */}
      <CycleAlert />

      {/* Execution Console (Bottom collapsible) */}
      <ExecutionConsole />
    </div>
  );
};
