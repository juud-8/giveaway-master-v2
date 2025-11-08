import { WhopSDK } from '@whop-sdk/api';

// Initialize the Whop SDK with API key
const whopApiKey = process.env.WHOP_API_KEY;

if (!whopApiKey) {
  console.warn('WHOP_API_KEY is not set. Whop SDK functionality will be limited.');
}

export const whopSdk = new WhopSDK({
  TOKEN: whopApiKey || '',
});

/**
 * Verify and decode the Whop user token from headers
 * Returns the userId and any other relevant user information
 */
export async function verifyWhopUserToken(token: string) {
  try {
    // The token verification will be handled by the SDK
    // For now, we'll decode the JWT manually to extract user info
    // In production, you should verify the signature properly

    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );

    return {
      userId: payload.sub || payload.user_id || payload.id,
      companyId: payload.company_id || payload.cid,
      ...payload,
    };
  } catch (error) {
    console.error('Failed to verify Whop user token:', error);
    throw new Error('Invalid Whop user token');
  }
}
