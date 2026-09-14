/**
 * OpenStreetMap (OSM) Service & OAuth 2.0 Integration
 * 
 * Provides utilities for:
 * 1. OpenStreetMap OAuth 2.0 Authorization & Token Exchange
 * 2. Client Credentials verification against OSM servers
 * 3. User Details retrieval via OSM API v0.6
 * 4. Nominatim geocoding & place search
 */

export const OSM_CONFIG = {
  clientId: process.env.OSM_CLIENT_ID || process.env.NEXT_PUBLIC_OSM_CLIENT_ID || '',
  clientSecret: process.env.OSM_CLIENT_SECRET || '',
  authorizeUrl: 'https://www.openstreetmap.org/oauth2/authorize',
  tokenUrl: 'https://www.openstreetmap.org/oauth2/token',
  apiBase: 'https://api.openstreetmap.org/api/0.6',
  nominatimBase: 'https://nominatim.openstreetmap.org',
  userAgent: 'NaviiGo/1.0 (travel-app; contact@naviigo.com)',
};

export interface OsmTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  created_at: number;
}

export interface OsmVerificationResult {
  valid: boolean;
  statusCode: number;
  clientIdPreview: string;
  message: string;
  error?: string;
}

/**
 * Generate OAuth 2.0 Authorization URL for OpenStreetMap.
 */
export function getOsmAuthUrl({
  redirectUri,
  state,
  scopes = ['read_prefs'],
}: {
  redirectUri: string;
  state?: string;
  scopes?: string[];
}): string {
  const clientId = OSM_CONFIG.clientId;
  if (!clientId) {
    throw new Error('OSM_CLIENT_ID is not configured.');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
  });

  if (state) {
    params.set('state', state);
  }

  return `${OSM_CONFIG.authorizeUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for an OpenStreetMap access token.
 */
export async function exchangeOsmCodeForToken({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}): Promise<OsmTokenResponse> {
  const { clientId, clientSecret, tokenUrl } = OSM_CONFIG;

  if (!clientId || !clientSecret) {
    throw new Error('OSM_CLIENT_ID or OSM_CLIENT_SECRET is missing.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': OSM_CONFIG.userAgent,
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || `HTTP ${response.status}`);
  }

  return data as OsmTokenResponse;
}

/**
 * Fetch authenticated user details from OSM API v0.6.
 */
export async function getOsmUserDetails(accessToken: string) {
  const response = await fetch(`${OSM_CONFIG.apiBase}/user/details.json`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': OSM_CONFIG.userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch OSM user details: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Programmatically verify OSM Client Credentials against OpenStreetMap OAuth 2.0 server.
 * 
 * OpenStreetMap uses Doorkeeper. If the client credentials (client_id / client_secret) are invalid,
 * the server responds with HTTP 401 and error: "invalid_client".
 * If the credentials are valid, the server accepts client auth and returns HTTP 400 with "invalid_grant"
 * because the dummy test grant code is intentionally not an issued authorization code.
 */
export async function verifyOsmCredentials(): Promise<OsmVerificationResult> {
  const { clientId, clientSecret, tokenUrl } = OSM_CONFIG;

  if (!clientId || !clientSecret) {
    return {
      valid: false,
      statusCode: 0,
      clientIdPreview: '',
      message: 'OSM_CLIENT_ID or OSM_CLIENT_SECRET is not set in environment.',
      error: 'missing_credentials',
    };
  }

  const clientIdPreview = `${clientId.substring(0, 8)}...${clientId.substring(clientId.length - 4)}`;

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: '__verification_probe__',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: 'http://localhost:3000/api/osm/callback',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': OSM_CONFIG.userAgent,
      },
      body: body.toString(),
    });

    const data = await response.json().catch(() => ({}));

    // If client credentials are bad, OSM returns HTTP 401 invalid_client
    if (response.status === 401 || data.error === 'invalid_client') {
      return {
        valid: false,
        statusCode: response.status,
        clientIdPreview,
        message: 'OpenStreetMap rejected client authentication: Invalid Client ID or Secret.',
        error: data.error_description || data.error,
      };
    }

    // If client credentials are good, OSM authenticates the client and fails on the dummy code with 400 invalid_grant
    if (data.error === 'invalid_grant' || (response.status === 400 && data.error)) {
      return {
        valid: true,
        statusCode: 200,
        clientIdPreview,
        message: 'OpenStreetMap client credentials verified successfully with openstreetmap.org servers.',
      };
    }

    // Any other 2xx or valid response
    if (response.ok) {
      return {
        valid: true,
        statusCode: 200,
        clientIdPreview,
        message: 'OpenStreetMap credentials verified.',
      };
    }

    return {
      valid: false,
      statusCode: response.status,
      clientIdPreview,
      message: `Unexpected response from OpenStreetMap OAuth server: HTTP ${response.status}`,
      error: JSON.stringify(data),
    };
  } catch (err: any) {
    return {
      valid: false,
      statusCode: 500,
      clientIdPreview,
      message: `Failed to connect to OpenStreetMap servers: ${err.message}`,
      error: err.message,
    };
  }
}
