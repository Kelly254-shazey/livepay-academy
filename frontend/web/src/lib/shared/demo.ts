// Demo module - contains all demo data and fallback functions
// This is a placeholder; full demo implementation would go here
export const DEMO_PASSWORD = 'Demo@12345';
export const DEMO_LIVE_ACCESS_CODE = '12345';
export const DEFAULT_VIEWER_ENTRY_LIVE_ID = 'live-nairobi-city-lights';

// Demo participants - stub data for testing
export const demoParticipants: any[] = [
  {
    id: 'demo-viewer',
    audience: 'public',
    fullName: 'Demo Viewer',
    email: 'viewer@demo.livegate.app',
    password: DEMO_PASSWORD,
    roles: ['viewer'],
  },
  {
    id: 'demo-creator',
    audience: 'public',
    fullName: 'Demo Creator',
    email: 'creator@demo.livegate.app',
    password: DEMO_PASSWORD,
    roles: ['creator'],
  },
];

// Demo imports/exports - placeholder stubs
export function signInWithDemo(input: any) { return null; }
export function signUpWithDemo(input: any) { return null; }
export function createDemoCheckout(input: any) { return null; }
export function forgotPasswordDemo(input: any) { return null; }
export function resetPasswordDemo(input: any) { return null; }
export function getDemoAdminDashboard() { return null; }
export function getDemoCategoryDetail(slug: string) { return null; }
export function getDemoClassDetail(id: string) { return null; }
export function getDemoCreatorDashboard() { return null; }
export function getDemoCreatorProfile(id: string) { return null; }
export function getDemoHomeFeed() { return null; }
export function getDemoLiveDetail(id: string) { return null; }
export function getDemoLiveRoom(id: string) { return null; }
export function getDemoNotifications() { return null; }
export function getDemoProfileSettings() { return null; }
export function getDemoPremiumContentDetail(id: string) { return null; }
export function getDemoViewerDashboard() { return null; }
export function requestDemoPayout() { return null; }
export function saveDemoProfileSettings(data: any) { return null; }
export function searchDemo(query: string) { return null; }
