/**
 * Metro configuration for React Native
 * https://facebook.github.io/metro/docs/configuration
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Add shared directory to watched folders
defaultConfig.watchFolders = [
  ...defaultConfig.watchFolders,
  path.resolve(__dirname, 'shared')
];

// Ensure Metro can resolve modules from shared directory
defaultConfig.resolver.nodeModulesPaths = [
  ...defaultConfig.resolver.nodeModulesPaths,
  path.resolve(__dirname, 'shared')
];

module.exports = defaultConfig;