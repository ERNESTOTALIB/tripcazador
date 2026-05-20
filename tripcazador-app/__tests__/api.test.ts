/**
 * API client tests — verifica que las URL se construyen correctamente
 * y que errores de red devuelven el shape ApiResult esperado.
 *
 * No tocamos red real — mock global fetch.
 */

import { getDeals, subscribeNewsletter, startCheckout } from '../src/lib/api';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('api.getDeals', () => {
  it('returns data on 200', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockJsonResponse({ deals: [] }));
    const res = await getDeals({ limit: 10 });
    expect(res.status).toBe(200);
    expect(res.data?.deals).toEqual([]);
    expect(res.error).toBeNull();
  });

  it('builds query string from params', async () => {
    const fetchMock = jest.fn().mockResolvedValue(mockJsonResponse({ deals: [] }));
    global.fetch = fetchMock;
    await getDeals({ limit: 5, origin: 'MAD' });
    const call = fetchMock.mock.calls[0][0] as string;
    expect(call).toContain('/api/deals?');
    expect(call).toContain('limit=5');
    expect(call).toContain('origin=MAD');
  });

  it('returns error on network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));
    const res = await getDeals();
    expect(res.error).toBe('network');
    expect(res.data).toBeNull();
  });
});

describe('api.subscribeNewsletter', () => {
  it('sends consent:true by default', async () => {
    const fetchMock = jest.fn().mockResolvedValue(mockJsonResponse({ ok: true, created: true }, 201));
    global.fetch = fetchMock;
    await subscribeNewsletter({ email: 'a@b.com' });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.consent).toBe(true);
    expect(body.email).toBe('a@b.com');
    expect(body.source).toBe('mobile_app');
  });
});

describe('api.startCheckout', () => {
  it('passes cycle in body', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(mockJsonResponse({ url: 'https://stripe.checkout', id: 'cs_x' }));
    global.fetch = fetchMock;
    const res = await startCheckout({ email: 'a@b.com', cycle: 'annual' });
    expect(res.data?.url).toMatch(/stripe/);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.cycle).toBe('annual');
  });
});
