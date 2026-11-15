import type { RefinedStory } from '../api/types';

function lowerFirst(text: string): string {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function clean(text: string): string {
  return text.trim().replace(/[.\s]+$/, '');
}

/**
 * Simula al agente de refinamiento. Es determinista: no llama a ningún modelo,
 * solo arma un resultado creíble con la forma `refinedStory` del contrato.
 */
export function refineStory(title: string, description: string): RefinedStory {
  const match = /como\s+(.+?),?\s+quiero\s+(.+?),?\s+para\s+(.+)/is.exec(description);
  const asA = match?.[1] ? clean(match[1]) : 'usuario del sistema';
  const iWant = match?.[2] ? clean(match[2]) : lowerFirst(clean(title));
  const soThat = match?.[3] ? clean(match[3]) : 'lograr el resultado descrito en la historia';

  const ambiguities: string[] = [];
  if (!match) ambiguities.push('No está claro quién usa la funcionalidad ni qué beneficio espera.');
  if (description.trim().length < 80) {
    ambiguities.push('La descripción es breve: faltan reglas de negocio y casos límite.');
  }
  if (!/\d/.test(description)) {
    ambiguities.push('No se indican valores límite ni tiempos de respuesta esperados.');
  }

  return {
    title: clean(title),
    asA,
    iWant,
    soThat,
    acceptanceCriteria: [
      `Dado un ${asA} con los datos completos, cuando decide ${iWant}, entonces la operación termina con éxito y recibe una confirmación.`,
      'Dado que falta un dato obligatorio o es inválido, cuando intenta continuar, entonces ve un mensaje que explica qué corregir.',
      'Dado que la operación terminó, cuando se consulta el registro, entonces queda la traza de quién la hizo y cuándo.',
    ],
    ambiguities,
  };
}
