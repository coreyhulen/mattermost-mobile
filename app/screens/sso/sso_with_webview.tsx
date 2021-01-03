// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import {Text, View} from 'react-native';
import CookieManager from 'react-native-cookies';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';
import {WebViewErrorEvent, WebViewMessageEvent, WebViewNavigation, WebViewNavigationEvent} from 'react-native-webview/lib/WebViewTypes';
import urlParse from 'url-parse';

import {Client4} from '@mm-redux/client';
import type {Theme} from '@mm-redux/types/preferences';

import Loading from 'app/components/loading';
import StatusBar from 'app/components/status_bar';
import {ViewTypes} from 'app/constants';
import {changeOpacity, makeStyleSheetFromTheme} from 'app/utils/theme';

const HEADERS = {
    'X-Mobile-App': 'mattermost',
};

const postMessageJS = "window.postMessage(document.body.innerText, '*');";

// Used to make sure that OneLogin forms scale appropriately on both platforms.
const oneLoginFormScalingJS = `
    (function() {
        var loginPage = document.getElementById('login-page');
        var submitButton = document.getElementById('user_submit');

        if (loginPage) {
            loginPage.setAttribute('style', 'background-repeat: repeat-y;');
        }
        
        function resetPadding() {
            var mainBody = document.getElementById('body-main');
            
            if (mainBody) {
                mainBody.setAttribute('style', 'height: auto; padding: 10px 0;');
            }

            if (submitButton) {
                submitButton.removeEventListener('click', resetPadding);
            }
        }

        resetPadding();
        
        if (submitButton) {
            submitButton.addEventListener('click', resetPadding);
        }
    })();
`;

interface SSOWithWebViewProps {
    completeUrlPath: string;
    loginError: string;
    loginUrl: string;
    onCSRFToken: (token: string) => void;
    onMMToken: (token: string) => void;
    serverUrl: string;
    ssoType: string;
    theme: Theme
}

type CookieResponseType = {
    MMAUTHTOKEN: string | {
        value: string
    };
    MMCSRF: string | {
        value: string
    };
}

function SSOWithWebView({completeUrlPath, loginError, loginUrl, onCSRFToken, onMMToken, serverUrl, ssoType, theme}: SSOWithWebViewProps) {
    const style = React.useMemo(() => getStyleSheet(theme), [theme]);

    const [error, setError] = React.useState(null);
    const [jsCode, setJSCode] = React.useState('');
    const [messagingEnabled, setMessagingEnabled] = React.useState(false);
    const [shouldRenderWebView, setShouldRenderWebView] = React.useState(true);
    const cookiesTimeout = React.useRef<number>();
    const webView = React.useRef<WebView>(null);

    React.useEffect(() => {
        return () => {
            if (cookiesTimeout.current) {
                clearTimeout(cookiesTimeout.current);
            }
        };
    });

    const extractCookie = (parsedUrl: urlParse) => {
        const original = urlParse(serverUrl);

        // Check whether we need to set a sub-path
        parsedUrl.set('pathname', original.pathname || '');

        // Rebuild the server url without query string and/or hash
        const url = `${parsedUrl.origin}${parsedUrl.pathname}`;
        Client4.setUrl(url);

        CookieManager.get(url, true).then((res: CookieResponseType) => {
            const mmtoken = res.MMAUTHTOKEN;
            const csrf = res.MMCSRF;
            const token = typeof mmtoken === 'object' ? mmtoken.value : mmtoken;
            const csrfToken = typeof csrf === 'object' ? csrf.value : csrf;

            if (csrfToken) {
                onCSRFToken(csrfToken);
            }
            if (token) {
                onMMToken(token);
                if (cookiesTimeout.current) {
                    clearTimeout(cookiesTimeout.current);
                }
                setShouldRenderWebView(false);
            } else if (webView.current && !error) {
                webView.current.injectJavaScript(postMessageJS);
                cookiesTimeout.current = setTimeout(extractCookie.bind(null, parsedUrl), 250);
            }
        });
    };

    const onMessage = (event: WebViewMessageEvent) => {
        try {
            const response = JSON.parse(event.nativeEvent.data);
            if (response) {
                const {
                    id,
                    message,
                    status_code: statusCode,
                } = response;
                if (id && message && statusCode !== 200) {
                    if (cookiesTimeout.current) {
                        clearTimeout(cookiesTimeout.current);
                    }
                    setError(message);
                }
            }
        } catch (e) {
            // do nothing
        }
    };

    const onNavigationStateChange = (navState: WebViewNavigation) => {
        const {url} = navState;
        let isMessagingEnabled = false;
        const parsed = urlParse(url);
        if (parsed.host.includes('.onelogin.com')) {
            setJSCode(oneLoginFormScalingJS);
        } else if (parsed.pathname === completeUrlPath) {
            // To avoid `window.postMessage` conflicts in any of the SSO flows
            // we enable the onMessage handler only When the webView navigates to the final SSO URL.
            isMessagingEnabled = true;
        }
        setMessagingEnabled(isMessagingEnabled);
    };

    const onLoadEnd = (event: WebViewNavigationEvent | WebViewErrorEvent) => {
        const url = event.nativeEvent.url;
        const parsed = urlParse(url);

        let isLastRedirect = url.includes(completeUrlPath);
        if (ssoType === ViewTypes.SAML) {
            isLastRedirect = isLastRedirect && !parsed.query;
        }

        if (isLastRedirect) {
            extractCookie(parsed);
        }
    };

    const renderWebView = () => {
        if (shouldRenderWebView) {
            return (
                <WebView
                    ref={webView}
                    source={{uri: loginUrl, headers: HEADERS}}
                    javaScriptEnabled={true}
                    automaticallyAdjustContentInsets={false}
                    startInLoadingState={true}
                    onNavigationStateChange={onNavigationStateChange}
                    onShouldStartLoadWithRequest={() => true}
                    injectedJavaScript={jsCode}
                    onLoadEnd={onLoadEnd}
                    onMessage={messagingEnabled ? onMessage : undefined}
                    useSharedProcessPool={false}
                    cacheEnabled={false}
                />
            );
        }
        return <Loading/>;
    };

    return (
        <SafeAreaView
            style={style.container}
            testID='sso.webview'
        >
            <StatusBar/>
            {error || loginError ? (
                <View style={style.errorContainer}>
                    <Text style={style.errorText}>{error || loginError}</Text>
                </View>
            ) : renderWebView()}
        </SafeAreaView>
    );
}

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

export default React.memo(SSOWithWebView);
