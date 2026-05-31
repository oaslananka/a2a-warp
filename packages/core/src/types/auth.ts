/**
 * @file auth.ts
 * Re-exports auth types from the core-types package.
 */

export type {
  AuthScheme,
  ApiKeyAuthScheme,
  ApiKeyCredential,
  ApiKeyCredentialSource,
  AuthValidationResult,
  BaseAuthScheme,
  HttpAuthScheme,
  OpenIdConnectAuthScheme,
  RequestContext,
  RequestIdempotencyContext,
} from '@oaslananka/a2a-warp-core';
