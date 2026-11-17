import { describe, expect, it } from 'vitest';
import { createMockClient } from './mockClient';
import { DEMO_IDS, DEMO_USERS } from './seed';

const IN_REQUIREMENTS = DEMO_IDS.initiativeInRequirements;
const IN_ANALYSIS = DEMO_IDS.initiativeInAnalysis;

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

  it('los datos de ejemplo traen un proyecto con dos iniciativas en fases distintas', async () => {
    const { client, signIn } = setup();
    signIn(DEMO_USERS.productOwner.id);
    const summary = (await client.listProjects()).find((item) => item.id === DEMO_IDS.project);
    expect(summary).toMatchObject({ name: 'Apertura de cuenta digital', initiativeCount: 2, squad: { name: 'Squad Demo' } });
    expect(summary).not.toHaveProperty('currentPhase');

    const project = await client.getProject(DEMO_IDS.project);
    expect(project).not.toHaveProperty('stories');
    expect(project.initiatives.map((item) => [item.id, item.currentPhase])).toEqual([
      [IN_REQUIREMENTS, 'REQUIREMENTS'],
      [IN_ANALYSIS, 'ANALYSIS'],
    ]);

    const pending = await client.getInitiative(IN_REQUIREMENTS);
    expect(pending.stories.length).toBeGreaterThan(0);
    expect(pending.stories.every((story) => story.refined === null)).toBe(true);
    const approved = await client.getInitiative(IN_ANALYSIS);
    expect(approved.journey.map((step) => step.progress).slice(0, 2)).toEqual(['APPROVED', 'IN_PROGRESS']);
    expect(approved.journey[0]?.lastExecution?.status).toBe('ACCEPTED');
    expect(approved.stories.every((story) => story.refined !== null)).toBe(true);
    await expect(
      client.addStory(IN_ANALYSIS, { title: 'Otra', description: 'Tarde', origin: 'EXISTING' }),
    ).rejects.toMatchObject({ status: 409, code: 'PHASE_ALREADY_APPROVED' });

    const dashboard = await client.getDashboardPhases();
    expect(dashboard.map((phase) => phase.initiativesInPhase)).toEqual([1, 1, 0, 0, 0]);
  });

  it('una iniciativa nueva arranca en REQUIREMENTS, hereda el squad y sin historias no se puede refinar', async () => {
    const { client, signIn } = setup();
    signIn(DEMO_USERS.productOwner.id);
    const project = await client.createProject({ name: 'Nuevo', description: '', squadId: DEMO_IDS.squad });
    expect(project.initiatives).toEqual([]);
    const initiative = await client.createInitiative(project.id, { name: 'Lote 1', description: '' });
    expect(initiative).toMatchObject({
      currentPhase: 'REQUIREMENTS',
      completed: false,
      project: { id: project.id, name: 'Nuevo' },
      squad: { id: DEMO_IDS.squad, name: 'Squad Demo' },
      stories: [],
    });
    expect(initiative.journey.map((step) => step.progress)).toEqual([
      'IN_PROGRESS',
      'PENDING',
      'PENDING',
      'PENDING',
      'PENDING',
    ]);
    await expect(client.executeRequirements(initiative.id)).rejects.toMatchObject({ status: 409, code: 'NO_STORIES' });
    expect((await client.getProject(project.id)).initiatives).toHaveLength(1);
  });

  it('el nombre de la iniciativa es único dentro del proyecto, no entre proyectos', async () => {
    const { client, signIn } = setup();
    signIn(DEMO_USERS.productOwner.id);
    const first = await client.createProject({ name: 'Uno', description: '', squadId: DEMO_IDS.squad });
    const second = await client.createProject({ name: 'Dos', description: '', squadId: DEMO_IDS.squad });
    await client.createInitiative(first.id, { name: 'Lote 1', description: '' });
    await expect(client.createInitiative(first.id, { name: 'lote 1', description: '' })).rejects.toMatchObject({
      status: 409,
      code: 'DUPLICATE_NAME',
    });
    await expect(client.createInitiative(second.id, { name: 'Lote 1', description: '' })).resolves.toMatchObject({
      name: 'Lote 1',
    });
  });

  it('crear proyecto, crear iniciativa, agregar historia, refinar, quedar pendiente y aprobar', async () => {
    const { client, signIn } = setup();
    signIn(DEMO_USERS.productOwner.id);
    const project = await client.createProject({ name: 'Pagos con QR', description: '', squadId: DEMO_IDS.squad });
    const initiative = await client.createInitiative(project.id, { name: 'Cobro en comercios', description: '' });
    const story = await client.addStory(initiative.id, {
      title: 'Generar un código QR',
      description: 'Como comerciante, quiero generar un código QR, para cobrar sin efectivo.',
      origin: 'ASSISTED',
    });
    expect(story.refined).toBeNull();

    const execution = await client.executeRequirements(initiative.id);
    expect(execution).toMatchObject({
      status: 'PENDING_APPROVAL',
      initiative: { id: initiative.id, name: 'Cobro en comercios' },
      project: { id: project.id, name: 'Pagos con QR' },
    });
    const awaiting = await client.getInitiative(initiative.id);
    expect(awaiting.journey[0]?.progress).toBe('AWAITING_GATE');
    expect(awaiting.stories[0]?.refined?.asA).toBe('comerciante');
    await expect(
      client.addStory(initiative.id, { title: 'Otra', description: 'Tarde', origin: 'EXISTING' }),
    ).rejects.toMatchObject({ code: 'PHASE_AWAITING_GATE' });
    expect((await client.listPendingApprovals()).map((item) => item.id)).toEqual([execution.id]);
    expect(await client.listExecutions({ initiativeId: initiative.id })).toHaveLength(1);
    expect(await client.listExecutions({ projectId: project.id, status: 'PENDING_APPROVAL' })).toHaveLength(1);

    await client.decide(execution.id, { decision: 'APPROVE', comment: null });
    const approved = await client.getInitiative(initiative.id);
    expect(approved.currentPhase).toBe('ANALYSIS');
    expect(approved.journey.map((step) => step.progress).slice(0, 2)).toEqual(['APPROVED', 'IN_PROGRESS']);
    expect(await client.listPendingApprovals()).toHaveLength(0);
    expect(await client.listInitiatives({ projectId: project.id, phase: 'ANALYSIS' })).toHaveLength(1);
    expect(await client.listInitiatives({ projectId: project.id, phase: 'REQUIREMENTS' })).toHaveLength(0);
  });

  it('dos iniciativas del mismo proyecto avanzan de fase de forma independiente', async () => {
    const { client, signIn } = setup();
    signIn(DEMO_USERS.productOwner.id);
    const project = await client.createProject({ name: 'Pagos con QR', description: '', squadId: DEMO_IDS.squad });
    const first = await client.createInitiative(project.id, { name: 'Lote A', description: '' });
    const second = await client.createInitiative(project.id, { name: 'Lote B', description: '' });
    const story = { title: 'Historia', description: 'Algo que hacer', origin: 'EXISTING' } as const;
    await client.addStory(first.id, story);
    await client.addStory(second.id, story);

    // Refinar la primera no bloquea a la segunda
    const execution = await client.executeRequirements(first.id);
    expect((await client.getInitiative(second.id)).journey[0]?.progress).toBe('IN_PROGRESS');
    await expect(client.addStory(second.id, story)).resolves.toMatchObject({ title: 'Historia' });

    // Aprobar la primera solo avanza la primera
    await client.decide(execution.id, { decision: 'APPROVE', comment: null });
    const phases = (await client.getProject(project.id)).initiatives.map((item) => [item.name, item.currentPhase, item.storyCount]);
    expect(phases).toEqual([
      ['Lote A', 'ANALYSIS', 1],
      ['Lote B', 'REQUIREMENTS', 2],
    ]);
    expect((await client.getInitiative(second.id)).stories.every((item) => item.refined === null)).toBe(true);

    // La segunda sigue su propio camino: se refina y se rechaza sin tocar a la primera
    const other = await client.executeRequirements(second.id);
    await client.decide(other.id, { decision: 'REJECT', comment: 'No aplica' });
    expect((await client.getInitiative(second.id)).currentPhase).toBe('REQUIREMENTS');
    expect((await client.getInitiative(first.id)).currentPhase).toBe('ANALYSIS');
    await expect(client.executeRequirements(first.id)).rejects.toMatchObject({ code: 'PHASE_ALREADY_APPROVED' });
  });

  it('solo el rol que aprueba decide; pedir cambios exige comentario; aprobar avanza de fase', async () => {
    const { client, signIn } = setup();
    signIn(DEMO_USERS.developer.id);
    const execution = await client.executeRequirements(IN_REQUIREMENTS);
    expect(execution.status).toBe('PENDING_APPROVAL');
    expect(execution.refinedStories).toHaveLength(2);
    await expect(client.executeRequirements(IN_REQUIREMENTS)).rejects.toMatchObject({ code: 'PHASE_AWAITING_GATE' });
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

    const initiative = await client.getInitiative(IN_REQUIREMENTS);
    expect(initiative.currentPhase).toBe('ANALYSIS');
    expect(initiative.journey[0]?.progress).toBe('APPROVED');
    expect(initiative.journey[1]?.progress).toBe('IN_PROGRESS');
    expect(initiative.stories.every((story) => story.refined !== null)).toBe(true);
    await expect(client.executeRequirements(IN_REQUIREMENTS)).rejects.toMatchObject({ code: 'PHASE_ALREADY_APPROVED' });
  });

  it('un rechazo deja la fase en curso y las historias sin refinamiento vigente', async () => {
    const { client, signIn } = setup();
    signIn(DEMO_USERS.productOwner.id);
    const execution = await client.executeRequirements(IN_REQUIREMENTS);
    await client.decide(execution.id, { decision: 'REJECT', comment: 'No aplica' });
    const initiative = await client.getInitiative(IN_REQUIREMENTS);
    expect(initiative.journey[0]?.progress).toBe('IN_PROGRESS');
    expect(initiative.journey[0]?.lastExecution?.status).toBe('REJECTED');
    expect(initiative.stories.every((story) => story.refined === null)).toBe(true);
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
