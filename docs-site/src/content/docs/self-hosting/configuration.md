---
title: Configuration
description: Every environment variable Oyla reads, with defaults, and the limits that are built in.
---

Oyla is configured with environment variables only. It checks them at startup and refuses to start
when one is invalid, with a message that names the problem:

```text
Invalid configuration: OYLA_RETENTION_DAYS: must be a whole number
```

Oyla doesn't load a `.env` file on its own. Set the variables in your shell, with `docker run -e`
or `--env-file`, in Compose, or in your host's settings.

## All variables

| Variable | Default | What it does |
|---|---|---|
| [`PORT`](#port) | `3000` | HTTP port |
| [`HOST`](#host) | `0.0.0.0` | Address to listen on |
| [`OYLA_DB_PATH`](#oyla_db_path) | `./data/oyla.db` | SQLite file (`/data/oyla.db` in the Docker image) |
| [`OYLA_CREATE_PASSWORD`](#oyla_create_password) | unset | Password needed to create a presentation |
| [`OYLA_RETENTION_DAYS`](#oyla_retention_days) | `30` | Delete presentations unused for this many days; `0` keeps them |
| [`OYLA_TRUST_PROXY`](#oyla_trust_proxy) | `false` | Number of reverse proxies in front of Oyla |
| [`OYLA_WEB_DIST`](#oyla_web_dist) | `packages/web/dist` | Built web app to serve |
| [`OYLA_LOG_LEVEL`](#oyla_log_level) | `info` | Log level |
| [`OYLA_RATE_LIMIT_API_PER_MINUTE`](#oyla_rate_limit_api_per_minute) | `600` | API requests per minute per client IP |
| [`OYLA_RATE_LIMIT_CREATE_PER_HOUR`](#oyla_rate_limit_create_per_hour) | `30` | New presentations per hour per client IP |

## `PORT`

The HTTP port, a whole number from 0 to 65535. Default `3000`. The web app, the API and the
Socket.IO connections all share this port. Platforms such as Railway set it for you.

## `HOST`

The address to listen on. Default `0.0.0.0`, which accepts connections on every network
interface. Use `127.0.0.1` to accept local connections only, for example when a reverse proxy on
the same machine is the only way in.

## `OYLA_DB_PATH`

Path of the SQLite database file. Default `./data/oyla.db`, relative to the working directory; the
Docker image sets `/data/oyla.db`. Oyla creates the folder if it doesn't exist and applies database
migrations on startup.

`:memory:` keeps the database in memory, which the tests use. Everything is lost when the process
stops.

## `OYLA_CREATE_PASSWORD`

When set, creating a presentation requires this password; the **New presentation** form then shows
a **Server password** field. Joining, answering and editing with an admin link never need it. An
empty value counts as unset.

Use it for a private instance on a public address. The comparison runs in constant time and the
password is never logged. Keep it at most 200 characters, the longest password the API accepts.

## `OYLA_RETENTION_DAYS`

Presentations that nobody used for this many days are deleted, with their questions and answers.
Default `30`. `0` keeps presentations forever.

Opening a presentation in the editor, editing it, presenting it, and participants joining or
answering all count as use. The cleanup runs when the server starts and then every hour. Connected
phones of a deleted presentation see **This presentation has ended**.

## `OYLA_TRUST_PROXY`

How many reverse proxies sit in front of Oyla. Accepts `false` (0, the default), `true` (1) or a
single digit from `0` to `9`.

Oyla uses the client's IP address for rate limits and for the cap on connections per address.
Behind a proxy, every request arrives from the proxy's address, so without this setting all your
visitors share one rate limit. With it, Oyla reads the client address from the `X-Forwarded-For`
header, counting the given number of entries from the right, where your own proxies wrote them.

| Setup | Value |
|---|---|
| Container port published directly to the internet | `false` |
| One reverse proxy (Caddy, nginx, Traefik) or a platform such as Railway | `true` |
| Two proxies, for example a CDN in front of nginx | `2` |

:::caution
Don't set a higher number than you have proxies. Clients can write anything into the left part of
`X-Forwarded-For`, and trusting too many entries lets them pick the address that rate limits apply
to.
:::

## `OYLA_WEB_DIST`

Folder of the built web app, the output of `npm run build` in `packages/web`. Default
`packages/web/dist`, resolved relative to the server package. You only need this when you move the
build somewhere else.

If the folder has no `index.html`, Oyla serves the API only and logs
`No built web app found; serving the API only`. That is expected during `npm run dev` on a fresh
checkout, where Vite serves the web app on port 5173.

## `OYLA_LOG_LEVEL`

One of `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`. Default `info`. Logs are
JSON lines on standard output. The `Authorization` header is redacted, and admin tokens and the
create password never appear in logs.

## `OYLA_RATE_LIMIT_API_PER_MINUTE`

Requests per minute per client IP for the REST API. Default `600`. It applies to every `/api` route
except `/api/health` and creating a presentation, which has its own limit. A client over the limit
gets HTTP 429 and the web app shows **Too many requests. Wait a moment and try again.**

## `OYLA_RATE_LIMIT_CREATE_PER_HOUR`

New presentations per hour per client IP. Default `30`. Lower it on a public instance if you see
abuse, or set `OYLA_CREATE_PASSWORD`.

## Built-in limits

These limits are part of the code and not configurable.

| Limit | Value |
|---|---|
| REST request body | 64 KB |
| Socket.IO message | 16 KB |
| Live connections per client IP | 500 (generous, because a classroom often shares one public IP) |
| Join attempts per connection | 5 at once, then one every 2 seconds |
| Answers per connection | 10 at once, then one per second |
| Presenter commands per connection | 20 at once, then 5 per second |
| Results updates sent to the presenter | at most one every 250 ms per question |

Content limits such as 50 questions per presentation and 2,000 answers per question are listed on
the [question types page](/oyla/guide/question-types/#limits-for-every-type).
