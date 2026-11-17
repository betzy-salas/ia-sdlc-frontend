import type {
  AddMemberRequest,
  Agent,
  AgentFilters,
  AuthResponse,
  ChangeAgentStatusRequest,
  CreateAgentRequest,
  CreateAgentVersionRequest,
  CreateInitiativeRequest,
  CreateProjectRequest,
  CreateSquadRequest,
  CreateStoryRequest,
  DashboardPhase,
  DecisionRequest,
  Execution,
  ExecutionFilters,
  ExecutionSummary,
  Initiative,
  InitiativeFilters,
  InitiativeSummary,
  LoginRequest,
  Member,
  Phase,
  Project,
  ProjectSummary,
  RegisterRequest,
  Squad,
  Story,
  User,
  UserRef,
} from './types';

/**
 * Interfaz única de acceso a la API. La implementan el cliente HTTP real
 * (src/api/httpClient.ts) y el cliente en memoria del modo demo (src/mocks).
 */
export interface ApiClient {
  // Autenticación
  register(body: RegisterRequest): Promise<AuthResponse>;
  login(body: LoginRequest): Promise<AuthResponse>;
  me(): Promise<User>;
  // Usuarios y fases
  listUsers(): Promise<UserRef[]>;
  listPhases(): Promise<Phase[]>;
  // Squads
  listSquads(): Promise<Squad[]>;
  createSquad(body: CreateSquadRequest): Promise<Squad>;
  getSquad(squadId: string): Promise<Squad>;
  addSquadMember(squadId: string, body: AddMemberRequest): Promise<Member>;
  removeSquadMember(squadId: string, memberId: string): Promise<void>;
  // Agentes
  listAgents(filters?: AgentFilters): Promise<Agent[]>;
  createAgent(body: CreateAgentRequest): Promise<Agent>;
  getAgent(agentId: string): Promise<Agent>;
  addAgentVersion(agentId: string, body: CreateAgentVersionRequest): Promise<Agent>;
  changeAgentStatus(agentId: string, body: ChangeAgentStatusRequest): Promise<Agent>;
  // Proyectos
  listProjects(): Promise<ProjectSummary[]>;
  createProject(body: CreateProjectRequest): Promise<Project>;
  getProject(projectId: string): Promise<Project>;
  // Iniciativas e historias
  createInitiative(projectId: string, body: CreateInitiativeRequest): Promise<Initiative>;
  listInitiatives(filters?: InitiativeFilters): Promise<InitiativeSummary[]>;
  getInitiative(initiativeId: string): Promise<Initiative>;
  addStory(initiativeId: string, body: CreateStoryRequest): Promise<Story>;
  deleteStory(initiativeId: string, storyId: string): Promise<void>;
  // Ejecución de la fase 1
  executeRequirements(initiativeId: string): Promise<Execution>;
  listExecutions(filters?: ExecutionFilters): Promise<ExecutionSummary[]>;
  getExecution(executionId: string): Promise<Execution>;
  // Aprobaciones
  listPendingApprovals(): Promise<Execution[]>;
  decide(executionId: string, body: DecisionRequest): Promise<Execution>;
  // Inicio
  getDashboardPhases(): Promise<DashboardPhase[]>;
}

/** Lo que cualquier cliente necesita de la sesión. */
export interface ClientSession {
  getToken: () => string | null;
  /** Se llama cuando la API responde 401 a una petición autenticada. */
  onUnauthorized: () => void;
}
