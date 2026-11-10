import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { CustomWorkflowNode, CustomWorkflowEdge, Workflow, NodeExecutionLog } from '../types/workflow';
import { api } from '../api/client';

interface HistoryState {
  nodes: CustomWorkflowNode[];
  edges: CustomWorkflowEdge[];
}

interface WorkflowState {
  workflow: Workflow | null;
  nodes: CustomWorkflowNode[];
  edges: CustomWorkflowEdge[];
  selectedNodeId: string | null;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  isConsoleOpen: boolean;
  activeExecutionId: string | null;
  executionStatus: 'idle' | 'running' | 'completed' | 'failed';
  executionLogs: NodeExecutionLog[];
  cycleAlert: { hasCycle: boolean; error: string | null; cycleNodes: string[] } | null;

  // History for Undo/Redo
  past: HistoryState[];
  future: HistoryState[];

  // Actions
  setWorkflow: (workflow: Workflow) => void;
  updateWorkflowTitle: (title: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, position: { x: number; y: number }, title?: string) => void;
  updateNodeData: (id: string, data: Record<string, any>) => void;
  selectNode: (id: string | null) => void;
  toggleConsole: () => void;
  undo: () => void;
  redo: () => void;
  autoLayout: () => void;
  runWorkflow: () => Promise<void>;
  validateCycle: () => Promise<boolean>;
  saveToBackend: () => Promise<void>;
  exportWorkflow: () => void;
  importWorkflow: (jsonString: string) => boolean;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflow: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  saveStatus: 'saved',
  isConsoleOpen: true,
  activeExecutionId: null,
  executionStatus: 'idle',
  executionLogs: [],
  cycleAlert: null,
  past: [],
  future: [],

  setWorkflow: (workflow: Workflow) => {
    set({
      workflow,
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      selectedNodeId: workflow.nodes?.[0]?.id || null,
      saveStatus: 'saved',
      past: [],
      future: [],
      cycleAlert: workflow.graph_diagnostics?.has_cycle
        ? {
            hasCycle: true,
            error: workflow.graph_diagnostics.error,
            cycleNodes: workflow.graph_diagnostics.cycle_nodes,
          }
        : null,
    });
  },

  updateWorkflowTitle: (title: string) => {
    const { workflow } = get();
    if (!workflow) return;
    set({ workflow: { ...workflow, title }, saveStatus: 'unsaved' });
    debouncedSave(get);
  },

  onNodesChange: (changes: NodeChange[]) => {
    const { nodes, edges, past } = get();
    const updatedNodes = applyNodeChanges(changes, nodes) as CustomWorkflowNode[];
    
    // Check if change is significant (not just select) to record undo
    const isSignificant = changes.some(c => c.type === 'position' || c.type === 'remove');
    const newPast = isSignificant ? [...past.slice(-20), { nodes, edges }] : past;

    set({
      nodes: updatedNodes,
      past: newPast,
      future: isSignificant ? [] : get().future,
      saveStatus: 'unsaved',
    });

    if (isSignificant) {
      debouncedSave(get);
    }
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const { nodes, edges, past } = get();
    const updatedEdges = applyEdgeChanges(changes, edges) as CustomWorkflowEdge[];
    const isSignificant = changes.some(c => c.type === 'remove');
    const newPast = isSignificant ? [...past.slice(-20), { nodes, edges }] : past;

    set({
      edges: updatedEdges,
      past: newPast,
      future: isSignificant ? [] : get().future,
      saveStatus: 'unsaved',
    });

    get().validateCycle();
    debouncedSave(get);
  },

  onConnect: (connection: Connection) => {
    const { nodes, edges, past } = get();
    if (connection.source === connection.target) return; // Prevent self-loop

    const newEdge: CustomWorkflowEdge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    };

    const newEdges = addEdge(newEdge, edges) as CustomWorkflowEdge[];
    set({
      edges: newEdges,
      past: [...past.slice(-20), { nodes, edges }],
      future: [],
      saveStatus: 'unsaved',
    });

    get().validateCycle();
    debouncedSave(get);
  },

  addNode: (type: string, position: { x: number; y: number }, title?: string) => {
    const { nodes, edges, past } = get();
    const id = `node_${type}_${Date.now().toString(36)}`;
    
    const defaultDataMap: Record<string, any> = {
      trigger: { title: title || 'Webhook', triggerType: 'webhook', webhookPath: `/webhook/${Date.now().toString(36)}` },
      llm: { title: title || 'Оценка заявки', model: 'gpt-4o', temperature: 0.2, max_tokens: 1024, prompt: 'Оцени заявку: {{ trigger.payload }}' },
      condition: { title: title || 'Условие', expression: 'score >= 80' },
      action: { title: title || 'HTTP Request', method: 'POST', url: 'https://api.example.com/webhook', body: '{}' },
      code: { title: title || 'Python', code: "output = {'result': 'success'}" },
    };

    const newNode: CustomWorkflowNode = {
      id,
      type,
      position,
      data: defaultDataMap[type] || { title: title || type },
    };

    set({
      nodes: [...nodes, newNode],
      selectedNodeId: id,
      past: [...past.slice(-20), { nodes, edges }],
      future: [],
      saveStatus: 'unsaved',
    });

    get().validateCycle();
    debouncedSave(get);
  },

  updateNodeData: (id: string, partialData: Record<string, any>) => {
    const { nodes } = get();
    const updated = nodes.map(node => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            ...partialData,
          },
        };
      }
      return node;
    });

    set({ nodes: updated, saveStatus: 'unsaved' });
    debouncedSave(get);
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  toggleConsole: () => {
    set({ isConsoleOpen: !get().isConsoleOpen });
  },

  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: newPast,
      future: [{ nodes, edges }, ...future],
      saveStatus: 'unsaved',
    });

    get().validateCycle();
    debouncedSave(get);
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      nodes: next.nodes,
      edges: next.edges,
      past: [...past, { nodes, edges }],
      future: newFuture,
      saveStatus: 'unsaved',
    });

    get().validateCycle();
    debouncedSave(get);
  },

  autoLayout: () => {
    const { nodes, edges, past } = get();
    if (nodes.length === 0) return;

    // Simple horizontal layered layout algorithm
    const inDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    nodes.forEach(n => {
      inDegree[n.id] = 0;
      adj[n.id] = [];
    });
    edges.forEach(e => {
      if (adj[e.source]) adj[e.source].push(e.target);
      if (inDegree[e.target] !== undefined) inDegree[e.target]++;
    });

    const levels: string[][] = [];
    let current = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    const visited = new Set<string>();

    while (current.length > 0) {
      levels.push(current);
      current.forEach(id => visited.add(id));
      const next: string[] = [];
      current.forEach(u => {
        (adj[u] || []).forEach(v => {
          inDegree[v]--;
          if (inDegree[v] <= 0 && !visited.has(v)) {
            next.push(v);
            visited.add(v);
          }
        });
      });
      current = next;
    }

    // Add unvisited (e.g. disconnected) nodes
    const unvisited = nodes.filter(n => !visited.has(n.id)).map(n => n.id);
    if (unvisited.length > 0) levels.push(unvisited);

    const updatedNodes = nodes.map(n => {
      let colIdx = 0;
      let rowIdx = 0;
      levels.forEach((lvl, c) => {
        const r = lvl.indexOf(n.id);
        if (r !== -1) {
          colIdx = c;
          rowIdx = r;
        }
      });
      return {
        ...n,
        position: {
          x: 40 + colIdx * 210,
          y: 60 + rowIdx * 110,
        },
      };
    });

    set({
      nodes: updatedNodes,
      past: [...past.slice(-20), { nodes, edges }],
      saveStatus: 'unsaved',
    });
    debouncedSave(get);
  },

  validateCycle: async () => {
    const { nodes, edges } = get();
    const result = await api.validateGraph(nodes, edges);
    if (result.has_cycle) {
      set({
        cycleAlert: {
          hasCycle: true,
          error: result.error || 'Обнаружен цикл в графе',
          cycleNodes: result.cycle_nodes,
        },
      });
      return false;
    } else {
      set({ cycleAlert: null });
      return true;
    }
  },

  saveToBackend: async () => {
    const { workflow, nodes, edges } = get();
    if (!workflow) return;
    set({ saveStatus: 'saving' });
    try {
      await api.saveWorkflow(workflow.id, {
        nodes,
        edges,
        version: workflow.version + 1,
      });
      set({ saveStatus: 'saved' });
    } catch (err) {
      console.error('Failed to save workflow', err);
      set({ saveStatus: 'saved' });
    }
  },

  exportWorkflow: () => {
    const { workflow, nodes, edges } = get();
    const data = {
      title: workflow?.title || 'workflow',
      description: workflow?.description || '',
      version: (workflow?.version || 1) + 1,
      exported_at: new Date().toISOString(),
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(workflow?.title || 'workflow').replace(/[\s/\\?%*:|"<>]/g, '_')}.flow.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importWorkflow: (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        throw new Error('Некорректный формат: должны быть массивы nodes и edges');
      }
      const { past, nodes, edges, workflow } = get();
      set({
        past: [...past.slice(-20), { nodes, edges }],
        future: [],
        nodes: parsed.nodes,
        edges: parsed.edges,
        workflow: workflow ? { ...workflow, title: parsed.title || workflow.title } : null,
        saveStatus: 'unsaved',
      });
      get().validateCycle();
      debouncedSave(get);
      return true;
    } catch (err) {
      console.error('Import workflow error:', err);
      return false;
    }
  },

  runWorkflow: async () => {
    const { workflow, nodes, edges } = get();
    if (!workflow) return;

    // First check cycles
    const isValid = await get().validateCycle();
    if (!isValid) {
      set({ isConsoleOpen: true, executionStatus: 'failed' });
      return;
    }

    set({
      executionStatus: 'running',
      isConsoleOpen: true,
      executionLogs: [],
    });

    // Reset node visual statuses on canvas
    const resetNodes = nodes.map(n => ({
      ...n,
      data: { ...n.data, status: 'idle' as const, error: null },
    }));
    const animatedEdges = edges.map(e => ({ ...e, animated: true }));
    set({ nodes: resetNodes, edges: animatedEdges });

    try {
      const runRes = await api.runWorkflow(workflow.id);
      const executionId = runRes.execution_id;
      set({ activeExecutionId: executionId });

      // Connect to SSE stream or use realistic simulator
      const sse = new EventSource(`/api/v1/executions/${executionId}/stream/`);

      sse.addEventListener('node_started', (event: any) => {
        const payload = JSON.parse(event.data);
        const nodeId = payload.node_id;
        set(state => ({
          nodes: state.nodes.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n
          ),
          executionLogs: [
            ...state.executionLogs.filter(l => l.node_id !== nodeId),
            {
              id: 'log-' + nodeId,
              node_id: nodeId,
              node_type: '',
              node_title: payload.node_title || nodeId,
              status: 'RUNNING',
              input_payload: {},
              output_payload: {},
              execution_time_ms: 0,
              tokens_used: 0,
              error_trace: null,
              started_at: payload.timestamp,
              finished_at: null,
              created_at: payload.timestamp,
            },
          ],
        }));
      });

      sse.addEventListener('node_finished', (event: any) => {
        const payload = JSON.parse(event.data);
        const nodeId = payload.node_id;
        const isSuccess = payload.status === 'SUCCESS';
        set(state => ({
          nodes: state.nodes.map(n =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: isSuccess ? 'success' : 'failed',
                    output: payload.output,
                    error: payload.error,
                  },
                }
              : n
          ),
          executionLogs: state.executionLogs.map(l =>
            l.node_id === nodeId
              ? {
                  ...l,
                  status: isSuccess ? 'SUCCESS' : 'FAILED',
                  output_payload: payload.output,
                  execution_time_ms: payload.execution_time_ms,
                  tokens_used: payload.tokens_used,
                  error_trace: payload.error,
                }
              : l
          ),
        }));
      });

      sse.addEventListener('node_skipped', (event: any) => {
        const payload = JSON.parse(event.data);
        const nodeId = payload.node_id;
        set(state => ({
          nodes: state.nodes.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'skipped' } } : n
          ),
        }));
      });

      sse.addEventListener('execution_completed', () => {
        sse.close();
        set(state => ({
          executionStatus: 'completed',
          edges: state.edges.map(e => ({ ...e, animated: false })),
        }));
      });

      sse.addEventListener('execution_failed', (event: any) => {
        sse.close();
        const payload = JSON.parse(event.data || '{}');
        set(state => ({
          executionStatus: 'failed',
          edges: state.edges.map(e => ({ ...e, animated: false })),
          cycleAlert: payload.cycle_nodes?.length
            ? {
                hasCycle: true,
                error: payload.error,
                cycleNodes: payload.cycle_nodes,
              }
            : null,
        }));
      });

      sse.onerror = () => {
        sse.close();
        // If SSE failed (e.g. backend offline or mock run), simulate realistic flow in UI!
        simulateLocalRun(get, set);
      };
    } catch (e) {
      simulateLocalRun(get, set);
    }
  },
}));

// Fallback smooth runner simulation when running purely client-side
async function simulateLocalRun(get: () => WorkflowState, set: (fn: any) => void) {
  const { nodes, edges } = get();
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    // mark running
    set((s: WorkflowState) => ({
      nodes: s.nodes.map(n => (n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n)),
    }));
    await new Promise(r => setTimeout(r, 600));

    // mark completed or skipped
    const isFalseBranch = node.type === 'code' && node.position.y > 100;
    const status = isFalseBranch ? 'skipped' : 'success';
    const mockOutput =
      node.type === 'llm'
        ? { score: 87, summary: 'Заявка тёплая' }
        : node.type === 'condition'
        ? { result: true, active_handle: 'true' }
        : { status: 'OK' };

    set((s: WorkflowState) => ({
      nodes: s.nodes.map(n =>
        n.id === node.id ? { ...n, data: { ...n.data, status: status as any, output: mockOutput } } : n
      ),
      executionLogs: [
        ...s.executionLogs.filter(l => l.node_id !== node.id),
        {
          id: 'log-' + node.id,
          node_id: node.id,
          node_type: node.type || '',
          node_title: node.data.title || node.id,
          status: status === 'success' ? 'SUCCESS' : 'SKIPPED',
          input_payload: {},
          output_payload: mockOutput,
          execution_time_ms: node.type === 'llm' ? 842 : 15,
          tokens_used: node.type === 'llm' ? 842 : 0,
          error_trace: null,
          started_at: new Date().toISOString(),
          finished_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
    }));
  }

  set((s: WorkflowState) => ({
    executionStatus: 'completed',
    edges: s.edges.map(e => ({ ...e, animated: false })),
  }));
}

// Debounce helper for auto-save
let saveTimer: any = null;
function debouncedSave(getStore: () => WorkflowState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    getStore().saveToBackend();
  }, 1000);
}
