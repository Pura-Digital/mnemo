import React from 'react';
import { render } from '@testing-library/react-native';

const mockReplace = jest.fn();
let mockAuthScreenProps: { hideGuestContinue?: boolean } = {};
type MockAuthState = { user: { id: string; isAnonymous: boolean } | null; isGuest: boolean };
let mockAuthState: MockAuthState = { user: null, isGuest: false };

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    back: jest.fn(),
    canGoBack: () => false,
  },
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: MockAuthState) => unknown) => selector(mockAuthState),
}));
jest.mock('@/screens/AuthScreen', () => ({
  __esModule: true,
  default: (props: { hideGuestContinue?: boolean }) => {
    mockAuthScreenProps = props;
    return null;
  },
}));

import AuthRoute from '../auth';

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthScreenProps = {};
});

describe('/auth route', () => {
  it('redirects to Home in mnemo standalone builds', () => {
    mockAuthState = { user: { id: 'anon-user', isAnonymous: true }, isGuest: false };

    render(<AuthRoute />);

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/(record)');
  });

  it('redirects a signed-in user to Home', () => {
    mockAuthState = { user: { id: 'real-user', isAnonymous: false }, isGuest: false };

    render(<AuthRoute />);

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/(record)');
  });
});
