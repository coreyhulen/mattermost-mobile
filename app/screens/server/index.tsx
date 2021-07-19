// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useManagedConfig, ManagedConfig} from '@mattermost/react-native-emm';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useIntl} from 'react-intl';
import {
    ActivityIndicator, EventSubscription, Image, Keyboard, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, TextInput, TouchableWithoutFeedback, View,
} from 'react-native';
import Button from 'react-native-button';
import {Navigation, NavigationFunctionComponent} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';

import {doPing} from '@actions/remote/general';
import {fetchConfigAndLicense} from '@actions/remote/systems';
import LocalConfig from '@assets/config.json';
import AppVersion from '@components/app_version';
import ErrorText, {ClientErrorWithIntl} from '@components/error_text';
import FormattedText from '@components/formatted_text';
import {Screens} from '@constants';
import NetworkManager from '@init/network_manager';
import {goToScreen} from '@screens/navigation';
import {isMinimumServerVersion} from '@utils/helpers';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {getServerUrlAfterRedirect, isValidUrl, sanitizeUrl} from '@utils/url';

import {DeepLinkWithData, LaunchProps, LaunchType} from '@typings/launch';

interface ServerProps extends LaunchProps {
    componentId: string;
    theme: Theme;
}

let cancelPing: undefined | (() => void);

const Server: NavigationFunctionComponent = ({componentId, extra, launchType, launchError, theme}: ServerProps) => {
    // TODO: If we have LaunchProps, ensure they get passed along to subsequent screens
    // so that they are eventually accessible in the Channel screen.

    const intl = useIntl();
    const managedConfig = useManagedConfig<ManagedConfig>();
    const input = useRef<TextInput>(null);
    const [connecting, setConnecting] = useState(false);
    const initialError = launchError && launchType === LaunchType.Notification ? intl.formatMessage({
        id: 'mobile.launchError.notification',
        defaultMessage: 'Did not find a server for this notification',
    }) : undefined;
    const [error, setError] = useState<ClientErrorWithIntl|string|undefined>(initialError);

    const [url, setUrl] = useState<string>('');
    const styles = getStyleSheet(theme);
    const {formatMessage} = intl;

    const displayLogin = (serverUrl: string, config: ClientConfig, license: ClientLicense) => {
        const samlEnabled = config.EnableSaml === 'true' && license.IsLicensed === 'true' && license.SAML === 'true';
        const gitlabEnabled = config.EnableSignUpWithGitLab === 'true';
        const googleEnabled = config.EnableSignUpWithGoogle === 'true' && license.IsLicensed === 'true';
        const o365Enabled = config.EnableSignUpWithOffice365 === 'true' && license.IsLicensed === 'true' && license.Office365OAuth === 'true';
        const openIdEnabled = config.EnableSignUpWithOpenId === 'true' && license.IsLicensed === 'true' && isMinimumServerVersion(config.Version, 5, 33, 0);

        let screen = Screens.LOGIN;
        let title = formatMessage({id: 'mobile.routes.login', defaultMessage: 'Login'});
        if (samlEnabled || gitlabEnabled || googleEnabled || o365Enabled || openIdEnabled) {
            screen = Screens.LOGIN_OPTIONS;
            title = formatMessage({id: 'mobile.routes.loginOptions', defaultMessage: 'Login Chooser'});
        }

        const {allowOtherServers} = managedConfig;
        let visible = !LocalConfig.AutoSelectServerUrl;

        if (allowOtherServers === 'false') {
            visible = false;
        }

        const passProps = {
            config,
            extra,
            launchError,
            launchType,
            license,
            theme,
            serverUrl,
        };

        const defaultOptions = {
            popGesture: visible,
            topBar: {
                visible,
                height: visible ? null : 0,
            },
        };

        goToScreen(screen, title, passProps, defaultOptions);
        setConnecting(false);
        setUrl(serverUrl);
    };

    const handleConnect = preventDoubleTap((manualUrl?: string) => {
        if (connecting && cancelPing) {
            cancelPing();
            return;
        }

        let serverUrl = typeof manualUrl === 'string' ? manualUrl : url;
        if (!serverUrl || serverUrl.trim() === '') {
            setError(intl.formatMessage({
                id: 'mobile.server_url.empty',
                defaultMessage: 'Please enter a valid server URL',
            }));

            return;
        }

        serverUrl = sanitizeUrl(serverUrl);
        if (!isValidUrl(serverUrl)) {
            setError(formatMessage({
                id: 'mobile.server_url.invalid_format',
                defaultMessage: 'URL must start with http:// or https://',
            }));

            return;
        }

        pingServer(serverUrl);
    });

    const pingServer = async (pingUrl: string, retryWithHttp = true) => {
        let canceled = false;
        setConnecting(true);
        setError(undefined);

        cancelPing = () => {
            // We should not need this once we have the cancelable network-client library
            canceled = true;
            setConnecting(false);
            cancelPing = undefined;
        };

        const serverUrl = await getServerUrlAfterRedirect(pingUrl, !retryWithHttp);
        const result = await doPing(serverUrl);

        if (canceled) {
            return;
        }

        if (result.error) {
            if (retryWithHttp) {
                const nurl = serverUrl.replace('https:', 'http:');
                pingServer(nurl, false);
            } else {
                setError(result.error);
                setConnecting(false);
            }

            return;
        }

        const data = await fetchConfigAndLicense(serverUrl);
        if (data.error) {
            setError(data.error);
            setConnecting(false);
            return;
        }

        displayLogin(serverUrl, data.config!, data.license!);
    };

    const blur = useCallback(() => {
        input.current?.blur();
    }, []);

    const handleTextChanged = useCallback((text: string) => {
        setUrl(text);
    }, []);

    useEffect(() => {
        let listener: EventSubscription;
        if (Platform.OS === 'android') {
            listener = Keyboard.addListener('keyboardDidHide', blur);
        }

        return () => listener?.remove();
    }, []);

    useEffect(() => {
        let serverUrl = managedConfig?.serverUrl || LocalConfig.DefaultServerUrl;
        let autoconnect = managedConfig?.allowOtherServers === 'false' || LocalConfig.AutoSelectServerUrl;

        if (launchType === LaunchType.DeepLink) {
            const deepLinkServerUrl = (extra as DeepLinkWithData).data?.serverUrl;
            if (managedConfig) {
                autoconnect = (managedConfig.allowOtherServers === 'false' && managedConfig.serverUrl === deepLinkServerUrl);
                if (managedConfig.serverUrl !== deepLinkServerUrl || launchError) {
                    setError(intl.formatMessage({
                        id: 'mobile.server_url.deeplink.emm.denied',
                        defaultMessage: 'This app is controlled by an EMM and the DeepLink server url does not match the EMM allowed server',
                    }));
                }
            } else {
                autoconnect = true;
                serverUrl = deepLinkServerUrl;
            }
        }

        if (serverUrl) {
            // If a server Url is set by the managed or local configuration, use it.
            setUrl(serverUrl);

            if (autoconnect) {
                // If no other servers are allowed or the local config for AutoSelectServerUrl is set, attempt to connect
                handleConnect(managedConfig?.serverUrl || LocalConfig.DefaultServerUrl);
            }
        }
    }, []);

    useEffect(() => {
        const listener = {
            componentDidAppear: () => {
                if (url) {
                    NetworkManager.invalidateClient(url);
                }
            },
        };
        const unsubscribe = Navigation.events().registerComponentListener(listener, componentId);

        return () => unsubscribe.remove();
    }, [componentId, url]);

    let buttonIcon;
    let buttonText;

    if (connecting) {
        buttonIcon = (
            <ActivityIndicator
                animating={true}
                size='small'
                color={theme.buttonBg}
                style={styles.connectingIndicator}
            />
        );
        buttonText = (
            <FormattedText
                id='mobile.components.select_server_view.connecting'
                defaultMessage='Connecting...'
                style={styles.connectText}
            />
        );
    } else {
        buttonText = (
            <FormattedText
                id='mobile.components.select_server_view.connect'
                defaultMessage='Connect'
                style={styles.connectText}
            />
        );
    }

    const barStyle = Platform.OS === 'android' ? 'light-content' : 'dark-content';
    const inputDisabled = managedConfig.allowOtherServers === 'false' || connecting;

    const inputStyle = [styles.inputBox];
    if (inputDisabled) {
        inputStyle.push(styles.disabledInput);
    }

    return (
        <SafeAreaView
            testID='select_server.screen'
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior='padding'
                style={styles.flex}
                keyboardVerticalOffset={0}
                enabled={Platform.OS === 'ios'}
            >
                <StatusBar barStyle={barStyle}/>
                <TouchableWithoutFeedback
                    onPress={blur}
                    accessible={false}
                >
                    <View style={styles.formContainer}>
                        <Image
                            source={require('@assets/images/logo.png')}
                            style={styles.logo}
                        />

                        <View testID='select_server.header.text'>
                            <FormattedText
                                style={styles.header}
                                id='mobile.components.select_server_view.enterServerUrl'
                                defaultMessage='Enter Server URL'
                            />
                        </View>
                        <TextInput
                            testID='select_server.server_url.input'
                            ref={input}
                            value={url}
                            editable={!inputDisabled}
                            onChangeText={handleTextChanged}
                            onSubmitEditing={handleConnect}
                            style={StyleSheet.flatten(inputStyle)}
                            autoCapitalize='none'
                            autoCorrect={false}
                            keyboardType='url'
                            placeholder={formatMessage({
                                id: 'mobile.components.select_server_view.siteUrlPlaceholder',
                                defaultMessage: 'https://mattermost.example.com',
                            })}
                            placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                            returnKeyType='go'
                            underlineColorAndroid='transparent'
                            disableFullscreenUI={true}
                        />
                        <Button
                            testID='select_server.connect.button'
                            onPress={handleConnect}
                            containerStyle={styles.connectButton}
                        >
                            {buttonIcon}
                            {buttonText}
                        </Button>
                        {Boolean(error) &&
                        <View>
                            <ErrorText
                                testID='select_server.error.text'
                                error={error!}
                                theme={theme}
                            />
                        </View>
                        }
                    </View>
                </TouchableWithoutFeedback>
                <AppVersion/>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.centerChannelBg,
    },
    flex: {
        flex: 1,
    },
    formContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 15,
        paddingLeft: 15,
    },
    disabledInput: {
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
    },
    connectButton: {
        borderRadius: 3,
        borderColor: theme.buttonBg,
        alignItems: 'center',
        borderWidth: 1,
        alignSelf: 'stretch',
        marginTop: 10,
        padding: 15,
    },
    connectingIndicator: {
        marginRight: 5,
    },
    inputBox: {
        fontSize: 16,
        height: 45,
        borderColor: theme.centerChannelColor,
        borderWidth: 1,
        marginTop: 5,
        marginBottom: 5,
        paddingLeft: 10,
        alignSelf: 'stretch',
        borderRadius: 3,
        color: theme.centerChannelColor,
    },
    logo: {
        height: 72,
        resizeMode: 'contain',
    },
    header: {
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 15,
        fontSize: 20,
        fontWeight: '400',
    },
    connectText: {
        textAlign: 'center',
        color: theme.buttonBg,
        fontSize: 17,
    },
}));

export default Server;
