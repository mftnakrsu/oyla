import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { I18nProvider } from '../i18n/I18nProvider';
import { MultipleChoiceRespond } from './multiple-choice/Respond';
import { MultipleChoiceResults } from './multiple-choice/Results';
import { OpenEndedRespond } from './open-ended/Respond';
import { OpenEndedResults } from './open-ended/Results';
import { QaRespond } from './qa/Respond';
import { QaResults } from './qa/Results';
import { QuizEditor } from './quiz/Editor';
import { QuizRespond } from './quiz/Respond';
import { QuizResults } from './quiz/Results';
import { ScaleRespond } from './scale/Respond';
import { ScaleResults } from './scale/Results';
import { WordCloudRespond } from './word-cloud/Respond';
import { WordCloudResults } from './word-cloud/Results';

function renderEn(ui: ReactElement) {
  return render(<I18nProvider initial="en">{ui}</I18nProvider>);
}

const quizConfig = {
  options: [
    { id: 'a', label: 'Ankara' },
    { id: 'b', label: 'İstanbul' },
  ],
  correctOptionId: 'a',
  seconds: 20,
  points: 1000,
  speedCounts: true,
};

describe('quiz components', () => {
  test('one tap sends the answer', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    renderEn(<QuizRespond config={quizConfig} remaining={1} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /İstanbul/ }));
    expect(onSubmit).toHaveBeenCalledWith({ optionId: 'b' });
  });

  test('results mark the correct option only once revealed', () => {
    const results = { counts: { a: 3, b: 1 }, total: 4 };
    const { rerender } = renderEn(<QuizResults config={quizConfig} results={results} />);
    expect(screen.queryByText(/Correct/)).not.toBeInTheDocument();
    rerender(
      <I18nProvider initial="en">
        <QuizResults config={quizConfig} results={results} revealed />
      </I18nProvider>,
    );
    expect(screen.getByText(/Correct/)).toBeInTheDocument();
  });

  test('removing the correct option moves the mark to the first one left', async () => {
    const onChange = vi.fn();
    renderEn(
      <QuizEditor
        config={{ ...quizConfig, options: [...quizConfig.options, { id: 'c', label: 'İzmir' }] }}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove option 1' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ correctOptionId: 'b' }));
    await userEvent.click(screen.getByLabelText('Option 3 is the right answer'));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ correctOptionId: 'c' }));
  });

  test('the editor sets the points and whether speed counts, also for older quizzes', async () => {
    const onChange = vi.fn();
    const { points: _points, speedCounts: _speed, ...older } = quizConfig;
    renderEn(<QuizEditor config={older as typeof quizConfig} onChange={onChange} />);
    expect(screen.getByLabelText('Points for a right answer')).toHaveValue('1000');
    await userEvent.selectOptions(screen.getByLabelText('Points for a right answer'), '2000');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ points: 2000 }));
    const speed = screen.getByRole('checkbox', { name: /Faster answers earn more/ });
    expect(speed).toBeChecked();
    await userEvent.click(speed);
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ speedCounts: false }));
  });
});

describe('Respond components', () => {
  test('Q&A sends a question and upvotes others, but not your own', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    renderEn(
      <QaRespond
        config={{ maxEntries: 1 }}
        remaining={1}
        onSubmit={onSubmit}
        results={{
          entries: [
            { key: 'why?', text: 'Why?', votes: 2, answered: false },
            { key: 'mine?', text: 'Mine?', votes: 0, answered: false },
            { key: 'done?', text: 'Done?', votes: 1, answered: false },
          ],
          total: 3,
        }}
        mine={[{ text: ' Mine? ' }, { upvote: 'done?' }]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Upvote: Mine?' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Upvote: Done?' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Upvote: Why?' }));
    expect(onSubmit).toHaveBeenCalledWith({ upvote: 'why?' });

    await userEvent.type(screen.getByLabelText('Your question'), 'When?');
    await userEvent.click(screen.getByRole('button', { name: 'Send question' }));
    expect(onSubmit).toHaveBeenLastCalledWith({ text: 'When?' });
  });

  test('Q&A keeps upvoting open when no questions are left, and says when they are hidden', () => {
    renderEn(
      <QaRespond config={{ maxEntries: 1 }} remaining={0} onSubmit={vi.fn()} results={null} />,
    );
    expect(screen.queryByLabelText('Your question')).not.toBeInTheDocument();
    expect(screen.getByText(/still upvote/)).toBeInTheDocument();
    expect(screen.getByText(/hiding the questions/)).toBeInTheDocument();
  });

  test('Q&A results show votes and a hide button while moderating', async () => {
    const onHide = vi.fn();
    renderEn(
      <QaResults
        config={{ maxEntries: 1 }}
        results={{ entries: [{ key: 'why?', text: 'Why?', votes: 2, answered: false }], total: 1 }}
        onHide={onHide}
      />,
    );
    expect(screen.getByText('2 votes')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Why\?/ }));
    expect(onHide).toHaveBeenCalledWith('why?');
  });

  test('Q&A lists answered questions under their own heading, without upvotes', () => {
    renderEn(
      <QaRespond
        config={{ maxEntries: 1 }}
        remaining={1}
        onSubmit={vi.fn()}
        results={{
          entries: [
            { key: 'open?', text: 'Open?', votes: 0, answered: false },
            { key: 'done?', text: 'Done?', votes: 3, answered: true },
          ],
          total: 2,
        }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Answered' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upvote: Open?' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Upvote: Done?' })).toBeDisabled();
  });

  test('Q&A results let the presenter mark questions as answered and back', async () => {
    const onMarkAnswered = vi.fn();
    renderEn(
      <QaResults
        config={{ maxEntries: 1 }}
        results={{
          entries: [
            { key: 'why?', text: 'Why?', votes: 2, answered: false },
            { key: 'how?', text: 'How?', votes: 1, answered: true },
          ],
          total: 2,
        }}
        onMarkAnswered={onMarkAnswered}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Answered' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mark “Why?” as answered' }));
    expect(onMarkAnswered).toHaveBeenLastCalledWith('why?', true);
    await userEvent.click(screen.getByRole('button', { name: 'Mark “How?” as not answered' }));
    expect(onMarkAnswered).toHaveBeenLastCalledWith('how?', false);
  });

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

describe('Moderation', () => {
  const notes = {
    entries: [
      { key: 1, text: 'More breaks' },
      { key: 0, text: 'Spam SPAM' },
    ],
    total: 2,
  };

  test('open answers get hide buttons only while moderating', async () => {
    const { unmount } = renderEn(<OpenEndedResults config={{ maxEntries: 1 }} results={notes} />);
    expect(screen.queryByRole('button', { name: /Hide/ })).toBeNull();
    unmount();

    const onHide = vi.fn();
    renderEn(<OpenEndedResults config={{ maxEntries: 1 }} results={notes} onHide={onHide} />);
    await userEvent.click(screen.getByRole('button', { name: 'Hide “Spam SPAM”' }));
    expect(onHide).toHaveBeenCalledWith('spam spam');
  });

  test('the word cloud becomes a list of words to hide while moderating', async () => {
    const onHide = vi.fn();
    renderEn(
      <WordCloudResults
        config={{ maxEntries: 3 }}
        results={{
          words: [
            { text: 'İzmir', count: 3 },
            { text: 'Ankara', count: 1 },
          ],
          total: 4,
        }}
        onHide={onHide}
      />,
    );
    expect(screen.getByRole('list', { name: 'Answers' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Hide “İzmir”' }));
    expect(onHide).toHaveBeenCalledWith('izmir');
  });
});
