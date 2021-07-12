// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {SafeAreaView} from 'react-native-safe-area-context';

import Config from '@assets/config';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import StatusBar from '@components/status_bar';
import AboutLinks from '@constants/about_links';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {tryOpenURL} from '@utils/url';

const MATTERMOST_BUNDLE_IDS = ['com.mattermost.rnbeta', 'com.mattermost.rn'];

export default class About extends PureComponent {
    static propTypes = {
        config: PropTypes.object.isRequired,
        license: PropTypes.object.isRequired,
        theme: PropTypes.object.isRequired,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    openURL = (url) => {
        const {intl} = this.context;
        const onError = () => {
            Alert.alert(
                intl.formatMessage({
                    id: 'mobile.link.error.title',
                    defaultMessage: 'Error',
                }),
                intl.formatMessage({
                    id: 'mobile.link.error.text',
                    defaultMessage: 'Unable to open the link.',
                }),
            );
        };

        tryOpenURL(url, onError);
    };

    handleAboutTeam = () => {
        this.openURL(Config.AboutTeamURL);
    };

    handleAboutEnterprise = () => {
        this.openURL(Config.AboutEnterpriseURL);
    };

    handlePlatformNotice = () => {
        this.openURL(Config.PlatformNoticeURL);
    };

    handleMobileNotice = () => {
        this.openURL(Config.MobileNoticeURL);
    };

    handleTermsOfService = () => {
        this.openURL(AboutLinks.TERMS_OF_SERVICE);
    };

    handlePrivacyPolicy = () => {
        this.openURL(AboutLinks.PRIVACY_POLICY);
    }

    render() {
        const {theme, config, license} = this.props;
        const style = getStyleSheet(theme);

        let title = (
            <FormattedText
                id='about.teamEditiont0'
                defaultMessage='Team Edition'
                style={style.title}
                testID='about.title'
            />
        );

        let subTitle = (
            <FormattedText
                id='about.teamEditionSt'
                defaultMessage='All your team communication in one place, instantly searchable and accessible anywhere.'
                style={style.subtitle}
                testID='about.subtitle'
            />
        );

        let learnMore = (
            <View style={style.learnContainer}>
                <FormattedText
                    id='about.teamEditionLearn'
                    defaultMessage='Join the Mattermost community at '
                    style={style.learn}
                    testID='about.learn_more'
                />
                <TouchableOpacity
                    onPress={this.handleAboutTeam}
                >
                    <Text
                        style={style.learnLink}
                        testID='about.learn_more.url'
                    >
                        {Config.TeamEditionLearnURL}
                    </Text>
                </TouchableOpacity>
            </View>
        );

        let licensee;
        if (config.BuildEnterpriseReady === 'true') {
            title = (
                <FormattedText
                    id='about.teamEditiont1'
                    defaultMessage='Enterprise Edition'
                    style={style.title}
                    testID='about.title'
                />
            );

            subTitle = (
                <FormattedText
                    id='about.enterpriseEditionSt'
                    defaultMessage='Modern communication from behind your firewall.'
                    style={style.subtitle}
                    testID='about.subtitle'
                />
            );

            learnMore = (
                <View style={style.learnContainer}>
                    <FormattedText
                        id='about.enterpriseEditionLearn'
                        defaultMessage='Learn more about Enterprise Edition at '
                        style={style.learn}
                        testID='about.learn_more'
                    />
                    <TouchableOpacity
                        onPress={this.handleAboutEnterprise}
                    >
                        <Text
                            style={style.learnLink}
                            testID='about.learn_more.url'
                        >
                            {Config.EELearnURL}
                        </Text>
                    </TouchableOpacity>
                </View>
            );

            if (license.IsLicensed === 'true') {
                title = (
                    <FormattedText
                        id='about.enterpriseEditione1'
                        defaultMessage='Enterprise Edition'
                        style={style.title}
                        testID='about.title'
                    />
                );

                licensee = (
                    <View style={style.licenseContainer}>
                        <FormattedText
                            id='mobile.about.licensed'
                            defaultMessage='Licensed to: {company}'
                            style={style.info}
                            values={{
                                company: license.Company,
                            }}
                            testID='about.licensee'
                        />
                    </View>
                );
            }
        }

        let serverVersion;
        if (config.BuildNumber === config.Version) {
            serverVersion = (
                <FormattedText
                    id='mobile.about.serverVersionNoBuild'
                    defaultMessage='Server Version: {version}'
                    style={style.info}
                    values={{
                        version: config.Version,
                    }}
                    testID='about.server_version'
                />
            );
        } else {
            serverVersion = (
                <FormattedText
                    id='mobile.about.serverVersion'
                    defaultMessage='Server Version: {version} (Build {number})'
                    style={style.info}
                    values={{
                        version: config.Version,
                        number: config.BuildNumber,
                    }}
                    testID='about.server_version'
                />
            );
        }

        let termsOfService;
        if (config.TermsOfServiceLink) {
            termsOfService = (
                <FormattedText
                    id='mobile.tos_link'
                    defaultMessage='Terms of Service'
                    style={style.noticeLink}
                    onPress={this.handleTermsOfService}
                    testID='about.terms_of_service'
                />
            );
        }

        let privacyPolicy;
        if (config.PrivacyPolicyLink) {
            privacyPolicy = (
                <FormattedText
                    id='mobile.privacy_link'
                    defaultMessage='Privacy Policy'
                    style={style.noticeLink}
                    onPress={this.handlePrivacyPolicy}
                    testID='about.privacy_policy'
                />
            );
        }

        let tosPrivacyHyphen;
        if (termsOfService && privacyPolicy) {
            tosPrivacyHyphen = (
                <Text style={[style.footerText, style.hyphenText]}>
                    {' - '}
                </Text>
            );
        }

        return (
            <SafeAreaView
                edges={['left', 'right']}
                style={style.container}
                testID='about.screen'
            >
                <StatusBar/>
                <ScrollView
                    style={style.scrollView}
                    contentContainerStyle={style.scrollViewContent}
                    testID='about.scroll_view'
                >
                    <View style={style.logoContainer}>
                        <CompassIcon
                            name='mattermost'
                            color={theme.centerChannelColor}
                            size={120}
                            testID='about.logo'
                        />
                    </View>
                    <View style={style.infoContainer}>
                        <View style={style.titleContainer}>
                            <Text
                                style={style.title}
                                testID='about.site_name'
                            >
                                {`${config.SiteName} `}
                            </Text>
                            {title}
                        </View>
                        {subTitle}
                        <FormattedText
                            id='mobile.about.appVersion'
                            defaultMessage='App Version: {version} (Build {number})'
                            style={style.info}
                            values={{
                                version: DeviceInfo.getVersion(),
                                number: DeviceInfo.getBuildNumber(),
                            }}
                            testID='about.app_version'
                        />
                        {serverVersion}
                        <FormattedText
                            id='mobile.about.database'
                            defaultMessage='Database: {type}'
                            style={style.info}
                            values={{
                                type: config.SQLDriverName,
                            }}
                            testID='about.database'
                        />
                        {licensee}
                        {learnMore}
                        {!MATTERMOST_BUNDLE_IDS.includes(DeviceInfo.getBundleId()) &&
                            <FormattedText
                                id='mobile.about.powered_by'
                                defaultMessage='{site} is powered by Mattermost'
                                style={style.footerText}
                                values={{
                                    site: this.props.config.SiteName,
                                }}
                                testID='about.powered_by'
                            />
                        }
                        <FormattedText
                            id='mobile.about.copyright'
                            defaultMessage='Copyright 2015-{currentYear} Mattermost, Inc. All rights reserved'
                            style={[style.footerText, style.copyrightText]}
                            values={{
                                currentYear: new Date().getFullYear(),
                            }}
                            testID='about.copyright'
                        />
                        <View style={style.tosPrivacyContainer}>
                            {termsOfService}
                            {tosPrivacyHyphen}
                            {privacyPolicy}
                        </View>
                        <View style={style.noticeContainer}>
                            <View style={style.footerGroup}>
                                <FormattedText
                                    id='mobile.notice_text'
                                    defaultMessage='Mattermost is made possible by the open source software used in our {platform} and {mobile}.'
                                    style={style.footerText}
                                    values={{
                                        platform: (
                                            <FormattedText
                                                id='mobile.notice_platform_link'
                                                defaultMessage='server'
                                                style={style.noticeLink}
                                                onPress={this.handlePlatformNotice}
                                            />
                                        ),
                                        mobile: (
                                            <FormattedText
                                                id='mobile.notice_mobile_link'
                                                defaultMessage='mobile apps'
                                                style={[style.noticeLink, {marginLeft: 5}]}
                                                onPress={this.handleMobileNotice}
                                            />
                                        ),
                                    }}
                                    testID='about.notice_text'
                                />
                            </View>
                        </View>
                        <View style={style.hashContainer}>
                            <View style={style.footerGroup}>
                                <FormattedText
                                    id='about.hash'
                                    defaultMessage='Build Hash:'
                                    style={style.footerTitleText}
                                    testID='about.build_hash.title'
                                />
                                <Text
                                    style={style.footerText}
                                    testID='about.build_hash.value'
                                >
                                    {config.BuildHash}
                                </Text>
                            </View>
                            <View style={style.footerGroup}>
                                <FormattedText
                                    id='about.hashee'
                                    defaultMessage='EE Build Hash:'
                                    style={style.footerTitleText}
                                    testID='about.build_hash_enterprise.title'
                                />
                                <Text
                                    style={style.footerText}
                                    testID='about.build_hash_enterprise.value'
                                >
                                    {config.BuildHashEnterprise}
                                </Text>
                            </View>
                        </View>
                        <View style={style.footerGroup}>
                            <FormattedText
                                id='about.date'
                                defaultMessage='Build Date:'
                                style={style.footerTitleText}
                                testID='about.build_date.title'
                            />
                            <Text
                                style={style.footerText}
                                testID='about.build_date.value'
                            >
                                {config.BuildDate}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
        },
        scrollView: {
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.06),
        },
        scrollViewContent: {
            paddingBottom: 30,
        },
        logoContainer: {
            alignItems: 'center',
            flex: 1,
            height: 200,
            paddingVertical: 40,
        },
        infoContainer: {
            flex: 1,
            flexDirection: 'column',
            paddingHorizontal: 20,
        },
        titleContainer: {
            flex: 1,
            marginBottom: 20,
        },
        title: {
            fontSize: 22,
            color: theme.centerChannelColor,
        },
        subtitle: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 19,
            marginBottom: 15,
        },
        learnContainer: {
            flex: 1,
            flexDirection: 'column',
            marginVertical: 20,
        },
        learn: {
            color: theme.centerChannelColor,
            fontSize: 16,
        },
        learnLink: {
            color: theme.linkColor,
            fontSize: 16,
        },
        info: {
            color: theme.centerChannelColor,
            fontSize: 16,
            lineHeight: 19,
        },
        licenseContainer: {
            flex: 1,
            flexDirection: 'row',
            marginTop: 20,
        },
        noticeContainer: {
            flex: 1,
            flexDirection: 'column',
        },
        noticeLink: {
            color: theme.linkColor,
            fontSize: 11,
            lineHeight: 13,
        },
        hashContainer: {
            flex: 1,
            flexDirection: 'column',
        },
        footerGroup: {
            flex: 1,
        },
        footerTitleText: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 11,
            fontWeight: '600',
            lineHeight: 13,
        },
        footerText: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 11,
            lineHeight: 13,
            marginBottom: 10,
        },
        copyrightText: {
            marginBottom: 0,
        },
        hyphenText: {
            marginBottom: 0,
        },
        tosPrivacyContainer: {
            flex: 1,
            flexDirection: 'row',
            marginBottom: 10,
        },
    };
});
