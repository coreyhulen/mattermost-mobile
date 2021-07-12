// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {
    Text,
    View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import CompassIcon from '@components/compass_icon';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {makeStyleSheetFromTheme, changeOpacity} from '@utils/theme';

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        row: {
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.centerChannelBg,
        },
        rowPicture: {
            marginHorizontal: 8,
            width: 20,
            alignItems: 'center',
            justifyContent: 'center',
        },
        rowIcon: {
            color: changeOpacity(theme.centerChannelColor, 0.7),
            fontSize: 14,
        },
        rowUsername: {
            fontSize: 13,
            color: theme.centerChannelColor,
        },
        rowFullname: {
            color: theme.centerChannelColor,
            flex: 1,
            opacity: 0.6,
        },
        textWrapper: {
            flex: 1,
            flexWrap: 'wrap',
            paddingRight: 8,
        },
    };
});

const GroupMentionItem = (props) => {
    const insets = useSafeAreaInsets();
    const {onPress, completeHandle, theme} = props;

    const completeMention = () => {
        onPress(completeHandle);
    };

    const style = getStyleFromTheme(theme);

    return (
        <TouchableWithFeedback
            onPress={completeMention}
            style={[style.row, {marginLeft: insets.left, marginRight: insets.right}]}
            type={'opacity'}
        >
            <View style={style.rowPicture}>
                <CompassIcon
                    name='account-group-outline'
                    style={style.rowIcon}
                />
            </View>
            <Text style={style.rowUsername}>{`@${completeHandle}`}</Text>
            <Text style={style.rowUsername}>{' - '}</Text>
            <Text style={style.rowFullname}>{`${completeHandle}`}</Text>
        </TouchableWithFeedback>
    );
};

GroupMentionItem.propTypes = {
    completeHandle: PropTypes.string.isRequired,
    onPress: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
};

export default GroupMentionItem;
