---
title: Docker
description: Build the Oyla image, run it with a persistent volume, and put it behind HTTPS.
---

Oyla runs as one container: a Node.js process that serves the web app, the REST API and the live
Socket.IO connections, and stores everything in one SQLite file. It needs no database server and
no third-party account.

## Requirements

- Docker (or any runtime that builds a Dockerfile).
- A persistent volume for `/data`.
- If people reach it over the internet: HTTPS in front of the container, from your host or a
  reverse proxy.

One instance handles a hobby-sized audience, around 100 participants at the same time. Run exactly
one container per database: live presence and rate limits are kept in memory, so several replicas
would not see each other.

## Build and run

Clone the repository and build the image from its root:

```bash
git clone https://github.com/mftnakrsu/oyla.git
cd oyla
docker build -t oyla .
```

Run it with a named volume for the data:

```bash
docker run -d --name oyla -p 3000:3000 -v oyla-data:/data oyla
```

Open <http://localhost:3000>. To check that the server is up from the command line:

```bash
curl http://localhost:3000/api/health
# {"status":"ok"}
```

To let phones on the same network join, open Oyla by the network address of the machine that runs
it, for example `http://192.168.1.20:3000`, instead of `localhost`. The presenter screen shows the
address it was opened on, so that is what participants see and what the QR code points to.

## Where the data lives

Everything is in the SQLite database at `/data/oyla.db` inside the container, so in the
`oyla-data` volume in the example above. SQLite also keeps `oyla.db-wal` and `oyla.db-shm` next to
it while the server runs. The schema is created on first start and migrated automatically when you
update.

Without a volume the data disappears with the container, so always mount one.

To back up, stop the container and copy the volume's contents, for example:

```bash
docker stop oyla
docker run --rm -v oyla-data:/data -v "$PWD":/backup busybox \
  tar czf /backup/oyla-data.tgz -C /data .
docker start oyla
```

## About the image

- Multi-stage build on Node.js 24: the first stage installs dependencies and builds the web app
  and the server, the runtime stage keeps only what the server needs.
- Runs as a non-root user, which owns `/data`.
- Listens on port `3000` (`PORT`) and sets `OYLA_DB_PATH=/data/oyla.db`.
- A `HEALTHCHECK` requests `/api/health`; `docker ps` shows the container as `healthy` once it
  answers.
- Stops cleanly on `SIGTERM`, so `docker stop` closes the database properly.

## Configuration

Pass settings as environment variables with `-e`. For example, to require a password for creating
presentations:

```bash
docker run -d --name oyla -p 3000:3000 -v oyla-data:/data \
  -e OYLA_CREATE_PASSWORD='choose-a-long-password' \
  oyla
```

All variables are listed on the [configuration page](/self-hosting/configuration/). Oyla
doesn't read a `.env` file itself; use `--env-file` with `docker run` or `env_file` in Compose if
you prefer a file.

## Docker Compose

The repository includes a `docker-compose.yml` along these lines:

```yaml title="docker-compose.yml"
services:
  oyla:
    build: .
    image: oyla
    ports:
      - "3000:3000"
    volumes:
      - oyla-data:/data
    environment:
      # Behind a reverse proxy, set the number of proxies in front of Oyla.
      OYLA_TRUST_PROXY: "false"
      # Uncomment to require a password for creating presentations.
      # OYLA_CREATE_PASSWORD: change-me
    restart: unless-stopped

volumes:
  oyla-data:
```

```bash
docker compose up -d
```

## Update

Pull the new code, rebuild and replace the container. The volume keeps the data, and database
migrations run when the new container starts.

```bash
git pull
docker build -t oyla .
docker stop oyla && docker rm oyla
docker run -d --name oyla -p 3000:3000 -v oyla-data:/data oyla
```

With Compose: `git pull && docker compose up -d --build`.

## HTTPS and reverse proxies

Phones on a public network should reach Oyla over HTTPS. Most platforms terminate TLS for you
(see [Railway](/self-hosting/railway/)). On your own server, put a reverse proxy in front of
the container and keep these points in mind:

- The proxy must pass WebSocket upgrades through; the live connection uses Socket.IO on
  `/socket.io/`.
- Set `OYLA_TRUST_PROXY` to the number of proxies in front of Oyla, usually `true` (one).
  Otherwise every visitor seems to come from the proxy's address and they all share one rate
  limit. See [`OYLA_TRUST_PROXY`](/self-hosting/configuration/#oyla_trust_proxy).
- Publish the port on localhost only, so nobody can bypass the proxy:
  `-p 127.0.0.1:3000:3000`.

With [Caddy](https://caddyserver.com/), which gets certificates and proxies WebSockets
automatically:

```text title="Caddyfile"
oyla.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

With nginx, forward the upgrade headers:

```nginx
server {
  server_name oyla.example.com;
  # listen 443 ssl; and your certificate settings

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Without Docker

You need Node.js 24.

```bash
npm install
npm run build
npm start
```

The server listens on <http://localhost:3000> and stores data in `./data/oyla.db`. Use a process
manager such as systemd to keep it running, and set the same environment variables as above.
