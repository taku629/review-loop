export type ImportErrorKind = 'invalid' | 'not-found' | 'rate-limit' | 'network' | 'timeout' | 'server';

/** An import failure with a message that tells the user what happened and what to do. */
export class ImportError extends Error {
  constructor(
    public kind: ImportErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

export const TIMEOUT_MS = 25_000;

const HANDLE_RE = { AtCoder: /^[A-Za-z0-9_]{3,16}$/, Codeforces: /^[A-Za-z0-9_.-]{3,24}$/ };

export function checkHandle(judge: keyof typeof HANDLE_RE, handle: string): void {
  if (!HANDLE_RE[judge].test(handle.trim()))
    throw new ImportError('invalid', `“${handle.trim()}” is not a valid ${judge} handle (letters, digits and _ only). Check for typos or extra spaces.`);
}

/** fetch with a timeout; network and CORS failures (which look identical in the browser) become readable errors. */
export async function fetchApi(api: string, url: string, signal?: AbortSignal): Promise<Response> {
  const ctl = new AbortController();
  const onAbort = () => ctl.abort();
  signal?.addEventListener('abort', onAbort);
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctl.signal });
  } catch (e) {
    if (signal?.aborted) throw e;
    if (ctl.signal.aborted) throw new ImportError('timeout', `${api} did not answer within ${TIMEOUT_MS / 1000} s — it is probably overloaded. Try again in a minute.`);
    throw new ImportError('network', `Could not reach ${api}. Check your connection — an ad blocker, proxy or CORS error can also block the request.`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

export function httpError(api: string, status: number): ImportError {
  if (status === 429) return new ImportError('rate-limit', `${api} is rate-limiting requests (HTTP 429). Wait a minute, then try again.`);
  if (status >= 500) return new ImportError('server', `${api} is having trouble (HTTP ${status}). This is on their side — try again in a few minutes.`);
  return new ImportError('server', `${api} rejected the request (HTTP ${status}).`);
}

/** Codeforces reports most failures as `{ status: "FAILED", comment }`. */
export function codeforcesError(handle: string, status: number, comment?: string): ImportError {
  if (comment && /not found/i.test(comment)) return new ImportError('not-found', `Codeforces has no user “${handle.trim()}”. Check the spelling of the handle.`);
  if (status === 429 || (comment && /limit exceeded/i.test(comment))) return new ImportError('rate-limit', 'Codeforces API call limit exceeded. Wait a few seconds, then try again.');
  if (comment) return new ImportError('server', `Codeforces API: ${comment}`);
  return httpError('Codeforces API', status);
}
