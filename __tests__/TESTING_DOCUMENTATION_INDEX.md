# Testing Documentation Index

This directory contains comprehensive testing documentation and best practices for the project.

## Documentation Files

### 1. **TESTING_IMPROVEMENTS.md**

Overview of testing infrastructure improvements including:

- Test utilities (`__tests__/utils/test-helpers.ts`)
- Test factories (competitor and provider factories)
- MSW setup (Mock Service Worker)
- SOLID principles applied
- Test results summary

**When to read:** Understanding the overall testing infrastructure and improvements made.

### 2. **CONSOLE_ERROR_SUPPRESSION.md**

Best practices for handling console output in tests:

- Problem statement and solution
- Why suite-level suppression is correct software engineering
- SOLID principles applied
- Implementation details and patterns
- Test results

**When to read:** Understanding how to suppress console output while maintaining error logging verification.

### 3. **COMPONENT_TESTING_GUIDE.md**

Comprehensive guide for testing React components with @testing-library/react:

- Why @testing-library/react (user-centric testing)
- Core concepts (rendering, querying, interactions, async)
- Testing patterns (rendering, interaction, async, error handling, conditional)
- Best practices and anti-patterns
- Common assertions
- Testing checklist
- Complete example test

**When to read:** Learning how to write component tests following best practices.

### 4. **COMPONENT_TESTING_SUMMARY.md**

Summary of component testing approach:

- Current status of component tests
- Key principles
- Testing patterns
- SOLID principles applied
- Best practices checklist
- Next steps

**When to read:** Quick reference for component testing approach and status.

## Test Files Organization

```
__tests__/
├── api/                          # API route tests
│   ├── competitors/
│   │   └── discover.test.ts
│   ├── onboarding-fix.test.ts
│   └── scrape-metadata.test.ts
├── components/                   # Component tests
│   └── onboarding/
│       └── steps/
│           └── step-brand.test.tsx  # ✅ Reference implementation
├── factories/                    # Test data factories
│   ├── competitor.factory.ts
│   └── provider.factory.ts
├── integration/                  # Integration tests
│   ├── account-linking-flow.test.ts
│   └── test-real-beautybarn.test.ts
├── lib/                          # Library/utility tests
│   ├── auth/
│   │   ├── account-linking.test.ts
│   │   ├── account-linking-comprehensive.test.ts
│   │   └── provider-tracker.test.ts
│   ├── competitors/
│   │   ├── fetcher.test.ts
│   │   └── llm-extractor.test.ts
│   ├── country-detector.test.ts
│   ├── social-handle-extractor.test.ts
│   └── test-actual-beautybarn-html.test.ts
├── unit/                         # Unit tests
│   ├── bot-detection.test.ts
│   └── twitter-handle-extraction.test.ts
├── utils/                        # Test utilities
│   └── test-helpers.ts           # Reusable test helpers
└── mocks/                        # Mock Service Worker setup
    ├── handlers.ts
    └── server.ts
```

## Key Testing Patterns

### 1. Suite-Level Console Suppression

```typescript
describe('Service', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('handles errors gracefully', () => {
    // Test code
    expect(consoleErrorSpy).toHaveBeenCalledWith(...);
  });
});
```

### 2. Test Utilities (DRY Principle)

```typescript
import {
  withSuppressedConsoleError,
  createMockRequest,
} from "@/__tests__/utils/test-helpers";

// Reusable helpers reduce duplication
const request = createMockRequest({ brandName: "Test" });
```

### 3. Test Factories (Complex Test Data)

```typescript
import { competitorFactory } from "@/__tests__/factories/competitor.factory";

// Factories create consistent test data
const competitors = competitorFactory.createMany(3);
const llmCompetitor = competitorFactory.llm();
```

### 4. Component Testing with @testing-library/react

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

describe('StepBrand Component', () => {
  it('renders all form fields', () => {
    render(<StepBrand {...props} />);
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
  });

  it('calls onChange when user edits input', () => {
    const onChange = jest.fn();
    render(<StepBrand {...props} onChange={onChange} />);

    const input = screen.getByLabelText(/brand name/i);
    fireEvent.change(input, { target: { value: 'New Brand' } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      brandName: 'New Brand'
    }));
  });
});
```

## SOLID Principles in Testing

### Single Responsibility Principle (SRP)

- Each test focuses on one specific behavior
- Test utilities handle only console suppression
- Factories handle only test data creation

### Dependency Inversion Principle (DIP)

- Tests depend on public APIs, not internals
- Production code doesn't depend on test infrastructure
- Mocks abstract external dependencies

### Interface Segregation Principle (ISP)

- Tests use minimal interfaces (only needed props)
- Don't force components to accept unused props
- Keep component props focused

### Open/Closed Principle (OCP)

- Tests are open for extension (add new test cases)
- Tests are closed for modification (don't change existing tests)
- New features tested via new test cases

### DRY Principle

- Reusable test utilities in `__tests__/utils/test-helpers.ts`
- Factories for complex test data
- Suite-level setup/teardown (not repeated in each test)

## Test Results

✅ **Test Suites:** 16 passed, 16 total
✅ **Tests:** 271 passed, 271 total
✅ **No console.error pollution**
✅ **All SOLID principles followed**
✅ **DRY principle applied throughout**

## Best Practices Summary

### For All Tests

- [ ] Use descriptive test names (should/do pattern)
- [ ] Organize tests by feature/behavior (describe blocks)
- [ ] Use suite-level console suppression for error tests
- [ ] Verify logging occurred (don't just suppress)
- [ ] Use factories for complex test data
- [ ] Use inline data for simple test cases

### For Component Tests

- [ ] Test user behavior, not implementation
- [ ] Use accessible queries (role, label, placeholder)
- [ ] Test rendering, interaction, async, error handling
- [ ] Test accessibility (labels, roles)
- [ ] Use @testing-library/react patterns
- [ ] Avoid testing internal state

### For API/Service Tests

- [ ] Mock external dependencies
- [ ] Test happy path and error cases
- [ ] Verify correct API calls
- [ ] Test error handling and logging
- [ ] Use factories for complex test data

## Getting Started

1. **Read** `COMPONENT_TESTING_GUIDE.md` for component testing patterns
2. **Review** `step-brand.test.tsx` as reference implementation
3. **Study** `CONSOLE_ERROR_SUPPRESSION.md` for error handling
4. **Check** `TESTING_IMPROVEMENTS.md` for infrastructure overview
5. **Use** test utilities and factories to reduce duplication

## Common Tasks

### Writing a New Component Test

1. Read `COMPONENT_TESTING_GUIDE.md`
2. Review `step-brand.test.tsx` as reference
3. Use @testing-library/react patterns
4. Organize tests by feature/behavior
5. Use accessible queries

### Adding Error Handling Tests

1. Use suite-level console suppression
2. Verify error logging occurred
3. Test error message display
4. Test error recovery

### Creating Test Data

1. Use factories for complex objects
2. Use inline data for simple cases
3. Use factory overrides for variations
4. Keep test data focused

## Resources

- [@testing-library/react Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
- [Jest Documentation](https://jestjs.io/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

## Questions?

Refer to the appropriate documentation file:

- **"How do I test a component?"** → `COMPONENT_TESTING_GUIDE.md`
- **"How do I suppress console output?"** → `CONSOLE_ERROR_SUPPRESSION.md`
- **"What testing infrastructure exists?"** → `TESTING_IMPROVEMENTS.md`
- **"What's the current testing status?"** → `COMPONENT_TESTING_SUMMARY.md`
