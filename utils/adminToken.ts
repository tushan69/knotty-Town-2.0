/** Admin API token from login; never hardcode in the client for production builds. */
export function getAdminApiToken(): string {
  return (
    sessionStorage.getItem('knotty_admin_token') ||
    localStorage.getItem('knotty_admin_token') ||
    ''
  );
}
