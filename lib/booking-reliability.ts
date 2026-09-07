export type CancellationKind = "early" | "late" | "no_show" | "office" | "excused";
export type CancellationRecord = { kind: CancellationKind; occurredAt: string; shiftStartsAt: string; actor: "professional" | "office" | "admin"; reason?: string; };
export type ReliabilityEvent = { kind: "completed" | CancellationKind; excused?: boolean };
export const LATE_CANCELLATION_HOURS = 24;

export function classifyCancellation(input: { shiftStartsAt: string; cancelledAt: string; actor: "professional" | "office"; noShow?: boolean }): CancellationKind {
  const start = Date.parse(input.shiftStartsAt);
  const cancelled = Date.parse(input.cancelledAt);
  if (!Number.isFinite(start) || !Number.isFinite(cancelled)) throw new Error("Valid timestamps are required.");
  if (input.actor === "office") return "office";
  if (input.noShow) return "no_show";
  return start - cancelled < LATE_CANCELLATION_HOURS * 3600000 ? "late" : "early";
}

export function calculateReliability(events: ReliabilityEvent[]) {
  const completed = events.filter(event => event.kind === "completed").length;
  const late = events.filter(event => event.kind === "late" && !event.excused).length;
  const noShows = events.filter(event => event.kind === "no_show" && !event.excused).length;
  const total = completed + late + noShows;
  return { completed, late, noShows, total, score: total ? Math.round(completed / total * 100) : null };
}
