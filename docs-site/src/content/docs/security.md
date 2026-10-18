---
title: Security
description: Oyla's security model, how to report a vulnerability, and advice for running your own server.
---

Oyla is built for quick, low-stakes polls in a room: no accounts, nothing to install, answers in
seconds. That shapes its security model. It protects presentations from being edited by the wrong
people and keeps the server hard to abuse, but it can't guarantee one vote per person. Don't use it
for elections, grading or anything else where a vote must be tamper-proof.

## Report a vulnerability

Please don't open a public issue. Use GitHub's private vulnerability reporting instead:

1. Open the [Oyla repository](https://github.com/mftnakrsu/oyla) on GitHub.
2. Go to the **Security** tab and select **Report a vulnerability**.
3. Describe what an attacker can do, the steps to reproduce it, and the version or commit you
   tested.

You can expect a first answer within a week. Once a fix is released, the advisory is published,
with credit to you if you want it. Only the latest version on the `main` branch receives security
fixes.

## Security model

### Admin links

There are no user accounts. Creating a presentation returns an **admin link**, and whoever has it
can edit, present and delete that presentation.

- The secret in the link is 32 random bytes, encoded as base64url.
- It sits in the URL fragment (`#key=…`), which browsers never send to the server, so it doesn't
  show up in server logs or in `Referer` headers. The editor removes the fragment from the address
  bar right after loading.
- The browser sends the token to the server only in the `Authorization: Bearer` header of API
  requests and in the presenter screen's Socket.IO join message.
- The server stores only a SHA-256 hash of the token and compares hashes in constant time.
- The browser keeps the token in local storage for the **Your presentations** list. On a shared
  computer, remove the presentation from that list with the × button when you're done.

A link can't be revoked or rotated. If one leaks, delete the presentation and create a new one.

### Anonymous participants

Participants don't sign in or give a name. Their browser creates a random participant id and keeps
it in local storage; the server uses it to enforce how many answers each person may give and to
let a reconnecting phone keep its answers.

This means someone who clears their browser storage, opens a private window or uses a second
device can answer again. Rate limits slow this down but don't prevent it. Without accounts, that is
an accepted trade-off.

Join codes are 6 digits so people can type them quickly. They are not secrets: a code lets someone
answer the active question, but not see results or change anything.

### Validation and limits

- Every REST body and every socket message is parsed with a zod schema before it is used. Request
  bodies are limited to 64 KB and socket messages to 16 KB.
- Text fields have length limits, for example 280 characters for an open answer and 200 for a
  question. Invisible and direction-changing characters, broken characters and piles of stacked
  accents are removed from user text before it is stored, so nothing hidden or garbled reaches the
  projector.
- Answering is checked on the server: the question must be active, the answer must match the
  question's settings, and the participant must have answers left. The check and the insert run in
  one database transaction.

### Rate limits

- The REST API allows `OYLA_RATE_LIMIT_API_PER_MINUTE` requests per minute per client IP
  (default 600, shared by all API routes) and `OYLA_RATE_LIMIT_CREATE_PER_HOUR` new presentations
  per hour (default 10).
- Each Socket.IO connection has token buckets for join attempts, answers and presenter commands.
- Per client IP, across all its connections: at most 500 live connections and a limited rate of
  new ones (enough for a classroom behind one router), a limited number of wrong join codes, so
  codes can't be guessed by scanning, and at most 600 answers to any one question. IPv6 addresses
  are grouped by their /64 prefix.
- A question takes at most 2,000 answers and a presentation 20,000, and `OYLA_MAX_DB_MB` caps the
  database file, so a server open to the internet can't be filled up.
- Socket connections from pages on other sites are refused (the `Origin` must match the host).

Behind a reverse proxy, these limits only work per visitor when
[`OYLA_TRUST_PROXY`](/self-hosting/configuration/#oyla_trust_proxy) is set correctly.

### Browser protections

- Responses carry security headers from `@fastify/helmet`, including a Content Security Policy.
  It allows scripts, styles, fonts, images and connections from the same origin only (plus inline
  styles and `data:` images), blocks plugins and forbids embedding the app in frames.
- The web app is served by the same server as the API, so no CORS is needed or enabled.
- React escapes all text from participants and presenters; the app never inserts raw HTML.
- The app loads no third-party scripts, fonts or trackers.

### Data and retention

- The database holds presentation titles, questions, answers, each answer's participant id and
  timestamps. It stores no names, email addresses or IP addresses.
- The server's request log at the default `info` level contains client IP addresses, as Fastify
  logs every request. The `Authorization` header is redacted, and admin tokens and the create
  password are never logged.
- Presentations nobody has used for `OYLA_RETENTION_DAYS` days (default 30) are deleted
  automatically with all their questions and answers. Deleting a presentation by hand does the
  same right away.
- Open answers and word cloud entries appear on the presenter screen unmoderated. Moderation is on
  the [roadmap](/roadmap/).

## Advice for self-hosters

- **Use HTTPS.** Let your host terminate TLS (Railway and similar platforms do this for you) or put
  a reverse proxy such as Caddy or nginx in front of Oyla. See the
  [Docker page](/self-hosting/docker/#https-and-reverse-proxies).
- **Set `OYLA_TRUST_PROXY` to the number of proxies in front of Oyla**, and no higher. Too low and
  all visitors share the proxy's rate limit; too high and clients can spoof their address.
- **Keep the app port private behind a proxy**, for example `-p 127.0.0.1:3000:3000`, so nobody
  can bypass the proxy.
- **Consider `OYLA_CREATE_PASSWORD`** for an instance meant for your team or school. Participants
  still join with just the code.
- **Protect the data volume and its backups.** The database contains every answer people gave.
- **Decide on log retention.** Request logs contain IP addresses; keep them only as long as you
  need them.
- **Stay up to date.** Pull new versions and rebuild; database migrations run automatically.
