import { describe, expect, it } from 'vitest';
import { createMockClient } from './mockClient';
import { DEMO_USERS } from './seed';

function setup() {
  let token: string | null = null;
  const client = createMockClient({ getToken: () => token, onUnauthorized: () => (token = null) });
  const signIn = (userId: string) => {
    token = `mock-token-${userId}`;
  };
  return { client, signIn };
}

describe('cliente en memoria: reglas del contrato', () => {
  it('rechaza las llamadas sin sesión con 401', async () => {
    const { client } = setup();
    await expect(client.listProjects()).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
  });

  it('un proyecto nuevo arranca en REQUIREMENTS y sin historias no se puede refinar', async () => {
    const { client, signIn } = setup();
    signIn(DEMO_USERS.productOwner.id);
    const project = await client.createProject({ name: 'Nuevo', description: '', squadId: 's-0001' });
    expect(project.currentPhase).toBe('REQUIREMENTS');
    expect(project.journey.map((step) => step.progress)).toEqual([
      'IN_PROGRESS',
      'PENDING',
      'PENDING',
      'PENDING',
      'PENDING',
    ]);
    await expect(client.executeRequirements(project.id)).rejects.toMatchObject({ status: 409, code: 'NO_STORIES' });
  });

  it('solo el rol que aprueba decide; pedir cambios exige comentario; aprobar avanza de fase', async () => {
    const { client, signIn } = setup();
    signIn(DEMO_USERS.developer.id);
    const execution = await client.executeRequirements('p-0001');
    expect(execution.status).toBe('PENDING_APPROVAL');
    expect(execution.refinedStories).toHaveLength(2);
    await expect(client.executeRequirements('p-0001')).rejects.toMatchObject({ code: 'PHASE_AWAITING_GATE' });
    await expect(client.decide(execution.id, { decision: 'APPROVE', comment: null })).rejects.toMatchObject({
      status: 403,
      code: 'NOT_GATE_APPROVER',
    });
    expect(await client.listPendingApprovals()).toHaveLength(0);

    signIn(DEMO_USERS.productOwner.id);
    expect(await client.listPendingApprovals()).toHaveLength(1);
    await expect(client.decide(execution.id, { decision: 'REQUEST_REWORK', comment: ' ' })).rejects.toMatchObject({
      status: 400,
      code: 'COMMENT_REQUIRED',
    });
    const decided = await client.decide(execution.id, { decision: 'APPROVE', comment: null });
    expect(decided.status).toBe('ACCEPTED');
    await expect(client.decide(execution.id, { decision: 'REJECT', comment: 'tarde' })).rejects.toMatchObject({
      code: 'EXECUTION_ALREADY_DECIDED',
    });

    const project = await client.getProject('p-0001');
    expect(project.currentPhase).toBe('ANALYSIS');
    expect(project.journey[0]?.progress).toBe('APPROVED');
    expect(project.journey[1]?.progress).toBe('IN_PROGRESS');
    expect(project.stories.every((story) => story.refined !== null)).toBe(true);
    await expect(client.executeRequirements('p-0001')).rejects.toMatchObject({ code: 'PHASE_ALREADY_APPROVED' });
  });

  it('un rechazo deja la fase en curso y las historias sin refinamiento vigente', async () => {
    const { client, signIn } = setup();
    signIn(DEMO_USERS.productOwner.id);
    const execution = await client.executeRequirements('p-0001');
    await client.decide(execution.id, { decision: 'REJECT', comment: 'No aplica' });
    const project = await client.getProject('p-0001');
    expect(project.journey[0]?.progress).toBe('IN_PROGRESS');
    expect(project.journey[0]?.lastExecution?.status).toBe('REJECTED');
    expect(project.stories.every((story) => story.refined === null)).toBe(true);
  });

  it('un agente nuevo queda PLANNED sin versión y no devuelve instrucciones en el listado', async () => {
    const { client, signIn } = setup();
    signIn(DEMO_USERS.productOwner.id);
    const agent = await client.createAgent({
      name: 'Agente de diseño',
      phaseCode: 'DESIGN',
      description: '',
      repositoryUrl: 'https://example.com/repo',
      repositoryPath: 'agents/diseno',
      ownerUserId: DEMO_USERS.architect.id,
    });
    expect(agent).toMatchObject({ status: 'PLANNED', currentVersion: null, versions: [] });
    const updated = await client.addAgentVersion(agent.id, {
      version: '0.1.0',
      commitSha: 'abc1234',
      instructions: '# agente',
      changeNotes: '',
    });
    expect(updated.currentVersion).toBe('0.1.0');
    expect(updated.versions[0]?.instructions).toBe('# agente');
    const listed = (await client.listAgents({ phase: 'DESIGN' })).find((item) => item.id === agent.id);
    expect(listed?.versions[0]).not.toHaveProperty('instructions');
  });
});
