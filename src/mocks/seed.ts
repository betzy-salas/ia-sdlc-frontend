import type {
  AgentStatus,
  AgentVersion,
  Execution,
  PhaseCode,
  PhaseProgress,
  SquadRole,
  StoryOrigin,
} from '../api/types';

// Formas internas del "servidor" en memoria. Las respuestas se arman con las formas del contrato.

export interface DbUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
}
export interface DbMember {
  id: string;
  userId: string;
  role: SquadRole;
  substitute: boolean;
}
export interface DbSquad {
  id: string;
  name: string;
  members: DbMember[];
}
export interface DbAgent {
  id: string;
  name: string;
  phaseCode: PhaseCode;
  status: AgentStatus;
  currentVersion: string | null;
  description: string;
  repositoryUrl: string;
  repositoryPath: string;
  ownerUserId: string;
  versions: Required<AgentVersion>[];
}
export interface DbStory {
  id: string;
  title: string;
  description: string;
  origin: StoryOrigin;
}
export interface DbProject {
  id: string;
  name: string;
  description: string;
  squadId: string;
  currentPhase: PhaseCode;
  progress: Record<PhaseCode, PhaseProgress>;
  stories: DbStory[];
}
export interface Db {
  users: DbUser[];
  squads: DbSquad[];
  agents: DbAgent[];
  projects: DbProject[];
  executions: Execution[];
}

export const PHASE_SEED: { code: PhaseCode; order: number; name: string; approverRole: SquadRole }[] = [
  { code: 'REQUIREMENTS', order: 1, name: 'Requerimientos', approverRole: 'PRODUCT_OWNER' },
  { code: 'ANALYSIS', order: 2, name: 'Análisis', approverRole: 'TECH_LEAD' },
  { code: 'DESIGN', order: 3, name: 'Diseño', approverRole: 'ARCHITECT' },
  { code: 'CONSTRUCTION', order: 4, name: 'Construcción', approverRole: 'DEVELOPER' },
  { code: 'TESTING', order: 5, name: 'Pruebas', approverRole: 'QA' },
];

/** Credenciales del modo demo (se muestran en la pantalla de ingreso). */
export const DEMO_PASSWORD = 'demo1234';
export const DEMO_USERS = {
  productOwner: { id: 'u-0001', fullName: 'Ana Rojas', email: 'ana@demo.local' },
  techLead: { id: 'u-0002', fullName: 'Luis Paredes', email: 'luis@demo.local' },
  architect: { id: 'u-0003', fullName: 'Marta Quispe', email: 'marta@demo.local' },
  developer: { id: 'u-0004', fullName: 'Diego Salazar', email: 'diego@demo.local' },
  qa: { id: 'u-0005', fullName: 'Carla Núñez', email: 'carla@demo.local' },
} as const;

const REPO = 'https://github.com/ejemplo/agentes-ia-sdlc';

function plannedAgent(id: string, name: string, phaseCode: PhaseCode, path: string, ownerUserId: string): DbAgent {
  return {
    id,
    name,
    phaseCode,
    status: 'PLANNED',
    currentVersion: null,
    description: 'Agente planeado para una entrega posterior.',
    repositoryUrl: REPO,
    repositoryPath: path,
    ownerUserId,
    versions: [],
  };
}

export function createSeedDb(): Db {
  const u = DEMO_USERS;
  return {
    users: Object.values(u).map((user) => ({ ...user, password: DEMO_PASSWORD })),
    squads: [
      {
        id: 's-0001',
        name: 'Squad Demo',
        members: [
          { id: 'm-0001', userId: u.productOwner.id, role: 'PRODUCT_OWNER', substitute: false },
          { id: 'm-0002', userId: u.techLead.id, role: 'TECH_LEAD', substitute: false },
          { id: 'm-0003', userId: u.architect.id, role: 'ARCHITECT', substitute: false },
          { id: 'm-0004', userId: u.developer.id, role: 'DEVELOPER', substitute: false },
          { id: 'm-0005', userId: u.qa.id, role: 'QA', substitute: false },
          { id: 'm-0006', userId: u.techLead.id, role: 'PRODUCT_OWNER', substitute: true },
        ],
      },
    ],
    agents: [
      {
        id: 'a-0001',
        name: 'Agente de refinamiento',
        phaseCode: 'REQUIREMENTS',
        status: 'PILOT',
        currentVersion: '0.1.0',
        description:
          'Toma las historias del proyecto y las deja en formato como/quiero/para, con criterios de aceptación y ambigüedades por resolver.',
        repositoryUrl: REPO,
        repositoryPath: 'agents/refinamiento',
        ownerUserId: u.productOwner.id,
        versions: [
          {
            version: '0.1.0',
            commitSha: '3f9c2ab71d0e4c58a6b2f1e09d7c5a4b3e2f1a0b',
            changeNotes: 'Primera versión en piloto.',
            createdAt: '2026-10-01T15:00:00Z',
            instructions:
              '# Agente de refinamiento\n\nRefina cada historia: redáctala como "Como… quiero… para…", propone criterios de aceptación verificables y lista las ambigüedades.',
          },
        ],
      },
      plannedAgent('a-0002', 'Agente de impacto', 'ANALYSIS', 'agents/impacto', u.techLead.id),
      plannedAgent('a-0003', 'Agente de contratos', 'DESIGN', 'agents/contratos', u.architect.id),
      plannedAgent('a-0004', 'Agente de código', 'CONSTRUCTION', 'agents/codigo', u.developer.id),
      plannedAgent('a-0005', 'Agente de pruebas', 'TESTING', 'agents/pruebas', u.qa.id),
    ],
    projects: [
      {
        id: 'p-0001',
        name: 'Apertura de cuenta digital',
        description: 'Permitir que una persona abra su cuenta de ahorros desde el celular, sin ir a una agencia.',
        squadId: 's-0001',
        currentPhase: 'REQUIREMENTS',
        progress: {
          REQUIREMENTS: 'IN_PROGRESS',
          ANALYSIS: 'PENDING',
          DESIGN: 'PENDING',
          CONSTRUCTION: 'PENDING',
          TESTING: 'PENDING',
        },
        stories: [
          {
            id: 'st-0001',
            title: 'Validar identidad con el documento',
            description:
              'Como cliente nuevo, quiero validar mi identidad con una foto de mi documento, para abrir la cuenta sin ir a una agencia.',
            origin: 'EXISTING',
          },
          {
            id: 'st-0002',
            title: 'Elegir el tipo de cuenta',
            description: 'El cliente debe poder escoger entre las cuentas disponibles.',
            origin: 'EXISTING',
          },
        ],
      },
    ],
    executions: [],
  };
}
