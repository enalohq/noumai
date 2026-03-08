import { normalizeKeywords, keywordsToString } from '@/lib/onboarding/keyword-normalizer';

describe('Keyword Normalizer', () => {
  describe('normalizeKeywords', () => {
    describe('Basic normalization', () => {
      it('should trim whitespace from keywords', () => {
        const result = normalizeKeywords('  project management  ,  invoicing  ');
        expect(result).toEqual(['project management', 'invoicing']);
      });

      it('should convert keywords to lowercase', () => {
        const result = normalizeKeywords('Project Management, INVOICING, Team Collaboration');
        expect(result).toEqual(['project management', 'invoicing', 'team collaboration']);
      });

      it('should handle comma-separated keywords', () => {
        const result = normalizeKeywords('keyword1, keyword2, keyword3');
        expect(result).toEqual(['keyword1', 'keyword2', 'keyword3']);
      });

      it('should handle newline-separated keywords', () => {
        const result = normalizeKeywords('keyword1\nkeyword2\nkeyword3');
        expect(result).toEqual(['keyword1', 'keyword2', 'keyword3']);
      });

      it('should handle mixed comma and newline separators', () => {
        const result = normalizeKeywords('keyword1, keyword2\nkeyword3, keyword4');
        expect(result).toEqual(['keyword1', 'keyword2', 'keyword3', 'keyword4']);
      });
    });

    describe('Duplicate removal', () => {
      it('should remove exact duplicates', () => {
        const result = normalizeKeywords('project management, invoicing, project management');
        expect(result).toEqual(['project management', 'invoicing']);
      });

      it('should remove case-insensitive duplicates', () => {
        const result = normalizeKeywords('Project Management, invoicing, PROJECT MANAGEMENT');
        expect(result).toEqual(['project management', 'invoicing']);
      });

      it('should remove duplicates with different whitespace', () => {
        const result = normalizeKeywords('  project management  , invoicing,project management');
        expect(result).toEqual(['project management', 'invoicing']);
      });

      it('should preserve order when removing duplicates', () => {
        const result = normalizeKeywords('alpha, beta, gamma, alpha, delta');
        expect(result).toEqual(['alpha', 'beta', 'gamma', 'delta']);
      });
    });

    describe('Empty and whitespace handling', () => {
      it('should remove empty strings', () => {
        const result = normalizeKeywords('keyword1, , keyword2');
        expect(result).toEqual(['keyword1', 'keyword2']);
      });

      it('should remove whitespace-only entries', () => {
        const result = normalizeKeywords('keyword1,   ,keyword2');
        expect(result).toEqual(['keyword1', 'keyword2']);
      });

      it('should handle empty input', () => {
        const result = normalizeKeywords('');
        expect(result).toEqual([]);
      });

      it('should handle whitespace-only input', () => {
        const result = normalizeKeywords('   ');
        expect(result).toEqual([]);
      });

      it('should handle only separators', () => {
        const result = normalizeKeywords(',,,\n\n,');
        expect(result).toEqual([]);
      });
    });

    describe('Special characters and unicode', () => {
      it('should preserve special characters in keywords', () => {
        const result = normalizeKeywords('C++, Node.js, AI/ML');
        expect(result).toEqual(['c++', 'node.js', 'ai/ml']);
      });

      it('should preserve unicode characters', () => {
        const result = normalizeKeywords('美容, 护肤, café');
        expect(result).toEqual(['美容', '护肤', 'café']);
      });

      it('should handle keywords with hyphens and underscores', () => {
        const result = normalizeKeywords('machine-learning, data_science, web-development');
        expect(result).toEqual(['machine-learning', 'data_science', 'web-development']);
      });

      it('should handle keywords with numbers', () => {
        const result = normalizeKeywords('Web3, Crypto2024, AI-2025');
        expect(result).toEqual(['web3', 'crypto2024', 'ai-2025']);
      });
    });

    describe('Real-world scenarios', () => {
      it('should normalize user input from form', () => {
        const userInput = `
          Project Management Software
          Invoicing Tools
          Team Collaboration
          project management software
        `;
        const result = normalizeKeywords(userInput);
        expect(result).toEqual([
          'project management software',
          'invoicing tools',
          'team collaboration',
        ]);
      });

      it('should handle messy user input', () => {
        const messyInput = '  skincare  ,  , SKINCARE , beauty products , ';
        const result = normalizeKeywords(messyInput);
        expect(result).toEqual(['skincare', 'beauty products']);
      });

      it('should handle long keyword lists', () => {
        const keywords = Array(50)
          .fill(0)
          .map((_, i) => `keyword${i}`)
          .join(', ');
        const result = normalizeKeywords(keywords);
        expect(result).toHaveLength(50);
      });
    });
  });

  describe('keywordsToString', () => {
    it('should convert array to comma-separated string', () => {
      const result = keywordsToString(['project management', 'invoicing', 'collaboration']);
      expect(result).toBe('project management, invoicing, collaboration');
    });

    it('should handle empty array', () => {
      const result = keywordsToString([]);
      expect(result).toBe('');
    });

    it('should handle single keyword', () => {
      const result = keywordsToString(['project management']);
      expect(result).toBe('project management');
    });

    it('should preserve keyword content', () => {
      const keywords = ['C++', 'Node.js', 'AI/ML'];
      const result = keywordsToString(keywords);
      expect(result).toBe('C++, Node.js, AI/ML');
    });
  });

  describe('Round-trip normalization', () => {
    it('should normalize, convert to string, and normalize again consistently', () => {
      const input = '  Project Management  , invoicing , PROJECT MANAGEMENT  ';
      const normalized1 = normalizeKeywords(input);
      const stringified = keywordsToString(normalized1);
      const normalized2 = normalizeKeywords(stringified);
      expect(normalized1).toEqual(normalized2);
    });

    it('should handle complex round-trip', () => {
      const input = `
        AI/ML, machine-learning
        Data Science, data_science
        AI/ML
      `;
      const normalized1 = normalizeKeywords(input);
      const stringified = keywordsToString(normalized1);
      const normalized2 = normalizeKeywords(stringified);
      expect(normalized1).toEqual(normalized2);
      expect(normalized1).toEqual(['ai/ml', 'machine-learning', 'data science', 'data_science']);
    });
  });
});
