import { extractCompetitorKeywords } from '@/lib/onboarding/extract-competitor-keywords';

describe('Extract Competitor Keywords', () => {
  describe('Basic extraction', () => {
    it('should extract keywords from single competitor', () => {
      const result = extractCompetitorKeywords(['Salesforce']);
      expect(result).toContain('salesforce');
    });

    it('should extract keywords from multiple competitors', () => {
      const result = extractCompetitorKeywords(['Salesforce', 'HubSpot', 'Pipedrive']);
      expect(result).toContain('salesforce');
      expect(result).toContain('hubspot');
      expect(result).toContain('pipedrive');
    });

    it('should handle empty array', () => {
      const result = extractCompetitorKeywords([]);
      expect(result).toEqual([]);
    });

    it('should handle empty strings', () => {
      const result = extractCompetitorKeywords(['', 'Salesforce', '']);
      expect(result).toContain('salesforce');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Delimiter handling', () => {
    it('should split on spaces', () => {
      const result = extractCompetitorKeywords(['Project Management Software']);
      expect(result).toContain('project');
      expect(result).toContain('management');
      expect(result).toContain('software');
    });

    it('should split on hyphens', () => {
      const result = extractCompetitorKeywords(['monday-com']);
      expect(result).toContain('monday');
      expect(result).toContain('com');
    });

    it('should split on underscores', () => {
      const result = extractCompetitorKeywords(['base_camp']);
      expect(result).toContain('base');
      expect(result).toContain('camp');
    });

    it('should split on dots', () => {
      const result = extractCompetitorKeywords(['monday.com']);
      expect(result).toContain('monday');
      expect(result).toContain('com');
    });

    it('should split on ampersands', () => {
      const result = extractCompetitorKeywords(['Smith & Associates']);
      expect(result).toContain('smith');
      expect(result).toContain('associates');
    });

    it('should handle multiple consecutive delimiters', () => {
      const result = extractCompetitorKeywords(['Project---Management']);
      expect(result).toContain('project');
      expect(result).toContain('management');
    });
  });

  describe('Common word filtering', () => {
    it('should filter out common articles', () => {
      const result = extractCompetitorKeywords(['The Project Manager']);
      expect(result).not.toContain('the');
      expect(result).toContain('project');
      expect(result).toContain('manager');
    });

    it('should filter out common prepositions', () => {
      const result = extractCompetitorKeywords(['Project for Management']);
      expect(result).not.toContain('for');
      expect(result).toContain('project');
      expect(result).toContain('management');
    });

    it('should filter out common company suffixes', () => {
      const result = extractCompetitorKeywords(['Acme Corp', 'Smith Inc', 'Tech LLC']);
      expect(result).not.toContain('corp');
      expect(result).not.toContain('inc');
      expect(result).not.toContain('llc');
      expect(result).toContain('acme');
      expect(result).toContain('smith');
      // 'tech' is filtered as a common word
      expect(result).not.toContain('tech');
    });

    it('should filter out common tech words', () => {
      const result = extractCompetitorKeywords(['Digital Solutions Company']);
      expect(result).not.toContain('digital');
      expect(result).not.toContain('solutions');
      expect(result).not.toContain('company');
    });
  });

  describe('Case handling', () => {
    it('should convert to lowercase', () => {
      const result = extractCompetitorKeywords(['SALESFORCE']);
      expect(result).toContain('salesforce');
      expect(result).not.toContain('SALESFORCE');
    });

    it('should handle mixed case', () => {
      const result = extractCompetitorKeywords(['SalesForce', 'HubSpot']);
      expect(result).toContain('salesforce');
      expect(result).toContain('hubspot');
    });
  });

  describe('Length filtering', () => {
    it('should skip very short parts (single character)', () => {
      const result = extractCompetitorKeywords(['X Y Z']);
      // Single character parts are filtered, but full name "x y z" is too short (3 chars)
      // so result should be empty or only contain the full name if it passes length check
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should include 2-character parts', () => {
      const result = extractCompetitorKeywords(['AI ML']);
      expect(result).toContain('ai');
      expect(result).toContain('ml');
    });

    it('should skip very long parts', () => {
      const longString = 'a'.repeat(100);
      const result = extractCompetitorKeywords([longString]);
      expect(result).not.toContain(longString);
    });

    it('should include reasonable length keywords', () => {
      const result = extractCompetitorKeywords(['Salesforce']);
      expect(result).toContain('salesforce');
    });
  });

  describe('Deduplication', () => {
    it('should remove duplicate keywords', () => {
      const result = extractCompetitorKeywords(['Project Manager', 'Project Planning']);
      const projectCount = result.filter((k) => k === 'project').length;
      expect(projectCount).toBe(1);
    });

    it('should handle case-insensitive duplicates', () => {
      const result = extractCompetitorKeywords(['SALESFORCE', 'Salesforce', 'salesforce']);
      const salesforceCount = result.filter((k) => k === 'salesforce').length;
      expect(salesforceCount).toBe(1);
    });
  });

  describe('Real-world scenarios', () => {
    it('should extract keywords from CRM competitors', () => {
      const competitors = ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM'];
      const result = extractCompetitorKeywords(competitors);
      expect(result).toContain('salesforce');
      expect(result).toContain('hubspot');
      expect(result).toContain('pipedrive');
      expect(result).toContain('zoho');
    });

    it('should extract keywords from project management competitors', () => {
      const competitors = ['Monday.com', 'Asana', 'Jira', 'Trello'];
      const result = extractCompetitorKeywords(competitors);
      expect(result).toContain('monday');
      expect(result).toContain('asana');
      expect(result).toContain('jira');
      expect(result).toContain('trello');
    });

    it('should extract keywords from SaaS competitors', () => {
      const competitors = ['Slack', 'Microsoft Teams', 'Discord'];
      const result = extractCompetitorKeywords(competitors);
      expect(result).toContain('slack');
      expect(result).toContain('microsoft');
      expect(result).toContain('teams');
      expect(result).toContain('discord');
    });

    it('should handle competitors with special characters', () => {
      const competitors = ['Figma', 'Adobe XD', 'Sketch'];
      const result = extractCompetitorKeywords(competitors);
      expect(result).toContain('figma');
      expect(result).toContain('adobe');
      expect(result).toContain('xd');
      expect(result).toContain('sketch');
    });
  });

  describe('Sorting', () => {
    it('should return sorted keywords', () => {
      const result = extractCompetitorKeywords(['Zebra', 'Apple', 'Mango']);
      expect(result).toEqual([...result].sort());
    });
  });

  describe('Edge cases', () => {
    it('should handle null values gracefully', () => {
      const result = extractCompetitorKeywords([null as any, 'Salesforce']);
      expect(result).toContain('salesforce');
    });

    it('should handle undefined values gracefully', () => {
      const result = extractCompetitorKeywords([undefined as any, 'Salesforce']);
      expect(result).toContain('salesforce');
    });

    it('should handle whitespace-only strings', () => {
      const result = extractCompetitorKeywords(['   ', 'Salesforce']);
      expect(result).toContain('salesforce');
    });

    it('should handle unicode characters', () => {
      const result = extractCompetitorKeywords(['Café Manager', '美容 Studio']);
      expect(result).toContain('café');
      expect(result).toContain('manager');
      expect(result).toContain('美容');
      expect(result).toContain('studio');
    });
  });
});
