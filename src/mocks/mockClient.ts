import { ApiError } from '../api/ApiError';
import type { ApiClient, ClientSession } from '../api/client';
import type {
  Agent,
  Execution,
  ExecutionSummary,
  Initiative,
  InitiativeSummary,
  Member,
  NamedRef,
  PhaseCode,
  PhaseStep,
  Project,
  RefinedStory,
  Squad,
  Story,
  User,
} from '../api/types';
import { refineStory } from './refine';
import {
  createSeedDb,
  initialProgress,
  PHASE_SEED,
  type Db,
  type DbAgent,
  type DbInitiative,
  type DbProject,
  type DbSquad,
  type DbUser,
} from './seed';

export interface MockClientOptions extends ClientSession {
  /** Demora simulada de cada llamada, en milisegundos. */
  latencyMs?: number;
  db?: Db;
}

const TOKEN_PREFIX = 'mock-token-';

function newId(): string {
  return crypto.randomUUID();
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function summaryOf(execution: Execution): ExecutionSummary {
  const { id, initiative, project, phaseCode, agent, launchedBy, status, createdAt } = execution;
  return clone({ id, initiative, project, phaseCode, agent, launchedBy, status, createdAt });
}

/**
 * Cliente de API en memoria para el modo demo y las pruebas. Implementa la misma
 * interfaz que el cliente HTTP, con las formas del contrato y sus reglas básicas.
 * Los datos viven solo en memoria: al recargar la página vuelven los de ejemplo.
 */
export function createMockClient(options: MockClientOptions): ApiClient {
  const db = options.db ?? createSeedDb();
  const latencyMs = options.latencyMs ?? 0;

  // --- utilidades
  function fail(status: number, code: string, message: string): never {
    throw new ApiError(status, code, message);
  }

  function requireText(value: string | null | undefined, field: string): string {
    const text = (value ?? '').trim();
    if (!text) fail(400, 'VALIDATION_ERROR', `El campo "${field}" es obligatorio.`);
    return text;
  }

  function currentUser(): DbUser {
    const token = options.getToken();
    const user = token?.startsWith(TOKEN_PREFIX)
      ? db.users.find((candidate) => candidate.id === token.slice(TOKEN_PREFIX.length))
      : undefined;
    if (!user) {
      options.onUnauthorized();
      fail(401, 'UNAUTHORIZED', 'Tu sesión no es válida. Ingresa de nuevo.');
    }
    return user;
  }

  function findOr404<T extends { id: string }>(items: T[], id: string, what: string): T {
    const item = items.find((candidate) => candidate.id === id);
    if (!item) fail(404, 'NOT_FOUND', `No existe ${what} con ese identificador.`);
    return item;
  }

  function userName(userId: string): string {
    return db.users.find((user) => user.id === userId)?.fullName ?? 'Usuario desconocido';
  }

  // --- armado de respuestas con las formas del contrato
  function toUser(user: DbUser): User {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      memberships: db.squads.flatMap((squad) =>
        squad.members
          .filter((member) => member.userId === user.id)
          .map((member) => ({
            squadId: squad.id,
            squadName: squad.name,
            role: member.role,
            substitute: member.substitute,
          })),
      ),
    };
  }

  function toSquad(squad: DbSquad): Squad {
    return {
      id: squad.id,
      name: squad.name,
      members: squad.members.map((member) => ({ ...member, fullName: userName(member.userId) })),
    };
  }

  function toAgent(agent: DbAgent, withInstructions: boolean): Agent {
    return {
      id: agent.id,
      name: agent.name,
      phaseCode: agent.phaseCode,
      status: agent.status,
      currentVersion: agent.currentVersion,
      description: agent.description,
      repositoryUrl: agent.repositoryUrl,
      repositoryPath: agent.repositoryPath,
      owner: { id: agent.ownerUserId, fullName: userName(agent.ownerUserId) },
      versions: agent.versions.map(({ instructions, ...rest }) =>
        withInstructions ? { ...rest, instructions } : rest,
      ),
    };
  }

  function initiativeExecutions(initiativeId: string): Execution[] {
    return db.executions.filter((execution) => execution.initiative.id === initiativeId);
  }

  /** `story.refined` refleja la última ejecución no rechazada. */
  function refinedFor(initiativeId: string, storyId: string): RefinedStory | null {
    const executions = initiativeExecutions(initiativeId).filter(
      (execution) => execution.status !== 'REJECTED' && execution.status !== 'FAILED',
    );
    for (const execution of executions.reverse()) {
      const found = execution.refinedStories.find((item) => item.storyId === storyId);
      if (found) return clone(found.refined);
    }
    return null;
  }

  function projectOf(initiative: DbInitiative): DbProject | undefined {
    return db.projects.find((candidate) => candidate.id === initiative.projectId);
  }

  function projectRef(initiative: DbInitiative): NamedRef {
    return { id: initiative.projectId, name: projectOf(initiative)?.name ?? 'Proyecto eliminado' };
  }

  function squadRef(squadId: string | undefined): NamedRef {
    const squad = db.squads.find((candidate) => candidate.id === squadId);
    return { id: squadId ?? '', name: squad?.name ?? 'Squad eliminado' };
  }

  /** El squad de una iniciativa es el de su proyecto. */
  function toInitiativeSummary(initiative: DbInitiative): InitiativeSummary {
    return {
      id: initiative.id,
      name: initiative.name,
      project: projectRef(initiative),
      squad: squadRef(projectOf(initiative)?.squadId),
      currentPhase: initiative.currentPhase,
      completed: false,
      storyCount: initiative.stories.length,
      createdAt: initiative.createdAt,
    };
  }

  function toInitiative(initiative: DbInitiative): Initiative {
    const executions = initiativeExecutions(initiative.id);
    const journey: PhaseStep[] = PHASE_SEED.map((phase) => {
      const last = executions.filter((execution) => execution.phaseCode === phase.code).at(-1);
      return {
        phaseCode: phase.code,
        order: phase.order,
        name: phase.name,
        progress: initiative.progress[phase.code],
        approverRole: phase.approverRole,
        lastExecution: last ? summaryOf(last) : null,
      };
    });
    return {
      id: initiative.id,
      name: initiative.name,
      description: initiative.description,
      project: projectRef(initiative),
      squad: squadRef(projectOf(initiative)?.squadId),
      currentPhase: initiative.currentPhase,
      completed: false,
      stories: initiative.stories.map<Story>((story) => ({
        ...story,
        refined: refinedFor(initiative.id, story.id),
      })),
      journey,
      createdAt: initiative.createdAt,
    };
  }

  function projectInitiatives(projectId: string): DbInitiative[] {
    return db.initiatives.filter((initiative) => initiative.projectId === projectId);
  }

  function toProject(project: DbProject): Project {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      squad: squadRef(project.squadId),
      initiatives: projectInitiatives(project.id).map(toInitiativeSummary),
    };
  }

  function isApprover(user: DbUser, execution: Execution): boolean {
    const project = db.projects.find((candidate) => candidate.id === execution.project.id);
    const squad = db.squads.find((candidate) => candidate.id === project?.squadId);
    const role = PHASE_SEED.find((phase) => phase.code === execution.phaseCode)?.approverRole;
    return Boolean(squad?.members.some((member) => member.userId === user.id && member.role === role));
  }

  function requireStoriesEditable(initiative: DbInitiative): void {
    const progress = initiative.progress.REQUIREMENTS;
    if (progress === 'AWAITING_GATE') {
      fail(409, 'PHASE_AWAITING_GATE', 'Las historias no se pueden cambiar mientras el refinamiento espera aprobación.');
    }
    if (progress !== 'IN_PROGRESS') {
      fail(409, 'PHASE_ALREADY_APPROVED', 'La fase de Requerimientos ya fue aprobada; las historias no se pueden cambiar.');
    }
  }

  // --- operaciones
  const operations: ApiClient = {
    async register(body) {
      const fullName = requireText(body.fullName, 'nombre completo');
      const email = requireText(body.email, 'correo').toLowerCase();
      const password = requireText(body.password, 'contraseña');
      if (password.length < 8) fail(400, 'VALIDATION_ERROR', 'La contraseña debe tener al menos 8 caracteres.');
      if (db.users.some((user) => user.email === email)) {
        fail(409, 'EMAIL_ALREADY_REGISTERED', 'Ya existe una cuenta con ese correo.');
      }
      const user: DbUser = { id: newId(), fullName, email, password };
      db.users.push(user);
      return { token: TOKEN_PREFIX + user.id, user: toUser(user) };
    },

    async login(body) {
      const email = (body.email ?? '').trim().toLowerCase();
      const user = db.users.find((candidate) => candidate.email === email);
      if (!user || user.password !== body.password) {
        fail(401, 'INVALID_CREDENTIALS', 'El correo o la contraseña no son correctos.');
      }
      return { token: TOKEN_PREFIX + user.id, user: toUser(user) };
    },

    async me() {
      return toUser(currentUser());
    },

    async listUsers() {
      currentUser();
      return db.users.map(({ id, fullName, email }) => ({ id, fullName, email }));
    },

    async listPhases() {
      currentUser();
      return PHASE_SEED.map((phase) => ({
        ...phase,
        agents: db.agents
          .filter((agent) => agent.phaseCode === phase.code)
          .map(({ id, name, status, currentVersion }) => ({ id, name, status, currentVersion })),
      }));
    },

    async listSquads() {
      currentUser();
      return db.squads.map(toSquad);
    },

    async createSquad(body) {
      currentUser();
      const name = requireText(body.name, 'nombre');
      if (db.squads.some((squad) => squad.name.toLowerCase() === name.toLowerCase())) {
        fail(409, 'DUPLICATE_NAME', 'Ya existe un squad con ese nombre.');
      }
      const squad: DbSquad = { id: newId(), name, members: [] };
      db.squads.push(squad);
      return toSquad(squad);
    },

    async getSquad(squadId) {
      currentUser();
      return toSquad(findOr404(db.squads, squadId, 'un squad'));
    },

    async addSquadMember(squadId, body) {
      currentUser();
      const squad = findOr404(db.squads, squadId, 'un squad');
      const user = findOr404(db.users, body.userId, 'un usuario');
      if (squad.members.some((member) => member.userId === user.id && member.role === body.role)) {
        fail(400, 'VALIDATION_ERROR', 'Esa persona ya tiene ese rol en el squad.');
      }
      const member = { id: newId(), userId: user.id, role: body.role, substitute: Boolean(body.substitute) };
      squad.members.push(member);
      return { ...member, fullName: user.fullName } satisfies Member;
    },

    async removeSquadMember(squadId, memberId) {
      currentUser();
      const squad = findOr404(db.squads, squadId, 'un squad');
      findOr404(squad.members, memberId, 'un integrante');
      squad.members = squad.members.filter((member) => member.id !== memberId);
    },

    async listAgents(filters) {
      currentUser();
      return db.agents
        .filter((agent) => !filters?.phase || agent.phaseCode === filters.phase)
        .filter((agent) => !filters?.status || agent.status === filters.status)
        .map((agent) => toAgent(agent, false));
    },

    async createAgent(body) {
      currentUser();
      const name = requireText(body.name, 'nombre');
      if (db.agents.some((agent) => agent.name.toLowerCase() === name.toLowerCase())) {
        fail(409, 'DUPLICATE_NAME', 'Ya existe un agente con ese nombre.');
      }
      const owner = findOr404(db.users, body.ownerUserId, 'un usuario responsable');
      const agent: DbAgent = {
        id: newId(),
        name,
        phaseCode: body.phaseCode,
        status: 'PLANNED',
        currentVersion: null,
        description: (body.description ?? '').trim(),
        repositoryUrl: requireText(body.repositoryUrl, 'URL del repositorio'),
        repositoryPath: (body.repositoryPath ?? '').trim(),
        ownerUserId: owner.id,
        versions: [],
      };
      db.agents.push(agent);
      return toAgent(agent, true);
    },

    async getAgent(agentId) {
      currentUser();
      return toAgent(findOr404(db.agents, agentId, 'un agente'), true);
    },

    async addAgentVersion(agentId, body) {
      currentUser();
      const agent = findOr404(db.agents, agentId, 'un agente');
      const version = requireText(body.version, 'versión');
      if (agent.versions.some((item) => item.version === version)) {
        fail(409, 'DUPLICATE_NAME', 'Ese agente ya tiene registrada esa versión.');
      }
      agent.versions.push({
        version,
        commitSha: requireText(body.commitSha, 'commit'),
        instructions: requireText(body.instructions, 'instrucciones'),
        changeNotes: (body.changeNotes ?? '').trim(),
        createdAt: new Date().toISOString(),
      });
      agent.currentVersion = version;
      return toAgent(agent, true);
    },

    async changeAgentStatus(agentId, body) {
      currentUser();
      const agent = findOr404(db.agents, agentId, 'un agente');
      agent.status = body.status;
      return toAgent(agent, true);
    },

    async listProjects() {
      currentUser();
      return db.projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        squad: squadRef(project.squadId),
        initiativeCount: projectInitiatives(project.id).length,
      }));
    },

    async createProject(body) {
      currentUser();
      const name = requireText(body.name, 'nombre');
      if (db.projects.some((project) => project.name.toLowerCase() === name.toLowerCase())) {
        fail(409, 'DUPLICATE_NAME', 'Ya existe un proyecto con ese nombre.');
      }
      requireText(body.squadId, 'squad');
      const squad = findOr404(db.squads, body.squadId, 'un squad');
      const project: DbProject = {
        id: newId(),
        name,
        description: (body.description ?? '').trim(),
        squadId: squad.id,
      };
      db.projects.push(project);
      return toProject(project);
    },

    async getProject(projectId) {
      currentUser();
      return toProject(findOr404(db.projects, projectId, 'un proyecto'));
    },

    async createInitiative(projectId, body) {
      currentUser();
      const project = findOr404(db.projects, projectId, 'un proyecto');
      const name = requireText(body.name, 'nombre');
      if (projectInitiatives(project.id).some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        fail(409, 'DUPLICATE_NAME', 'Este proyecto ya tiene una iniciativa con ese nombre.');
      }
      const initiative: DbInitiative = {
        id: newId(),
        projectId: project.id,
        name,
        description: (body.description ?? '').trim(),
        currentPhase: 'REQUIREMENTS',
        progress: initialProgress(),
        stories: [],
        createdAt: new Date().toISOString(),
      };
      db.initiatives.push(initiative);
      return toInitiative(initiative);
    },

    async listInitiatives(filters) {
      currentUser();
      return db.initiatives
        .filter((initiative) => !filters?.projectId || initiative.projectId === filters.projectId)
        .filter((initiative) => !filters?.phase || initiative.currentPhase === filters.phase)
        .map(toInitiativeSummary);
    },

    async getInitiative(initiativeId) {
      currentUser();
      return toInitiative(findOr404(db.initiatives, initiativeId, 'una iniciativa'));
    },

    async addStory(initiativeId, body) {
      currentUser();
      const initiative = findOr404(db.initiatives, initiativeId, 'una iniciativa');
      requireStoriesEditable(initiative);
      const story = {
        id: newId(),
        title: requireText(body.title, 'título'),
        description: requireText(body.description, 'descripción'),
        origin: body.origin,
      };
      initiative.stories.push(story);
      return { ...story, refined: null };
    },

    async deleteStory(initiativeId, storyId) {
      currentUser();
      const initiative = findOr404(db.initiatives, initiativeId, 'una iniciativa');
      findOr404(initiative.stories, storyId, 'una historia');
      requireStoriesEditable(initiative);
      initiative.stories = initiative.stories.filter((story) => story.id !== storyId);
    },

    async executeRequirements(initiativeId) {
      const user = currentUser();
      const initiative = findOr404(db.initiatives, initiativeId, 'una iniciativa');
      const phase: PhaseCode = 'REQUIREMENTS';
      if (initiative.progress[phase] === 'AWAITING_GATE') {
        fail(409, 'PHASE_AWAITING_GATE', 'Ya hay una ejecución de esta fase esperando aprobación.');
      }
      if (initiative.progress[phase] === 'APPROVED') {
        fail(409, 'PHASE_ALREADY_APPROVED', 'La fase de Requerimientos ya fue aprobada.');
      }
      if (initiative.stories.length === 0) {
        fail(409, 'NO_STORIES', 'La iniciativa no tiene historias. Agrega al menos una antes de refinar.');
      }
      const agent = db.agents.find(
        (candidate) =>
          candidate.phaseCode === phase &&
          (candidate.status === 'PILOT' || candidate.status === 'ACTIVE') &&
          candidate.currentVersion !== null,
      );
      if (!agent || agent.currentVersion === null) {
        fail(409, 'AGENT_NOT_AVAILABLE', 'No hay un agente de Requerimientos en piloto o activo con versión vigente.');
      }
      const execution: Execution = {
        id: newId(),
        initiative: { id: initiative.id, name: initiative.name },
        project: projectRef(initiative),
        phaseCode: phase,
        agent: { id: agent.id, name: agent.name, version: agent.currentVersion },
        launchedBy: { id: user.id, fullName: user.fullName },
        status: 'PENDING_APPROVAL',
        createdAt: new Date().toISOString(),
        refinedStories: initiative.stories.map((story) => ({
          storyId: story.id,
          originalTitle: story.title,
          refined: refineStory(story.title, story.description),
        })),
        decision: null,
      };
      db.executions.push(execution);
      initiative.progress[phase] = 'AWAITING_GATE';
      return clone(execution);
    },

    async listExecutions(filters) {
      currentUser();
      return db.executions
        .filter((execution) => !filters?.initiativeId || execution.initiative.id === filters.initiativeId)
        .filter((execution) => !filters?.projectId || execution.project.id === filters.projectId)
        .filter((execution) => !filters?.status || execution.status === filters.status)
        .map(summaryOf)
        .reverse();
    },

    async getExecution(executionId) {
      currentUser();
      return clone(findOr404(db.executions, executionId, 'una ejecución'));
    },

    async listPendingApprovals() {
      const user = currentUser();
      return db.executions
        .filter((execution) => execution.status === 'PENDING_APPROVAL' && isApprover(user, execution))
        .map(clone);
    },

    async decide(executionId, body) {
      const user = currentUser();
      const execution = findOr404(db.executions, executionId, 'una ejecución');
      if (!isApprover(user, execution)) {
        fail(403, 'NOT_GATE_APPROVER', 'Solo quien tiene el rol que aprueba esta fase en el squad puede decidir.');
      }
      if (execution.status !== 'PENDING_APPROVAL') {
        fail(409, 'EXECUTION_ALREADY_DECIDED', 'Esta ejecución ya fue decidida.');
      }
      const comment = (body.comment ?? '').trim();
      if (body.decision !== 'APPROVE' && !comment) {
        fail(400, 'COMMENT_REQUIRED', 'Para pedir cambios o rechazar hay que escribir un comentario.');
      }
      const initiative = findOr404(db.initiatives, execution.initiative.id, 'una iniciativa');
      if (body.decision === 'APPROVE') {
        execution.status = 'ACCEPTED';
        initiative.progress[execution.phaseCode] = 'APPROVED';
        initiative.currentPhase = 'ANALYSIS';
        initiative.progress.ANALYSIS = 'IN_PROGRESS';
      } else {
        execution.status = body.decision === 'REJECT' ? 'REJECTED' : 'REWORK_REQUESTED';
        initiative.progress[execution.phaseCode] = 'IN_PROGRESS';
      }
      execution.decision = {
        decision: body.decision,
        decidedBy: { id: user.id, fullName: user.fullName },
        decidedAt: new Date().toISOString(),
        comment: comment || null,
      };
      return clone(execution);
    },

    async getDashboardPhases() {
      currentUser();
      return PHASE_SEED.map((phase) => ({
        phaseCode: phase.code,
        order: phase.order,
        name: phase.name,
        approverRole: phase.approverRole,
        agents: db.agents
          .filter((agent) => agent.phaseCode === phase.code)
          .map(({ id, name, status }) => ({ id, name, status })),
        initiativesInPhase: db.initiatives.filter((initiative) => initiative.currentPhase === phase.code).length,
        pendingApprovals: db.executions.filter(
          (execution) => execution.phaseCode === phase.code && execution.status === 'PENDING_APPROVAL',
        ).length,
      }));
    },
  };

  if (latencyMs <= 0) return operations;

  // Demora simulada para que en el modo demo se vean los estados de carga.
  const delayed = {} as Record<string, unknown>;
  for (const [name, operation] of Object.entries(operations)) {
    delayed[name] = async (...args: unknown[]) => {
      await new Promise((resolve) => setTimeout(resolve, latencyMs));
      return (operation as (...a: unknown[]) => Promise<unknown>)(...args);
    };
  }
  return delayed as unknown as ApiClient;
}
