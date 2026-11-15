// Token en memoria, respaldado en sessionStorage para sobrevivir a una recarga de la pestaña.
const STORAGE_KEY = 'ia-sdlc.token';

type Listener = (token: string | null) => void;

function readStored(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

let memoryToken: string | null | undefined;
const listeners = new Set<Listener>();

export const tokenStore = {
  get(): string | null {
    if (memoryToken === undefined) memoryToken = readStored();
    return memoryToken;
  },
  set(token: string | null): void {
    memoryToken = token;
    try {
      if (token) window.sessionStorage.setItem(STORAGE_KEY, token);
      else window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Sin sessionStorage el token queda solo en memoria.
    }
    listeners.forEach((listener) => listener(token));
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
