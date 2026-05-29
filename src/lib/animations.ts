import {interpolate, spring} from 'remotion';
import type {CSSProperties} from 'react';

// ─── Timing constants (brand spec — see BRAND.md §08) ────────────────────────

/** Left-to-right accent stripe wipe duration: 400ms at 30fps. */
export const ACCENT_WIPE_FRAMES = 12;

/** Extra frames between header elements (chip → title → subtitle). */
export const HEADER_STAGGER_FRAMES = 7;

/**
 * Frame at which the first data row starts animating.
 * Enforces the brand's 0.8s title-hold rule: header settles ~frame 29,
 * then 24 frames (~0.8s) of silence before data appears.
 */
export const ROWS_START_FRAME = 48;

/** Frames between each successive row: 200ms at 30fps. */
export const ROW_STAGGER_FRAMES = 6;

/**
 * How many frames after a row starts before it is considered fully settled.
 * Used to calculate when the footer / logo should appear (always last).
 */
const ROW_SETTLE_FRAMES = 18;

// ─── Spring presets ───────────────────────────────────────────────────────────

/** Snappy spring for list rows — settles in ~12 frames. */
const rowSpring = {damping: 18, stiffness: 200, mass: 0.5};

/** Smooth spring for header panels — settles in ~20 frames. */
const headerSpring = {damping: 20, stiffness: 120, mass: 0.6};

/** Gentle spring for footer fades — settles in ~26 frames. */
const fadeSpring = {damping: 22, stiffness: 80, mass: 0.6};

/** Punchy spring for score/stat pop: scale 0.8→1.0, 150ms. */
const popSpring = {damping: 12, stiffness: 300, mass: 0.4};

// ─── Frame calculators ────────────────────────────────────────────────────────

/**
 * The frame at which row `index` starts animating.
 * Optionally override the base start frame (e.g. for section-relative rows).
 */
export const rowStartFrame = (index: number, baseFrame = ROWS_START_FRAME): number =>
  baseFrame + index * ROW_STAGGER_FRAMES;

/**
 * The frame at which the footer / logo should start fading in.
 * Calculated so the logo always appears AFTER the last row has fully settled.
 * Per brand spec: logo is always the last thing to appear.
 */
export const footerStartFrame = (rowCount: number, baseFrame = ROWS_START_FRAME): number =>
  rowStartFrame(Math.max(rowCount - 1, 0), baseFrame) + ROW_SETTLE_FRAMES;

// ─── Style helpers ────────────────────────────────────────────────────────────

/**
 * Spring-based entrance: element slides up from `fromY` px below and fades in.
 */
export const entranceStyle = (
  frame: number,
  fps: number,
  startFrame: number,
  fromY = 36,
): CSSProperties => {
  const f = Math.max(0, frame - startFrame);
  const p = spring({frame: f, fps, config: rowSpring});
  return {
    opacity: interpolate(p, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    transform: `translateY(${interpolate(p, [0, 1], [fromY, 0])}px)`,
  };
};

/**
 * Smooth entrance for header elements — slightly softer than row entrances.
 */
export const headerEntranceStyle = (
  frame: number,
  fps: number,
  startFrame: number,
  fromY = 28,
): CSSProperties => {
  const f = Math.max(0, frame - startFrame);
  const p = spring({frame: f, fps, config: headerSpring});
  return {
    opacity: interpolate(p, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    transform: `translateY(${interpolate(p, [0, 1], [fromY, 0])}px)`,
  };
};

/**
 * Gentle fade-in for footer elements, brand marks, and CTA boxes.
 * Per brand spec: logo always appears last.
 */
export const fadeInStyle = (
  frame: number,
  fps: number,
  startFrame: number,
): CSSProperties => {
  const f = Math.max(0, frame - startFrame);
  const p = spring({frame: f, fps, config: fadeSpring});
  return {
    opacity: interpolate(p, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  };
};

/**
 * Score / stat pop: scale 0.8 → 1.0 in 150ms.
 * Apply to score boxes after their parent row has entered.
 */
export const scorePopStyle = (
  frame: number,
  fps: number,
  startFrame: number,
): CSSProperties => {
  const f = Math.max(0, frame - startFrame);
  const p = spring({frame: f, fps, config: popSpring});
  const scale = interpolate(p, [0, 1], [0.8, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {
    transform: `scale(${scale})`,
    opacity: interpolate(p, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  };
};

/**
 * Competition accent stripe wipe: a width percentage (0→100) over ACCENT_WIPE_FRAMES.
 * Render as a thin absolutely-positioned div at the top of the composition.
 */
export const accentWipeWidth = (frame: number): string => {
  const pct = interpolate(frame, [0, ACCENT_WIPE_FRAMES], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return `${pct}%`;
};
