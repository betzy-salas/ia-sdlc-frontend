import type { RefinedStory } from '../api/types';
import styles from './RefinedStoryView.module.css';

/** Resultado del agente de refinamiento para una historia. */
export function RefinedStoryView({ refined }: { refined: RefinedStory }) {
  return (
    <div className={styles.refined} data-phase="REQUIREMENTS">
      <p className={styles.title}>{refined.title}</p>
      <dl className={styles.statement}>
        <dt>Como</dt>
        <dd>{refined.asA}</dd>
        <dt>Quiero</dt>
        <dd>{refined.iWant}</dd>
        <dt>Para</dt>
        <dd>{refined.soThat}</dd>
      </dl>
      <div>
        <h4 className={styles.subtitle}>Criterios de aceptación</h4>
        {refined.acceptanceCriteria.length > 0 ? (
          <ul className={styles.list}>
            {refined.acceptanceCriteria.map((criterion, index) => (
              <li key={index}>{criterion}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.none}>El agente no propuso criterios.</p>
        )}
      </div>
      {refined.ambiguities.length > 0 ? (
        <div className={styles.ambiguities}>
          <h4 className={styles.subtitle}>Ambigüedades por resolver</h4>
          <ul className={styles.list}>
            {refined.ambiguities.map((ambiguity, index) => (
              <li key={index}>{ambiguity}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={styles.none}>Sin ambigüedades detectadas.</p>
      )}
    </div>
  );
}
