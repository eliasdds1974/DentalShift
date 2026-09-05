import { loadAccountDetails, type AccountDetails } from "@/lib/dentalshift";

export type AccountLoadOptions = {
  attempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function loadAccountDetailsResilient(
  userId: string,
  options: AccountLoadOptions = {},
): Promise<AccountDetails> {
  const attempts = Math.max(1, options.attempts ?? 4);
  const initialDelayMs = Math.max(0, options.initialDelayMs ?? 250);
  const maxDelayMs = Math.max(initialDelayMs, options.maxDelayMs ?? 2000);
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await loadAccountDetails(userId);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) break;
      const delay = Math.min(maxDelayMs, initialDelayMs * 2 ** attempt);
      await sleep(delay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("DentalShift could not load this account after several attempts.");
}
