import type React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { colors, fontFamily } from "../theme";

type LiveBarsProps = {
  readonly options: readonly string[];
  readonly votes: readonly number[];
  /** Frame at which the first vote arrives and the frame by which all have arrived. */
  readonly startFrame: number;
  readonly endFrame: number;
  readonly fontSize: number;
};

/** The presenter's multiple-choice chart with votes arriving one by one, like in the app. */
export const LiveBars: React.FC<LiveBarsProps> = ({ options, votes, startFrame, endFrame, fontSize }) => {
  const frame = useCurrentFrame();
  // A fixed, shuffled arrival order: each vote lands at its own frame.
  const ballots = votes
    .flatMap((count, option) => Array.from({ length: count }, (_, n) => ({ option, key: random(`vote-${option}-${n}`) })))
    .sort((a, b) => a.key - b.key)
    .map((ballot, index, all) => ({
      option: ballot.option,
      at: startFrame + ((endFrame - startFrame) * index) / Math.max(1, all.length - 1),
    }));
  // Each vote grows its bar over 8 frames, like the app's CSS transition.
  const grown = options.map((_, option) =>
    ballots
      .filter((b) => b.option === option)
      .reduce(
        (sum, b) => sum + interpolate(frame, [b.at, b.at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }),
        0,
      ),
  );
  const counts = options.map((_, option) => ballots.filter((b) => b.option === option && b.at <= frame).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...grown);

  return (
    <div style={{ fontFamily, color: colors.ink, display: "flex", flexDirection: "column", gap: fontSize * 0.9 }}>
      {options.map((label, option) => (
        <div key={label}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: fontSize * 0.3 }}>
            <span style={{ fontSize: fontSize * 1.1, fontWeight: 700 }}>{label}</span>
            <span style={{ fontSize, color: colors.muted }}>
              <span style={{ fontWeight: 800, color: colors.ink }}>
                {total === 0 ? 0 : Math.round(((counts[option] ?? 0) / total) * 100)}%
              </span>{" "}
              ({counts[option] ?? 0})
            </span>
          </div>
          <div
            style={{
              height: fontSize * 1.05,
              width: `${Math.max(0.2, ((grown[option] ?? 0) / max) * 100)}%`,
              backgroundColor: colors.series,
              borderRadius: "0 4px 4px 0",
            }}
          />
        </div>
      ))}
      <div style={{ fontSize: fontSize * 0.8, color: colors.muted }}>{total === 1 ? "1 vote" : `${total} votes`}</div>
    </div>
  );
};
