# IA SDLC · Frontend

Contexto del proyecto para trabajar con un asistente de IA. Léelo antes de cambiar código.

## Qué es

Aplicación web que gestiona un SDLC asistido por IA: en cada fase del proceso de desarrollo un agente de IA propone un artefacto y una persona con un rol definido lo aprueba (gate) antes de avanzar. Es una idea que la autora construye para proponerla; todavía no tiene usuarios reales.

Este repositorio es el front. El back está en el repositorio hermano `ia-sdlc-backend` (Java, Spring Boot).

## Estado actual

- Compila, pasa lint y sus pruebas.
- **Solo se ha probado en modo demo** (cliente de API en memoria). Nunca se ha ejecutado contra el back real: al integrarlos pueden aparecer diferencias con el contrato.
- Dos desajustes conocidos del modo demo frente al contrato: un integrante duplicado en un squad responde `VALIDATION_ERROR` en lugar de `DUPLICATE_MEMBER`, y el agente semilla trae `owner` con datos cuando el back lo envía en `null`.

## Comandos

```bash
npm install
npm run dev         # contra el back real en http://localhost:8080 (proxy /api)
npm run dev:mock    # modo demo, sin back; entra con ana@demo.local / demo1234
npm run build
npm run lint
npm test
```

En modo demo aparece la etiqueta "Datos de ejemplo" y los datos se reinician al recargar.

## Stack y estructura

- React, TypeScript estricto, Vite, React Router, TanStack Query, CSS Modules con variables CSS. Sin librería de componentes. Vitest y React Testing Library.
- `src/api`: tipos del contrato, cliente HTTP, claves de consulta, textos de enums.
- `src/mocks`: cliente en memoria con la misma interfaz que el real; es el modo demo.
- `src/auth`, `src/layout` (barra superior y menú lateral), `src/components` (piezas comunes).
- `src/features`: `home`, `projects`, `initiatives`, `approvals`, `agents`, `executions`, `squads`.
- `src/styles`: tokens (colores, tipografías) y estilos globales.

## Modelo

- **Proyecto**: lo estable. Nombre, descripción y squad. No recorre fases.
- **Iniciativa**: lote de trabajo dentro de un proyecto. Es la que recorre las fases, tiene las historias y pasa por los gates. Se llega a ella desde el proyecto; no tiene opción propia en el menú.
- **Historia**: pertenece a una iniciativa. Se agrega ya escrita o con un formulario guiado.
- **Squad** y **roles**: cinco roles fijos, con titular y suplente. Cada fase la aprueba un rol.
- **Fases**: Requerimientos, Análisis, Diseño, Construcción, Pruebas. Solo Requerimientos está implementada.

## Contrato de API

- `specs/contrato-api.md` es la fuente de verdad. **Es el mismo archivo en los dos repositorios.**
- Regla: primero se cambia el contrato (en ambos repositorios), después el código.
- El front no implementa reglas de negocio: muestra los errores `{ code, message }` que devuelve el back.
- Cualquier cambio en el cliente real debe reflejarse en el cliente en memoria de `src/mocks`.

## Reglas de diseño (decisiones de la autora; no cambiarlas sin que lo pida)

- Estilo claro con color: fondo claro, tarjetas blancas redondeadas con sombra suave. **Sin tablas**: tarjetas y listas de tarjetas.
- Un color fuerte por fase, definido en los tokens. El estado nunca se comunica solo con color: siempre lleva texto.
- **Menú lateral a la izquierda**, de ancho fijo y fondo sólido, con ícono y texto por opción. **No tapa el contenido**: está en el flujo, y el contenido ocupa el espacio restante. Elegir una opción no lo cierra. No cambia de tamaño ni de posición según la pantalla. Se abre y cierra con el botón de tres líneas de la barra superior.
- **Letra contenida**: título de página 24 px, títulos de sección 17 px, títulos de tarjeta 16 px, texto 15 px. No introducir tamaños mayores.
- Squads y roles: una fila por rol con columnas Rol, Titular y Suplente.
- Tipografías: Space Grotesk para títulos y números, Inter para el resto.
- La autora juzga el diseño viéndolo. Ante un cambio visual, muéstrale el resultado antes de darlo por terminado.

## Accesibilidad

Botones y enlaces reales, navegable con teclado, `aria-label` en botones solo con ícono, contraste 4.5:1, áreas táctiles de 44 px, y todas las pantallas deben funcionar en ancho de celular.

## Convenciones

- Textos de interfaz, documentación y mensajes de commit en español. Identificadores de código en inglés.
- No hacer commits directamente en `main`: trabajar en ramas.
- Al terminar un cambio deben pasar `npm run build`, `npm run lint` y `npm test`.
- Tras una mutación, invalidar las consultas afectadas.

## Pendientes conocidos

- Integrar y probar contra el back real.
- El enlace al proyecto en las tarjetas de Por aprobar y Ejecuciones es texto pequeño, sin área táctil de 44 px.
- El estado abierto o cerrado del menú no se conserva al recargar.
- Los criterios de gate con casillas del diseño original no están implementados porque no forman parte del contrato.

## Documentos del repositorio

- `README.md`: cómo correr, estructura y decisiones.
- `VALIDACION.md`: recorrido de validación de front y back juntos.
- `specs/contrato-api.md`: contrato de API.
