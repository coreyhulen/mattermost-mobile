// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    TouchableOpacity,
    Text,
    View,
} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {makeStyleSheetFromTheme} from '@utils/theme';

const ITEM_HEIGHT = 45;

export default class SelectTimezoneRow extends PureComponent {
    static propTypes = {
        theme: PropTypes.object.isRequired,
        timezone: PropTypes.string.isRequired,
        selectedTimezone: PropTypes.string,
        onPress: PropTypes.func.isRequired,
    };

    timezoneSelected = () => {
        const {timezone, onPress} = this.props;
        onPress(timezone);
    };

    render() {
        const {theme, timezone, selectedTimezone} = this.props;
        const styles = getStyleSheet(theme);

        const selected = timezone === selectedTimezone && (
            <CompassIcon
                name='check'
                size={24}
                color={theme.linkColor}
            />
        );

        return (
            <TouchableOpacity
                style={styles.itemContainer}
                key={timezone}
                onPress={this.timezoneSelected}
            >
                <View style={styles.item}>
                    <Text style={styles.itemText}>
                        {timezone}
                    </Text>
                </View>
                {selected}
            </TouchableOpacity>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        itemContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            paddingHorizontal: 15,
            height: ITEM_HEIGHT,
        },
        item: {
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
        },
        itemText: {
            fontSize: 15,
            color: theme.centerChannelColor,
        },
    };
});
