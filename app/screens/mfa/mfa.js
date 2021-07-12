// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    ActivityIndicator,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Button from 'react-native-button';
import {SafeAreaView} from 'react-native-safe-area-context';

import ErrorText from '@components/error_text';
import FormattedText from '@components/formatted_text';
import StatusBar from '@components/status_bar';
import TextInputWithLocalizedPlaceholder from '@components/text_input_with_localized_placeholder';
import {t} from '@utils/i18n';
import {preventDoubleTap} from '@utils/tap';

import {GlobalStyles} from 'app/styles';

export default class Mfa extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            login: PropTypes.func.isRequired,
        }).isRequired,
        goToChannel: PropTypes.func.isRequired,
        loginId: PropTypes.string.isRequired,
        password: PropTypes.string.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            token: '',
            error: null,
            isLoading: false,
        };
    }

    componentDidMount() {
        if (Platform.OS === 'android') {
            Keyboard.addListener('keyboardDidHide', this.handleAndroidKeyboard);
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            Keyboard.removeListener('keyboardDidHide', this.handleAndroidKeyboard);
        }
    }

    handleAndroidKeyboard = () => {
        this.blur();
    };

    handleInput = (token) => {
        this.setState({
            token,
            error: null,
        });
    };

    inputRef = (ref) => {
        this.textInput = ref;
    };

    blur = () => {
        this.textInput.blur();
    };

    submit = preventDoubleTap(() => {
        const {actions, goToChannel, loginId, password} = this.props;
        const {token} = this.state;

        Keyboard.dismiss();
        if (!token) {
            this.setState({
                error: {
                    intl: {
                        id: t('login_mfa.tokenReq'),
                        defaultMessage: 'Please enter an MFA token',
                    },
                },
            });
            return;
        }

        this.setState({isLoading: true});
        actions.login(loginId, password, token).then((result) => {
            this.setState({isLoading: false});
            if (result.error) {
                this.setState({error: result.error});
                return;
            }

            goToChannel();
        });
    });

    render() {
        const {isLoading} = this.state;

        let proceed;
        if (isLoading) {
            proceed = (
                <ActivityIndicator
                    animating={true}
                    size='small'
                />
            );
        } else {
            proceed = (
                <Button
                    onPress={this.submit}
                    loading={false}
                    containerStyle={GlobalStyles.signupButton}
                >
                    <FormattedText
                        style={GlobalStyles.signupButtonText}
                        id='mobile.components.select_server_view.proceed'
                        defaultMessage='Proceed'
                    />
                </Button>
            );
        }

        return (
            <SafeAreaView
                testID='mfa.screen'
                style={style.flex}
            >
                <KeyboardAvoidingView
                    behavior='padding'
                    style={style.flex}
                    keyboardVerticalOffset={5}
                    enabled={Platform.OS === 'ios'}
                >
                    <StatusBar/>
                    <TouchableWithoutFeedback onPress={this.blur}>
                        <View style={[GlobalStyles.container, GlobalStyles.signupContainer]}>
                            <Image
                                source={require('@assets/images/logo.png')}
                                style={{height: 72, resizeMode: 'contain'}}
                            />
                            <View>
                                <FormattedText
                                    style={[GlobalStyles.header, GlobalStyles.label]}
                                    id='login_mfa.enterToken'
                                    defaultMessage="To complete the sign in process, please enter a token from your smartphone's authenticator"
                                />
                            </View>
                            <ErrorText
                                testID='mfa.error.text'
                                error={this.state.error}
                            />
                            <TextInputWithLocalizedPlaceholder
                                ref={this.inputRef}
                                value={this.state.token}
                                onChangeText={this.handleInput}
                                onSubmitEditing={this.submit}
                                style={GlobalStyles.inputBox}
                                autoCapitalize='none'
                                autoCorrect={false}
                                keyboardType='numeric'
                                placeholder={{id: t('login_mfa.token'), defaultMessage: 'MFA Token'}}
                                returnKeyType='go'
                                underlineColorAndroid='transparent'
                                disableFullscreenUI={true}
                            />
                            {proceed}
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }
}

const style = StyleSheet.create({
    flex: {
        flex: 1,
    },
});
