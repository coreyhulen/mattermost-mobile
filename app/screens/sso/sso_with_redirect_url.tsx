// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import {intlShape} from 'react-intl';
import {Linking, Platform, Text, TouchableOpacity, View} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {SafeAreaView} from 'react-native-safe-area-context';
import urlParse from 'url-parse';

import {setDeepLinkURL} from '@actions/views/root';
import FormattedText from '@components/formatted_text';
import Loading from '@components/loading';
import {Theme} from '@mm-redux/types/preferences';
import Store from '@store/store';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {tryOpenURL} from '@utils/url';

interface SSOWithRedirectURLProps {
    intl: typeof intlShape;
    loginError: string;
    loginUrl: string;
    onCSRFToken: (token: string) => void;
    onMMToken: (token: string) => void;
    setLoginError: (value: string) => void;
    theme: Theme;
}

function SSOWithRedirectURL({
    intl,
    loginError,
    loginUrl,
    onCSRFToken,
    onMMToken,
    setLoginError,
    theme,
}: SSOWithRedirectURLProps) {
    const [error, setError] = React.useState<string>('');
    const style = getStyleSheet(theme);

    let customUrlScheme = 'mmauth://';
    if (DeviceInfo.getBundleId && DeviceInfo.getBundleId().includes('rnbeta')) {
        customUrlScheme = 'mmauthbeta://';
    }

    const redirectUrl = customUrlScheme + 'callback';

    const init = (resetErrors?: boolean) => {
        if (resetErrors !== false) {
            setError('');
            setLoginError('');
        }
        const parsedUrl = urlParse(loginUrl, true);
        parsedUrl.set('query', {
            ...parsedUrl.query,
            redirect_to: redirectUrl,
        });
        const url = parsedUrl.toString();

        const onError = (e: Error) => {
            let message;
            if (e && Platform.OS === 'android' && e?.message?.match(/no activity found to handle intent/i)) {
                message = intl.formatMessage({
                    id: 'mobile.oauth.failed_to_open_link_no_browser',
                    defaultMessage: 'The link failed to open. Please verify if a browser is installed in the current space.',
                });
            } else {
                message = intl.formatMessage({
                    id: 'mobile.oauth.failed_to_open_link',
                    defaultMessage: 'The link failed to open. Please try again.',
                });
            }
            setError(
                message,
            );
        };
        tryOpenURL(url, onError);
    };

    const onURLChange = ({url}: { url: string }) => {
        if (url && url.startsWith(redirectUrl)) {
            Store?.redux?.dispatch(setDeepLinkURL(''));
            const parsedUrl = urlParse(url, true);
            if (parsedUrl.query && parsedUrl.query.MMCSRF && parsedUrl.query.MMAUTHTOKEN) {
                onCSRFToken(parsedUrl.query.MMCSRF);
                onMMToken(parsedUrl.query.MMAUTHTOKEN);
            } else {
                setError(
                    intl.formatMessage({
                        id: 'mobile.oauth.failed_to_login',
                        defaultMessage: 'Your login attempt failed. Please try again.',
                    }),
                );
            }
        }
    };

    React.useEffect(() => {
        Linking.addEventListener('url', onURLChange);
        init(false);
        return () => {
            Linking.removeEventListener('url', onURLChange);
        };
    }, []);

    return (
        <SafeAreaView
            style={style.container}
            testID='sso.redirect_url'
        >
            {loginError || error ? (
                <View style={style.errorContainer}>
                    <View style={style.errorTextContainer}>
                        <Text style={style.errorText}>
                            {`${loginError || error}.`}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => init()}>
                        <FormattedText
                            id='mobile.oauth.try_again'
                            defaultMessage='Try again'
                            style={style.button}
                        />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={style.infoContainer}>
                    <FormattedText
                        id='mobile.oauth.switch_to_browser'
                        defaultMessage='Please use your browser to complete the login'
                        style={style.infoText}
                    />
                    <TouchableOpacity onPress={() => init()}>
                        <FormattedText
                            id='mobile.oauth.restart_login'
                            defaultMessage='Restart login'
                            style={style.button}
                        />
                    </TouchableOpacity>
                    <Loading/>
                </View>
            )}
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
        errorTextContainer: {
            marginBottom: 12,
        },
        errorText: {
            color: changeOpacity(theme.centerChannelColor, 0.6),
            fontSize: 16,
            fontWeight: '400',
            lineHeight: 23,
            textAlign: 'center',
        },
        infoContainer: {
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
            marginTop: 40,
        },
        infoText: {
            color: changeOpacity(theme.centerChannelColor, 0.6),
            fontSize: 16,
            fontWeight: '400',
            lineHeight: 23,
            marginBottom: 6,
        },
        button: {
            backgroundColor: theme.buttonBg,
            color: theme.buttonColor,
            fontSize: 16,
            paddingHorizontal: 9,
            paddingVertical: 9,
            marginTop: 3,
        },
    };
});

export default SSOWithRedirectURL;
