/** The shape the UI renders. Deliberately free of any monaco/ts types so the
 *  Node-side curriculum test can produce the same thing. */
export interface Diag {
  line: number;
  column: number;
  message: string;
  code: number;
}

/** TS nests chained messages through `next`; flatten to one indented string. */
export function flattenMessage(messageText: string | MessageChain, depth = 0): string {
  if (typeof messageText === 'string') return messageText;
  const indent = '  '.repeat(depth);
  const head = indent + messageText.messageText;
  const rest = (messageText.next ?? []).map((n) => flattenMessage(n, depth + 1));
  return [head, ...rest].join('\n');
}

export interface MessageChain {
  messageText: string;
  next?: MessageChain[];
}
