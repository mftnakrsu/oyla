# Security policy

## Reporting a vulnerability

Please do **not** open a public issue. Use GitHub's private vulnerability reporting instead:
**Security → Report a vulnerability** on this repository. Include what an attacker can do, the
steps to reproduce it and the affected version or commit.

You can expect a first answer within a week. Once a fix is released, the advisory is published
with credit to you if you want it.

## Supported versions

Only the latest release on the `main` branch receives security fixes.

## Security model in short

- There are no user accounts. Creating a presentation returns an **admin link**; whoever has it can
  edit and present. The token travels only in the link's URL fragment and the `Authorization`
  header, and the server stores a SHA-256 hash of it.
- Participants are anonymous. Their browser keeps a random id so a reconnecting phone keeps its
  answers; someone who clears their browser storage can answer again. Rate limits bound how fast
  that can happen. Oyla is not meant for votes that must be tamper-proof.
- Every request and socket message is validated, API routes and socket events are rate limited,
  and responses carry a strict Content Security Policy.
- Presentations nobody used for `OYLA_RETENTION_DAYS` (default 30) are deleted automatically.

The documentation has a longer [security page](https://mftnakrsu.github.io/oyla/security/) with
advice for running a public instance.
