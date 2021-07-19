// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import {shallowEqual, useSelector} from 'react-redux';

import type {GlobalState} from '@mm-redux/types/store';

import {getTheme} from '@mm-redux/selectors/entities/preferences';

import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';

import type {Theme} from '@mm-redux/types/preferences';

import StatusBar from 'app/components/status_bar';
import {changeOpacity, makeStyleSheetFromTheme} from 'app/utils/theme';

const HEADERS = {
    'X-Mobile-App': 'mattermost',
};

interface PluginProps {
    link: string;
}

function Plugin({link}: PluginProps) {
    const [theme] = useSelector((state: GlobalState) => ([
        getTheme(state),
    ]), shallowEqual);

    const style = getStyleSheet(theme);

    const renderWebView = () => {
        const userAgent = 'Mozilla/5.0 (Linux; Android 10; Android SDK built for x86 Build/LMY48X) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/81.0.4044.117 Mobile Safari/608.2.11';
        return (
            <WebView
                automaticallyAdjustContentInsets={false}
                cacheEnabled={false}
                javaScriptEnabled={true}
                onShouldStartLoadWithRequest={() => true}
                source={{uri: link, headers: HEADERS}}
                startInLoadingState={true}
                userAgent={userAgent}
                useSharedProcessPool={false}
            />
        );
    };

    return (
        <SafeAreaView
            style={style.container}
            testID='plugin.webview'
        >
            <StatusBar/>
            {renderWebView()}
        </SafeAreaView>
    );
}

export default Plugin;

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            flex: 1,
        },
        errorContainer: {
            alignItems: 'center',
            flex: 1,
            marginTop: 40,
        },
        errorText: {
            color: changeOpacity(theme.centerChannelColor, 0.4),
            fontSize: 16,
            fontWeight: '400',
            lineHeight: 23,
            paddingHorizontal: 30,
        },
    };
});

