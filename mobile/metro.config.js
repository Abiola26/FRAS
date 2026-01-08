const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for solving modules with .ts and .tsx extensions
config.resolver.sourceExts.push('ts', 'tsx', 'js', 'jsx', 'json');

module.exports = config;
