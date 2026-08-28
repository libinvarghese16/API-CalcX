/// <reference types="@capacitor-firebase/authentication" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.libinvarghese.apicalcpro",
  appName: "API Calc Pro",
  webDir: "dist",
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com", "apple.com"],
    },
  },
  experimental: {
    ios: {
      spm: {
        packageOptions: {
          "@capacitor-firebase/authentication": {
            symlink: true,
          },
        },
      },
    },
  },
};

export default config;
