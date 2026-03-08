import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock toast component
jest.mock('@/components/ui/toast', () => ({
  useToast: jest.fn(),
}));

interface MockStepProps {
  data: {
    brandName?: string;
    website?: string;
    industry?: string;
    brandDescription?: string;
    targetKeywords?: string;
    country?: string;
  };
  onChange: (data: any) => void;
}

jest.mock('@/components/onboarding/steps/step-brand', () => ({
  StepBrand: ({ data, onChange }: MockStepProps) => (
    <div data-testid="step-brand">
      <input 
        aria-label="Brand Name" 
        value={data.brandName || ''} 
        onChange={(e) => onChange({ ...data, brandName: e.target.value })} 
      />
      <input 
        aria-label="Website" 
        value={data.website || ''} 
        onChange={(e) => onChange({ ...data, website: e.target.value })} 
      />
    </div>
  ),
}));

jest.mock('@/components/onboarding/steps/step-market', () => ({
  StepMarket: ({ data, onChange }: MockStepProps) => (
    <div data-testid="step-market">
      <input 
        placeholder="Industry" 
        value={data.industry || ''} 
        onChange={(e) => onChange({ ...data, industry: e.target.value })} 
      />
      <textarea 
        aria-label="Brand Description" 
        value={data.brandDescription || ''} 
        onChange={(e) => onChange({ ...data, brandDescription: e.target.value })} 
      />
    </div>
  ),
}));

jest.mock('@/components/onboarding/steps/step-competitors', () => ({
  StepCompetitors: ({ brandContext }: any) => (
    <div data-testid="step-competitors">
      <input placeholder="Competitors" />
      {brandContext && (
        <div data-testid="brand-context-preview">
          <span data-testid="context-brand-name">{brandContext.brandName}</span>
          <span data-testid="context-website">{brandContext.website}</span>
          <span data-testid="context-industry">{brandContext.industry}</span>
          <span data-testid="context-country">{brandContext.country}</span>
        </div>
      )}
    </div>
  ),
}));

jest.mock('@/components/onboarding/steps/step-keywords', () => ({
  StepKeywords: ({ data, onChange }: MockStepProps) => (
    <div data-testid="step-keywords">
      <label htmlFor="keywords">Target Keywords</label>
      <input id="keywords" placeholder="Enter keywords" value={(data.targetKeywords as string) || ''} onChange={(e) => onChange({ ...data, targetKeywords: e.target.value })} />
    </div>
  ),
}));

jest.mock('@/components/onboarding/steps/step-prompts', () => ({
  StepPrompts: ({ brandName }: any) => (
    <div data-testid="step-prompts">
      <input placeholder="Prompts" />
      <span data-testid="prompts-brand-name">{brandName}</span>
    </div>
  ),
}));

jest.mock('@/components/onboarding/dashboard-preview', () => ({
  DashboardPreview: () => <div data-testid="dashboard-preview" />,
}));

// Import component AFTER mocks are set up
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

describe('OnboardingWizard', () => {
  let mockPush: jest.Mock;
  let mockFetch: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;
  let mockShowToast: jest.Mock;
  let mockToastService: ReturnType<typeof useToast>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    mockShowToast = jest.fn();
    mockToastService = {
      showToast: mockShowToast,
      ToastContainer: () => <></>,
    };

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      },
      update: jest.fn().mockResolvedValue({}),
    });

    (useToast as jest.Mock).mockReturnValue(mockToastService);

    mockFetch = jest.fn();
    global.fetch = mockFetch;

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ status: 200, json: () => ({}) }), 100)
          )
      );

      render(<OnboardingWizard toastService={mockToastService} />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should render step 1 after loading', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 0 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Your Brand')).toBeInTheDocument();
    });

    it('should display step progress indicator', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 0 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText(/Step 1 of 5/i)).toBeInTheDocument();
    });

    it('should render all 5 step indicators', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 0 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Your Brand')).toBeInTheDocument();
      expect(await screen.findByText(/Step 1 of 5/i)).toBeInTheDocument();
    });
  });

  describe('Step Progression', () => {
    it('should progress from step 1 to step 2', async () => {
      const user = userEvent.setup();
      
      // Set up all fetch calls to return success
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({
          currentStep: 0,
          workspace: {
            industry: 'Technology',
            brandDescription: 'A tech brand',
          },
        }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Your Brand')).toBeInTheDocument();

      // Fill step 1 form
      const brandNameInput = screen.getByRole('textbox', { name: /Brand Name/i });
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });

      await user.type(brandNameInput, 'Test Brand');
      await user.type(websiteInput, 'https://testbrand.com');

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      expect(await screen.findByText('Your Market')).toBeInTheDocument();
    });

    it('should show back button on step 2+', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 1 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByRole('button', { name: /Back/i })).toBeInTheDocument();
    });

    it('should navigate back to previous step', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 1 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Your Market')).toBeInTheDocument();

      const backButton = screen.getByRole('button', { name: /Back/i });
      await user.click(backButton);

      expect(await screen.findByText('Your Brand')).toBeInTheDocument();
    });

    it('should disable back button on step 1', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 0 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Your Brand')).toBeInTheDocument();

      const backButton = screen.getByRole('button', { name: /Back/i });
      expect(backButton).toBeDisabled();
    });
  });

  describe('Step 4 - Keywords Integration', () => {
    it('should render step 4 keywords input', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 3 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Track Keywords')).toBeInTheDocument();
      expect(await screen.findByLabelText(/Target Keywords/i)).toBeInTheDocument();
    });

    it('should save keywords when progressing from step 4', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 3 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Track Keywords')).toBeInTheDocument();

      const keywordsInput = screen.getByRole('textbox', { name: /Target Keywords/i });
      await user.type(keywordsInput, 'skincare, beauty, organic');

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({}),
      });

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/onboarding',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('skincare, beauty, organic'),
          })
        );
      });
    });

    it('should validate keywords are not empty', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 3 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Track Keywords')).toBeInTheDocument();

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      expect(await screen.findByText(/Please enter at least one target keyword/i)).toBeInTheDocument();
    });

    it('should not allow whitespace-only keywords', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 3 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Track Keywords')).toBeInTheDocument();

      const keywordsInput = screen.getByRole('textbox', { name: /Target Keywords/i });
      await user.type(keywordsInput, '   ');

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      expect(await screen.findByText(/Please enter at least one target keyword/i)).toBeInTheDocument();
    });
  });

  describe('Data Persistence', () => {
    it('should load saved workspace data on mount', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: () =>
          Promise.resolve({
            workspace: {
              brandName: 'Saved Brand',
              website: 'https://saved.com',
              industry: 'Technology',
              brandDescription: 'A saved brand',
              targetKeywords: 'saved, keywords',
            },
            currentStep: 0,
          }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByDisplayValue('Saved Brand')).toBeInTheDocument();
    });

    it('should resume from last saved step', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: () =>
          Promise.resolve({
            workspace: {},
            currentStep: 2,
          }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Track Competitors')).toBeInTheDocument();
    });

    it('should save step data to API', async () => {
      const user = userEvent.setup();
      
      // Set up all fetch calls to return success
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ currentStep: 0, workspace: {} }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Your Brand')).toBeInTheDocument();

      const brandNameInput = screen.getByRole('textbox', { name: /Brand Name/i });
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });

      await user.type(brandNameInput, 'Test Brand');
      await user.type(websiteInput, 'https://testbrand.com');

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/onboarding',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('Test Brand'),
          })
        );
      });
    });
  });

  describe('Wizard Data Pipeline', () => {
    it('should correctly pass brand data from Step 1 to Step 3 and Step 5 contexts', async () => {
      const user = userEvent.setup();
      
      // Step 0 load
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ currentStep: 0 }),
      });

      // Step 1 save
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Auto-fill PATCH (step 1 -> 2 transition)
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Auto-fill GET
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ workspace: { industry: 'Testing' } }),
      });

      // Step 2 save
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      // Step 1: Fill Brand Details
      const brandNameInput = await screen.findByRole('textbox', { name: /Brand Name/i });
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });
      await user.type(brandNameInput, 'Pipeline Brand');
      await user.type(websiteInput, 'https://pipeline.com');
      
      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      // Step 2: Fill Market Details
      const industryInput = await screen.findByPlaceholderText('Industry');
      const descriptionInput = screen.getByRole('textbox', { name: /Brand Description/i });
      await user.type(industryInput, 'Testing Industry');
      await user.type(descriptionInput, 'Testing Description');
      await user.click(continueButton);

      // Step 3: Verify context received from Step 1 and Step 2
      await screen.findByTestId('step-competitors');
      expect(screen.getByTestId('context-brand-name')).toHaveTextContent('Pipeline Brand');
      expect(screen.getByTestId('context-website')).toHaveTextContent('https://pipeline.com');
      expect(screen.getByTestId('context-industry')).toHaveTextContent('Testing Industry');

      // Proceed through Step 3 and 4...
      // Step 3 save
      mockFetch.mockResolvedValueOnce({ status: 200, ok: true, json: () => Promise.resolve({}) });
      await user.click(continueButton);

      // Step 4: Verify we are on Keywords
      expect(await screen.findByText('Track Keywords')).toBeInTheDocument();
      const keywordsInput = screen.getByRole('textbox', { name: /Target Keywords/i });
      await user.type(keywordsInput, 'test');
      
      // Step 4 save (saves to step 3 API)
      mockFetch.mockResolvedValueOnce({ status: 200, ok: true, json: () => Promise.resolve({}) });
      await user.click(continueButton);

      // Step 5: Verify brandName context passed to Prompts
      expect(await screen.findByText('Starter Prompts')).toBeInTheDocument();
      expect(screen.getByTestId('prompts-brand-name')).toHaveTextContent('Pipeline Brand');
    });
  });

  describe('Error Handling', () => {
    it('should display specific server error message on save failure', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ currentStep: 0 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Your Brand')).toBeInTheDocument();

      const brandNameInput = screen.getByRole('textbox', { name: /Brand Name/i });
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });

      await user.type(brandNameInput, 'Test Brand');
      await user.type(websiteInput, 'https://testbrand.com');

      // Mock failure response with specific error
      mockFetch.mockResolvedValueOnce({
        status: 400,
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid brand name' }),
      });

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      expect(await screen.findByText(/Invalid brand name/i)).toBeInTheDocument();
    });

    it('should display network error message on fetch failure', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ currentStep: 0 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Your Brand')).toBeInTheDocument();

      const brandNameInput = screen.getByRole('textbox', { name: /Brand Name/i });
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });

      await user.type(brandNameInput, 'Test Brand');
      await user.type(websiteInput, 'https://testbrand.com');

      // Mock network failure
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      expect(await screen.findByText(/Network error. Please check your internet connection./i)).toBeInTheDocument();
    });

    it('should handle 401 unauthorized response on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 401,
        json: () => Promise.resolve({}),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/auth/signin' });
      });
    });

    it('should handle 401 unauthorized response during save', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ currentStep: 0 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Your Brand')).toBeInTheDocument();

      const brandNameInput = screen.getByRole('textbox', { name: /Brand Name/i });
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });
      await user.type(brandNameInput, 'Test Brand');
      await user.type(websiteInput, 'https://test.com');

      // Mock 401 on save
      mockFetch.mockResolvedValueOnce({
        status: 401,
        json: () => Promise.resolve({}),
      });

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/auth/signin' });
      });
    });

    it('should validate required fields before saving', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 0 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Your Brand')).toBeInTheDocument();

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      expect(await screen.findByText(/Brand name and website are required/i)).toBeInTheDocument();
    });
  });

  describe('Skip Onboarding', () => {
    it('should show skip button on step 2+', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 1 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByRole('button', { name: /Skip for now/i })).toBeInTheDocument();
    });

    it('should skip onboarding and redirect to home', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Set up all fetch calls to return success
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ currentStep: 1 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByRole('button', { name: /Skip for now/i })).toBeInTheDocument();

      const skipButton = screen.getByRole('button', { name: /Skip for now/i });
      await user.click(skipButton);

      // Fast-forward the 1000ms delay in handleSkip
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
      
      jest.useRealTimers();
    });
  });

  describe('Step 1 Auto-fill - Market Details', () => {
    it('should auto-fill market data after step 1 completion', async () => {
      const user = userEvent.setup();
      
      // Initial load
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ currentStep: 0 }),
      });

      // Step 1 save
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Auto-fill PATCH
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Auto-fill GET
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () =>
          Promise.resolve({
            workspace: {
              industry: 'SaaS / Software',
              brandDescription: 'A software company specializing in AI',
            },
          }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      // Wait for step 1 to load
      expect(await screen.findByText('Your Brand')).toBeInTheDocument();

      // Fill in brand data using aria-label
      const brandNameInput = screen.getByRole('textbox', { name: /Brand Name/i });
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });

      await user.type(brandNameInput, 'Test Brand');
      await user.type(websiteInput, 'https://test.com');

      // Click continue
      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      // Verify we moved to step 2
      expect(await screen.findByText('Your Market')).toBeInTheDocument();

      // Verify auto-fill data is populated in the form
      const industryInput = await screen.findByPlaceholderText('Industry');
      expect(industryInput).toHaveValue('SaaS / Software');

      // Verify auto-fill was called
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/onboarding',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('should continue to step 2 even if auto-fill fails', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ currentStep: 0 }),
      });

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Auto-fill PATCH fails
      mockFetch.mockResolvedValueOnce({
        status: 500,
        ok: false,
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      // Wait for step 1 to load
      expect(await screen.findByText('Your Brand')).toBeInTheDocument();

      const brandNameInput = screen.getByRole('textbox', { name: /Brand Name/i });
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });

      await user.type(brandNameInput, 'Test Brand');
      await user.type(websiteInput, 'https://test.com');

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      // Should still move to step 2
      expect(await screen.findByText('Your Market')).toBeInTheDocument();
    });

    it('should continue to step 2 if auto-fill GET fails', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ currentStep: 0 }),
      });

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Auto-fill PATCH succeeds
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Auto-fill GET fails
      mockFetch.mockResolvedValueOnce({
        status: 500,
        ok: false,
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      // Wait for step 1 to load
      expect(await screen.findByText('Your Brand')).toBeInTheDocument();

      const brandNameInput = screen.getByRole('textbox', { name: /Brand Name/i });
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });

      await user.type(brandNameInput, 'Test Brand');
      await user.type(websiteInput, 'https://test.com');

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      // Should still move to step 2
      expect(await screen.findByText('Your Market')).toBeInTheDocument();
    });
  });

  describe('Completion', () => {
    it('should show finish button on final step', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ currentStep: 4 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByRole('button', { name: /Finish setup/i })).toBeInTheDocument();
    });

    it('should redirect to home on completion', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Set up all fetch calls to return success
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ currentStep: 4 }),
      });

      render(<OnboardingWizard toastService={mockToastService} />);

      expect(await screen.findByText('Starter Prompts')).toBeInTheDocument();

      const finishButton = screen.getByRole('button', { name: /Finish setup/i });
      await user.click(finishButton);

      // Fast-forward the 1000ms delay in handleNext
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
      
      jest.useRealTimers();
    });
  });
});
