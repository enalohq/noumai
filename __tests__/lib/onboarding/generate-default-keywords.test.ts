import { generateDefaultKeywords } from '@/lib/onboarding/generate-default-keywords';
import type { CompetitorData } from '@/components/onboarding/steps/step-competitors';

describe('generateDefaultKeywords', () => {
  describe('Brand Name Only', () => {
    it('should generate keywords from brand name alone', () => {
      const result = generateDefaultKeywords('Acme Corp', []);
      expect(result).toBe('Acme Corp');
    });

    it('should trim brand name', () => {
      const result = generateDefaultKeywords('  Acme Corp  ', []);
      expect(result).toBe('Acme Corp');
    });

    it('should handle empty brand name', () => {
      const result = generateDefaultKeywords('', []);
      expect(result).toBe('');
    });

    it('should handle whitespace-only brand name', () => {
      const result = generateDefaultKeywords('   ', []);
      expect(result).toBe('');
    });
  });

  describe('Brand + Competitors', () => {
    it('should include brand name and competitor names', () => {
      const competitors: CompetitorData[] = [
        { name: 'Competitor A', type: 'direct' },
        { name: 'Competitor B', type: 'indirect' },
      ];
      const result = generateDefaultKeywords('Acme Corp', competitors);
      expect(result).toBe('Acme Corp, Competitor A, Competitor B');
    });

    it('should limit to 3 competitor names', () => {
      const competitors: CompetitorData[] = [
        { name: 'Comp A', type: 'direct' },
        { name: 'Comp B', type: 'indirect' },
        { name: 'Comp C', type: 'substitute' },
        { name: 'Comp D', type: 'direct' },
        { name: 'Comp E', type: 'indirect' },
      ];
      const result = generateDefaultKeywords('Brand', competitors);
      expect(result).toBe('Brand, Comp A, Comp B, Comp C');
    });

    it('should trim competitor names', () => {
      const competitors: CompetitorData[] = [
        { name: '  Competitor A  ', type: 'direct' },
        { name: '  Competitor B  ', type: 'indirect' },
      ];
      const result = generateDefaultKeywords('Brand', competitors);
      expect(result).toBe('Brand, Competitor A, Competitor B');
    });

    it('should skip empty competitor names', () => {
      const competitors: CompetitorData[] = [
        { name: 'Competitor A', type: 'direct' },
        { name: '', type: 'indirect' },
        { name: 'Competitor B', type: 'substitute' },
      ];
      const result = generateDefaultKeywords('Brand', competitors);
      expect(result).toBe('Brand, Competitor A, Competitor B');
    });

    it('should skip whitespace-only competitor names', () => {
      const competitors: CompetitorData[] = [
        { name: 'Competitor A', type: 'direct' },
        { name: '   ', type: 'indirect' },
        { name: 'Competitor B', type: 'substitute' },
      ];
      const result = generateDefaultKeywords('Brand', competitors);
      expect(result).toBe('Brand, Competitor A, Competitor B');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in names', () => {
      const competitors: CompetitorData[] = [
        { name: 'Company & Co.', type: 'direct' },
        { name: 'Tech (Ltd.)', type: 'indirect' },
      ];
      const result = generateDefaultKeywords('Brand & Co.', competitors);
      expect(result).toBe('Brand & Co., Company & Co., Tech (Ltd.)');
    });

    it('should handle unicode characters', () => {
      const competitors: CompetitorData[] = [
        { name: '美容品牌', type: 'direct' },
        { name: 'Beauté', type: 'indirect' },
      ];
      const result = generateDefaultKeywords('品牌', competitors);
      expect(result).toBe('品牌, 美容品牌, Beauté');
    });

    it('should handle single competitor', () => {
      const competitors: CompetitorData[] = [
        { name: 'Only Competitor', type: 'direct' },
      ];
      const result = generateDefaultKeywords('Brand', competitors);
      expect(result).toBe('Brand, Only Competitor');
    });

    it('should handle competitors with URLs', () => {
      const competitors: CompetitorData[] = [
        { name: 'Competitor A', url: 'https://a.com', type: 'direct' },
        { name: 'Competitor B', url: 'https://b.com', type: 'indirect' },
      ];
      const result = generateDefaultKeywords('Brand', competitors);
      expect(result).toBe('Brand, Competitor A, Competitor B');
    });

    it('should handle auto-discovered competitors', () => {
      const competitors: CompetitorData[] = [
        { name: 'Auto Discovered', type: 'direct', isAutoDiscovered: true },
        { name: 'Manual', type: 'indirect', isAutoDiscovered: false },
      ];
      const result = generateDefaultKeywords('Brand', competitors);
      expect(result).toBe('Brand, Auto Discovered, Manual');
    });
  });

  describe('Output Format', () => {
    it('should use comma-space separator', () => {
      const competitors: CompetitorData[] = [
        { name: 'Comp A', type: 'direct' },
        { name: 'Comp B', type: 'indirect' },
      ];
      const result = generateDefaultKeywords('Brand', competitors);
      expect(result).toMatch(/Brand, Comp A, Comp B/);
    });

    it('should not have trailing commas', () => {
      const competitors: CompetitorData[] = [
        { name: 'Comp A', type: 'direct' },
      ];
      const result = generateDefaultKeywords('Brand', competitors);
      expect(result).not.toMatch(/,\s*$/);
    });

    it('should not have leading commas', () => {
      const competitors: CompetitorData[] = [
        { name: 'Comp A', type: 'direct' },
      ];
      const result = generateDefaultKeywords('Brand', competitors);
      expect(result).not.toMatch(/^,/);
    });
  });
});
