import { participantIdSchema, randomId } from '@oyla/shared';
import { readJson, writeJson } from './storage';

const KEY = 'oyla:participant-id';
let memoryId: string | null = null;

/** Anonymous id that lets a reconnecting phone keep its answers. */
export function getParticipantId(): string {
  const stored = readJson<unknown>(KEY, null);
  if (participantIdSchema.safeParse(stored).success) {
    return stored as string;
  }
  memoryId ??= randomId(24);
  writeJson(KEY, memoryId);
  return memoryId;
}
