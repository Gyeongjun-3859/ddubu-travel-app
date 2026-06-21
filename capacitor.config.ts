import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ddubu.travel',
  appName: 'ddubu-travel-app',
  webDir: 'build',
  android: {
    allowMixedContent: true,
  },
  server: {
    allowNavigation: [
      'dapi.kakao.com',
      '*.kakao.com',
      '*.kakaocdn.net',
      'api.open-meteo.com',
      '*.supabase.co',
    ]
  }
};

export default config;
