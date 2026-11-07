import { EntriesEditor } from '../EntriesEditor';
import type { EditorProps } from '../types';

export function QaEditor({ config, onChange }: EditorProps<'qa'>) {
  return (
    <EntriesEditor
      value={config.maxEntries}
      labelKey="qa.entries.label"
      onChange={(maxEntries) => onChange({ maxEntries })}
    />
  );
}
