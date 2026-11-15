import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEMO_USERS } from '../mocks/seed';
import { renderApp, signInAs } from '../test/renderApp';

describe('SideMenu', () => {
  it('abre y cierra con el botón de la barra superior', async () => {
    const user = userEvent.setup();
    signInAs(DEMO_USERS.productOwner.id);
    renderApp();

    const menu = await screen.findByRole('navigation', { name: 'Menú' });
    for (const option of ['Inicio', 'Proyectos', 'Por aprobar', 'Agentes', 'Ejecuciones', 'Squads y roles']) {
      expect(within(menu).getByRole('link', { name: option })).toBeInTheDocument();
    }

    await user.click(screen.getByRole('button', { name: 'Cerrar el menú' }));
    expect(screen.queryByRole('navigation', { name: 'Menú' })).not.toBeInTheDocument();
    // El contenido sigue en pantalla: el menú no lo tapa ni lo reemplaza.
    expect(screen.getByRole('main')).toBeInTheDocument();

    const openButton = screen.getByRole('button', { name: 'Abrir el menú' });
    expect(openButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(openButton);
    expect(screen.getByRole('navigation', { name: 'Menú' })).toBeInTheDocument();
  });

  it('no se cierra al elegir una opción y resalta la activa', async () => {
    const user = userEvent.setup();
    signInAs(DEMO_USERS.productOwner.id);
    renderApp();

    const menu = await screen.findByRole('navigation', { name: 'Menú' });
    await user.click(within(menu).getByRole('link', { name: 'Agentes' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Agentes' })).toBeInTheDocument();
    const menuAfter = screen.getByRole('navigation', { name: 'Menú' });
    expect(within(menuAfter).getByRole('link', { name: 'Agentes' })).toHaveAttribute('aria-current', 'page');
    expect(within(menuAfter).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');

    await user.click(within(menuAfter).getByRole('link', { name: 'Squads y roles' }));
    expect(await screen.findByRole('heading', { level: 1, name: /Squad/ })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Menú' })).toBeInTheDocument();
  });
});
