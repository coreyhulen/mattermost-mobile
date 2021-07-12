// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {
    ScrollView,
    View,
} from 'react-native';

import FormattedText from '@components/formatted_text';
import RadioButtonGroup from '@components/radio_button';
import StatusBar from '@components/status_bar';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import ChannelNotificationPreferenceBase from './channel_notification_preference_base';

export default class ChannelNotificationPreferenceAndroid extends ChannelNotificationPreferenceBase {
    getRadioItems = () => {
        const {intl} = this.context;
        const items = this.getItems();
        const radioItems = [];
        items.forEach((element) => {
            const e = {
                label: intl.formatMessage({
                    id: element.id,
                    defaultMessage: element.defaultMessage,
                }, element.labelValues),
                value: element.value,
                checked: element.checked,
            };
            radioItems.push(e);
        });
        return radioItems;
    }

    render() {
        const {theme} = this.props;
        const style = getStyleSheet(theme);

        const options = this.getRadioItems();

        return (
            <View
                testID='channel_notification_preference.screen'
                style={style.container}
            >
                <StatusBar/>
                <FormattedText
                    id='channel_notifications.preference.header'
                    defaultMessage='Send Notifications'
                    style={style.header}
                />
                <ScrollView
                    contentContainerStyle={style.wrapper}
                    alwaysBounceVertical={false}
                >
                    <RadioButtonGroup
                        name='pushSettings'
                        onSelect={this.handlePress}
                        options={options}
                    />
                </ScrollView>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelBg, 0.03),
        },
        wrapper: {
            marginLeft: 16,
        },
        header: {
            color: changeOpacity(theme.centerChannelColor, 0.56),
            fontSize: 13,
            marginTop: 10,
            padding: 16,
        },
    };
});
