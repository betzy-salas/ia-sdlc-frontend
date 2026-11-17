import { ApiError } from './ApiError';
import type { ApiClient, ClientSession } from './client';
import type { ApiErrorBody } from './types';

export interface HttpClientOptions extends ClientSession {
  baseUrl: string;
  fetchFn?: typeof fetch;
}

type Query = Record<string, string | undefined>;

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function isErrorBody(value: unknown): value is Partial<ApiErrorBody> {
  return typeof value === 'object' && value !== null;
}

export function createHttpClient(options: HttpClientOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    { auth = true }: { auth?: boolean } = {},
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = auth ? options.getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    const doFetch = options.fetchFn ?? fetch;
    let response: Response;
    try {
      response = await doFetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        'No se pudo conectar con el servidor. Revisa que el backend esté disponible.',
      );
    }

    const text = response.status === 204 ? '' : await response.text();
    let data: unknown = undefined;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = undefined;
      }
    }

    if (!response.ok) {
      if (response.status === 401 && auth) options.onUnauthorized();
      const errorBody = isErrorBody(data) ? data : {};
      throw new ApiError(
        response.status,
        typeof errorBody.code === 'string' ? errorBody.code : `HTTP_${response.status}`,
        typeof errorBody.message === 'string'
          ? errorBody.message
          : `El servidor respondió con un error (${response.status}).`,
        Array.isArray(errorBody.details) ? errorBody.details : [],
      );
    }
    return data as T;
  }

  const id = encodeURIComponent;

  return {
    register: (body) => request('POST', '/auth/register', body, { auth: false }),
    login: (body) => request('POST', '/auth/login', body, { auth: false }),
    me: () => request('GET', '/auth/me'),

    listUsers: () => request('GET', '/users'),
    listPhases: () => request('GET', '/phases'),

    listSquads: () => request('GET', '/squads'),
    createSquad: (body) => request('POST', '/squads', body),
    getSquad: (squadId) => request('GET', `/squads/${id(squadId)}`),
    addSquadMember: (squadId, body) => request('POST', `/squads/${id(squadId)}/members`, body),
    removeSquadMember: (squadId, memberId) =>
      request('DELETE', `/squads/${id(squadId)}/members/${id(memberId)}`),

    listAgents: (filters) =>
      request('GET', withQuery('/agents', { phase: filters?.phase, status: filters?.status })),
    createAgent: (body) => request('POST', '/agents', body),
    getAgent: (agentId) => request('GET', `/agents/${id(agentId)}`),
    addAgentVersion: (agentId, body) => request('POST', `/agents/${id(agentId)}/versions`, body),
    changeAgentStatus: (agentId, body) => request('PATCH', `/agents/${id(agentId)}/status`, body),

    listProjects: () => request('GET', '/projects'),
    createProject: (body) => request('POST', '/projects', body),
    getProject: (projectId) => request('GET', `/projects/${id(projectId)}`),

    createInitiative: (projectId, body) => request('POST', `/projects/${id(projectId)}/initiatives`, body),
    listInitiatives: (filters) =>
      request('GET', withQuery('/initiatives', { projectId: filters?.projectId, phase: filters?.phase })),
    getInitiative: (initiativeId) => request('GET', `/initiatives/${id(initiativeId)}`),
    addStory: (initiativeId, body) => request('POST', `/initiatives/${id(initiativeId)}/stories`, body),
    deleteStory: (initiativeId, storyId) =>
      request('DELETE', `/initiatives/${id(initiativeId)}/stories/${id(storyId)}`),

    executeRequirements: (initiativeId) =>
      request('POST', `/initiatives/${id(initiativeId)}/phases/REQUIREMENTS/executions`),
    listExecutions: (filters) =>
      request(
        'GET',
        withQuery('/executions', {
          initiativeId: filters?.initiativeId,
          projectId: filters?.projectId,
          status: filters?.status,
        }),
      ),
    getExecution: (executionId) => request('GET', `/executions/${id(executionId)}`),

    listPendingApprovals: () => request('GET', '/approvals/pending'),
    decide: (executionId, body) => request('POST', `/executions/${id(executionId)}/decision`, body),

    getDashboardPhases: () => request('GET', '/dashboard/phases'),
  };
}
