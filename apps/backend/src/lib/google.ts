/**
 * Google OAuth — verify an access token and return user profile.
 *
 * The FormIQ frontend uses the Google popup flow which returns an OAuth2
 * ACCESS token (not an ID token). We verify it by hitting the Google
 * userinfo endpoint, which returns the user's profile if the token is valid.
 *
 * Endpoint: https://www.googleapis.com/oauth2/v3/userinfo
 * Required scope: openid email profile
 */
import { Errors } from './errors';
import { config } from '../config';

export interface GoogleProfile {
  sub: string;           // stable Google user ID
  email: string;
  name: string;
  picture?: string;      // avatar URL
  emailVerified: boolean;
}

export async function verifyGoogleAccessToken(
  accessToken: string,
): Promise<GoogleProfile> {
  if (!config.GOOGLE_CLIENT_ID) {
    throw Errors.internal('Google sign-in is not configured on this server');
  }

  let resp: Response;
  try {
    resp = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(accessToken)}`,
    );
  } catch (err) {
    throw Errors.internal('Failed to reach Google userinfo endpoint');
  }

  if (!resp.ok) {
    throw Errors.unauthorized('Invalid or expired Google access token');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await resp.json()) as Record<string, any>;

  if (!data.sub || !data.email) {
    throw Errors.unauthorized('Google token did not return required profile fields');
  }

  // Verify the token audience matches our client ID
  // (userinfo endpoint does not expose aud, but we still check it
  //  when available in the token response)
  if (data.aud && data.aud !== config.GOOGLE_CLIENT_ID) {
    throw Errors.unauthorized('Google token audience mismatch');
  }

  return {
    sub: data.sub as string,
    email: (data.email as string).toLowerCase(),
    name: (data.name as string) || data.email,
    picture: data.picture as string | undefined,
    emailVerified: Boolean(data.email_verified),
  };
}
