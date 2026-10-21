import { getOnboardingRoute } from '@/store/useOnboardingStore';

describe('useOnboardingStore standalone mnemo', () => {
  it('omits paywall and create-account from the onboarding route', () => {
    const route = getOnboardingRoute('cloud');
    expect(route).not.toContain('paywall');
    expect(route).not.toContain('create-account');
    expect(route).toContain('graduation');
  });
});
