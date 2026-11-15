import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useApi } from '../../api/apiContext';
import { PHASE_BY_ROLE, ROLE_LABELS } from '../../api/labels';
import { queryKeys } from '../../api/queryKeys';
import { SQUAD_ROLES, type Squad, type SquadRole } from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorMessage } from '../../components/ErrorMessage';
import { CheckboxField, SelectField, TextField } from '../../components/Fields';
import { TrashIcon } from '../../components/icons';
import { PageHeader } from '../../components/PageHeader';
import { PhaseBadge } from '../../components/PhaseBadge';
import { Pill } from '../../components/Pill';
import shared from '../../components/shared.module.css';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import styles from './SquadsPage.module.css';

function NewSquadForm({ onCreated, onClose }: { onCreated: (squad: Squad) => void; onClose: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const create = useMutation({
    mutationFn: () => api.createSquad({ name: name.trim() }),
    onSuccess: async (squad) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.squads });
      onCreated(squad);
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  return (
    <Card as="section" aria-label="Nuevo squad">
      <h2 className={shared.sectionTitle}>Nuevo squad</h2>
      <form className={shared.form} onSubmit={handleSubmit}>
        <TextField label="Nombre del squad" required value={name} onChange={setName} />
        <ErrorMessage error={create.error} />
        <div className={shared.actions}>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Creando…' : 'Crear squad'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function AddMemberForm({ squad, onClose }: { squad: Squad; onClose: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: queryKeys.users, queryFn: () => api.listUsers() });
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<SquadRole>('PRODUCT_OWNER');
  const [substitute, setSubstitute] = useState(false);
  const add = useMutation({
    mutationFn: () => api.addSquadMember(squad.id, { userId, role, substitute }),
    onSuccess: async () => {
      // El rol define qué ve cada quien en "Por aprobar".
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.squads }),
        queryClient.invalidateQueries({ queryKey: queryKeys.approvals }),
      ]);
      onClose();
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    add.mutate();
  }

  return (
    <Card as="section" aria-label="Agregar integrante">
      <h2 className={shared.sectionTitle}>Agregar integrante a {squad.name}</h2>
      <form className={shared.form} onSubmit={handleSubmit}>
        <div className={shared.formGrid}>
          <SelectField
            label="Usuario"
            required
            value={userId}
            onChange={setUserId}
            placeholder={users.isPending ? 'Cargando personas…' : 'Elige una persona'}
            options={(users.data ?? []).map((user) => ({
              value: user.id,
              label: `${user.fullName} (${user.email})`,
            }))}
          />
          <SelectField
            label="Rol"
            required
            value={role}
            onChange={(value) => setRole(value as SquadRole)}
            options={SQUAD_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] }))}
          />
        </div>
        <CheckboxField label="Es suplente de este rol" checked={substitute} onChange={setSubstitute} />
        <ErrorMessage error={users.error ?? add.error} />
        <div className={shared.actions}>
          <Button type="submit" disabled={add.isPending}>
            {add.isPending ? 'Agregando…' : 'Agregar integrante'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SquadRoles({ squad }: { squad: Squad }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (memberId: string) => api.removeSquadMember(squad.id, memberId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.squads }),
        queryClient.invalidateQueries({ queryKey: queryKeys.approvals }),
      ]),
  });

  return (
    <>
      <ErrorMessage error={remove.error} />
      <ul className={shared.stack}>
        {SQUAD_ROLES.map((role) => {
          const members = squad.members
            .filter((member) => member.role === role)
            .sort((a, b) => Number(a.substitute) - Number(b.substitute));
          return (
            <Card as="li" row key={role} phase={PHASE_BY_ROLE[role]}>
              <PhaseBadge phase={PHASE_BY_ROLE[role]} />
              <h3 className={styles.roleName}>{ROLE_LABELS[role]}</h3>
              {members.length === 0 ? (
                <p className={styles.none}>Nadie ocupa este rol todavía.</p>
              ) : (
                <ul className={styles.members}>
                  {members.map((member) => (
                    <li key={member.id} className={styles.member}>
                      <span className={styles.memberName}>{member.fullName}</span>
                      <Pill tone={member.substitute ? 'neutral' : 'dark'}>
                        {member.substitute ? 'Suplente' : 'Titular'}
                      </Pill>
                      <Button
                        variant="danger"
                        iconOnly
                        aria-label={`Retirar a ${member.fullName} del rol ${ROLE_LABELS[role]}`}
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(member.id)}
                      >
                        <TrashIcon size={20} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </ul>
    </>
  );
}

type Panel = 'newSquad' | 'addMember' | null;

export function SquadsPage() {
  const api = useApi();
  const squads = useQuery({ queryKey: queryKeys.squads, queryFn: () => api.listSquads() });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);

  const selected = squads.data?.find((squad) => squad.id === selectedId) ?? squads.data?.[0];

  return (
    <>
      <PageHeader
        title={selected ? `Squad ${selected.name}` : 'Squads y roles'}
        subtitle="Quién ocupa cada rol que aprueba un gate."
        actions={
          <>
            {selected && panel !== 'addMember' && (
              <Button onClick={() => setPanel('addMember')}>Agregar integrante</Button>
            )}
            {squads.isSuccess && panel !== 'newSquad' && (
              <Button variant="outline" onClick={() => setPanel('newSquad')}>
                Nuevo squad
              </Button>
            )}
          </>
        }
      />
      {panel === 'newSquad' && (
        <NewSquadForm
          onClose={() => setPanel(null)}
          onCreated={(squad) => {
            setSelectedId(squad.id);
            setPanel(null);
          }}
        />
      )}
      {squads.isPending ? (
        <LoadingState label="Cargando squads…" />
      ) : squads.isError ? (
        <ErrorState error={squads.error} onRetry={() => void squads.refetch()} />
      ) : !selected ? (
        panel !== 'newSquad' && (
          <EmptyState
            title="Aún no hay squads"
            text="Crea un squad y asigna quién ocupa cada rol que aprueba un gate."
            action={<Button onClick={() => setPanel('newSquad')}>Nuevo squad</Button>}
          />
        )
      ) : (
        <>
          {squads.data.length > 1 && (
            <ul className={styles.chooser} aria-label="Elegir squad">
              {squads.data.map((squad) => (
                <li key={squad.id}>
                  <Button
                    variant={squad.id === selected.id ? 'primary' : 'outline'}
                    aria-pressed={squad.id === selected.id}
                    onClick={() => {
                      setSelectedId(squad.id);
                      setPanel(null);
                    }}
                  >
                    {squad.name}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {panel === 'addMember' && (
            <AddMemberForm key={selected.id} squad={selected} onClose={() => setPanel(null)} />
          )}
          <SquadRoles squad={selected} />
        </>
      )}
    </>
  );
}
