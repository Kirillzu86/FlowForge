import { Node, Edge } from '@xyflow/react';

export type NodeStatus = 'idle' | 'running' | 'success' | 'failed' | 'skipped';

export interface WorkflowNodeData extends Record<string, unknown> {
  title?: string;
  label?: string;
  triggerType?: 'manual' | 'webhook' | 'cron';
  webhookPath?: string;
  defaultPayload?: Record<string, any>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  prompt?: string;
  expression?: string;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  code?: string;
  status?: NodeStatus;
  output?: Record<string, any>;
  execution_time_ms?: number;
  tokens_used?: number;
  error?: string | null;
}

export type CustomWorkflowNode = Node<WorkflowNodeData>;
export type CustomWorkflowEdge = Edge;

export interface Workflow {
  id: string;
  workspace?: string | null;
  title: string;
  description: string;
  is_active: boolean;
  version: number;
  nodes: CustomWorkflowNode[];
  edges: CustomWorkflowEdge[];
  variables: Record<string, any>;
  webhook_token: string;
  last_run_status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'NEVER_RUN';
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
  graph_diagnostics?: {
    is_valid: boolean;
    has_cycle: boolean;
    levels: string[][];
    error: string | null;
    cycle_nodes: string[];
  };
}

export interface NodeExecutionLog {
  id: string;
  node_id: string;
  node_type: string;
  node_title: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  input_payload: Record<string, any>;
  output_payload: Record<string, any>;
  execution_time_ms: number;
  tokens_used: number;
  error_trace: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow: string;
  workflow_title?: string;
  trigger_type: 'MANUAL' | 'WEBHOOK' | 'CRON';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  context_data: Record<string, any>;
  trigger_payload: Record<string, any>;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number;
  total_tokens: number;
  created_at: string;
  logs: NodeExecutionLog[];
}

export interface Credential {
  id: string;
  name: string;
  provider: 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'DEEPSEEK' | 'CUSTOM_HEADER' | 'BEARER_TOKEN' | 'OTHER';
  masked_value: string;
  created_at: string;
  updated_at: string;
}
