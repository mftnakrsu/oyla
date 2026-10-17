import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { I18nProvider } from '../i18n/I18nProvider';
import { MultipleChoiceRespond } from './multiple-choice/Respond';
import { MultipleChoiceResults } from './multiple-choice/Results';
import { OpenEndedRespond } from './open-ended/Respond';
import { ScaleRespond } from './scale/Respond';
import { ScaleResults } from './scale/Results';
import { WordCloudRespond } from './word-cloud/Respond';
import { WordCloudResults } from './word-cloud/Results';

function renderEn(ui: ReactElement) {
  return render(<I18nProvider initial="en">{ui}</I18nProvider>);
}

describe('Respond components', () => {
  test('multiple choice sends the picked option', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    renderEn(
      <MultipleChoiceRespond
        config={{
          options: [
            { id: 'a', label: 'Tea' },
            { id: 'b', label: 'Coffee' },
          ],
        }}
        remaining={1}
        onSubmit={onSubmit}
      />,
    );
    const send = screen.getByRole('button', { name: 'Send vote' });
    expect(send).toBeDisabled();
    await userEvent.click(screen.getByLabelText('Coffee'));
    await userEvent.click(send);
    expect(onSubmit).toHaveBeenCalledWith({ optionId: 'b' });
  });

  test('multiple choice shows placeholders for blank labels', () => {
    renderEn(
      <MultipleChoiceRespond
        config={{
          options: [
            { id: 'a', label: '' },
            { id: 'b', label: '' },
          ],
        }}
        remaining={1}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
  });

  test('word cloud sends the text and clears the field when accepted', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    renderEn(<WordCloudRespond config={{ maxEntries: 3 }} remaining={3} onSubmit={onSubmit} />);
    const field = screen.getByLabelText('Your answer');
    await userEvent.type(field, 'pizza');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledWith({ text: 'pizza' });
    expect(field).toHaveValue('');
  });

  test('word cloud keeps the text when the server refuses it', async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    renderEn(<WordCloudRespond config={{ maxEntries: 3 }} remaining={3} onSubmit={onSubmit} />);
    const field = screen.getByLabelText('Your answer');
    await userEvent.type(field, 'sushi{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({ text: 'sushi' });
    expect(field).toHaveValue('sushi');
  });

  test('open question sends multi-line text', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    renderEn(<OpenEndedRespond config={{ maxEntries: 1 }} remaining={1} onSubmit={onSubmit} />);
    await userEvent.type(
      screen.getByLabelText('Your answer'),
      'Great talk{Shift>}{Enter}{/Shift}thanks',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledWith({ text: 'Great talk\nthanks' });
  });

  test('scale sends the picked number', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    renderEn(
      <ScaleRespond
        config={{ min: 1, max: 5, minLabel: 'Bad', maxLabel: 'Great' }}
        remaining={1}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByText('Bad')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('4'));
    await userEvent.click(screen.getByRole('button', { name: 'Send rating' }));
    expect(onSubmit).toHaveBeenCalledWith({ value: 4 });
  });
});

describe('Results components', () => {
  test('multiple choice shows percentages and the vote count', () => {
    renderEn(
      <MultipleChoiceResults
        config={{
          options: [
            { id: 'a', label: 'Tea' },
            { id: 'b', label: 'Coffee' },
          ],
        }}
        results={{ counts: { a: 1, b: 3 }, total: 4 }}
      />,
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('4 votes')).toBeInTheDocument();
  });

  test('scale shows the average', () => {
    renderEn(
      <ScaleResults
        config={{ min: 1, max: 5, minLabel: '', maxLabel: '' }}
        results={{ distribution: [0, 0, 1, 1, 0], average: 3.5, total: 2 }}
      />,
    );
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  test('word cloud lists every word for screen readers', () => {
    renderEn(
      <WordCloudResults
        config={{ maxEntries: 3 }}
        results={{ words: [{ text: 'pizza', count: 2 }], total: 2 }}
      />,
    );
    expect(screen.getByText(/pizza: 2 answers/)).toBeInTheDocument();
  });
});
