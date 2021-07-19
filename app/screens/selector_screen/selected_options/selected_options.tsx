// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';

import SelectedOption from './selected_option';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {Theme} from '@mm-redux/types/preferences';
import {DialogOption} from '@mm-redux/types/integrations';
import {Channel} from '@mm-redux/types/channels';
import {UserProfile} from '@mm-redux/types/users';
import {ViewTypes} from '@constants';

type Props = {
    theme: Theme,
    selectedOptions: DialogOption[]|UserProfile[]|Channel[],
    dataSource: string,
    onRemove: (opt: DialogOption|UserProfile|Channel) => void,
}

export default function SelectedOptions(props: Props) {
    const {theme, selectedOptions, onRemove, dataSource} = props;
    const options: React.ReactNode[] = [];

    for (const option of selectedOptions) {
        let key: string;
        switch (dataSource) {
        case ViewTypes.DATA_SOURCE_USERS:
            key = (option as UserProfile).id;
            break;
        case ViewTypes.DATA_SOURCE_CHANNELS:
            key = (option as Channel).id;
            break;
        default:
            key = (option as DialogOption).value;
            break;
        }
        options.push(
            <SelectedOption
                key={key}
                option={option}
                theme={theme}
                dataSource={dataSource}
                onRemove={onRemove}
            />,
        );
    }

    if (options.length === 0) {
        return null;
    }

    const style = getStyleFromTheme(theme);

    return (
        <View style={style.container}>
            <View style={style.users}>
                {options}
            </View>
        </View>
    );
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            marginLeft: 5,
            marginBottom: 5,
        },
        users: {
            alignItems: 'flex-start',
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        message: {
            color: changeOpacity(theme.centerChannelColor, 0.6),
            fontSize: 12,
            marginRight: 5,
            marginTop: 10,
            marginBottom: 2,
        },
    };
});
