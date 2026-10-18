import type { QuestionDto } from '@oyla/shared';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiRequestError, api } from '../../api/client';
import { I18nProvider } from '../../i18n/I18nProvider';
import { QuestionPanel } from './QuestionPanel';

const question: QuestionDto = {
  id: 'q1',
  type: 'open-ended',
  title: 'Old title',
  config: { maxEntries: 1 },
  position: 0,
  responseCount: 0,
};

function renderPanel(onSaved = vi.fn(), onError = vi.fn()) {
  render(
    <I18nProvider initial="en">
      <QuestionPanel
        presentationId="p1"
        token="token"
        question={question}
        index={0}
        total={1}
        onSaved={onSaved}
        onMove={vi.fn()}
        onDelete={vi.fn()}
        onReset={vi.fn()}
        onError={onError}
      />
    </I18nProvider>,
  );
  return { onSaved, onError };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('QuestionPanel autosave', () => {
  test('a failed save is retried instead of being forgotten', async () => {
    const update = vi
      .spyOn(api, 'updateQuestion')
      .mockRejectedValueOnce(new ApiRequestError('NETWORK', 0))
      .mockResolvedValueOnce({ ...question, title: 'New title' });
    const { onSaved, onError } = renderPanel();

    fireEvent.change(screen.getByLabelText('Question'), { target: { value: 'New title' } });
    await act(() => vi.advanceTimersByTimeAsync(600));
    expect(update).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Couldn’t save your last change. Trying again…')).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(update).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenLastCalledWith('p1', 'token', 'q1', { title: 'New title' });
    expect(onSaved).toHaveBeenCalledWith({ ...question, title: 'New title' });
    expect(onError).not.toHaveBeenCalled();
  });

  test('saves one at a time, so a slow earlier save cannot overwrite a later one', async () => {
    let finishFirst: (value: QuestionDto) => void = () => {};
    const update = vi
      .spyOn(api, 'updateQuestion')
      .mockImplementationOnce(() => new Promise((resolve) => (finishFirst = resolve)))
      .mockResolvedValueOnce({ ...question, title: 'AB' });
    const { onSaved } = renderPanel();
    const field = screen.getByLabelText('Question');

    fireEvent.change(field, { target: { value: 'A' } });
    await act(() => vi.advanceTimersByTimeAsync(600));
    fireEvent.change(field, { target: { value: 'AB' } });
    await act(() => vi.advanceTimersByTimeAsync(600));
    expect(update).toHaveBeenCalledTimes(1);

    await act(async () => finishFirst({ ...question, title: 'A' }));
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(update).toHaveBeenCalledTimes(2);
    expect(onSaved.mock.calls.map(([q]) => q.title)).toEqual(['A', 'AB']);
  });

  test('errors that retrying cannot fix are reported', async () => {
    vi.spyOn(api, 'updateQuestion').mockRejectedValueOnce(
      new ApiRequestError('VALIDATION_FAILED', 400),
    );
    const { onError } = renderPanel();
    fireEvent.change(screen.getByLabelText('Question'), { target: { value: 'x' } });
    await act(() => vi.advanceTimersByTimeAsync(600));
    expect(onError).toHaveBeenCalledWith('VALIDATION_FAILED');
  });
});
