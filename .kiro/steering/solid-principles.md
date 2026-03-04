---
title: SOLID Principles
description: Software design principles for maintainable code
inclusion: always
---

# SOLID Principles for Code Changes

All new code, enhancements, bug fixes and refactoring should follow these SOLID principles:

## S - Single Responsibility Principle (SRP)
- Each component, function, or class should have one reason to change
- Keep components focused on a single task
- Example: `StepBrand` handles brand data only, not metadata fetching logic

## O - Open/Closed Principle (OCP)
- Software entities should be open for extension but closed for modification
- Use composition over inheritance
- Add new features via extension, not by modifying existing code

## L - Liskov Substitution Principle (LSP)
- Objects of a superclass should be replaceable with objects of a subclass
- Maintain interface contracts when extending functionality

## I - Interface Segregation Principle (ISP)
- Clients should not be forced to depend on interfaces they don't use
- Keep interfaces small and focused
- Prefer multiple specific interfaces over one general interface

## D - Dependency Inversion Principle (DIP)
- Depend on abstractions, not concretions
- Use dependency injection for external services
- Example: Pass `onChange` callback instead of hardcoding API calls

## Additional Guidelines

### Avoid Over-Engineering
- Don't create abstractions without clear need
- Start simple, refactor when patterns emerge
- YAGNI (You Aren't Gonna Need It) - don't implement until necessary

### Incremental Changes
- Make small, testable changes
- Verify each change works before moving on
- Keep backward compatibility with existing tests

### Testing
- Write tests that verify behavior, not implementation details
- Maintain existing test coverage
- Use property-based testing for edge cases
- Include tests for real-world scenarios (e.g., Unicode-escaped HTML from beautybarn.in)
- Test both happy paths and edge cases to catch issues before production
- Use descriptive test names that explain what's being tested

### Code Organization
- Keep related logic together
- Dont repeate yourself
- Extract reusable utilities to shared modules
- Use custom hooks for shared React logic