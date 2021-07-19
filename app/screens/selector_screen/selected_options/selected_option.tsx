// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {Theme} from '@mm-redux/types/preferences';
import {DialogOption} from '@mm-redux/types/integrations';
import {UserProfile} from '@mm-redux/types/users';
import {Channel} from '@mm-redux/types/channels';
import {ViewTypes} from '@constants';

type Props = {
    theme: Theme,
    option: DialogOption | UserProfile | Channel,
    dataSource: string,
    onRemove: (opt: DialogOption | UserProfile | Channel) => void,
}
export default function SelectedOption(props: Props) {
    const {theme, option, onRemove, dataSource} = props;
    const style = getStyleFromTheme(theme);
    const onPress = useCallback(
        () => onRemove(option),
        [option],
    );

    let text;
    switch (dataSource) {
    case ViewTypes.DATA_SOURCE_USERS:
        text = (option as UserProfile).username;
        break;
    case ViewTypes.DATA_SOURCE_CHANNELS:
        text = (option as Channel).display_name;
        break;
    default:
        text = (option as DialogOption).text;
        break;
    }
    return (
        <View style={style.container}>
            <Text
                style={style.text}
                numberOfLines={1}
            >
                {text}
            </Text>
            <TouchableOpacity
                style={style.remove}
                onPress={onPress}
            >
                <CompassIcon
                    name='close'
                    size={14}
                    color={theme.centerChannelColor}
                />
            </TouchableOpacity>
        </View>
    );
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            alignItems: 'center',
            flexDirection: 'row',
            height: 27,
            borderRadius: 3,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
            marginBottom: 4,
            marginRight: 10,
            paddingLeft: 10,
        },
        remove: {
            paddingHorizontal: 10,
        },
        text: {
            color: theme.centerChannelColor,
            fontSize: 13,
            maxWidth: '90%',
        },
    };
});
