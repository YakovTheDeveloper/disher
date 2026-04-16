const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
export const API_BASE = `${protocol}://${window.location.hostname}:3100`;
