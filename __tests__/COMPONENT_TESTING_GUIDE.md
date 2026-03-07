# Component Testing Guide - @testing-library/react

This guide explains best practices for testing React components using @testing-library/react, following SOLID principles and the project's testing standards.

## Why @testing-library/react?

@testing-library/react encourages testing components from the **user's perspective** rather than implementation details:

- ✅ Tests user interactions (clicks, typing, etc.)
- ✅ Tests what users see (rendered output)
- ✅ Tests accessibility (labels, roles, etc.)
- ❌ Avoids testing internal state or component structure
- ❌ Avoids testing implementation details

This aligns with SOLID principles:

- **SRP**: Tests focus on one behavior at a time
- **DIP**: Tests depend on public component API, not internals
- **ISP**: Tests use minimal interfaces (props only)

## Core Concepts

### 1. Rendering Components

```typescript
import { render, screen } from '@testing-library/react';

// Basic render
render(<MyComponent prop="value" />);

// With wrapper (for providers, context, etc.)
render(<MyComponent />, { wrapper: MyWrapper });
```

### 2. Querying Elements

Use queries in this priority order:

```typescript
// 1. BEST: By accessible role (most user-like)
screen.getByRole('button', { name: /submit/i });
screen.getByRole('textbox', { name: /email/i });

// 2. GOOD: By label (for form inputs)
screen.getByLabelText(/brand name/i);

// 3. GOOD: By placeholder text
screen.getByPlaceholderText('username');

// 4. ACCEPTABLE: By display value (for filled inputs)
screen.getByDisplayValue('existing value');

// 5. LAST RESORT: By test ID (when others don't work)
screen.getByTestId('custom-element');

// Query variants:
screen.getBy...()      // Throws if not found
screen.queryBy...()    // Returns null if not found
screen.findBy...()     // Async, waits for element
screen.getAllBy...()   // Returns array
screen.queryAllBy...() // Returns array or empty
screen.findAllBy...()  // Async array query
```

### 3. User Interactions

```typescript
import { fireEvent, userEvent } from "@testing-library/react";

// Typing (preferred - more realistic)
await userEvent.type(input, "text");

// Clicking
fireEvent.click(button);

// Changing input value
fireEvent.change(input, { target: { value: "new value" } });

// Form submission
fireEvent.submit(form);
```

### 4. Async Operations

```typescript
import { waitFor } from "@testing-library/react";

// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText("Success")).toBeInTheDocument();
});

// Wait for condition
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled();
});

// With timeout
await waitFor(
  () => {
    expect(element).toBeInTheDocument();
  },
  { timeout: 3000 },
);
```

## Testing Patterns

### Pattern 1: Basic Rendering

```typescript
describe('MyComponent', () => {
  it('renders all required elements', () => {
    render(<MyComponent />);

    expect(screen.getByRole('heading', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });
});
```

### Pattern 2: User Interaction

```typescript
describe('MyComponent', () => {
  it('calls onChange when user types in input', () => {
    const onChange = jest.fn();
    render(<MyComponent onChange={onChange} />);

    const input = screen.getByLabelText(/name/i);
    fireEvent.change(input, { target: { value: 'John' } });

    expect(onChange).toHaveBeenCalledWith('John');
  });
});
```

### Pattern 3: Async Operations

```typescript
describe('MyComponent', () => {
  it('displays data after fetching', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'John' })
    });

    render(<MyComponent />);

    // Wait for async operation
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });
  });
});
```

### Pattern 4: Error Handling

```typescript
describe('MyComponent', () => {
  it('displays error message on failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    render(<MyComponent />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Pattern 5: Conditional Rendering

```typescript
describe('MyComponent', () => {
  it('shows content when condition is true', () => {
    render(<MyComponent isVisible={true} />);
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('hides content when condition is false', () => {
    render(<MyComponent isVisible={false} />);
    expect(screen.queryByText('Visible content')).not.toBeInTheDocument();
  });
});
```

## Best Practices

### 1. Test User Behavior, Not Implementation

```typescript
// ❌ BAD: Testing internal state
it('sets state correctly', () => {
  const { getByTestId } = render(<MyComponent />);
  const instance = getByTestId('component').instance;
  expect(instance.state.value).toBe('expected');
});

// ✅ GOOD: Testing user-visible behavior
it('displays updated value after user input', () => {
  render(<MyComponent />);
  const input = screen.getByLabelText(/value/i);
  fireEvent.change(input, { target: { value: 'new' } });
  expect(screen.getByDisplayValue('new')).toBeInTheDocument();
});
```

### 2. Use Accessible Queries

```typescript
// ❌ BAD: Using test IDs for everything
screen.getByTestId("submit-button");

// ✅ GOOD: Using accessible queries
screen.getByRole("button", { name: /submit/i });
```

### 3. Test Accessibility

```typescript
// ✅ GOOD: Ensures form is accessible
it('has proper labels for inputs', () => {
  render(<MyForm />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
```

### 4. Use Factories for Complex Props

```typescript
// ✅ GOOD: Using factory for test data
it('displays user information', () => {
  const user = userFactory.create();
  render(<UserCard user={user} />);
  expect(screen.getByText(user.name)).toBeInTheDocument();
});
```

### 5. Suppress Console Output for Error Tests

```typescript
// ✅ GOOD: Suite-level suppression
describe('ErrorComponent', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('handles errors gracefully', () => {
    render(<ErrorComponent />);
    // Error handling test
  });
});
```

## Common Assertions

```typescript
// Visibility
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toHaveClass("active");

// Content
expect(element).toHaveTextContent("text");
expect(element).toHaveValue("value");
expect(element).toHaveAttribute("href", "/path");

// Disabled state
expect(button).toBeDisabled();
expect(button).toBeEnabled();

// Form validation
expect(input).toHaveClass("error");
expect(input).toHaveAttribute("aria-invalid", "true");

// Mocks
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg);
expect(mockFn).toHaveBeenCalledTimes(1);
```

## Testing Checklist

For each component test, verify:

- [ ] Tests user interactions (clicks, typing, etc.)
- [ ] Tests what users see (rendered output)
- [ ] Tests accessibility (labels, roles)
- [ ] Tests error states
- [ ] Tests loading states
- [ ] Tests conditional rendering
- [ ] Uses accessible queries (role, label, placeholder)
- [ ] Avoids testing implementation details
- [ ] Uses factories for complex test data
- [ ] Suppresses console output for error tests
- [ ] Tests are organized by feature/behavior
- [ ] Test names follow "should/do" pattern

## Example: Complete Component Test

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyComponent } from '@/components/my-component';

describe('MyComponent', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Rendering', () => {
    it('renders all required elements', () => {
      render(<MyComponent />);

      expect(screen.getByRole('heading', { name: /title/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/input label/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('displays initial data', () => {
      const data = { name: 'John', email: 'john@example.com' };
      render(<MyComponent data={data} />);

      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('calls onChange when user edits input', () => {
      const onChange = jest.fn();
      render(<MyComponent onChange={onChange} />);

      const input = screen.getByLabelText(/name/i);
      fireEvent.change(input, { target: { value: 'Jane' } });

      expect(onChange).toHaveBeenCalledWith({ name: 'Jane' });
    });

    it('submits form when user clicks submit button', () => {
      const onSubmit = jest.fn();
      render(<MyComponent onSubmit={onSubmit} />);

      const button = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(button);

      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('Async Operations', () => {
    it('displays loading state while fetching', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<MyComponent />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });

    it('displays error message on fetch failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      render(<MyComponent />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all inputs', () => {
      render(<MyComponent />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('button is keyboard accessible', () => {
      render(<MyComponent />);

      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toBeEnabled();
    });
  });
});
```

## Resources

- [@testing-library/react Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
- [Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

## Next Steps

1. Review existing component tests (e.g., `step-brand.test.tsx`)
2. Create tests for other components using this guide
3. Ensure all component tests use @testing-library/react
4. Verify tests follow SOLID principles
5. Keep test output clean with suite-level console suppression
