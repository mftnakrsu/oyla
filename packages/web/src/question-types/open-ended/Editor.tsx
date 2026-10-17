import { EntriesEditor } from '../EntriesEditor';
import type { EditorProps } from '../types';

export function OpenEndedEditor({ config, onChange }: EditorProps<'open-ended'>) {
  return (
    <EntriesEditor value={config.maxEntries} onChange={(maxEntries) => onChange({ maxEntries })} />
  );
}
