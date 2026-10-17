import { readJson, writeJson } from './storage';

export interface MyPresentation {
  id: string;
  title: string;
  joinCode: string;
  adminToken: string;
  createdAt: number;
}

const KEY = 'oyla:my-presentations';

export function listMine(): MyPresentation[] {
  const value = readJson<unknown>(KEY, []);
  return Array.isArray(value) ? (value as MyPresentation[]) : [];
}

export function saveMine(entry: MyPresentation): void {
  const others = listMine().filter((item) => item.id !== entry.id);
  writeJson(KEY, [entry, ...others]);
}

/** Updates the cached title or code without changing the list order. */
export function updateMine(
  id: string,
  changes: Partial<Pick<MyPresentation, 'title' | 'joinCode'>>,
): void {
  writeJson(
    KEY,
    listMine().map((item) => (item.id === id ? { ...item, ...changes } : item)),
  );
}

export function forgetMine(id: string): void {
  writeJson(
    KEY,
    listMine().filter((item) => item.id !== id),
  );
}

export function tokenFor(id: string): string | null {
  return listMine().find((item) => item.id === id)?.adminToken ?? null;
}
