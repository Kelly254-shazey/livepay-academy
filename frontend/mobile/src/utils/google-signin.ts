import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Initialize Google Sign-In
// Call this once at app startup
export function initializeGoogleSignIn(webClientId?: string) {
  GoogleSignin.configure({
    webClientId: webClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    // iOS URL scheme is configured in app.json
  });
}

// Sign in with Google and get the ID token
export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    return {
      idToken: userInfo.data?.idToken || '',
      email: userInfo.data?.user.email || '',
      name: userInfo.data?.user.name || '',
    };
  } catch (error) {
    if ((error as any).code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign-in was cancelled');
    } else if ((error as any).code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign-in is in progress');
    } else if ((error as any).code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Play Services not available or outdated');
    } else {
      throw new Error((error as Error).message || 'Unknown sign-in error');
    }
  }
}

// Sign out from Google
export async function signOutFromGoogle() {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

// Check if user is signed in
export async function isUserSignedIn() {
  try {
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser !== null;
  } catch (error) {
    return false;
  }
}
