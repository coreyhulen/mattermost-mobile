// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
    env: {
        production: {
            plugins: ['transform-remove-console'],
        },
    },
    plugins: [
        '@babel/plugin-transform-runtime',
        ['module-resolver', {
            root: ['.'],
            alias: {
                '@assets': './dist/assets',
                '@actions': './app/actions',
                '@client': './app/client',
                '@components': './app/components',
                '@constants': './app/constants',
                '@hooks': './app/hooks',
                '@i18n': './app/i18n',
                '@init': './app/init',
                '@mattermost-managed': './app/mattermost_managed/index',
                '@mm-redux': './app/mm-redux',
                '@share': './share_extension',
                '@screens': './app/screens',
                '@selectors': './app/selectors',
                '@store': './app/store',
                '@telemetry': './app/telemetry',
                '@test': './test',
                '@mm-types': './types',
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
