import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEMO_IDS, DEMO_PASSWORD, DEMO_USERS } from '../mocks/seed';
import { renderApp, signInAs } from '../test/renderApp';

describe('flujo de la fase 1 con el cliente en memoria', () => {
  it('sin sesión, cualquier ruta lleva al ingreso', async () => {
    renderApp({ route: '/projects' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Ingresar' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Menú' })).not.toBeInTheDocument();
  });

  it('muestra el error del back cuando las credenciales no sirven', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/login' });
    await user.type(await screen.findByLabelText('Correo'), DEMO_USERS.productOwner.email);
    await user.type(screen.getByLabelText('Contraseña'), 'otra-clave');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('INVALID_CREDENTIALS');
  });

  it('crear proyecto, crear iniciativa, agregar historia, refinar, ver el pendiente y aprobarlo', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/login' });

    // Ingreso como Product Owner del squad de ejemplo
    await user.type(await screen.findByLabelText('Correo'), DEMO_USERS.productOwner.email);
    await user.type(screen.getByLabelText('Contraseña'), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'De la necesidad al código probado' })).toBeInTheDocument();
    expect(screen.getByText(DEMO_USERS.productOwner.fullName)).toBeInTheDocument();

    // Crear proyecto
    const menu = screen.getByRole('navigation', { name: 'Menú' });
    await user.click(within(menu).getByRole('link', { name: 'Proyectos' }));
    await user.click(await screen.findByRole('button', { name: 'Nuevo proyecto' }));
    await user.type(screen.getByLabelText('Nombre'), 'Pagos con QR');
    await user.type(screen.getByLabelText('Descripción'), 'Cobrar con un código QR.');
    await user.selectOptions(screen.getByLabelText('Squad'), await screen.findByRole('option', { name: 'Squad Demo' }));
    await user.click(screen.getByRole('button', { name: 'Crear proyecto' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Pagos con QR' })).toBeInTheDocument();
    expect(await screen.findByText('Este proyecto aún no tiene iniciativas')).toBeInTheDocument();

    // Crear iniciativa: lleva a su detalle, con el recorrido y el regreso al proyecto
    await user.click(screen.getByRole('button', { name: 'Nueva iniciativa' }));
    const initiativeForm = within(screen.getByRole('region', { name: 'Nueva iniciativa' }));
    await user.type(initiativeForm.getByLabelText('Nombre'), 'Cobro en comercios');
    await user.type(initiativeForm.getByLabelText('Descripción'), 'Primer lote.');
    await user.click(initiativeForm.getByRole('button', { name: 'Crear iniciativa' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Cobro en comercios' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Recorrido' })).toBeInTheDocument();
    const crumbs = screen.getByRole('navigation', { name: 'Ruta de navegación' });
    expect(within(crumbs).getByRole('link', { name: 'Pagos con QR' })).toBeInTheDocument();

    // Sin historias, el back responde NO_STORIES y se muestra su mensaje
    await user.click(screen.getByRole('button', { name: 'Refinar con el agente' }));
    expect(await screen.findByText(/NO_STORIES/)).toBeInTheDocument();

    // Agregar historia con ayuda
    await user.click(screen.getAllByRole('button', { name: 'Ayúdame a construirla' })[0]!);
    await user.type(screen.getByLabelText('¿Quién la necesita?'), 'comerciante');
    await user.type(screen.getByLabelText('¿Qué quiere hacer?'), 'generar un código QR de cobro');
    await user.type(screen.getByLabelText('¿Para qué?'), 'recibir pagos sin efectivo');
    await user.click(screen.getByRole('button', { name: 'Agregar historia' }));
    expect(await screen.findByRole('heading', { level: 3, name: 'Generar un código QR de cobro' })).toBeInTheDocument();
    expect(screen.getByText('Como comerciante, quiero generar un código QR de cobro, para recibir pagos sin efectivo.')).toBeInTheDocument();
    expect(screen.getByText('Construida con ayuda')).toBeInTheDocument();
    expect(screen.getByText('Aún sin refinar.')).toBeInTheDocument();

    // Refinar con el agente
    await user.click(screen.getByRole('button', { name: 'Refinar con el agente' }));
    expect(await screen.findByText(/Pendiente de aprobación del Product Owner/)).toBeInTheDocument();
    expect(screen.getByText('Criterios de aceptación')).toBeInTheDocument();
    expect(screen.getByText('comerciante')).toBeInTheDocument();
    expect(screen.queryByText(/NO_STORIES/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Refinar con el agente' })).not.toBeInTheDocument();

    // El menú muestra el contador y la bandeja trae el pendiente
    const approvalsLink = await within(menu).findByRole('link', { name: /Por aprobar\s*1\s*pendiente/ });
    await user.click(approvalsLink);
    expect(await screen.findByRole('heading', { level: 1, name: 'Por aprobar' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Cobro en comercios' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pagos con QR' })).toBeInTheDocument();
    expect(screen.getByText('Historia original: Generar un código QR de cobro')).toBeInTheDocument();

    // Aprobar: la bandeja queda vacía y la ejecución queda aceptada, con su iniciativa y su proyecto
    await user.click(screen.getByRole('button', { name: 'Aprobar' }));
    expect(await screen.findByText('No tienes nada por aprobar')).toBeInTheDocument();
    await user.click(within(menu).getByRole('link', { name: 'Ejecuciones' }));
    const executionCard = (await screen.findByRole('link', { name: 'Cobro en comercios' })).closest('li');
    expect(executionCard).not.toBeNull();
    expect(within(executionCard as HTMLElement).getByText('Aceptado')).toBeInTheDocument();
    await user.click(within(executionCard as HTMLElement).getByRole('link', { name: 'Pagos con QR' }));

    // En el proyecto, la iniciativa ya está en Análisis
    const initiativeCard = (await screen.findByRole('link', { name: 'Cobro en comercios' })).closest('li');
    expect(within(initiativeCard as HTMLElement).getByText('Fase 2 · Análisis')).toBeInTheDocument();
    expect(within(initiativeCard as HTMLElement).getByText('1 historia')).toBeInTheDocument();

    // Inicio cuenta iniciativas por fase (la de ejemplo y esta, en Análisis)
    await user.click(within(menu).getByRole('link', { name: 'Inicio' }));
    const analysis = (await screen.findByRole('heading', { level: 2, name: /Análisis/ })).closest('li');
    expect(within(analysis as HTMLElement).getByText('iniciativas').nextElementSibling).toHaveTextContent('2');
  });

  it('el proyecto de ejemplo muestra sus dos iniciativas, cada una en su fase', async () => {
    const user = userEvent.setup();
    signInAs(DEMO_USERS.productOwner.id);
    renderApp({ route: '/projects' });

    const projectCard = (await screen.findByRole('link', { name: 'Apertura de cuenta digital' })).closest('li');
    expect(within(projectCard as HTMLElement).getByText('Squad Squad Demo')).toBeInTheDocument();
    expect(within(projectCard as HTMLElement).getByText('2 iniciativas')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Apertura de cuenta digital' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Iniciativas (2)' })).toBeInTheDocument();
    const inRequirements = screen.getByRole('link', { name: 'Validación de identidad' }).closest('li') as HTMLElement;
    expect(within(inRequirements).getByText('Fase 1 · Requerimientos')).toBeInTheDocument();
    expect(within(inRequirements).getByText('2 historias')).toBeInTheDocument();
    const inAnalysis = screen.getByRole('link', { name: 'Entrega de tarjeta de débito' }).closest('li') as HTMLElement;
    expect(within(inAnalysis).getByText('Fase 2 · Análisis')).toBeInTheDocument();

    // La iniciativa aprobada ya no deja agregar historias ni refinar
    await user.click(screen.getByRole('link', { name: 'Entrega de tarjeta de débito' }));
    expect(await screen.findByText(/Historias refinadas aprobadas por el Product Owner/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Refinar con el agente' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ya tengo la historia' })).not.toBeInTheDocument();
  });

  it('quien no es aprobador no ve pendientes ajenos', async () => {
    const user = userEvent.setup();
    signInAs(DEMO_USERS.developer.id);
    const { client } = renderApp({ route: `/initiatives/${DEMO_IDS.initiativeInRequirements}` });

    await user.click(await screen.findByRole('button', { name: 'Refinar con el agente' }));
    expect(await screen.findByText(/Pendiente de aprobación del Product Owner/)).toBeInTheDocument();

    const menu = screen.getByRole('navigation', { name: 'Menú' });
    await user.click(within(menu).getByRole('link', { name: 'Por aprobar' }));
    expect(await screen.findByText('No tienes nada por aprobar')).toBeInTheDocument();
    expect(await client.listExecutions({ status: 'PENDING_APPROVAL' })).toHaveLength(1);
  });
});
