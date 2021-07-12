// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {
    ScrollView,
    View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import FormattedText from '@components/formatted_text';
import StatusBar from '@components/status_bar';
import SectionItem from '@screens/settings/section_item';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import ChannelNotificationPreferenceBase from './channel_notification_preference_base';

export default class ChannelNotificationPreferenceIos extends ChannelNotificationPreferenceBase {
    render() {
        const {theme} = this.props;
        const style = getStyleSheet(theme);

        const items = this.getItems();

        return (
            <View
                testID='channel_notification_preference.screen'
                style={style.container}
            >
                <StatusBar/>
                <SafeAreaView edges={['left', 'right']}>
                    <FormattedText
                        id='channel_notifications.preference.header'
                        defaultMessage='Send Notifications'
                        style={style.header}
                    />
                </SafeAreaView>
                <ScrollView
                    contentContainerStyle={style.scrollView}
                    alwaysBounceVertical={false}
                >
                    <View style={style.contentContainer}>
                        <SafeAreaView edges={['left', 'right']}>
                            {items.map((item) => (
                                <View key={item.id}>
                                    <View style={style.divider}/>
                                    <SectionItem
                                        label={(
                                            <FormattedText
                                                id={item.id}
                                                defaultMessage={item.defaultMessage}
                                                values={item.labelValues}
                                            />
                                        )}
                                        action={this.handlePress}
                                        actionType='select'
                                        actionValue={item.value}
                                        selected={item.checked}
                                        theme={theme}
                                    />
                                </View>),
                            )}
                        </SafeAreaView>
                        <View style={style.divider}/>
                    </View>
                </ScrollView>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.03),
        },
        header: {
            color: changeOpacity(theme.centerChannelColor, 0.56),
            fontSize: 13,
            textTransform: 'uppercase',
            marginTop: 10,
            padding: 16,
        },
        divider: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            height: 1,
            width: '100%',
            marginLeft: 16,
        },
        scrollView: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.03),
        },
        contentContainer: {
            backgroundColor: changeOpacity(theme.centerChannelBg, 1),
        },
    };
});
