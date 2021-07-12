// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    Alert,
    ScrollView,
    View,
} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';

import {dismissModal, setButtons} from '@actions/navigation';
import FailedNetworkAction from '@components/failed_network_action';
import Loading from '@components/loading';
import Markdown from '@components/markdown';
import StatusBar from '@components/status_bar';
import {getMarkdownTextStyles, getMarkdownBlockStyles} from '@utils/markdown';
import {unsupportedServer} from '@utils/supported_server';
import {makeStyleSheetFromTheme} from '@utils/theme';

export default class TermsOfService extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            logout: PropTypes.func.isRequired,
            getTermsOfService: PropTypes.func.isRequired,
            updateMyTermsOfServiceStatus: PropTypes.func.isRequired,
        }).isRequired,
        componentId: PropTypes.string,
        closeButton: PropTypes.object,
        isSupportedServer: PropTypes.bool,
        isSystemAdmin: PropTypes.bool,
        siteName: PropTypes.string,
        theme: PropTypes.object,
    };

    static contextTypes = {
        intl: intlShape,
    };

    static defaultProps = {
        siteName: 'Mattermost',
    };

    leftButton = {
        id: 'reject-terms-of-service',
    };

    rightButton = {
        id: 'accept-terms-of-service',
        showAsAction: 'always',
    };

    constructor(props, context) {
        super(props);

        this.state = {
            getTermsError: false,
            loading: true,
            termsId: '',
            termsText: '',
        };

        this.rightButton.text = context.intl.formatMessage({id: 'terms_of_service.agreeButton', defaultMessage: 'I Agree'});
        this.rightButton.color = props.theme.sidebarHeaderTextColor;
        this.leftButton.icon = props.closeButton;

        this.setNavigatorButtons(false);
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);

        this.getTerms();
    }

    navigationButtonPressed({buttonId}) {
        switch (buttonId) {
        case 'close-terms-of-service':
            this.closeTermsAndLogout();
            break;

        case 'reject-terms-of-service':
            this.handleRejectTerms();
            break;

        case 'accept-terms-of-service':
            this.handleAcceptTerms();
            break;
        }
    }

    setNavigatorButtons = (enabled = true) => {
        const {componentId} = this.props;
        const buttons = {
            leftButtons: [{...this.leftButton, enabled}],
            rightButtons: [{...this.rightButton, enabled}],
        };

        setButtons(componentId, buttons);
    };

    enableNavigatorLogout = () => {
        const buttons = {
            leftButtons: [{...this.leftButton, id: 'close-terms-of-service', enabled: true}],
            rightButtons: [{...this.rightButton, enabled: false}],
        };

        setButtons(buttons);
    };

    closeTermsAndLogout = async () => {
        const {actions} = this.props;

        actions.logout();
    };

    getTerms = async () => {
        const {actions} = this.props;

        this.setState({
            termsId: '',
            termsText: '',
            loading: true,
            getTermsError: false,
        });
        this.setNavigatorButtons(false);

        const {data} = await actions.getTermsOfService();
        if (data) {
            this.setState({
                termsId: data.id,
                termsText: data.text,
                loading: false,
            }, () => {
                this.setNavigatorButtons(true);
            });
        } else {
            this.setState({
                loading: false,
                getTermsError: true,
            });
            this.enableNavigatorLogout();
        }
    };

    handleAcceptTerms = () => {
        const onSuccess = () => {
            const {isSupportedServer, isSystemAdmin} = this.props;
            dismissModal();

            if (!isSupportedServer) {
                unsupportedServer(isSystemAdmin, this.context.intl.formatMessage);
            }
        };

        this.registerUserAction(
            true,
            onSuccess,
            this.handleAcceptTerms,
        );
    };

    handleRejectTerms = () => {
        const {siteName} = this.props;
        const {intl} = this.context;

        this.registerUserAction(
            false,
            () => {
                Alert.alert(
                    this.props.siteName,
                    intl.formatMessage({
                        id: 'mobile.terms_of_service.terms_rejected',
                        defaultMessage: 'You must agree to the terms of service before accessing {siteName}. Please contact your System Administrator for more details.',
                    }, {
                        siteName,
                    }),
                    [{
                        text: intl.formatMessage({id: 'mobile.terms_of_service.alert_ok', defaultMessage: 'OK'}),
                        onPress: this.closeTermsAndLogout,
                    }],
                );
            },
            this.handleRejectTerms,
        );
    };

    registerUserAction = async (accepted, success, retry) => {
        const {actions} = this.props;
        const {intl} = this.context;

        this.setNavigatorButtons(false);
        this.setState({
            loading: true,
        });

        const {data} = await actions.updateMyTermsOfServiceStatus(this.state.termsId, accepted);
        this.setState({
            loading: false,
        });

        if (data) {
            success(data);
            this.setNavigatorButtons(true);
        } else {
            Alert.alert(
                this.props.siteName,
                intl.formatMessage({
                    id: 'terms_of_service.api_error',
                    defaultMessage: 'Unable to complete the request. If this issue persists, contact your System Administrator.',
                }),
                [{
                    text: intl.formatMessage({id: 'mobile.terms_of_service.alert_cancel', defaultMessage: 'Cancel'}),
                    style: 'cancel',
                    onPress: this.closeTermsAndLogout,
                }, {
                    text: intl.formatMessage({id: 'mobile.terms_of_service.alert_retry', defaultMessage: 'Try Again'}),
                    onPress: retry,
                }],
            );
        }
    };

    render() {
        const {theme} = this.props;
        const styles = getStyleSheet(theme);

        const blockStyles = getMarkdownBlockStyles(theme);
        const textStyles = getMarkdownTextStyles(theme);

        if (this.state.loading) {
            return <Loading color={theme.centerChannelColor}/>;
        }

        if (this.state.getTermsError) {
            return (
                <View style={styles.container}>
                    <StatusBar/>
                    <FailedNetworkAction
                        onRetry={this.getTerms}
                        theme={theme}
                    />
                </View>
            );
        }

        return (
            <SafeAreaView style={styles.container}>
                <StatusBar/>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                >
                    <Markdown
                        baseTextStyle={styles.baseText}
                        textStyles={textStyles}
                        blockStyles={blockStyles}
                        value={this.state.termsText}
                        disableHashtags={true}
                        disableAtMentions={true}
                        disableChannelLink={true}
                        disableGallery={true}
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        baseText: {
            color: theme.centerChannelColor,
            fontSize: 15,
            lineHeight: 20,
        },
        container: {
            flex: 1,
        },
        scrollView: {
            flex: 1,
            backgroundColor: theme.centerChannelBg,
            padding: 30,
        },
        scrollViewContent: {
            paddingBottom: 50,
        },
    };
});
