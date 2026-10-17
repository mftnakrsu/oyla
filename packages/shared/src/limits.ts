/** Hard limits shared by the server (validation) and the web app (form hints). */
export const LIMITS = {
  presentationTitle: 120,
  questionTitle: 200,
  questionsPerPresentation: 50,
  optionsMin: 2,
  optionsMax: 10,
  optionLabel: 80,
  wordCloudEntry: 25,
  openEndedEntry: 280,
  maxEntries: 5,
  scaleLabel: 40,
  responsesPerQuestion: 2000,
  wordCloudTop: 100,
  openEndedLatest: 200,
} as const;

export const JOIN_CODE_LENGTH = 6;
