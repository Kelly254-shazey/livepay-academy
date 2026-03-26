export function initializeGoogleSignIn(webClientId?: string) {
  void webClientId;
}

export async function signInWithGoogle() {
  throw new Error('Google sign-in is disabled in tester builds.');
}

export async function signOutFromGoogle() {
  return;
}

export async function isUserSignedIn() {
  return false;
}
