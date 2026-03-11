import { NextRequest } from "next/server";
import { GET } from "@/app/api/scrape-metadata/route";

function createHtmlResponse(html: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => html,
    json: async () => ({ html }),
  } as Response;
}

describe("GET /api/scrape-metadata route hardening", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });
  });

  it("uses the first successful HTML response for social handles and country without an unnecessary refetch", async () => {
    fetchMock.mockResolvedValueOnce(
      createHtmlResponse(`
        <html>
          <head>
            <meta property="og:site_name" content="Acme India" />
            <meta name="twitter:site" content="@acmeindia" />
          </head>
          <body>
            <p>Headquarters: Bengaluru, Karnataka, India 560001</p>
            <a href="https://www.linkedin.com/company/acme-india">LinkedIn</a>
          </body>
        </html>
      `)
    );

    const response = await GET(
      new NextRequest("http://localhost:3000/api/scrape-metadata?url=https://acme.example")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      brandName: "Acme India",
      twitterHandle: "acmeindia",
      linkedinHandle: "https://www.linkedin.com/company/acme-india",
      country: "India",
      url: "https://acme.example/",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses alternative-header HTML when the first response is bot-blocked", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createHtmlResponse(`
          <html>
            <body>
              <h1>Access denied</h1>
              <p>Please verify you are a human</p>
            </body>
          </html>
        `)
      )
      .mockResolvedValueOnce(
        createHtmlResponse(`
          <html>
            <head>
              <meta property="og:site_name" content="Battle Tested Brand" />
              <meta name="twitter:site" content="@btestedbrand" />
            </head>
            <body>
              <p>Office: Mumbai, Maharashtra, India 400001</p>
              <a href="https://www.linkedin.com/company/battle-tested-brand">LinkedIn</a>
            </body>
          </html>
        `)
      );

    const response = await GET(
      new NextRequest("http://localhost:3000/api/scrape-metadata?url=https://battle.example")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      brandName: "Battle Tested Brand",
      twitterHandle: "btestedbrand",
      linkedinHandle: "https://www.linkedin.com/company/battle-tested-brand",
      country: "India",
      url: "https://battle.example/",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to the provider chain only for fields missing from the first HTML response", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createHtmlResponse(`
          <html>
            <head>
              <meta property="og:site_name" content="Fallback Brand" />
            </head>
            <body>
              <p>Office: Pune, Maharashtra, India 411001</p>
            </body>
          </html>
        `)
      )
      .mockResolvedValueOnce(
        createHtmlResponse(`
          <html>
            <head>
              <meta property="og:site_name" content="Fallback Brand" />
              <meta name="twitter:site" content="@fallbackbrand" />
            </head>
            <body>
              <a href="https://www.linkedin.com/company/fallback-brand">LinkedIn</a>
            </body>
          </html>
        `)
      );

    const response = await GET(
      new NextRequest("http://localhost:3000/api/scrape-metadata?url=https://fallback.example")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      brandName: "Fallback Brand",
      twitterHandle: "fallbackbrand",
      linkedinHandle: "https://www.linkedin.com/company/fallback-brand",
      country: "India",
      url: "https://fallback.example/",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
