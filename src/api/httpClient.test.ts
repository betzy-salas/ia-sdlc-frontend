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
    await client.executeRequirements('p 1');
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('/api/v1/projects/p%201/phases/REQUIREMENTS/executions');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });

  it('arma los filtros como query string y omite los vacíos', async () => {
    const { client, fetchFn } = setup(jsonResponse(200, []));
    await client.listExecutions({ status: 'PENDING_APPROVAL' });
    expect(fetchFn.mock.calls[0]![0]).toBe('/api/v1/executions?status=PENDING_APPROVAL');
  });

  it('convierte el error del back en ApiError con code y message', async () => {
    const { client, onUnauthorized } = setup(
      jsonResponse(409, { code: 'NO_STORIES', message: 'El proyecto no tiene historias', details: [] }),
    );
    const error = await client.executeRequirements('p1').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'NO_STORIES', message: 'El proyecto no tiene historias' });
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
    await expect(client.deleteStory('p1', 's1')).resolves.toBeUndefined();
  });
});
