import { APIRequestContext, expect } from '@playwright/test';

export class BaseApi {
  constructor(protected request: APIRequestContext) {}

  baseUrl = process.env.BASE_URL || '';

  async post(endpoint: string, data: object, headers: any = {}) {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    const response = await this.request.post(fullUrl, {
      data,
      headers,
    });

    expect(response.ok(), `request to ${endpoint} failed with status ${response.status()}`).toBeTruthy();

    return await response.json();
  }
}
