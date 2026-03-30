import {
  GoogleSignin,
  statusCodes,
  type NativeModuleError,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

const googleConfig = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '',
};

let configured = false;

export type GoogleSignInPayload = {
  idToken: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
};

function getNativeErrorCode(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as NativeModuleError).code;
  }

  return null;
}

function toGoogleErrorMessage(error: unknown) {
  const code = getNativeErrorCode(error);

  switch (code) {
    case statusCodes.SIGN_IN_CANCELLED:
      return 'Google sign-in was cancelled.';
    case statusCodes.IN_PROGRESS:
      return 'Google sign-in is already in progress.';
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return 'Google Play Services are unavailable on this device.';
    default:
      return error instanceof Error
        ? error.message
        : 'Google sign-in could not be completed.';
  }
}

export function isGoogleSignInConfigured() {
  return Platform.OS !== 'web' && Boolean(googleConfig.webClientId);
}

export function getGoogleSignInHelpText() {
  if (Platform.OS === 'web') {
    return 'Google sign-in is available in the native mobile app build only.';
  }

  if (!googleConfig.webClientId) {
    return 'Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to enable Google sign-in.';
  }

  return 'Google sign-in is ready. LiveGate still enforces email verification and profile completion from the backend.';
}

export function initializeGoogleSignIn(webClientId?: string) {
  if (Platform.OS === 'web') {
    return false;
  }

  const resolvedWebClientId = webClientId?.trim() || googleConfig.webClientId;
  if (!resolvedWebClientId) {
    configured = false;
    return false;
  }

  if (configured) {
    return true;
  }

  GoogleSignin.configure({
    webClientId: resolvedWebClientId,
    iosClientId: googleConfig.iosClientId || undefined,
  });
  configured = true;
  return true;
}

export async function signInWithGoogle(): Promise<GoogleSignInPayload> {
  if (Platform.OS === 'web') {
    throw new Error('Google sign-in is only available in the native LiveGate mobile app.');
  }

  if (!initializeGoogleSignIn()) {
    throw new Error(getGoogleSignInHelpText());
  }

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();

    if (!result.idToken) {
      throw new Error(
        'Google sign-in did not return an ID token. Confirm the Google web client ID is configured correctly.',
      );
    }

    return {
      idToken: result.idToken,
      email: result.user.email,
      fullName: result.user.name,
      avatarUrl: result.user.photo,
    };
  } catch (error) {
    throw new Error(toGoogleErrorMessage(error));
  }
}

export async function signOutFromGoogle() {
  if (Platform.OS === 'web' || !initializeGoogleSignIn()) {
    return;
  }

  try {
    if (await GoogleSignin.isSignedIn()) {
      await GoogleSignin.signOut();
    }
  } catch {
    return;
  }
}

export async function isUserSignedIn() {
  if (Platform.OS === 'web' || !initializeGoogleSignIn()) {
    return false;
  }

  try {
    return await GoogleSignin.isSignedIn();
  } catch {
    return false;
  }
}
