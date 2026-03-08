import { deduplicateByDomain, getDeduplicationStats } from '@/lib/competitors/deduplicator';
import { Competitor } from '@/lib/competitors/types';

describe('Competitor Deduplicator', () => {
  describe('deduplicateByDomain', () => {
    describe('Basic deduplication', () => {
      it('should return empty array for empty input', () => {
        const result = deduplicateByDomain([]);
        expect(result).toEqual([]);
      });

      it('should return single competitor unchanged', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.9, source: 'llm' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Salesforce');
      });

      it('should remove exact duplicate domains', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.9, source: 'llm' },
          { name: 'Salesforce CRM', url: 'https://salesforce.com', type: 'direct', confidence: 0.8, source: 'web' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Salesforce');
        expect(result[0].confidence).toBe(0.9);
      });

      it('should keep competitor with higher confidence', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce CRM', url: 'https://salesforce.com', type: 'direct', confidence: 0.7, source: 'web' },
          { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.95, source: 'llm' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Salesforce');
        expect(result[0].confidence).toBe(0.95);
      });
    });

    describe('URL normalization', () => {
      it('should treat www and non-www as same domain', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce', url: 'https://www.salesforce.com', type: 'direct', confidence: 0.9, source: 'llm' },
          { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.8, source: 'web' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(1);
      });

      it('should handle URLs without protocol', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce', url: 'salesforce.com', type: 'direct', confidence: 0.9, source: 'llm' },
          { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.8, source: 'web' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(1);
      });

      it('should handle URLs with trailing slashes', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce', url: 'https://salesforce.com/', type: 'direct', confidence: 0.9, source: 'llm' },
          { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.8, source: 'web' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(1);
      });

      it('should be case-insensitive', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce', url: 'https://SALESFORCE.COM', type: 'direct', confidence: 0.9, source: 'llm' },
          { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.8, source: 'web' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(1);
      });

      it('should handle subdomains as different domains', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.9, source: 'llm' },
          { name: 'Salesforce Cloud', url: 'https://cloud.salesforce.com', type: 'direct', confidence: 0.8, source: 'web' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(2);
      });
    });

    describe('Missing URLs', () => {
      it('should keep competitors without URLs', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce', url: undefined, type: 'direct', confidence: 0.9, source: 'llm' },
          { name: 'HubSpot', url: undefined, type: 'direct', confidence: 0.8, source: 'web' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(2);
      });

      it('should keep competitors with empty URLs', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce', url: '', type: 'direct', confidence: 0.9, source: 'llm' },
          { name: 'HubSpot', url: '', type: 'direct', confidence: 0.8, source: 'web' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(2);
      });

      it('should mix URL and non-URL competitors', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.9, source: 'llm' },
          { name: 'Unknown Competitor', url: undefined, type: 'direct', confidence: 0.7, source: 'web' },
          { name: 'HubSpot', url: 'https://hubspot.com', type: 'direct', confidence: 0.85, source: 'llm' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(3);
      });
    });

    describe('Real-world scenarios', () => {
      it('should deduplicate CRM competitors', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.95, source: 'llm' },
          { name: 'Salesforce CRM', url: 'https://www.salesforce.com', type: 'direct', confidence: 0.9, source: 'web' },
          { name: 'HubSpot', url: 'https://hubspot.com', type: 'direct', confidence: 0.92, source: 'llm' },
          { name: 'HubSpot CRM', url: 'https://www.hubspot.com', type: 'direct', confidence: 0.88, source: 'web' },
          { name: 'Pipedrive', url: 'https://pipedrive.com', type: 'direct', confidence: 0.85, source: 'llm' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(3);
        expect(result.map((c) => c.name)).toContain('Salesforce');
        expect(result.map((c) => c.name)).toContain('HubSpot');
        expect(result.map((c) => c.name)).toContain('Pipedrive');
      });

      it('should handle mixed quality data', () => {
        const competitors: Competitor[] = [
          { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.95, source: 'llm' },
          { name: 'Salesforce', url: 'salesforce.com', type: 'direct', confidence: 0.9, source: 'web' },
          { name: 'Salesforce', url: 'https://www.salesforce.com/', type: 'direct', confidence: 0.85, source: 'web' },
          { name: 'Unknown', url: undefined, type: 'direct', confidence: 0.5, source: 'web' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(2);
        expect(result[0].confidence).toBe(0.95);
      });
    });

    describe('Edge cases', () => {
      it('should handle invalid URLs gracefully', () => {
        const competitors: Competitor[] = [
          { name: 'Company1', url: 'not a valid url', type: 'direct', confidence: 0.9, source: 'llm' },
          { name: 'Company2', url: 'also not valid', type: 'direct', confidence: 0.8, source: 'web' },
        ];
        const result = deduplicateByDomain(competitors);
        // Should keep both since they can't be parsed as same domain
        expect(result.length).toBeGreaterThanOrEqual(1);
      });

      it('should handle very long domain lists', () => {
        const competitors: Competitor[] = Array.from({ length: 100 }, (_, i) => ({
          name: `Company${i}`,
          url: i % 2 === 0 ? `https://company${i}.com` : `https://company${i % 50}.com`,
          type: 'direct' as const,
          confidence: 0.9,
          source: 'llm',
        }));
        const result = deduplicateByDomain(competitors);
        expect(result.length).toBeLessThan(competitors.length);
      });

      it('should preserve order of first occurrence', () => {
        const competitors: Competitor[] = [
          { name: 'First', url: 'https://example.com', type: 'direct', confidence: 0.8, source: 'llm' },
          { name: 'Second', url: 'https://example.com', type: 'direct', confidence: 0.9, source: 'web' },
          { name: 'Third', url: 'https://other.com', type: 'direct', confidence: 0.7, source: 'llm' },
        ];
        const result = deduplicateByDomain(competitors);
        expect(result).toHaveLength(2);
        // Second should be kept (higher confidence) but appear in position of First
        expect(result[0].name).toBe('Second');
        expect(result[1].name).toBe('Third');
      });
    });
  });

  describe('getDeduplicationStats', () => {
    it('should calculate stats for no duplicates', () => {
      const original: Competitor[] = [
        { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.9, source: 'llm' },
        { name: 'HubSpot', url: 'https://hubspot.com', type: 'direct', confidence: 0.85, source: 'llm' },
      ];
      const deduplicated = deduplicateByDomain(original);
      const stats = getDeduplicationStats(original, deduplicated);

      expect(stats.totalOriginal).toBe(2);
      expect(stats.totalDeduplicated).toBe(2);
      expect(stats.duplicatesRemoved).toBe(0);
      expect(stats.uniqueDomains).toBe(2);
    });

    it('should calculate stats for duplicates', () => {
      const original: Competitor[] = [
        { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.95, source: 'llm' },
        { name: 'Salesforce CRM', url: 'https://www.salesforce.com', type: 'direct', confidence: 0.9, source: 'web' },
        { name: 'HubSpot', url: 'https://hubspot.com', type: 'direct', confidence: 0.85, source: 'llm' },
      ];
      const deduplicated = deduplicateByDomain(original);
      const stats = getDeduplicationStats(original, deduplicated);

      expect(stats.totalOriginal).toBe(3);
      expect(stats.totalDeduplicated).toBe(2);
      expect(stats.duplicatesRemoved).toBe(1);
      expect(stats.uniqueDomains).toBe(2);
    });

    it('should handle competitors without URLs', () => {
      const original: Competitor[] = [
        { name: 'Salesforce', url: 'https://salesforce.com', type: 'direct', confidence: 0.9, source: 'llm' },
        { name: 'Unknown', url: undefined, type: 'direct', confidence: 0.5, source: 'web' },
      ];
      const deduplicated = deduplicateByDomain(original);
      const stats = getDeduplicationStats(original, deduplicated);

      expect(stats.totalOriginal).toBe(2);
      expect(stats.totalDeduplicated).toBe(2);
      expect(stats.duplicatesRemoved).toBe(0);
      expect(stats.uniqueDomains).toBe(1);
    });
  });
});
