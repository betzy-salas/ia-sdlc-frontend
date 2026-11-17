import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './ApiError';
import { createHttpClient } from './httpClient';

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function setup(response: Response, token: string | null = 'abc') {
  const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(response);
  const onUnauthorized = vi.fn();
  const client = createHttpClient({ baseUrl: '/api/v1/', getToken: () => token, onUnauthorized, fetchFn });
  return { client, fetchFn, onUnauthorized };
}

describe('createHttpClient', () => {
  it('usa las rutas del contrato y envía el token', async () => {
    const { client, fetchFn } = setup(jsonResponse(201, { id: 'e1' }));
    await client.executeRequirements('i 1');
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('/api/v1/initiatives/i%201/phases/REQUIREMENTS/executions');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });

  it('arma los filtros como query string y omite los vacíos', async () => {
    const { client, fetchFn } = setup(jsonResponse(200, []));
    await client.listExecutions({ status: 'PENDING_APPROVAL' });
    expect(fetchFn.mock.calls[0]![0]).toBe('/api/v1/executions?status=PENDING_APPROVAL');
  });

  it('las iniciativas y sus historias usan las rutas del contrato', async () => {
    const { client, fetchFn } = setup(jsonResponse(200, {}));
    fetchFn.mockImplementation(async () => jsonResponse(200, {}));
    await client.createInitiative('p1', { name: 'Lote 1', description: '' });
    await client.listInitiatives({ projectId: 'p1', phase: 'ANALYSIS' });
    await client.getInitiative('i1');
    await client.addStory('i1', { title: 't', description: 'd', origin: 'EXISTING' });
    await client.deleteStory('i1', 's1');
    await client.listExecutions({ initiativeId: 'i1', projectId: 'p1' });
    expect(fetchFn.mock.calls.map(([url, init]) => `${init?.method} ${String(url)}`)).toEqual([
      'POST /api/v1/projects/p1/initiatives',
      'GET /api/v1/initiatives?projectId=p1&phase=ANALYSIS',
      'GET /api/v1/initiatives/i1',
      'POST /api/v1/initiatives/i1/stories',
      'DELETE /api/v1/initiatives/i1/stories/s1',
      'GET /api/v1/executions?initiativeId=i1&projectId=p1',
    ]);
  });

  it('convierte el error del back en ApiError con code y message', async () => {
    const { client, onUnauthorized } = setup(
      jsonResponse(409, { code: 'NO_STORIES', message: 'La iniciativa no tiene historias', details: [] }),
    );
    const error = await client.executeRequirements('i1').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'NO_STORIES', message: 'La iniciativa no tiene historias' });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('un 401 en una ruta autenticada cierra la sesión', async () => {
    const { client, onUnauthorized } = setup(jsonResponse(401, { code: 'UNAUTHORIZED', message: 'Sin token' }));
    await expect(client.listProjects()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('un 401 del login no cierra sesión ni envía token', async () => {
    const { client, fetchFn, onUnauthorized } = setup(
      jsonResponse(401, { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' }),
    );
    await expect(client.login({ email: 'a@b.c', password: 'x' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
    const headers = fetchFn.mock.calls[0]![1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('acepta respuestas 204 sin cuerpo', async () => {
    const { client } = setup(jsonResponse(204));
    await expect(client.deleteStory('i1', 's1')).resolves.toBeUndefined();
  });
});
