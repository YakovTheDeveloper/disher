-- B1 — better-auth tables (greenfield).
--
-- Targets a blank Postgres DB (e.g. disher_dev). Creates the four better-auth
-- tables (users, session, account, verification). User-domain tables live in
-- a separate migration — see 20260509120000_zero_base_schema.sql.
--
-- No RLS, no policies, no auth schema. Backend uses a direct pg.Pool with the
-- DB owner; protected routes verify a bearer token via auth.api.getSession.

begin;

create extension if not exists pgcrypto;

create table "users" (
  "id"            uuid default pg_catalog.gen_random_uuid() not null primary key,
  "name"          text not null,
  "email"         text not null unique,
  "emailVerified" boolean not null,
  "image"         text,
  "createdAt"     timestamptz default current_timestamp not null,
  "updatedAt"     timestamptz default current_timestamp not null
);

create table "session" (
  "id"        uuid default pg_catalog.gen_random_uuid() not null primary key,
  "expiresAt" timestamptz not null,
  "token"     text not null unique,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId"    uuid not null references "users" ("id") on delete cascade
);

create table "account" (
  "id"                     uuid default pg_catalog.gen_random_uuid() not null primary key,
  "accountId"              text not null,
  "providerId"             text not null,
  "userId"                 uuid not null references "users" ("id") on delete cascade,
  "accessToken"            text,
  "refreshToken"           text,
  "idToken"                text,
  "accessTokenExpiresAt"   timestamptz,
  "refreshTokenExpiresAt"  timestamptz,
  "scope"                  text,
  "password"               text,
  "createdAt"              timestamptz default current_timestamp not null,
  "updatedAt"              timestamptz not null
);

create table "verification" (
  "id"         uuid default pg_catalog.gen_random_uuid() not null primary key,
  "identifier" text not null,
  "value"      text not null,
  "expiresAt"  timestamptz not null,
  "createdAt"  timestamptz default current_timestamp not null,
  "updatedAt"  timestamptz default current_timestamp not null
);

create index "session_userId_idx"               on "session"      ("userId");
create index "account_userId_idx"               on "account"      ("userId");
create index "verification_identifier_idx"      on "verification" ("identifier");

commit;
