import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.discapp.app',
  appName: 'Discapp',
  webDir:  'out',
  server: {
    url:       'http://10.0.2.2:3000',  // ← esta IP especial apunta a tu PC
    cleartext: true,
  },
};

export default config;