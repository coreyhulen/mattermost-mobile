// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {
    Text,
    View,
} from 'react-native';

import CompassIcon from '@components/compass_icon';
import CustomListRow from '@components/custom_list/custom_list_row';
import {makeStyleSheetFromTheme, changeOpacity} from '@utils/theme';

export default class ChannelListRow extends React.PureComponent {
    static propTypes = {
        id: PropTypes.string.isRequired,
        isArchived: PropTypes.bool,
        theme: PropTypes.object.isRequired,
        channel: PropTypes.object.isRequired,
        ...CustomListRow.propTypes,
    };

    onPress = () => {
        this.props.onPress(this.props.id, this.props.item);
    };

    render() {
        const style = getStyleFromTheme(this.props.theme);

        let purpose;
        if (this.props.channel.purpose) {
            purpose = (
                <Text
                    style={style.purpose}
                    ellipsizeMode='tail'
                    numberOfLines={1}
                >
                    {this.props.channel.purpose}
                </Text>
            );
        }

        const testID = this.props.testID;
        const itemTestID = `${testID}.${this.props.id}`;
        const channelDisplayNameTestID = `${testID}.display_name`;
        let icon = 'globe';
        if (this.props.isArchived) {
            icon = 'archive-outline';
        } else if (this.props.channel?.shared) {
            icon = 'circle-multiple-outline';
        }

        return (
            <CustomListRow
                id={this.props.id}
                onPress={this.props.onPress ? this.onPress : null}
                enabled={this.props.enabled}
                selectable={this.props.selectable}
                selected={this.props.selected}
                testID={testID}
            >
                <View
                    style={style.container}
                    testID={itemTestID}
                >
                    <View style={style.titleContainer}>
                        <CompassIcon
                            name={icon}
                            style={style.icon}
                        />
                        <Text
                            style={style.displayName}
                            testID={channelDisplayNameTestID}
                        >
                            {this.props.channel.display_name}
                        </Text>
                    </View>
                    {purpose}
                </View>
            </CustomListRow>
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        titleContainer: {
            alignItems: 'center',
            flexDirection: 'row',
        },
        displayName: {
            fontSize: 16,
            color: theme.centerChannelColor,
            marginLeft: 5,
        },
        icon: {
            fontSize: 16,
            color: theme.centerChannelColor,
        },
        container: {
            flex: 1,
            flexDirection: 'column',
            paddingHorizontal: 15,
        },
        purpose: {
            marginTop: 7,
            fontSize: 13,
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
    };
});
