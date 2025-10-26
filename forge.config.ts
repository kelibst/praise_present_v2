import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';

const config: ForgeConfig = {
  packagerConfig: {
    asar: {
      unpack: "*.{node,dll}",  // Only unpack native modules for better compression
    },
    icon: './assets/icon',  // Will use icon.ico on Windows
    extraResource: [
      './prisma/empty.db',  // Ship empty database with schema (364 KB instead of 100+ MB)
      './node_modules/.prisma/client'
    ],
    ignore: [
      /^\/src/,
      /^\/scripts/,
      /^\/plan/,
      /^\/.git/,
      /^\/out/,
      /^\/dist/,
      /tsconfig\.json$/,
      /tsconfig\.tsbuildinfo$/,
      /vite\..*\.config\.ts$/,
      /forge\.config\.ts$/,
      /\.md$/,
      /\.gitignore$/,
      /eslint/,
      // Additional size optimizations
      /node_modules\/.*\/(test|tests|__tests__|spec|specs|__spec__|coverage)/,
      /node_modules\/.*\/(docs|documentation|examples|example)/,
      /node_modules\/.*\.(md|markdown|txt)$/i,
      /node_modules\/.*\.d\.ts\.map$/,  // TypeScript declaration maps
      /node_modules\/.*\/\..*$/,         // Hidden files in node_modules
      /\.map$/,                           // Source maps
      /CHANGELOG/i,
      /LICENSE-.*$/,
      /AUTHORS/,
      /CONTRIBUTORS/,
      /^\/prisma\/dev\.db$/,              // Explicitly exclude dev database
      /^\/prisma\/.*\.db$/,                // Exclude all .db files
    ]
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      // Icon configuration
      setupIcon: './assets/icon.ico',
      iconUrl: 'https://raw.githubusercontent.com/yourusername/praisepresent/main/assets/icon.ico',  // For auto-updates (update this URL)

      // Installer metadata
      name: 'PraisePresent',
      authors: 'Keli Booster',
      description: 'PowerPoint-style presentation software for church services',

      // Better installer name
      setupExe: 'PraisePresentSetup.exe',

      // Loading animation (optional - will create this)
      loadingGif: undefined,  // './assets/installing.gif' if created
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({})
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: false, // Changed to false to allow loading native modules
    }),
  ],
};

export default config;
