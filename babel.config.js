// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
module.exports = {
    presets: [
        'module:metro-react-native-babel-preset',
        '@babel/preset-typescript',
        ['@babel/preset-env', {targets: {node: 'current'}}],
    ],
    env: {
        production: {
            plugins: ['transform-remove-console'],
        },
    },
    plugins: [
        '@babel/plugin-transform-runtime',
        ['@babel/plugin-proposal-decorators', {legacy: true}],
        ['@babel/plugin-transform-flow-strip-types'],
        ['@babel/plugin-proposal-class-properties', {loose: true}],
        ['module-resolver', {
            root: ['.'],
            alias: {
                '@actions': './app/actions',
                '@app': './app/',
                '@assets': './dist/assets',
                '@client': './app/client',
                '@contexts': './app/contexts',
                '@components': './app/components',
                '@constants': './app/constants',
                '@context': './app/context',
                '@database': './app/database',
                '@helpers': './app/helpers',
                '@i18n': './app/i18n',
                '@init': './app/init',
                '@hooks': './app/hooks',
                '@notifications': './app/notifications',
                '@queries': './app/queries',
                '@screens': './app/screens',
                '@share': './share_extension',
                '@store': './app/store',
                '@telemetry': './app/telemetry',
                '@test': './test',
                '@typings': './types',
                '@utils': './app/utils',
                '@websocket': './app/client/websocket',
            },
        }],
        ['module:react-native-dotenv', {
            moduleName: '@env',
            path: '.env',
            blacklist: null,
            whitelist: null,
            safe: false,
            allowUndefined: true,
        }],
        'react-native-reanimated/plugin',
    ],
    exclude: ['**/*.png', '**/*.jpg', '**/*.gif'],
};
