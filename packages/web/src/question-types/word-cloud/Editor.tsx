import { EntriesEditor } from '../EntriesEditor';
import type { EditorProps } from '../types';

export function WordCloudEditor({ config, onChange }: EditorProps<'word-cloud'>) {
  return (
    <EntriesEditor value={config.maxEntries} onChange={(maxEntries) => onChange({ maxEntries })} />
  );
}
