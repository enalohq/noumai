import { NextRequest } from "next/server";
import { GET } from "@/app/api/scrape-metadata/route";
import {
  INDIAN_BRAND_METADATA_FIXTURES,
  buildIndianBrandHtml,
  type IndianBrandMetadataFixture,
} from "@/__tests__/fixtures/indian-brand-metadata";

function createHtmlResponse(html: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => html,
    json: async () => ({ html }),
  } as Response;
}

describe("GET /api/scrape-metadata with Indian brand dataset", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });
  });

  it("covers 50 Indian brand fixtures", () => {
    expect(INDIAN_BRAND_METADATA_FIXTURES).toHaveLength(50);
  });

  it.each(INDIAN_BRAND_METADATA_FIXTURES)(
    "extracts onboarding metadata for $brandName",
    async (fixture: IndianBrandMetadataFixture) => {
      const html = buildIndianBrandHtml(fixture);

      fetchMock
        .mockResolvedValueOnce(createHtmlResponse(html))
        .mockResolvedValueOnce(createHtmlResponse(html));

      const request = new NextRequest(
        `http://localhost:3000/api/scrape-metadata?url=${encodeURIComponent(fixture.website)}`
      );

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        brandName: fixture.brandName,
        twitterHandle: fixture.twitterHandle.toLowerCase(),
        linkedinHandle: fixture.linkedinHandle,
        country: fixture.country,
        url: new URL(fixture.website).toString(),
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  );
});
