import axios from 'axios';

const WHOP_API_BASE = 'https://api.whop.com/api/v1';
const API_KEY = process.env.WHOP_API_KEY;

const whopClient = axios.create({
  baseURL: WHOP_API_BASE,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface WhopCompany {
  id: string;
  name: string;
  role?: string;
}

export interface WhopMember {
  id: string;
  name: string;
  email: string;
}

export async function getCompanyDetails(companyId: string): Promise<WhopCompany> {
  try {
    const response = await whopClient.get(`/companies/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get company details:', error);
    throw error;
  }
}

export async function getCompanyMembers(companyId: string): Promise<WhopMember[]> {
  try {
    const response = await whopClient.get(`/companies/${companyId}/members`);
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to get company members:', error);
    throw error;
  }
}

export async function getWhopUserContext(token: string) {
  try {
    const response = await axios.get(`${WHOP_API_BASE}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get user context:', error);
    throw error;
  }
}

export { whopClient };
