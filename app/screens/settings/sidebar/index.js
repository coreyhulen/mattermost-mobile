// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import AsyncStorage from '@react-native-community/async-storage';

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    View,
    Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import FormattedText from '@components/formatted_text';
import StatusBar from '@components/status_bar';
import {DeviceTypes} from '@constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import Section from '@screens/settings/section';
import SectionItem from '@screens/settings/section_item';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

export default class SidebarSettings extends PureComponent {
    static propTypes = {
        theme: PropTypes.object.isRequired,
    };

    static contextTypes = {
        intl: intlShape,
    };

    constructor(props) {
        super(props);

        this.loadSetting();
    }

    loadSetting = async () => {
        const value = await AsyncStorage.getItem(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS);
        const enabled = Boolean(value === 'true');
        this.setState({enabled});
    };

    saveSetting = (enabled) => {
        AsyncStorage.setItem(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS, enabled.toString());
        this.setState({enabled}, () => EventEmitter.emit(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS));
    };

    render() {
        if (!this.state) {
            return null;
        }

        const {theme} = this.props;
        const {enabled} = this.state;
        const style = getStyleSheet(theme);

        return (
            <SafeAreaView
                edges={['left', 'right']}
                style={style.container}
            >
                <StatusBar/>
                <View style={style.wrapper}>
                    <Section
                        disableHeader={true}
                        theme={theme}
                    >
                        <View style={style.divider}/>
                        <SectionItem
                            label={(
                                <FormattedText
                                    id='mobile.sidebar_settings.permanent'
                                    defaultMessage='Permanent Sidebar'
                                />
                            )}
                            description={(
                                <FormattedText
                                    id='mobile.sidebar_settings.permanent_description'
                                    defaultMessage='Keep the sidebar open permanently'
                                />
                            )}
                            action={this.saveSetting}
                            actionType='toggle'
                            selected={enabled}
                            theme={theme}
                        />
                        <View style={style.divider}/>
                    </Section>
                </View>
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
            flex: 1,
            ...Platform.select({
                ios: {
                    paddingTop: 35,
                },
            }),
        },
        divider: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            height: 1,
        },
        separator: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            height: 1,
            marginLeft: 15,
        },
    };
});
