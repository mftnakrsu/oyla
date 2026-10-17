/** "042917" → "042 917", the way codes are shown on screens. */
export function formatJoinCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}

export function joinUrl(code: string): string {
  return `${window.location.origin}/join/${code}`;
}

export function adminUrl(id: string, token: string): string {
  return `${window.location.origin}/edit/${id}#key=${token}`;
}

/** Host shown in "Go to … and enter …", without the protocol. */
export function displayHost(): string {
  return window.location.host;
}
