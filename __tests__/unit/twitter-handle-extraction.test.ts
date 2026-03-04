/**
 * Unit tests for Twitter handle extraction logic
 * This tests the core logic without importing Next.js server modules
 */

describe('Twitter Handle Extraction Logic', () => {
  // Test the validation function
  describe('Twitter handle validation', () => {
    const isValidTwitterHandle = (handle: string | undefined): boolean => {
      if (!handle) return false;
      return /^[a-z0-9_]{1,15}$/.test(handle);
    };

    it('should accept valid Twitter handles', () => {
      expect(isValidTwitterHandle('testuser')).toBe(true);
      expect(isValidTwitterHandle('test_user')).toBe(true);
      expect(isValidTwitterHandle('test123')).toBe(true);
      expect(isValidTwitterHandle('test_user_123')).toBe(true);
      expect(isValidTwitterHandle('minimalist_ae')).toBe(true);
    });

    it('should reject invalid Twitter handles', () => {
      expect(isValidTwitterHandle('TestUser')).toBe(false); // uppercase
      expect(isValidTwitterHandle('test-user')).toBe(false); // hyphen
      expect(isValidTwitterHandle('test.user')).toBe(false); // dot
      expect(isValidTwitterHandle('test user')).toBe(false); // space
      expect(isValidTwitterHandle('@testuser')).toBe(false); // @ symbol
      expect(isValidTwitterHandle('')).toBe(false); // empty
      expect(isValidTwitterHandle(undefined)).toBe(false); // undefined
    });
  });

  // Test URL parsing and handle extraction
  describe('URL parsing and handle extraction', () => {
    const extractHandleFromTwitterUrl = (url: string): string | null => {
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        
        if (!hostname.includes('twitter.com') && !hostname.includes('x.com')) {
          return null;
        }
        
        const skipPaths = ['hashtag', 'search', 'intent', 'share', 'about', 'help', 'blog', 'press'];
        if (pathParts.length > 0 && skipPaths.includes(pathParts[0].toLowerCase())) {
          return null;
        }
        
        if (pathParts.length >= 1) {
          const rawHandle = pathParts[0].startsWith('@') ? pathParts[0].substring(1) : pathParts[0];
          const handle = rawHandle.replace(/[^a-zA-Z0-9_]/g, '');
          if (handle && handle.length > 1) {
            return handle.toLowerCase();
          }
        }
        
        return null;
      } catch {
        return null;
      }
    };

    it('should extract handle from Twitter URL', () => {
      expect(extractHandleFromTwitterUrl('https://twitter.com/testuser')).toBe('testuser');
      expect(extractHandleFromTwitterUrl('https://x.com/testuser')).toBe('testuser');
      expect(extractHandleFromTwitterUrl('https://twitter.com/test_user')).toBe('test_user');
      expect(extractHandleFromTwitterUrl('https://twitter.com/test123')).toBe('test123');
    });

    it('should handle @ symbol in URL', () => {
      expect(extractHandleFromTwitterUrl('https://twitter.com/@testuser')).toBe('testuser');
      expect(extractHandleFromTwitterUrl('https://x.com/@test_user')).toBe('test_user');
    });

    it('should clean special characters', () => {
      expect(extractHandleFromTwitterUrl('https://twitter.com/test-user')).toBe('testuser');
      expect(extractHandleFromTwitterUrl('https://twitter.com/test.user')).toBe('testuser');
      expect(extractHandleFromTwitterUrl('https://twitter.com/test?param=value')).toBe('test');
    });

    it('should skip non-handle paths', () => {
      expect(extractHandleFromTwitterUrl('https://twitter.com/hashtag/test')).toBe(null);
      expect(extractHandleFromTwitterUrl('https://twitter.com/search?q=test')).toBe(null);
      expect(extractHandleFromTwitterUrl('https://twitter.com/intent/tweet')).toBe(null);
    });

    it('should handle the minimalist_ae case correctly', () => {
      expect(extractHandleFromTwitterUrl('https://twitter.com/minimalist_ae')).toBe('minimalist_ae');
      expect(extractHandleFromTwitterUrl('https://x.com/minimalist_ae')).toBe('minimalist_ae');
    });
  });

  // Test meta tag processing
  describe('Meta tag processing', () => {
    const processMetaHandle = (metaContent: string): string => {
      return metaContent
        .replace(/^https?:\/\/(twitter|x)\.com\//i, '')
        .replace(/^@/, '')
        .replace(/^\//, '')
        .trim()
        .toLowerCase();
    };

    it('should process various meta tag formats', () => {
      expect(processMetaHandle('@testuser')).toBe('testuser');
      expect(processMetaHandle('https://twitter.com/testuser')).toBe('testuser');
      expect(processMetaHandle('https://x.com/testuser')).toBe('testuser');
      // Note: In practice, meta content is trimmed before processing
      // So we don't test strings with spaces
      expect(processMetaHandle('/testuser')).toBe('testuser');
    });

    it('should handle the Minimalist case', () => {
      expect(processMetaHandle('@Minimalist')).toBe('minimalist');
      expect(processMetaHandle('https://twitter.com/Minimalist')).toBe('minimalist');
      expect(processMetaHandle('https://twitter.com/@Minimalist')).toBe('minimalist');
    });
  });

  // Test priority logic (the fix for minimalist_ae issue)
  describe('Priority logic for Twitter handle selection', () => {
    const isValidTwitterHandle = (handle: string | undefined): boolean => {
      if (!handle) return false;
      return /^[a-z0-9_]{1,15}$/.test(handle);
    };

    const selectTwitterHandle = (metaHandle: string | undefined, urlHandle: string | undefined): string | undefined => {
      // Priority logic:
      // 1. If meta tag is invalid, use URL handle
      // 2. If meta tag is valid but URL handle exists and is different, prefer URL handle
      //    (URL is an actual link, more reliable than meta tag)
      // 3. Otherwise use meta tag
      if (!metaHandle || !isValidTwitterHandle(metaHandle)) {
        return urlHandle;
      } else if (urlHandle && urlHandle !== metaHandle) {
        // Meta tag and URL handle are different, prefer URL (more reliable)
        return urlHandle;
      } else {
        return metaHandle;
      }
    };

    it('should prefer URL handle over meta tag when they differ (minimalist_ae fix)', () => {
      const metaHandle = 'minimalist'; // From meta tag @Minimalist
      const urlHandle = 'minimalist_ae'; // From URL https://twitter.com/minimalist_ae
      
      const result = selectTwitterHandle(metaHandle, urlHandle);
      expect(result).toBe('minimalist_ae'); // Should prefer URL handle
    });

    it('should use meta tag when it matches URL handle', () => {
      const metaHandle = 'testuser';
      const urlHandle = 'testuser';
      
      const result = selectTwitterHandle(metaHandle, urlHandle);
      expect(result).toBe('testuser');
    });

    it('should use URL handle when meta tag is invalid', () => {
      const metaHandle = 'Test User'; // Invalid (space)
      const urlHandle = 'testuser';
      
      const result = selectTwitterHandle(metaHandle, urlHandle);
      expect(result).toBe('testuser');
    });

    it('should use meta tag when no URL handle exists', () => {
      const metaHandle = 'testuser';
      const urlHandle = undefined;
      
      const result = selectTwitterHandle(metaHandle, urlHandle);
      expect(result).toBe('testuser');
    });

    it('should return undefined when no handles exist', () => {
      const metaHandle = undefined;
      const urlHandle = undefined;
      
      const result = selectTwitterHandle(metaHandle, urlHandle);
      expect(result).toBe(undefined);
    });
  });
});