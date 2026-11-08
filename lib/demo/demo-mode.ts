/**
 * Demo mode plays back scripted, tool-using replies instead of calling OpenAI.
 *
 * It is on when DEMO_MODE=1, or automatically when OPENAI_API_KEY is missing
 * (set DEMO_MODE=0 to disable the automatic fallback). With a key and no
 * DEMO_MODE, Relay always uses the real model.
 */
export function isDemoMode() {
  if (process.env.DEMO_MODE === "1") return true;
  if (process.env.DEMO_MODE === "0") return false;
  return !process.env.OPENAI_API_KEY;
}
