# IA SDLC · Frontend (Entrega 1)

Aplicación web donde, en cada fase del proceso de desarrollo, **un agente de IA propone un artefacto y una persona con cierto rol lo aprueba** (gate).

Alcance de la entrega 1: ingreso y registro, squads y roles, catálogo de agentes con versiones, proyectos con historias de usuario y la fase 1 (Requerimientos): desde el proyecto se ejecuta el agente de refinamiento, se ve el resultado y queda pendiente de la aprobación del Product Owner en «Por aprobar».

El contrato con el backend está en [`specs/contrato-api.md`](specs/contrato-api.md) y es la fuente de verdad de rutas, campos y enums.

## Requisitos

- Node 22 y npm.
- Para el modo con backend: `ia-sdlc-backend` corriendo en `http://localhost:8080`.

## Cómo correr

```bash
npm install
```

### Con el backend

```bash
npm run dev
```

Abre `http://localhost:5173`. Vite reenvía `/api` a `http://localhost:8080` (proxy), así que no hace falta configurar CORS en desarrollo.

### Modo demo, sin backend

```bash
npm run dev:mock
```

Equivale a `VITE_USE_MOCKS=true vite`. La app usa un cliente de API en memoria (`src/mocks`) con la misma interfaz que el cliente real, las mismas formas del contrato y sus reglas básicas (`NO_STORIES`, `PHASE_AWAITING_GATE`, `NOT_GATE_APPROVER`, `COMMENT_REQUIRED`, etc.).

- Ingresa como Product Owner con `ana@demo.local` / `demo1234` (la pantalla de ingreso lo recuerda).
- Otros usuarios de ejemplo, misma contraseña: `luis@demo.local` (líder técnico y PO suplente), `marta@demo.local` (arquitecta), `diego@demo.local` (desarrollador), `carla@demo.local` (QA).
- Los datos viven solo en memoria: **al recargar la página vuelven los datos de ejemplo**.
- El «agente» del modo demo no llama a ningún modelo: arma un refinamiento determinista a partir del texto de la historia.

### Variables de entorno

| Variable | Por defecto | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | URL base de la API. |
| `VITE_USE_MOCKS` | `false` | `true` activa el modo demo. |

Se pueden poner en un archivo `.env.local` (ver `.env.example`).

### Otros comandos

| Comando | Qué hace |
|---|---|
| `npm run build` | Revisa tipos (`tsc -b`) y genera `dist/`. |
| `npm run build:mock` | Igual, pero deja el modo demo activo en el resultado. |
| `npm run preview` | Sirve `dist/`. |
| `npm run lint` | ESLint. |
| `npm test` | Pruebas con Vitest y React Testing Library. |

## Stack

React 19 + TypeScript estricto + Vite, React Router, TanStack Query, CSS Modules con variables CSS (tokens). Sin librería de componentes. Íconos SVG propios, de trazo, en línea. Vitest + React Testing Library. ESLint.

## Estructura

```
specs/contrato-api.md   Contrato REST (idéntico al del backend)
src/
  app/        Proveedores (API, sesión, consultas), rutas y prueba del flujo completo
  api/        Tipos del contrato, interfaz ApiClient, cliente HTTP, claves de consulta, textos de enums
  auth/       Token (memoria + sessionStorage), sesión, Ingreso, Registro, guardia de rutas
  layout/     Barra superior, menú lateral y armazón de la página
  components/ Piezas compartidas: botón, tarjeta, etiquetas de estado, campos, estados de carga/vacío/error, íconos
  features/
    home/        Inicio: las cinco fases (GET /dashboard/phases)
    projects/    Lista, detalle, recorrido por fases, historias y refinamiento
    approvals/   Por aprobar y formulario de decisión
    agents/      Catálogo, registro, detalle, versiones y estado
    executions/  Lista de ejecuciones
    squads/      Squads, roles e integrantes
  mocks/      Cliente en memoria del modo demo, datos de ejemplo y refinamiento simulado
  styles/     tokens.css (colores, tipografías, medidas) y estilos globales
  test/       Configuración y utilidades de pruebas
```

## Decisiones

- **Un solo punto de acceso a la API.** `ApiClient` (`src/api/client.ts`) es la interfaz; la implementan `createHttpClient` y `createMockClient`. Las pantallas la obtienen con `useApi()`, así que no saben cuál de las dos usan. Las pruebas inyectan el cliente en memoria por `AppProviders`.
- **El front no implementa reglas de negocio.** Muestra el `{ code, message }` que devuelve el back, tal cual (mensaje y código). La única validación propia es la que pidió la usuaria: exigir comentario para «Pedir cambios» y «Rechazar» antes de enviar. Las acciones que se muestran u ocultan (agregar historias, refinar) dependen del estado que informa el back (`journey[].progress`), no de cálculos del front.
- **Sesión.** El token vive en memoria y se respalda en `sessionStorage` (sobrevive a recargar, no a cerrar la pestaña). Un 401 en una ruta autenticada borra el token, limpia la caché de consultas y lleva a `/login`. Un 401 de `/auth/login` solo muestra el error.
- **Consultas.** Tras ejecutar el agente o decidir un gate se invalidan proyectos, ejecuciones, pendientes e Inicio (`invalidateWorkflow`). Los 4xx no se reintentan.
- **Menú lateral en el flujo.** Mide 270 px fijos y comparte fila (flex) con el contenido: no lo tapa. Cerrado, el contenido usa todo el ancho; elegir una opción no lo cierra; en pantallas angostas el contenido baja debajo del menú. Solo el botón de tres líneas lo abre o lo cierra.
- **Color por fase con tokens.** `data-phase="REQUIREMENTS"` (etc.) define `--phase-strong`, `--phase-soft` y `--phase-on-soft`; los componentes solo usan esas variables.
- **Sin tablas.** Todo listado es una lista (`ul`/`ol`) de tarjetas.
- **Accesibilidad.** Botones y enlaces reales, foco visible, `aria-label` en botones solo con ícono, áreas táctiles de 44 px, y el estado siempre va escrito (el color solo acompaña).

## Lecturas del contrato que conviene confirmar con el backend

- `comment` al aprobar: el front envía `null` cuando no se escribe comentario.
- El contrato no define el código de error al agregar o borrar historias fuera de `IN_PROGRESS`; el front muestra el que llegue (el modo demo usa `PHASE_AWAITING_GATE` / `PHASE_ALREADY_APPROVED`).
- `pendingApprovals` de `/dashboard/phases`: el modo demo cuenta todos los pendientes de la fase, no solo los del usuario. El contador del menú sí usa `/approvals/pending` (los del usuario).
- `versions[].instructions` se trata como opcional (solo llega en `GET /agents/{id}`).
- «Squads y roles» usa `GET /squads` (ya trae los integrantes); `GET /squads/{id}` está en el cliente pero ninguna pantalla lo necesita.
