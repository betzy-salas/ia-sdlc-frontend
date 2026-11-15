# Guía de validación sin conexión — IA SDLC · Entrega 1

Guía para validar y corregir el back y el front sin internet (por ejemplo, en un vuelo). Este mismo archivo está en los dos repositorios.

## Estado al momento de escribir esta guía

- **Front**: compila, pasa lint y sus 22 pruebas. Probado solo en modo demo (datos en memoria).
- **Back**: código completo, pero **nunca se ha compilado con Maven ni ejecutado**. Sus 32 pruebas no han corrido.
- **Front + back juntos**: sin probar.

## 1. Antes de quedarte sin conexión

Todo esto necesita internet. Hazlo en este orden.

### Herramientas

```
java -version    # debe ser 21
mvn -version
node -v          # 20 o superior
```

### Código actualizado

```
cd ia-sdlc-backend  && git pull
cd ia-sdlc-frontend && git pull
```

### Base de datos (PostgreSQL)

```
cd ia-sdlc-backend
docker compose pull
docker compose up -d
docker compose ps        # debe decir "healthy"
```

- `docker compose pull` descarga la imagen de PostgreSQL: **sin internet no se puede**, hazlo antes.
- Si no usas Docker, deja instalado un PostgreSQL local con la base, el usuario y la clave `iasdlc` (ver README).

### Dependencias del back

```
mvn dependency:go-offline
mvn verify
```

- El segundo comando puede fallar: no importa, lo que interesa es que descargue todo.
- Ojo: si falla en la **compilación**, Maven no llega a descargar el ejecutor de pruebas. En ese caso corrige la compilación antes de desconectarte, o al menos ejecuta `mvn verify` de nuevo después de cada arreglo mientras tengas red.
- Comprobación final: `mvn -o verify` (la `-o` es modo sin conexión). Si no se queja de artefactos faltantes, estás lista.

### Dependencias del front

```
cd ia-sdlc-frontend
npm ci
npm test
```

### Lo que no tendrás sin conexión

- Asistentes de IA (Claude, Copilot), salvo que el avión tenga wifi.
- Las tipografías de Google: la app usará una fuente de respaldo. Es solo estético.
- Documentación en línea de Spring. Si quieres, deja abiertas en el navegador las páginas que creas necesitar.

## 2. Durante el vuelo

### Paso 1 — Compilar y probar el back

```
cd ia-sdlc-backend
mvn -o verify
```

Si falla, mira primero la tabla de la sección 3.

Las pruebas usan H2 en memoria, así que `mvn verify` no necesita PostgreSQL.

### Paso 2 — Levantar el back

```
docker compose up -d
mvn -o spring-boot:run
```

Queda en http://localhost:8080 usando PostgreSQL: los datos se conservan al reiniciar. Para empezar con la base vacía: `docker compose down -v` y `docker compose up -d`.

Para mirar los datos directamente:

```
docker exec -it iasdlc-postgres psql -U iasdlc -d iasdlc -c "\dt"
```

Prueba rápida en otra terminal:

```
curl -i http://localhost:8080/api/v1/phases
```

Debe responder 401 (falta el token). Eso confirma que la app y la seguridad están arriba.

```
curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Ana PO","email":"ana@prueba.local","password":"clave1234"}'
```

Debe responder 201 con `token` y `user`.

### Paso 3 — Levantar el front contra el back real

```
cd ia-sdlc-frontend
npm run dev
```

Importante: es `npm run dev`, **no** `npm run dev:mock`. Con `dev:mock` el front no habla con el back.

Abre http://localhost:5173. No debe aparecer la etiqueta "Datos de ejemplo".

### Paso 4 — Recorrido completo

Marca cada paso que funcione.

- [ ] Registrar un usuario (será el Product Owner).
- [ ] Cerrar sesión y registrar un segundo usuario (no aprobador).
- [ ] Iniciar sesión con el primero.
- [ ] Squads y roles: crear un squad.
- [ ] Agregar al primer usuario como Product Owner.
- [ ] Agregar al segundo usuario como desarrollador.
- [ ] Agentes: aparece "Agente de refinamiento" en piloto, versión 0.1.0.
- [ ] Agentes: registrar un agente nuevo y una versión.
- [ ] Proyectos: crear un proyecto apuntando al squad.
- [ ] Agregar una historia con "Ya tengo la historia".
- [ ] Agregar una historia con "Ayúdame a construirla".
- [ ] Pulsar "Refinar con el agente": aparece el resultado refinado y el estado pendiente de aprobación.
- [ ] Por aprobar: el Product Owner ve la ejecución; el contador del menú muestra 1.
- [ ] Iniciar sesión con el segundo usuario: "Por aprobar" está vacío.
- [ ] Con el Product Owner: "Pedir cambios" sin comentario muestra error; con comentario funciona.
- [ ] Refinar de nuevo y aprobar: el proyecto pasa a la fase de Análisis.
- [ ] Ejecuciones: aparecen las dos ejecuciones con su estado.
- [ ] Inicio: las tarjetas de fase muestran los conteos.
- [ ] Reiniciar el back: los datos siguen ahí (PostgreSQL).

## 3. Dónde es más probable que falle el back

La lógica de negocio (dominio y casos de uso) sí se compiló y se recorrió con datos en memoria. Lo que nunca se ha ejecutado es la capa de Spring. Sospechosos, del más al menos probable:

| Síntoma | Causa probable | Dónde mirar |
|---|---|---|
| Errores de compilación en `infrastructure` | Tipos o imports que nunca se compilaron con las librerías reales | El archivo y la línea que indique Maven |
| En las pruebas: "Migration V1 failed" o error de SQL | Las migraciones se probaron en PostgreSQL, no en H2, que es lo que usan las pruebas | `src/main/resources/db/migration/V1__schema.sql` |
| Al arrancar: "Connection refused" o falla de autenticación | PostgreSQL no está arriba o las credenciales no coinciden | `docker compose ps`; variables `IASDLC_DB_*` |
| Arranca, pero falla al guardar o consultar | Una entidad JPA no coincide con las tablas | `infrastructure/persistence`. Truco: pon `spring.jpa.hibernate.ddl-auto: validate` en `application.yml` para que el desajuste aparezca al arrancar, con el nombre de la columna |
| "No qualifying bean" o "UnsatisfiedDependency" | Un caso de uso o adaptador no quedó registrado como bean | La anotación `@UseCase` y la configuración que la escanea |
| Todo responde 401 o 403, incluso registro e inicio de sesión | Rutas públicas mal declaradas en la seguridad | `infrastructure/security` |
| El navegador muestra error de CORS | Origen no permitido | `iasdlc.cors.allowed-origins` en `application.yml` |
| Error al generar el token | Secreto JWT muy corto o API de jjwt distinta | `infrastructure/security`, propiedad `iasdlc.security.jwt.secret` |
| El JSON llega con nombres distintos a los del contrato | DTO o mapper | `infrastructure/web` y `specs/contrato-api.md` |

Si el fallo aparece en el front solo cuando usa el back real, compara la respuesta del back (pestaña Red del navegador) con `specs/contrato-api.md`: el que se aparte del contrato es el que hay que corregir.

## 4. Qué anotar para retomar después

Por cada problema que no logres resolver:

```
Dónde: back / front / los dos
Comando o pantalla:
Qué esperaba:
Qué pasó (mensaje de error completo):
Qué intenté:
```

Con el mensaje de error completo y el paso del recorrido donde ocurrió es suficiente para corregirlo después.

Al terminar, sube tus cambios en una rama para no perderlos:

```
git checkout -b correcciones-vuelo
git add -A
git commit -m "Correcciones durante la validación"
git push -u origin correcciones-vuelo   # cuando vuelvas a tener red
```
