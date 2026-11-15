import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, DEMO_USERS } from '../mocks/seed';
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

  it('crear proyecto, agregar historia, refinar, ver el pendiente y aprobarlo', async () => {
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
    expect(await screen.findByRole('link', { name: 'Pagos con QR' })).toBeInTheDocument();
    expect(screen.getByText('Historia original: Generar un código QR de cobro')).toBeInTheDocument();

    // Aprobar: la bandeja queda vacía y el proyecto avanza a Análisis
    await user.click(screen.getByRole('button', { name: 'Aprobar' }));
    expect(await screen.findByText('No tienes nada por aprobar')).toBeInTheDocument();
    await user.click(within(menu).getByRole('link', { name: 'Ejecuciones' }));
    const executionCard = (await screen.findByRole('link', { name: 'Pagos con QR' })).closest('li');
    expect(executionCard).not.toBeNull();
    expect(within(executionCard as HTMLElement).getByText('Aceptado')).toBeInTheDocument();
  });

  it('quien no es aprobador no ve pendientes ajenos', async () => {
    const user = userEvent.setup();
    signInAs(DEMO_USERS.developer.id);
    const { client } = renderApp({ route: '/projects/p-0001' });

    await user.click(await screen.findByRole('button', { name: 'Refinar con el agente' }));
    expect(await screen.findByText(/Pendiente de aprobación del Product Owner/)).toBeInTheDocument();

    const menu = screen.getByRole('navigation', { name: 'Menú' });
    await user.click(within(menu).getByRole('link', { name: 'Por aprobar' }));
    expect(await screen.findByText('No tienes nada por aprobar')).toBeInTheDocument();
    expect(await client.listExecutions({ status: 'PENDING_APPROVAL' })).toHaveLength(1);
  });
});
