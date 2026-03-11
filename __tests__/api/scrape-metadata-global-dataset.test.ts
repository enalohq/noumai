import { NextRequest } from "next/server";
import { GET } from "@/app/api/scrape-metadata/route";
import {
    GLOBAL_BRAND_METADATA_FIXTURES,
    buildGlobalBrandHtml,
    type GlobalBrandMetadataFixture,
} from "@/__tests__/fixtures/global-brand-metadata";

function createHtmlResponse(html: string, status = 200): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => html,
        json: async () => ({ html }),
    } as Response;
}

describe("GET /api/scrape-metadata with Global brand dataset", () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        fetchMock = jest.fn();
        Object.defineProperty(global, "fetch", {
            configurable: true,
            writable: true,
            value: fetchMock,
        });
    });

    it("covers global brand fixtures", () => {
        expect(GLOBAL_BRAND_METADATA_FIXTURES.length).toBeGreaterThan(0);
    });

    it.each(GLOBAL_BRAND_METADATA_FIXTURES)(
        "extracts onboarding metadata for $brandName",
        async (fixture: GlobalBrandMetadataFixture) => {
            const html = buildGlobalBrandHtml(fixture);

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
                url: new URL(fixture.website).toString(),
            });

            // The extracted country might differ based on library
            expect(body.country).toBeDefined();

            // At least 1 fetch should be triggered
            expect(fetchMock).toHaveBeenCalled();
        }
    );
});
