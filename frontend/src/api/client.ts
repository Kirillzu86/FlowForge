import { Workflow, WorkflowExecution, Credential } from '../types/workflow';

const BASE_URL = '/api/v1';

export const api = {
  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    try {
      const res = await fetch(`${BASE_URL}/workflows/`);
      if (!res.ok) throw new Error('Failed to fetch workflows');
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (err) {
      console.warn('API getWorkflows fallback to local demo data:', err);
      return getDemoWorkflows();
    }
  },

  async getWorkflow(id: string): Promise<Workflow> {
    try {
      const res = await fetch(`${BASE_URL}/workflows/${id}/`);
      if (!res.ok) throw new Error('Failed to fetch workflow');
      return await res.json();
    } catch (err) {
      console.warn('API getWorkflow fallback to local demo:', err);
      const demo = getDemoWorkflows().find(w => w.id === id) || getDemoWorkflows()[0];
      return demo;
    }
  },

  async saveWorkflow(id: string, partial: Partial<Workflow>): Promise<Workflow> {
    try {
      const res = await fetch(`${BASE_URL}/workflows/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (!res.ok) throw new Error('Failed to save workflow');
      return await res.json();
    } catch (err) {
      console.warn('API saveWorkflow local mock:', err);
      return { ...getDemoWorkflows()[0], ...partial } as Workflow;
    }
  },

  async createWorkflow(payload: Partial<Workflow>): Promise<Workflow> {
    try {
      const res = await fetch(`${BASE_URL}/workflows/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create workflow');
      return await res.json();
    } catch (err) {
      return {
        id: 'new-' + Date.now(),
        title: payload.title || 'Новый воркфлоу',
        description: payload.description || '',
        is_active: true,
        version: 1,
        nodes: payload.nodes || [],
        edges: payload.edges || [],
        variables: {},
        webhook_token: 'wb-' + Math.random().toString(36).substring(7),
        last_run_status: 'NEVER_RUN',
        last_run_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  async deleteWorkflow(id: string): Promise<void> {
    try {
      await fetch(`${BASE_URL}/workflows/${id}/`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API deleteWorkflow local mock', err);
    }
  },

  async runWorkflow(id: string, payload: any = {}): Promise<{ execution_id: string; status: string }> {
    try {
      const res = await fetch(`${BASE_URL}/workflows/${id}/run/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });
      if (!res.ok) throw new Error('Failed to start run');
      return await res.json();
    } catch (err) {
      console.warn('API runWorkflow fallback to mock id:', err);
      return { execution_id: 'mock-exec-' + Date.now(), status: 'PENDING' };
    }
  },

  async validateGraph(nodes: any[], edges: any[]): Promise<{ is_valid: boolean; has_cycle: boolean; error: string | null; cycle_nodes: string[] }> {
    try {
      const res = await fetch(`${BASE_URL}/workflows/validate-graph/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback local cycle detection
    }
    return localDetectCycles(nodes, edges);
  },

  // Executions
  async getExecutions(): Promise<WorkflowExecution[]> {
    try {
      const res = await fetch(`${BASE_URL}/executions/`);
      if (!res.ok) throw new Error('Failed to fetch executions');
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (err) {
      return getDemoExecutions();
    }
  },

  async getExecution(id: string): Promise<WorkflowExecution> {
    try {
      const res = await fetch(`${BASE_URL}/executions/${id}/`);
      if (!res.ok) throw new Error('Failed to fetch execution');
      return await res.json();
    } catch (err) {
      return getDemoExecutions().find(e => e.id === id) || getDemoExecutions()[0];
    }
  },

  // Credentials
  async getCredentials(): Promise<Credential[]> {
    try {
      const res = await fetch(`${BASE_URL}/credentials/`);
      if (!res.ok) throw new Error('Failed to fetch credentials');
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (err) {
      return getDemoCredentials();
    }
  },

  async createCredential(payload: { name: string; provider: string; value: string }): Promise<Credential> {
    try {
      const res = await fetch(`${BASE_URL}/credentials/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create credential');
      return await res.json();
    } catch (err) {
      return {
        id: 'cred-' + Date.now(),
        name: payload.name,
        provider: payload.provider as any,
        masked_value: payload.value ? payload.value.slice(0, 3) + '••••••••' + payload.value.slice(-4) : '••••••••',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  async deleteCredential(id: string): Promise<void> {
    try {
      await fetch(`${BASE_URL}/credentials/${id}/`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Delete credential error', err);
    }
  }
};

// Local cycle detection helper
function localDetectCycles(nodes: any[], edges: any[]) {
  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  nodes.forEach(n => {
    adj[n.id] = [];
    inDegree[n.id] = 0;
  });
  edges.forEach(e => {
    if (adj[e.source] && inDegree[e.target] !== undefined) {
      adj[e.source].push(e.target);
      inDegree[e.target]++;
    }
  });
  const queue = Object.keys(inDegree).filter(id => inDegree[id] === 0);
  let visited = 0;
  while (queue.length > 0) {
    const u = queue.shift()!;
    visited++;
    for (const v of adj[u] || []) {
      inDegree[v]--;
      if (inDegree[v] === 0) queue.push(v);
    }
  }
  const hasCycle = visited < nodes.length;
  const cycleNodes = hasCycle ? Object.keys(inDegree).filter(id => inDegree[id] > 0) : [];
  return {
    is_valid: !hasCycle,
    has_cycle: hasCycle,
    error: hasCycle ? `Цикл запрещён: обнаружена циклическая зависимость между узлами ${cycleNodes.join(', ')}` : null,
    cycle_nodes: cycleNodes,
  };
}

// Demo fallback data matching the design boards exactly
export function getDemoWorkflows(): Workflow[] {
  return [
    {
      id: 'wf-leads-01',
      title: 'Оценка лидов',
      description: 'Claude оценивает заявку, условие score ≥ 80, запись в CRM.',
      is_active: true,
      version: 1,
      webhook_token: 'ab12',
      last_run_status: 'SUCCESS',
      last_run_at: '2026-11-04T12:00:00Z',
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-04T12:00:00Z',
      variables: {},
      nodes: [
        {
          id: 'node_webhook',
          type: 'trigger',
          position: { x: 20, y: 70 },
          data: {
            title: 'Webhook',
            triggerType: 'webhook',
            webhookPath: '/webhook/ab12',
            status: 'success',
            execution_time_ms: 12,
            tokens_used: 0,
            defaultPayload: {
              name: 'Алексей Иванов',
              company: 'TechRetail',
              request: 'Ищем решение для AI-интеграции в CRM'
            }
          }
        },
        {
          id: 'node_llm',
          type: 'llm',
          position: { x: 215, y: 60 },
          data: {
            title: 'Оценка заявки',
            model: 'gpt-4o',
            temperature: 0.2,
            max_tokens: 1024,
            prompt: 'Оцени заявку от 0 до 100: [текст заявки]',
            status: 'success',
            execution_time_ms: 842,
            tokens_used: 842,
            output: { score: 87, summary: 'Заявка тёплая: клиент готов к демо' }
          }
        },
        {
          id: 'node_condition',
          type: 'condition',
          position: { x: 430, y: 90 },
          data: {
            title: 'Условие',
            expression: 'score ≥ 80',
            status: 'success',
            execution_time_ms: 4,
            tokens_used: 0,
            output: { result: true, active_handle: 'true' }
          }
        },
        {
          id: 'node_action_true',
          type: 'action',
          position: { x: 620, y: 40 },
          data: {
            title: 'HTTP POST',
            method: 'POST',
            url: 'https://api.crm.example.com/v1/leads',
            status: 'success',
            execution_time_ms: 65,
            tokens_used: 0,
            output: { status_code: 200, data: { success: true } }
          }
        },
        {
          id: 'node_action_false',
          type: 'code',
          position: { x: 620, y: 160 },
          data: {
            title: 'Python',
            code: "output = {'status': 'archive', 'reason': 'Lead score under 80'}",
            status: 'skipped',
            execution_time_ms: 0,
            tokens_used: 0
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'node_webhook', target: 'node_llm', animated: false },
        { id: 'e2', source: 'node_llm', target: 'node_condition', animated: false },
        { id: 'e3', source: 'node_condition', target: 'node_action_true', sourceHandle: 'true', animated: false },
        { id: 'e4', source: 'node_condition', target: 'node_action_false', sourceHandle: 'false', animated: false }
      ]
    },
    {
      id: 'wf-email-02',
      title: 'Суммаризация писем',
      description: 'Webhook → GPT-4o → отправка в Slack.',
      is_active: true,
      version: 1,
      webhook_token: 'cd34',
      last_run_status: 'SUCCESS',
      last_run_at: '2026-11-05T09:30:00Z',
      created_at: '2026-11-02T10:00:00Z',
      updated_at: '2026-11-05T09:30:00Z',
      variables: {},
      nodes: [
        { id: 'n1', type: 'trigger', position: { x: 50, y: 80 }, data: { title: 'Webhook' } },
        { id: 'n2', type: 'llm', position: { x: 260, y: 80 }, data: { title: 'GPT-4o', model: 'gpt-4o' } },
        { id: 'n3', type: 'action', position: { x: 480, y: 80 }, data: { title: 'Slack HTTP', method: 'POST' } }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' }
      ]
    },
    {
      id: 'wf-night-03',
      title: 'Ночной отчёт',
      description: 'Cron → HTTP → Python → Gemini.',
      is_active: true,
      version: 1,
      webhook_token: 'ef56',
      last_run_status: 'SUCCESS',
      last_run_at: '2026-11-02T22:00:00Z',
      created_at: '2026-10-28T10:00:00Z',
      updated_at: '2026-11-02T22:00:00Z',
      variables: {},
      nodes: [
        { id: 'n1', type: 'trigger', position: { x: 50, y: 80 }, data: { title: 'Cron' } },
        { id: 'n2', type: 'action', position: { x: 250, y: 80 }, data: { title: 'HTTP GET' } },
        { id: 'n3', type: 'code', position: { x: 450, y: 80 }, data: { title: 'Python' } },
        { id: 'n4', type: 'llm', position: { x: 650, y: 80 }, data: { title: 'Gemini', model: 'gemini-1.5-pro' } }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n4' }
      ]
    },
    {
      id: 'wf-local-04',
      title: 'Локальный чат-бот',
      description: 'Ollama llama3 через host.docker.internal.',
      is_active: false,
      version: 1,
      webhook_token: 'gh78',
      last_run_status: 'NEVER_RUN',
      last_run_at: null,
      created_at: '2026-10-30T10:00:00Z',
      updated_at: '2026-10-30T10:00:00Z',
      variables: {},
      nodes: [
        { id: 'n1', type: 'trigger', position: { x: 50, y: 80 }, data: { title: 'Webhook' } },
        { id: 'n2', type: 'llm', position: { x: 280, y: 80 }, data: { title: 'Ollama Llama3', model: 'ollama/llama3' } }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' }
      ]
    }
  ];
}

export function getDemoExecutions(): WorkflowExecution[] {
  return [
    {
      id: 'exec-101',
      workflow: 'wf-leads-01',
      workflow_title: 'Оценка лидов',
      trigger_type: 'WEBHOOK',
      status: 'COMPLETED',
      duration_ms: 923,
      total_tokens: 842,
      started_at: '2026-11-04T12:00:00Z',
      finished_at: '2026-11-04T12:00:01Z',
      created_at: '2026-11-04T12:00:00Z',
      trigger_payload: { name: 'Алексей Иванов', budget: 50000 },
      context_data: {
        nodes: {
          node_llm: { output: { score: 87, summary: 'Заявка тёплая' } }
        }
      },
      error_message: null,
      logs: [
        {
          id: 'log-1',
          node_id: 'node_webhook',
          node_type: 'trigger',
          node_title: 'Webhook',
          status: 'SUCCESS',
          execution_time_ms: 12,
          tokens_used: 0,
          error_trace: null,
          started_at: '2026-11-04T12:00:00Z',
          finished_at: '2026-11-04T12:00:00.012Z',
          created_at: '2026-11-04T12:00:00Z',
          input_payload: {},
          output_payload: { lead: 'Алексей Иванов' }
        },
        {
          id: 'log-2',
          node_id: 'node_llm',
          node_type: 'llm',
          node_title: 'Оценка заявки',
          status: 'SUCCESS',
          execution_time_ms: 842,
          tokens_used: 842,
          error_trace: null,
          started_at: '2026-11-04T12:00:00.015Z',
          finished_at: '2026-11-04T12:00:00.857Z',
          created_at: '2026-11-04T12:00:00Z',
          input_payload: { prompt: 'Оцени заявку от 0 до 100: Алексей Иванов' },
          output_payload: { score: 87, summary: 'Заявка тёплая' }
        },
        {
          id: 'log-3',
          node_id: 'node_condition',
          node_type: 'condition',
          node_title: 'score ≥ 80',
          status: 'SUCCESS',
          execution_time_ms: 4,
          tokens_used: 0,
          error_trace: null,
          started_at: '2026-11-04T12:00:00.860Z',
          finished_at: '2026-11-04T12:00:00.864Z',
          created_at: '2026-11-04T12:00:00Z',
          input_payload: { score: 87 },
          output_payload: { result: true, active_handle: 'true' }
        },
        {
          id: 'log-4',
          node_id: 'node_action_true',
          node_type: 'action',
          node_title: 'HTTP POST',
          status: 'SUCCESS',
          execution_time_ms: 65,
          tokens_used: 0,
          error_trace: null,
          started_at: '2026-11-04T12:00:00.865Z',
          finished_at: '2026-11-04T12:00:00.930Z',
          created_at: '2026-11-04T12:00:00Z',
          input_payload: { url: 'https://api.crm.example.com/v1/leads' },
          output_payload: { status_code: 200, data: { saved: true } }
        },
        {
          id: 'log-5',
          node_id: 'node_action_false',
          node_type: 'code',
          node_title: 'Python',
          status: 'SKIPPED',
          execution_time_ms: 0,
          tokens_used: 0,
          error_trace: null,
          started_at: null,
          finished_at: null,
          created_at: '2026-11-04T12:00:00Z',
          input_payload: {},
          output_payload: {}
        }
      ]
    },
    {
      id: 'exec-102',
      workflow: 'wf-leads-01',
      workflow_title: 'Оценка лидов',
      trigger_type: 'WEBHOOK',
      status: 'FAILED',
      duration_ms: 310,
      total_tokens: 0,
      started_at: '2026-11-03T18:40:00Z',
      finished_at: '2026-11-03T18:40:00Z',
      created_at: '2026-11-03T18:40:00Z',
      trigger_payload: { raw: 'invalid lead payload' },
      context_data: {},
      error_message: 'HTTPStatusError: 502 Bad Gateway',
      logs: [
        {
          id: 'log-201',
          node_id: 'node_action_true',
          node_type: 'action',
          node_title: 'HTTP POST',
          status: 'FAILED',
          execution_time_ms: 310,
          tokens_used: 0,
          error_trace: 'httpx.HTTPStatusError: 502 Bad Gateway at https://api.crm.example.com/v1/leads',
          started_at: '2026-11-03T18:40:00Z',
          finished_at: '2026-11-03T18:40:00.310Z',
          created_at: '2026-11-03T18:40:00Z',
          input_payload: { url: 'https://api.crm.example.com/v1/leads' },
          output_payload: { status_code: 502, error: 'Bad Gateway' }
        }
      ]
    }
  ];
}

export function getDemoCredentials(): Credential[] {
  return [
    {
      id: 'cred-1',
      name: 'OpenAI Production Key',
      provider: 'OPENAI',
      masked_value: 'sk-proj••••••••9988',
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-01T10:00:00Z'
    },
    {
      id: 'cred-2',
      name: 'Anthropic Claude Key',
      provider: 'ANTHROPIC',
      masked_value: 'sk-ant••••••••7890',
      created_at: '2026-11-02T11:00:00Z',
      updated_at: '2026-11-02T11:00:00Z'
    },
    {
      id: 'cred-3',
      name: 'Google Gemini Pro Key',
      provider: 'GEMINI',
      masked_value: 'AIza••••••••cdef',
      created_at: '2026-11-03T09:00:00Z',
      updated_at: '2026-11-03T09:00:00Z'
    },
    {
      id: 'cred-4',
      name: 'Slack Notification Token',
      provider: 'CUSTOM_HEADER',
      masked_value: 'xoxb••••••••samp',
      created_at: '2026-11-04T15:00:00Z',
      updated_at: '2026-11-04T15:00:00Z'
    }
  ];
}
