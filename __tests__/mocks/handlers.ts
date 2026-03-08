/**
 * MSW Request Handlers
 * Defines mock API responses for testing
 */

import { http, HttpResponse } from 'msw';

export const handlers = [
  // Onboarding API - GET
  http.get('/api/onboarding', () => {
    return HttpResponse.json({
      onboardingCompleted: false,
      currentStep: 1,
      suggestedPrompts: [],
      savedStarterPrompts: [],
      workspace: null,
    });
  }),

  // Onboarding API - PATCH
  http.patch('/api/onboarding', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true });
  }),

  // Competitor Discovery API
  http.post('/api/competitors/discover', () => {
    return HttpResponse.json({
      competitors: [],
    });
  }),

  // Scrape Metadata API
  http.post('/api/scrape-metadata', () => {
    return HttpResponse.json({
      title: 'Test Page',
      description: 'Test description',
    });
  }),
];
