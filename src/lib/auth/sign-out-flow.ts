export type SignOutViewState = {
  pending: boolean;
  error: string | null;
};

type SignOutResponse = {
  ok: boolean;
};

type SignOutFlowDependencies = {
  request: () => Promise<SignOutResponse>;
  navigate: (destination: string) => void;
  onStateChange: (state: SignOutViewState) => void;
};

const SAFE_SIGN_OUT_ERROR =
  "We could not sign you out. Please try again.";

export function createAuthenticatedSignOutFlow({
  request,
  navigate,
  onStateChange,
}: SignOutFlowDependencies) {
  let pending = false;

  return async function signOut(): Promise<boolean> {
    if (pending) return false;

    pending = true;
    onStateChange({ pending: true, error: null });

    try {
      const response = await request();

      if (!response.ok) {
        throw new Error("Sign-out request failed.");
      }

      navigate("/auth/login");
      return true;
    } catch {
      pending = false;
      onStateChange({ pending: false, error: SAFE_SIGN_OUT_ERROR });
      return false;
    }
  };
}
