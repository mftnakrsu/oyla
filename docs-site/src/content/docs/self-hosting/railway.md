---
title: Railway
description: Deploy Oyla on Railway with a persistent volume and your own domain.
---

[Railway](https://railway.com) builds the Dockerfile straight from GitHub, gives you HTTPS and
WebSockets out of the box and can attach a persistent volume. The public instance at
`oyla.mefby.com` runs this way. Expect to pay about $5 per month on Railway's Hobby plan.

## Before you start

- A Railway account.
- The Oyla repository in a GitHub account that Railway can access. A fork of
  `mftnakrsu/oyla` works and lets you decide when to take updates.
- For a custom domain: access to your domain's DNS settings.

## 1. Create the service

1. In Railway, create a new project and choose **Deploy from GitHub repo**.
2. Pick the Oyla repository.

Railway finds the `Dockerfile` and builds it. The `railway.json` in the repository tells Railway to
use the Dockerfile and sets the healthcheck path to `/api/health`, so a deploy only goes live once
the server answers.

You don't need to set `PORT`: Railway provides it and Oyla listens on it.

## 2. Add a volume

Without a volume, every deploy starts with an empty database.

1. Add a **Volume** to the Oyla service.
2. Set the mount path to `/data`.

The image stores its database at `/data/oyla.db`, so nothing else needs to change.

## 3. Set the variables

In the service's **Variables** tab, add:

| Variable | Value | Why |
|---|---|---|
| `OYLA_TRUST_PROXY` | `true` | Railway's proxy sits in front of Oyla. This makes rate limits use each visitor's address instead of the proxy's. |
| `OYLA_CREATE_PASSWORD` | a long password | Optional. Only people who know it can create presentations. Joining stays open. |

Variable changes take effect with the next deploy; deploy the changes when Railway offers it.

You don't need `RAILWAY_RUN_UID`. Railway mounts volumes owned by root; the image's entrypoint
hands `/data` to its unprivileged `node` user at start and runs the server as that user.

## 4. Add your domain

Railway can generate a `*.up.railway.app` address, which is handy for a first test. For your own
domain, for example `oyla.mefby.com`:

1. Open the service's **Settings** and go to **Networking**.
2. Add a custom domain and enter the host name.
3. Railway shows a CNAME record. Create that record at your DNS provider: the name is the
   subdomain (`oyla`), the value is the target Railway shows.
4. Wait until Railway shows the domain as active. It issues the HTTPS certificate on its own.

The presenter screen shows whichever host it is opened on, so open it on your custom domain to
have that domain in **Go to … and enter …** and in the QR code.

## 5. Check the deployment

- `https://your-domain/api/health` answers `{"status":"ok"}`.
- Create a presentation, open the presenter screen, and join from your phone over mobile data
  rather than the same Wi-Fi, so you test the public path.
- Redeploy once and confirm the presentation is still there. If it's gone, the volume isn't mounted
  at `/data`.

## Updates

Railway redeploys when the connected branch changes. With a fork, sync it with the original
repository to get a new version. The data stays on the volume, and database migrations run when
the new version starts.

## Other hosts

Railway is one option. Oyla runs on any host that:

- builds or runs a Docker image (or Node.js 24),
- supports WebSockets, and
- offers a persistent disk for `/data`.

Fly.io, Render, a small VPS with Docker and a home server behind a reverse proxy all fit. Whatever
you pick, run a single instance, give it HTTPS, and set
[`OYLA_TRUST_PROXY`](/oyla/self-hosting/configuration/#oyla_trust_proxy) to the number of proxies
in front of it. The [Docker page](/oyla/self-hosting/docker/) has reverse proxy examples.
