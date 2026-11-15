import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DecisionForm } from './DecisionForm';

function setup() {
  const onDecide = vi.fn();
  render(<DecisionForm onDecide={onDecide} pending={false} error={null} />);
  return { onDecide, user: userEvent.setup() };
}

describe('DecisionForm', () => {
  it('exige comentario para pedir cambios', async () => {
    const { onDecide, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Pedir cambios' }));
    expect(onDecide).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe un comentario para pedir cambios o rechazar.');
    expect(screen.getByLabelText('Comentario')).toHaveFocus();
  });

  it('exige comentario para rechazar, y no acepta solo espacios', async () => {
    const { onDecide, user } = setup();
    await user.type(screen.getByLabelText('Comentario'), '   ');
    await user.click(screen.getByRole('button', { name: 'Rechazar' }));
    expect(onDecide).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('envía la decisión con el comentario cuando se escribe', async () => {
    const { onDecide, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Rechazar' }));
    await user.type(screen.getByLabelText('Comentario'), 'Falta el criterio de límites');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pedir cambios' }));
    expect(onDecide).toHaveBeenCalledExactlyOnceWith('REQUEST_REWORK', 'Falta el criterio de límites');
  });

  it('permite aprobar sin comentario', async () => {
    const { onDecide, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Aprobar' }));
    expect(onDecide).toHaveBeenCalledExactlyOnceWith('APPROVE', '');
  });

  it('muestra el error del back al decidir', () => {
    render(
      <DecisionForm onDecide={vi.fn()} pending={false} error={new Error('Solo el Product Owner puede decidir.')} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Solo el Product Owner puede decidir.');
  });
});
