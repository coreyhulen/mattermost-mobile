// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import * as Sentry from '@sentry/react-native';

import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    Text,
    View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {dismissAllModals, goToScreen} from '@actions/navigation';
import Config from '@assets/config';
import StatusBar from '@components/status_bar';
import {getFormattedFileSize} from '@mm-redux/utils/file_utils';
import SettingsItem from '@screens/settings/settings_item';
import {deleteFileCache, getFileCacheSize} from '@utils/file';
import {t} from '@utils/i18n';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

class AdvancedSettings extends Component {
    static propTypes = {
        actions: PropTypes.shape({
            purgeOfflineStore: PropTypes.func.isRequired,
        }).isRequired,
        intl: intlShape.isRequired,
        theme: PropTypes.object,
    };

    state = {
        cacheSize: null,
        cacheSizedFetched: false,
    };

    componentDidMount() {
        this.getDownloadCacheSize();
    }

    shouldComponentUpdate(nextProps) {
        return this.props.theme === nextProps.theme;
    }

    clearOfflineCache = preventDoubleTap(() => {
        const {formatMessage} = this.props.intl;

        Alert.alert(
            formatMessage({id: t('mobile.advanced_settings.delete_title'), defaultMessage: 'Delete Documents & Data'}),
            formatMessage({id: t('mobile.advanced_settings.delete_message'), defaultMessage: '\nThis will reset all offline data and restart the app. You will be automatically logged back in once the app restarts.\n'}),
            [{
                text: formatMessage({id: 'channel_modal.cancel', defaultMessage: 'Cancel'}),
                style: 'cancel',
                onPress: () => true,
            }, {
                text: formatMessage({id: 'mobile.advanced_settings.delete', defaultMessage: 'Delete'}),
                style: 'destructive',
                onPress: this.purgeDocumentsAndData,
            }],
            {cancelable: false},
        );
    });

    getDownloadCacheSize = async () => {
        const size = await getFileCacheSize();
        this.setState({cacheSize: size, cacheSizedFetched: true});
    };

    purgeDocumentsAndData = preventDoubleTap(async () => {
        const {actions} = this.props;

        await deleteFileCache();
        this.setState({cacheSize: 0, cacheSizedFetched: true});
        actions.purgeOfflineStore();

        dismissAllModals();
    });

    renderCacheFileSize = () => {
        const {theme} = this.props;
        const {cacheSize, cacheSizedFetched} = this.state;
        const style = getStyleSheet(theme);

        let component;
        if (cacheSize === null) {
            component = (
                <ActivityIndicator
                    size='small'
                    color={theme.centerChannelColor}
                />
            );
        } else if (cacheSizedFetched) {
            component = (
                <Text style={style.cacheSize}>
                    {getFormattedFileSize({size: cacheSize})}
                </Text>
            );
        }

        return component;
    };

    renderSentryDebugOptions = () => {
        if (!Config.ShowSentryDebugOptions) {
            return null;
        }

        const {theme} = this.props;
        const style = getStyleSheet(theme);

        return (
            <View>
                <SettingsItem
                    defaultMessage='Throw JavaScript Exception'
                    iconName='alert-circle-outline'
                    onPress={Sentry.crash}
                    separator={false}
                    showArrow={false}
                    theme={theme}
                />
                <View style={style.divider}/>
                <SettingsItem
                    defaultMessage='Throw Native Exception'
                    iconName='alert-outline'
                    onPress={Sentry.nativeCrash}
                    separator={false}
                    showArrow={false}
                    theme={theme}
                />
                <View style={style.divider}/>
            </View>
        );
    };

    showPerfMetrics = preventDoubleTap(() => {
        goToScreen('PerfMetrics', 'Performance Metrics');
    });

    render() {
        const {theme} = this.props;
        const style = getStyleSheet(theme);

        return (
            <SafeAreaView
                edges={['left', 'right']}
                style={style.container}
                testID='advanced_settings.screen'
            >
                <StatusBar/>
                <ScrollView
                    contentContainerStyle={style.wrapper}
                    alwaysBounceVertical={false}
                    testID='advanced_settings.scroll_view'
                >
                    <View style={style.divider}/>
                    <SettingsItem
                        defaultMessage='Delete Documents & Data'
                        i18nId='mobile.advanced_settings.delete_title'
                        iconName='trash-can-outline'
                        isDestructor={true}
                        onPress={this.clearOfflineCache}
                        separator={Boolean(Config.ShowPerformanceMarkers)}
                        showArrow={false}
                        rightComponent={this.renderCacheFileSize()}
                        theme={theme}
                        testID='advanced_settings.delete_documents_and_data.action'
                    />
                    {Config.ShowPerformanceMarkers &&
                    <SettingsItem
                        defaultMessage='Performance Metrics'
                        i18nId='mobile.advanced_settings.performance_title'
                        iconName='chart-bar'
                        isDestructor={false}
                        onPress={this.showPerfMetrics}
                        separator={false}
                        showArrow={true}
                        theme={theme}
                        testID='advanced_settings.performance.action'
                    />
                    }
                    <View style={style.divider}/>
                    {this.renderSentryDebugOptions()}
                </ScrollView>
            </SafeAreaView>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
            backgroundColor: theme.centerChannelBg,
        },
        wrapper: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.06),
            ...Platform.select({
                ios: {
                    flex: 1,
                    paddingTop: 35,
                },
            }),
        },
        divider: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            height: 1,
        },
        cacheSize: {
            color: theme.centerChannelColor,
            flex: 1,
            fontSize: 14,
            ...Platform.select({
                android: {
                    lineHeight: 68,
                },
                ios: {
                    lineHeight: 43,
                },
            }),
        },
    };
});

export default injectIntl(AdvancedSettings);
