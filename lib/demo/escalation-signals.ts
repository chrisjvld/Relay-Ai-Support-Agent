const HUMAN_REQUEST =
  /\b(human|person|agent|representative|someone real|talk to support)\b/i;
const STRONG_FRUSTRATION =
  /\b(second time|again|unacceptable|ridiculous|furious|angry|fed up|terrible)\b/i;
const RESTRICTED_ACTION =
  /\b(refund (me|now)|want a refund|chargeback|override|exception|cancel (it|my order))\b/i;
const SAFETY_ISSUE =
  /\b(unsafe|injury|injured|dangerous|caught fire|allergic reaction)\b/i;

export function detectEscalationSignal(message: string) {
  const reasons: string[] = [];

  if (HUMAN_REQUEST.test(message)) reasons.push("explicit human request");
  if (STRONG_FRUSTRATION.test(message)) reasons.push("repeated frustration");
  if (RESTRICTED_ACTION.test(message)) reasons.push("restricted action request");
  if (SAFETY_ISSUE.test(message)) reasons.push("potential safety issue");

  return {
    shouldEscalate: reasons.length > 0,
    reasons,
    directive:
      reasons.length > 0
        ? `Escalation is required for this turn because of: ${reasons.join(
            ", ",
          )}. You MUST call createSupportTicket before replying. Do not claim the requested action is approved.`
        : "",
  };
}
