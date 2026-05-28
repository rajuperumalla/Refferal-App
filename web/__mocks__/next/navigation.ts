export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
}));

export const usePathname = jest.fn(() => '/dashboard');
export const useSearchParams = jest.fn(() => new URLSearchParams());
