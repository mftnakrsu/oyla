/** Every word on screen, per language. Labels that also appear in the app match its wording. */
export type Lang = "en" | "tr";

type Copy = {
  readonly opening: { readonly tagline: string };
  readonly ask: { readonly title: string; readonly body: string };
  readonly join: { readonly title: string; readonly body: string };
  readonly live: { readonly title: string };
  readonly types: { readonly title: string; readonly items: readonly [string, string, string, string] };
  readonly themes: {
    readonly title: string;
    readonly body: string;
    readonly names: { readonly emerald: string; readonly indigo: string; readonly navy: string; readonly blue: string };
  };
  readonly selfHost: { readonly title: string; readonly body: string };
  readonly outro: { readonly docs: string; readonly code: string };
  /** The sample presentation in the screenshots. */
  readonly poll: {
    readonly options: readonly string[];
    readonly votes: readonly number[];
    readonly scaleVotes: readonly number[];
    readonly scaleLow: string;
    readonly scaleHigh: string;
    readonly word: string;
    readonly openAnswer: string;
  };
  readonly results: {
    readonly votes: (count: number) => string;
    readonly answers: (count: number) => string;
    readonly average: string;
    readonly waiting: string;
    readonly charactersLeft: (count: number) => string;
  };
};

export const copy: Record<Lang, Copy> = {
  en: {
    opening: { tagline: "Live polls for talks, classes and meetings" },
    ask: {
      title: "Ask a question",
      body: "Multiple choice, word clouds, open questions and scales. No account needed.",
    },
    join: {
      title: "Everyone joins from their phone",
      body: "Open oyla.example.com and type the code, or scan the QR code. No app, no sign-up.",
    },
    live: { title: "Results update live" },
    types: { title: "Four question types", items: ["Multiple choice", "Word cloud", "Scale", "Open question"] },
    themes: {
      title: "Four themes",
      body: "Pick one for each presentation. The big screen and every phone follow it.",
      names: { emerald: "Emerald", indigo: "Indigo", navy: "Navy & orange", blue: "Classic blue" },
    },
    selfHost: {
      title: "Open source. Runs anywhere.",
      body: "One Docker container and one SQLite file, on your own server. MIT licensed.",
    },
    outro: { docs: "Docs", code: "Code" },
    poll: {
      options: ["Offline mode", "Dark mode", "CSV export", "Team spaces"],
      votes: [9, 6, 3, 6],
      scaleVotes: [1, 2, 5, 10, 6],
      scaleLow: "Not ready",
      scaleHigh: "Fully ready",
      word: "momentum",
      openAnswer: "Demo every Friday, it keeps us honest",
    },
    results: {
      votes: (count) => (count === 1 ? "1 vote" : `${count} votes`),
      answers: (count) => (count === 1 ? "1 answer" : `${count} answers`),
      average: "Average",
      waiting: "Waiting for the first answer",
      charactersLeft: (count) => (count === 1 ? "1 character left" : `${count} characters left`),
    },
  },
  tr: {
    opening: { tagline: "Sunumlar, dersler ve toplantılar için canlı anketler" },
    ask: {
      title: "Bir soru sorun",
      body: "Çoktan seçmeli, kelime bulutu, açık uçlu ya da ölçek sorusu. Hesap açmanız gerekmez.",
    },
    join: {
      title: "Herkes telefonundan katılır",
      body: "Katılımcılar oyla.example.com adresine girip kodu yazar ya da QR kodu okutur. Uygulama da üyelik de gerekmez.",
    },
    live: { title: "Sonuçlar anında güncellenir" },
    types: { title: "Dört soru tipi", items: ["Çoktan seçmeli", "Kelime bulutu", "Ölçek", "Açık uçlu soru"] },
    themes: {
      title: "Dört tema",
      body: "Her sunuma bir tema seçin; büyük ekran da tüm telefonlar da ona uyar.",
      names: { emerald: "Zümrüt", indigo: "İndigo", navy: "Lacivert ve turuncu", blue: "Klasik mavi" },
    },
    selfHost: {
      title: "Açık kaynak, her yerde çalışır",
      body: "Kendi sunucunuzda tek bir Docker konteyneri ve tek bir SQLite dosyası. MIT lisanslı.",
    },
    outro: { docs: "Dokümantasyon", code: "Kaynak kodu" },
    poll: {
      options: ["Çevrimdışı mod", "Karanlık mod", "CSV dışa aktarma", "Takım alanları"],
      votes: [8, 7, 2, 5],
      scaleVotes: [0, 1, 4, 8, 5],
      scaleLow: "Hiç hazır değil",
      scaleHigh: "Tamamen hazır",
      word: "ivme",
      openAnswer: "Her cuma demo",
    },
    results: {
      votes: (count) => `${count} oy`,
      answers: (count) => `${count} cevap`,
      average: "Ortalama",
      waiting: "İlk cevap bekleniyor",
      charactersLeft: (count) => `${count} karakter kaldı`,
    },
  },
};

/** One decimal, with the language's decimal separator (3.8 / 3,8), like the app. */
export const formatAverage = (value: number, lang: Lang) =>
  value.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
