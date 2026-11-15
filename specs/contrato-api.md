# Contrato de API — IA SDLC · Entrega 1

Contrato REST entre `ia-sdlc-frontend` y `ia-sdlc-backend`. Este archivo se mantiene idéntico en los dos proyectos (`specs/contrato-api.md`).

Alcance de la entrega 1: usuarios, squads y roles, catálogo de agentes, proyectos con historias y la fase 1 (Requerimientos): el agente de refinamiento se ejecuta desde la app y su resultado queda pendiente de aprobación del Product Owner.

- Prefijo: `/api/v1`
- Formato: JSON; fechas ISO 8601 en UTC; ids como UUID en texto
- Autenticación: `Authorization: Bearer <token>` en todo excepto `/auth/register` y `/auth/login`
- Los listados devuelven un arreglo JSON simple (sin paginación en esta entrega)

## Enumeraciones

| Enum | Valores |
|---|---|
| `SquadRole` | `PRODUCT_OWNER`, `TECH_LEAD`, `ARCHITECT`, `DEVELOPER`, `QA` |
| `PhaseCode` | `REQUIREMENTS`, `ANALYSIS`, `DESIGN`, `CONSTRUCTION`, `TESTING` |
| `AgentStatus` | `PLANNED`, `PILOT`, `ACTIVE`, `RETIRED` |
| `StoryOrigin` | `EXISTING` (el usuario la trae escrita), `ASSISTED` (la construye con ayuda) |
| `ExecutionStatus` | `RUNNING`, `PENDING_APPROVAL`, `ACCEPTED`, `REWORK_REQUESTED`, `REJECTED`, `FAILED` |
| `PhaseProgress` | `PENDING`, `IN_PROGRESS`, `AWAITING_GATE`, `APPROVED` |
| `Decision` | `APPROVE`, `REQUEST_REWORK`, `REJECT` |

## Errores

```json
{ "code": "NOT_GATE_APPROVER", "message": "Texto legible en español", "details": [] }
```

| HTTP | Uso |
|---|---|
| 400 | Datos inválidos (`VALIDATION_ERROR`, `COMMENT_REQUIRED`) |
| 401 | Sin token o credenciales inválidas (`UNAUTHORIZED`, `INVALID_CREDENTIALS`) |
| 403 | No es el aprobador del gate (`NOT_GATE_APPROVER`) |
| 404 | Recurso inexistente (`NOT_FOUND`) |
| 409 | Regla de negocio (`EMAIL_ALREADY_REGISTERED`, `NO_STORIES`, `AGENT_NOT_AVAILABLE`, `PHASE_AWAITING_GATE`, `PHASE_ALREADY_APPROVED`, `EXECUTION_ALREADY_DECIDED`, `DUPLICATE_NAME`, `DUPLICATE_MEMBER`) |

## Autenticación

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | `{ fullName, email, password }` | 201 `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` | 200 `{ token, user }` |
| GET | `/auth/me` | — | 200 `user` |

`user`: `{ id, fullName, email, memberships: [{ squadId, squadName, role, substitute }] }`

## Usuarios

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/users` | 200 `[{ id, fullName, email }]` (para elegir integrantes y responsables) |

## Fases

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/phases` | 200 `[phase]` en orden |

`phase`: `{ code, order, name, approverRole, agents: [{ id, name, status, currentVersion }] }`

Datos semilla: 1 REQUIREMENTS "Requerimientos" PRODUCT_OWNER; 2 ANALYSIS "Análisis" TECH_LEAD; 3 DESIGN "Diseño" ARCHITECT; 4 CONSTRUCTION "Construcción" DEVELOPER; 5 TESTING "Pruebas" QA.

## Squads y roles

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| GET | `/squads` | — | 200 `[squad]` |
| POST | `/squads` | `{ name }` | 201 `squad` |
| GET | `/squads/{squadId}` | — | 200 `squad` |
| POST | `/squads/{squadId}/members` | `{ userId, role, substitute }` | 201 `member` |
| DELETE | `/squads/{squadId}/members/{memberId}` | — | 204 |

`squad`: `{ id, name, members: [member] }`
`member`: `{ id, userId, fullName, role, substitute }`

## Agentes

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| GET | `/agents` | filtros `?phase=&status=` | 200 `[agent]` |
| POST | `/agents` | `{ name, phaseCode, description, repositoryUrl, repositoryPath, ownerUserId }` | 201 `agent` |
| GET | `/agents/{agentId}` | — | 200 `agent` |
| POST | `/agents/{agentId}/versions` | `{ version, commitSha, instructions, changeNotes }` | 201 `agent` |
| PATCH | `/agents/{agentId}/status` | `{ status }` | 200 `agent` |

`agent`: `{ id, name, phaseCode, status, currentVersion, description, repositoryUrl, repositoryPath, owner: { id, fullName } | null, versions: [{ version, commitSha, changeNotes, createdAt }] }`

- Un agente nuevo queda `PLANNED` y `currentVersion` en `null`.
- `owner` es `null` en el agente semilla; `ownerUserId` es opcional y por defecto es quien registra el agente.
- `instructions` es el texto del `agent.md` de esa versión; se guarda pero no se devuelve en los listados (sí en `GET /agents/{id}` dentro de cada versión como `instructions`).
- Dato semilla: "Agente de refinamiento", fase REQUIREMENTS, estado PILOT, versión `0.1.0`.

## Proyectos e historias

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| GET | `/projects` | — | 200 `[projectSummary]` |
| POST | `/projects` | `{ name, description, squadId }` | 201 `project` |
| GET | `/projects/{projectId}` | — | 200 `project` |
| POST | `/projects/{projectId}/stories` | `{ title, description, origin }` | 201 `story` |
| DELETE | `/projects/{projectId}/stories/{storyId}` | — | 204 |

`projectSummary`: `{ id, name, squad: { id, name }, currentPhase, storyCount }`

`project`: `{ id, name, description, squad: { id, name }, currentPhase, stories: [story], journey: [phaseStep] }`

`story`: `{ id, title, description, origin, refined: refinedStory | null }`

`refinedStory`: `{ title, asA, iWant, soThat, acceptanceCriteria: [string], ambiguities: [string] }`

`phaseStep`: `{ phaseCode, order, name, progress, approverRole, lastExecution: executionSummary | null }`

- Un proyecto nuevo arranca con `currentPhase = REQUIREMENTS` y esa fase `IN_PROGRESS`; las demás `PENDING`.
- Solo se agregan o borran historias mientras REQUIREMENTS esté `IN_PROGRESS`.
- `story.refined` refleja la última ejecución no rechazada.

## Ejecución de la fase 1

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/projects/{projectId}/phases/REQUIREMENTS/executions` | — | 201 `execution` |
| GET | `/executions` | filtros `?projectId=&status=` | 200 `[executionSummary]` |
| GET | `/executions/{executionId}` | — | 200 `execution` |

Al crear la ejecución, el back toma el agente de la fase REQUIREMENTS en estado `PILOT` o `ACTIVE` con versión vigente, lo ejecuta sobre todas las historias del proyecto y guarda el resultado. En esta entrega la ejecución es síncrona: la respuesta ya llega en `PENDING_APPROVAL` (o `FAILED`). La fase queda `AWAITING_GATE`.

`executionSummary`: `{ id, project: { id, name }, phaseCode, agent: { id, name, version }, launchedBy: { id, fullName }, status, createdAt }`

`execution`: `executionSummary` más `{ refinedStories: [{ storyId, originalTitle, refined: refinedStory }], decision: { decision, decidedBy: { id, fullName }, decidedAt, comment } | null }`

Reglas: `NO_STORIES` si el proyecto no tiene historias; `AGENT_NOT_AVAILABLE` si no hay agente ejecutable; `PHASE_AWAITING_GATE` si ya hay una ejecución por aprobar; `PHASE_ALREADY_APPROVED` si la fase ya fue aprobada.

## Aprobaciones

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| GET | `/approvals/pending` | — | 200 `[execution]` |
| POST | `/executions/{executionId}/decision` | `{ decision, comment }` | 200 `execution` |

- La bandeja devuelve las ejecuciones `PENDING_APPROVAL` de proyectos cuyos squads tienen al usuario con el rol que aprueba esa fase (titular o suplente).
- Solo ese rol puede decidir; otro usuario recibe 403 `NOT_GATE_APPROVER`.
- `APPROVE`: ejecución `ACCEPTED`, fase `APPROVED`, `currentPhase` pasa a `ANALYSIS` (que queda `IN_PROGRESS`).
- `REQUEST_REWORK` y `REJECT` exigen `comment`; la ejecución queda `REWORK_REQUESTED` o `REJECTED` y la fase vuelve a `IN_PROGRESS`.
- Una ejecución ya decidida responde 409 `EXECUTION_ALREADY_DECIDED`.

## Inicio

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/dashboard/phases` | 200 `[{ phaseCode, order, name, approverRole, agents: [{ id, name, status }], projectsInPhase, pendingApprovals }]` |
