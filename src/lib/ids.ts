import type { ID } from "./types";

export function generateId(): ID {
  return crypto.randomUUID();
}
