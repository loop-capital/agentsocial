declare module 'readable-stream' {
  export * from 'stream';
}

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: unknown;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
  }

  export type Algorithm =
    | 'HS256' | 'HS384' | 'HS512'
    | 'RS256' | 'RS384' | 'RS512'
    | 'ES256' | 'ES384' | 'ES512'
    | 'none';

  export interface SignOptions {
    algorithm?: Algorithm;
    expiresIn?: string | number;
    notBefore?: string | number;
    audience?: string | string[];
    issuer?: string;
    jwtid?: string;
    subject?: string;
    noTimestamp?: boolean;
    header?: Record<string, unknown>;
    keyid?: string;
    mutatePayload?: boolean;
    allowInsecureKeySizes?: boolean;
    allowInvalidAsymmetricKeyTypes?: boolean;
  }

  export interface VerifyOptions {
    algorithms?: Algorithm[];
    audience?: string | string[];
    issuer?: string | string[];
    jwtid?: string;
    ignoreExpiration?: boolean;
    ignoreNotBefore?: boolean;
    subject?: string;
    clockTimestamp?: number;
    maxAge?: string | number;
    clockTolerance?: number;
    complete?: boolean;
    allowInsecureKeySizes?: boolean;
    allowInvalidAsymmetricKeyTypes?: boolean;
  }

  export interface DecodeOptions {
    complete?: boolean;
    json?: boolean;
  }

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer | object,
    options?: SignOptions
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer | object,
    options?: VerifyOptions
  ): JwtPayload | string;
  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer | object,
    options: VerifyOptions & { complete: true }
  ): { header: Record<string, unknown>; payload: JwtPayload; signature: string };

  export function decode(
    token: string,
    options?: DecodeOptions
  ): null | JwtPayload | string | { header: Record<string, unknown>; payload: JwtPayload; signature: string };
}
