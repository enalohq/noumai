import React from "react";
import { render, screen } from "@testing-library/react";
import { AeoAuditTab } from "@/components/dashboard/menu/aeo-audit-tab";
import type { AuditReport } from "@/components/dashboard/types";

const mockReport: AuditReport = {
  url: "https://example.com",
  score: 85,
  checks: [],
  llmsTxtPresent: true,
  schemaMentions: 1,
  blufDensity: 2,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  pass: {
    llmsTxt: true,
    schema: true,
    bluf: false,
  },
};

describe("AeoAuditTab", () => {
  it("renders safe placeholder when there is no report", () => {
    // Tests fix for "Cannot read properties of undefined (reading 'length')"
    render(
      <AeoAuditTab
        brandWebsite="https://example.com"
        auditReport={null}
        history={undefined}
        onRunAudit={jest.fn()}
        onSelectAudit={jest.fn()}
        busy={false}
        demoMode={false}
      />
    );

    // It should state that there is no report for this website
    expect(screen.getByText(/No Audit Data Found/i)).toBeInTheDocument();
  });

  it("renders when history is correctly formatted as an empty array", () => {
    render(
      <AeoAuditTab
        brandWebsite="https://example.com"
        auditReport={null}
        history={[]}
        onRunAudit={jest.fn()}
        onSelectAudit={jest.fn()}
        busy={false}
        demoMode={false}
      />
    );

    expect(screen.getByText(/No Audit Data Found/i)).toBeInTheDocument();
  });

  it("displays the Last scanned timestamp using the mocked getTimeAgo", () => {
    render(
      <AeoAuditTab
        brandWebsite="https://example.com"
        auditReport={mockReport}
        history={[mockReport]}
        onRunAudit={jest.fn()}
        onSelectAudit={jest.fn()}
        busy={false}
        demoMode={false}
      />
    );

    // We use a regex match on the container or element text just in case it is split
    const elements = screen.getAllByText(/Last scanned/i);
    expect(elements).toHaveLength(1);
    expect(elements[0]).toHaveTextContent(/Last scanned 2h ago/i);
  });
});
