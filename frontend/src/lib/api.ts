import { config } from '@/config/app.config';

const headers = new Headers();
headers.append('Authorization', 'Basic ' + btoa(`${config.auth.username}:${config.auth.password}`));

export const api = {
  fetch: (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': headers.get('Authorization')!
      }
    });
  }
}; 