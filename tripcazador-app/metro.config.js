const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// SSS357: support SVG transformer si añadimos react-native-svg-transformer en el futuro
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

module.exports = config;
