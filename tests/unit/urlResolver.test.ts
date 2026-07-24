import { getBaseUrl } from '../../src/lib/urlResolver';

describe('getBaseUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('1. Use an explicitly configured application URL when present (APP_URL)', () => {
    process.env.APP_URL = 'https://custom-app.com';
    expect(getBaseUrl()).toBe('https://custom-app.com');
  });

  it('1. Use an explicitly configured application URL when present (NEXT_PUBLIC_API_BASE_URL)', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.custom-app.com';
    expect(getBaseUrl()).toBe('https://api.custom-app.com');
  });

  it('2. Otherwise use https://${process.env.VERCEL_URL} on Vercel', () => {
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    process.env.VERCEL_URL = 'my-preview.vercel.app';
    expect(getBaseUrl()).toBe('https://my-preview.vercel.app');
  });

  it('3. Permit http://localhost:3000 only when explicitly allowed (development)', () => {
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.VERCEL_URL;
    process.env.NODE_ENV = 'development';
    process.env.VERCEL_ENV = 'development';

    expect(getBaseUrl()).toBe('http://localhost:3000');
  });

  it('4. In Production or Preview, fail closed when no valid deployment URL exists', () => {
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.VERCEL_URL;
    
    // Simulate Vercel production missing VERCEL_URL somehow
    process.env.NODE_ENV = 'production';
    
    expect(() => getBaseUrl()).toThrow('SERVER_URL_RESOLUTION_FAILED');
  });
});
