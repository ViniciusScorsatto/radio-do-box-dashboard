import * as oidc from "openid-client";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomBytes } from "node:crypto";
export const token = () => randomBytes(32).toString("base64url");
export const cookie = (name, value, age) =>
  `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
export const cookies = (request) =>
  Object.fromEntries(
    (request.headers.cookie || "")
      .split(";")
      .map((part) => part.trim().split("=")),
  );
export function configuration(env = process.env) {
  for (const key of [
    "PUBLIC_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "ALLOWED_EMAILS",
    "APP_DATA_DIR",
  ])
    if (!env[key]) throw new Error(`Missing ${key}`);
  const url = new URL(env.PUBLIC_URL);
  if (
    url.protocol !== "https:" ||
    url.origin !== env.PUBLIC_URL ||
    url.username ||
    url.password
  )
    throw new Error("PUBLIC_URL must be an exact HTTPS origin");
  const emails = env.ALLOWED_EMAILS.split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  if (
    !emails.length ||
    emails.length > 2 ||
    emails.some((v) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
  )
    throw new Error("Configure one or two ALLOWED_EMAILS");
  if (!env.APP_DATA_DIR.startsWith("/"))
    throw new Error("APP_DATA_DIR must be absolute");
  return {
    origin: url.origin,
    emails,
    clientId: env.GOOGLE_CLIENT_ID,
    secret: env.GOOGLE_CLIENT_SECRET,
  };
}
export const authorizedClaims = (claims, emails) =>
  claims.email_verified === true &&
  typeof claims.email === "string" &&
  emails.includes(claims.email.toLowerCase());
export function createAuth(config, store) {
  let discovery;
  const getConfig = () =>
    (discovery ??= oidc
      .discovery(
        new URL("https://accounts.google.com"),
        config.clientId,
        config.secret,
      )
      .catch((error) => {
        discovery = undefined;
        throw error;
      }));
  const jwks = createRemoteJWKSet(
    new URL("https://www.googleapis.com/oauth2/v3/certs"),
  );
  return {
    async start(response) {
      const client = await getConfig();
      const binding = token();
      const state = oidc.randomState();
      const nonce = token();
      const verifier = oidc.randomPKCECodeVerifier();
      store.addOAuth(binding, { state, nonce, verifier });
      const url = oidc.buildAuthorizationUrl(client, {
        redirect_uri: `${config.origin}/auth/google/callback`,
        scope: "openid email",
        state,
        nonce,
        code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
        code_challenge_method: "S256",
        prompt: "select_account",
      });
      response.writeHead(302, {
        location: url.href,
        "set-cookie": cookie("__Host-oauth", binding, 600),
      });
      response.end();
    },
    async callback(request, response, url) {
      const saved = store.consumeOAuth(cookies(request)["__Host-oauth"] || "");
      if (!saved) throw new Error("oauth_state_missing");
      const tokens = await oidc.authorizationCodeGrant(await getConfig(), url, {
        pkceCodeVerifier: saved.verifier,
        expectedState: saved.state,
        expectedNonce: saved.nonce,
        idTokenExpected: true,
      });
      const { payload } = await jwtVerify(tokens.id_token, jwks, {
        issuer: "https://accounts.google.com",
        audience: config.clientId,
        requiredClaims: ["exp", "iat", "sub", "nonce"],
      });
      if (
        payload.nonce !== saved.nonce ||
        !authorizedClaims(payload, config.emails)
      )
        throw new Error("account_denied");
      const session = token();
      store.addSession(session, payload.email.toLowerCase());
      response.writeHead(302, {
        location: "/",
        "set-cookie": [
          cookie("__Host-session", session, 604800),
          cookie("__Host-oauth", "", 0),
        ],
      });
      response.end();
    },
    session(request) {
      const session = store.session(cookies(request)["__Host-session"] || "");
      return session && config.emails.includes(session.email) ? session : null;
    },
  };
}
