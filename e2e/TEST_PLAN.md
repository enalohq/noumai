# End-to-End Test Plan

This list captures the full set of recommended end-to-end flows. Use it as a coverage checklist. Implement the highest-risk and highest-value flows first.

## Authentication and Routing

1. Unauthenticated user hitting `/` redirects to `/auth/signin` when demo mode is disabled.
2. Authenticated user with onboarding incomplete is redirected to `/onboarding`.
3. Authenticated user with onboarding complete lands on the dashboard.
4. Stale session triggers sign-out and redirects to `/auth/signin`.
5. Demo mode loads dashboard without auth.

## Onboarding Flow

1. Brand step validates URL protocol and required fields.
2. Brand step auto-fills brand name, social handles, and country from metadata.
3. Brand step preserves user edits when auto-fill runs.
4. Brand step shows error if metadata request fails.
5. Market step requires industry and description.
6. Competitor step adds, removes, and deduplicates competitors.
7. Prompts step saves prompts and validates required text.
8. Completing onboarding redirects to dashboard.

## Dashboard Navigation

1. Side navigation switches between tabs and updates the main header.
2. Documentation tab renders overview content.
3. Settings tab loads and accepts edits.
4. Prompt Hub tab lists prompts and allows add/remove.
5. AEO Audit tab renders and allows audit trigger.

## Demo Mode Guards

1. Demo mode blocks API calls for prompt runs.
2. Demo mode blocks audit runs.
3. Demo mode blocks data mutation actions (save, delete, update).
4. Demo mode shows read-only message.

## Scrape Runs and Results

1. Run a single prompt across one provider and confirm progress UI updates.
2. Run all prompts across multiple providers and confirm completion status.
3. Scrape run results appear in history list.
4. Visibility KPI values update after runs.

## AEO Audit

1. Audit starts and shows progress.
2. Audit completes and renders report.
3. Audit error shows a user-facing error message.

## Prompt Explorer and Persona Fan-Out

1. Prompt Explorer generates niche queries and displays them.
2. Persona Fan-Out generates persona variants and displays them.
3. Generated prompts can be added to Prompt Hub.

## Analytics and Citations

1. Visibility Analytics renders charts and allows filtering.
2. Citations tab renders domain list and counts.
3. Citation Opportunities tab renders opportunities list and counts.

## Workspaces

1. Workspaces load from server and active workspace is selected.
2. Switching workspace updates displayed data.
3. Workspace persistence works across reloads.

## Error Handling and Resilience

1. API error on prompt run shows message and does not crash UI.
2. API error on audit shows message and does not crash UI.
3. ErrorBoundary renders fallback UI on component crash.

## Responsiveness and Accessibility

1. Dashboard renders on mobile viewport without overlap.
2. Keyboard navigation reaches main controls.

