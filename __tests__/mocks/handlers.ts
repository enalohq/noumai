/**
 * MSW Handlers - Mock Service Worker request handlers
 * Provides centralized HTTP mocking for tests
 */

import { http, HttpResponse } from 'msw';

export const handlers = [
  // Competitor discovery endpoint
  http.post('/api/competitors/discover', async ({ request }) => {
    const body = await request.json() as any;

    if (!body.brandName) {
      return HttpResponse.json(
        { error: 'brandName is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      competitors: [],
      meta: {
        total: 0,
        sources: [],
      },
    });
  }),

  // Metadata scraping endpoint
  http.post('/api/scrape-metadata', async ({ request }) => {
    const body = await request.json() as any;

    if (!body.url) {
      return HttpResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      title: 'Test Page',
      description: 'Test description',
      image: 'https://example.com/image.jpg',
    });
  }),

  // Onboarding endpoint
  http.post('/api/onboarding', async ({ request }) => {
    const body = await request.json() as any;

    if (!body.brandName) {
      return HttpResponse.json(
        { error: 'brandName is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      workspaceId: 'workspace-123',
    });
  }),
];
