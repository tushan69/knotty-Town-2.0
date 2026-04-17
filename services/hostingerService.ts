import { apiUrl } from '../utils/apiUrl';

export interface HostingerAccount {
    id: string;
    domain: string;
    status: string;
    server_ip: string;
    plan_name: string;
}

export interface HostingerDomain {
    domain: string;
    status: string;
    expires_at: string;
}

export const hostingerService = {
    async call(path: string, method: string = 'GET', body?: any) {
        const url = apiUrl(`hostinger.php?path=${encodeURIComponent(path)}`);
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Token': localStorage.getItem('adminToken') || ''
            }
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || err.message || 'Hostinger API Request Failed');
        }
        return response.json();
    },

    async getAccounts(): Promise<HostingerAccount[]> {
        return this.call('hosting/accounts');
    },

    async getDomains(): Promise<HostingerDomain[]> {
        return this.call('domains');
    },

    async getUsage(accountId: string) {
        return this.call(`hosting/accounts/${accountId}/usage`);
    }
};
