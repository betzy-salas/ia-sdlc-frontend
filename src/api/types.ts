// Tipos del contrato REST (specs/contrato-api.md). Mismos nombres de campos y enums.

export type SquadRole = 'PRODUCT_OWNER' | 'TECH_LEAD' | 'ARCHITECT' | 'DEVELOPER' | 'QA';
export type PhaseCode = 'REQUIREMENTS' | 'ANALYSIS' | 'DESIGN' | 'CONSTRUCTION' | 'TESTING';
export type AgentStatus = 'PLANNED' | 'PILOT' | 'ACTIVE' | 'RETIRED';
export type StoryOrigin = 'EXISTING' | 'ASSISTED';
export type ExecutionStatus =
  | 'RUNNING'
  | 'PENDING_APPROVAL'
  | 'ACCEPTED'
  | 'REWORK_REQUESTED'
  | 'REJECTED'
  | 'FAILED';
export type PhaseProgress = 'PENDING' | 'IN_PROGRESS' | 'AWAITING_GATE' | 'APPROVED';
export type Decision = 'APPROVE' | 'REQUEST_REWORK' | 'REJECT';

export const SQUAD_ROLES: SquadRole[] = ['PRODUCT_OWNER', 'TECH_LEAD', 'ARCHITECT', 'DEVELOPER', 'QA'];
export const PHASE_CODES: PhaseCode[] = ['REQUIREMENTS', 'ANALYSIS', 'DESIGN', 'CONSTRUCTION', 'TESTING'];
export const AGENT_STATUSES: AgentStatus[] = ['PLANNED', 'PILOT', 'ACTIVE', 'RETIRED'];
export const EXECUTION_STATUSES: ExecutionStatus[] = [
  'RUNNING',
  'PENDING_APPROVAL',
  'ACCEPTED',
  'REWORK_REQUESTED',
  'REJECTED',
  'FAILED',
];

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown[];
}

// --- Autenticación y usuarios
export interface Membership {
  squadId: string;
  squadName: string;
  role: SquadRole;
  substitute: boolean;
}
export interface User {
  id: string;
  fullName: string;
  email: string;
  memberships: Membership[];
}
export interface UserRef {
  id: string;
  fullName: string;
  email: string;
}
export interface PersonRef {
  id: string;
  fullName: string;
}
export interface AuthResponse {
  token: string;
  user: User;
}
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}

// --- Fases
export interface PhaseAgent {
  id: string;
  name: string;
  status: AgentStatus;
  currentVersion: string | null;
}
export interface Phase {
  code: PhaseCode;
  order: number;
  name: string;
  approverRole: SquadRole;
  agents: PhaseAgent[];
}

// --- Squads
export interface Member {
  id: string;
  userId: string;
  fullName: string;
  role: SquadRole;
  substitute: boolean;
}
export interface Squad {
  id: string;
  name: string;
  members: Member[];
}
export interface CreateSquadRequest {
  name: string;
}
export interface AddMemberRequest {
  userId: string;
  role: SquadRole;
  substitute: boolean;
}

// --- Agentes
export interface AgentVersion {
  version: string;
  commitSha: string;
  changeNotes: string;
  createdAt: string;
  /** Solo llega en GET /agents/{id}. */
  instructions?: string;
}
export interface Agent {
  id: string;
  name: string;
  phaseCode: PhaseCode;
  status: AgentStatus;
  currentVersion: string | null;
  description: string;
  repositoryUrl: string;
  repositoryPath: string;
  owner: PersonRef | null;
  versions: AgentVersion[];
}
export interface AgentFilters {
  phase?: PhaseCode;
  status?: AgentStatus;
}
export interface CreateAgentRequest {
  name: string;
  phaseCode: PhaseCode;
  description: string;
  repositoryUrl: string;
  repositoryPath: string;
  ownerUserId: string;
}
export interface CreateAgentVersionRequest {
  version: string;
  commitSha: string;
  instructions: string;
  changeNotes: string;
}
export interface ChangeAgentStatusRequest {
  status: AgentStatus;
}

// --- Proyectos e historias
export interface NamedRef {
  id: string;
  name: string;
}
export interface RefinedStory {
  title: string;
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string[];
  ambiguities: string[];
}
export interface Story {
  id: string;
  title: string;
  description: string;
  origin: StoryOrigin;
  refined: RefinedStory | null;
}
export interface ExecutionSummary {
  id: string;
  project: NamedRef;
  phaseCode: PhaseCode;
  agent: { id: string; name: string; version: string };
  launchedBy: PersonRef;
  status: ExecutionStatus;
  createdAt: string;
}
export interface PhaseStep {
  phaseCode: PhaseCode;
  order: number;
  name: string;
  progress: PhaseProgress;
  approverRole: SquadRole;
  lastExecution: ExecutionSummary | null;
}
export interface ProjectSummary {
  id: string;
  name: string;
  squad: NamedRef;
  currentPhase: PhaseCode;
  storyCount: number;
}
export interface Project {
  id: string;
  name: string;
  description: string;
  squad: NamedRef;
  currentPhase: PhaseCode;
  stories: Story[];
  journey: PhaseStep[];
}
export interface CreateProjectRequest {
  name: string;
  description: string;
  squadId: string;
}
export interface CreateStoryRequest {
  title: string;
  description: string;
  origin: StoryOrigin;
}

// --- Ejecuciones y aprobaciones
export interface ExecutionRefinedStory {
  storyId: string;
  originalTitle: string;
  refined: RefinedStory;
}
export interface ExecutionDecision {
  decision: Decision;
  decidedBy: PersonRef;
  decidedAt: string;
  comment: string | null;
}
export interface Execution extends ExecutionSummary {
  refinedStories: ExecutionRefinedStory[];
  decision: ExecutionDecision | null;
}
export interface ExecutionFilters {
  projectId?: string;
  status?: ExecutionStatus;
}
export interface DecisionRequest {
  decision: Decision;
  comment: string | null;
}

// --- Inicio
export interface DashboardPhase {
  phaseCode: PhaseCode;
  order: number;
  name: string;
  approverRole: SquadRole;
  agents: { id: string; name: string; status: AgentStatus }[];
  projectsInPhase: number;
  pendingApprovals: number;
}
