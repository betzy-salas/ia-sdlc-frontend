function tidy(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/[.,;\s]+$/, '');
}

function stripPrefix(text: string, prefix: RegExp): string {
  return tidy(text).replace(prefix, '');
}

/** Arma el título y la descripción de una historia a partir de las tres respuestas guiadas. */
export function buildAssistedStory(who: string, what: string, why: string): { title: string; description: string } {
  const asA = stripPrefix(who, /^como\s+/i);
  const iWant = stripPrefix(what, /^quiero\s+/i);
  const soThat = stripPrefix(why, /^para\s+/i);
  const title = iWant ? iWant.charAt(0).toUpperCase() + iWant.slice(1) : '';
  const description = asA && iWant && soThat ? `Como ${asA}, quiero ${iWant}, para ${soThat}.` : '';
  return { title, description };
}
