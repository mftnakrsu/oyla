/** Reads the admin token from a `#key=…` fragment, if the page was opened from an admin link. */
export function readKeyFromHash(): string | null {
  const match = /^#key=([A-Za-z0-9_-]{20,100})$/.exec(window.location.hash);
  return match?.[1] ?? null;
}

/** Removes the fragment so the token does not linger in the address bar or get shared by accident. */
export function dropHash(): void {
  if (window.location.hash) {
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + window.location.search,
    );
  }
}
