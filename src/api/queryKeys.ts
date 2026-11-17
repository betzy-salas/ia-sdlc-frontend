import type { QueryClient } from '@tanstack/react-query';
import type { AgentFilters, ExecutionFilters, InitiativeFilters } from './types';

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
  initiatives: ['initiatives'] as const,
  initiativeList: (filters: InitiativeFilters) => ['initiatives', 'list', filters] as const,
  initiative: (initiativeId: string) => ['initiatives', 'detail', initiativeId] as const,
  executions: ['executions'] as const,
  executionList: (filters: ExecutionFilters) => ['executions', 'list', filters] as const,
  execution: (executionId: string) => ['executions', 'detail', executionId] as const,
  approvals: ['approvals'] as const,
};

function invalidateAll(queryClient: QueryClient, keys: readonly (readonly string[])[]): Promise<void[]> {
  return Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
}

/** Tras crear una iniciativa o cambiar sus historias cambian los conteos del proyecto y de Inicio. */
export function invalidateStructure(queryClient: QueryClient): Promise<void[]> {
  return invalidateAll(queryClient, [queryKeys.initiatives, queryKeys.projects, queryKeys.dashboard]);
}

/** Tras ejecutar un agente o decidir un gate cambia todo lo que depende del avance. */
export function invalidateWorkflow(queryClient: QueryClient): Promise<void[]> {
  return invalidateAll(queryClient, [
    queryKeys.initiatives,
    queryKeys.projects,
    queryKeys.executions,
    queryKeys.approvals,
    queryKeys.dashboard,
  ]);
}
