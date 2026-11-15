import type { QueryClient } from '@tanstack/react-query';
import type { AgentFilters, ExecutionFilters } from './types';

export const queryKeys = {
  users: ['users'] as const,
  phases: ['phases'] as const,
  dashboard: ['dashboard'] as const,
  squads: ['squads'] as const,
  agents: ['agents'] as const,
  agentList: (filters: AgentFilters) => ['agents', 'list', filters] as const,
  agent: (agentId: string) => ['agents', 'detail', agentId] as const,
  projects: ['projects'] as const,
  projectList: ['projects', 'list'] as const,
  project: (projectId: string) => ['projects', 'detail', projectId] as const,
  executions: ['executions'] as const,
  executionList: (filters: ExecutionFilters) => ['executions', 'list', filters] as const,
  execution: (executionId: string) => ['executions', 'detail', executionId] as const,
  approvals: ['approvals'] as const,
};

/** Tras ejecutar un agente o decidir un gate cambia todo lo que depende del avance. */
export function invalidateWorkflow(queryClient: QueryClient): Promise<void[]> {
  return Promise.all(
    [queryKeys.projects, queryKeys.executions, queryKeys.approvals, queryKeys.dashboard].map((key) =>
      queryClient.invalidateQueries({ queryKey: key }),
    ),
  );
}
