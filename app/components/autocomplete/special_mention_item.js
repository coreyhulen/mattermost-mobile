// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    Text,
    View,
} from 'react-native';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {makeStyleSheetFromTheme, changeOpacity} from '@utils/theme';

export default class SpecialMentionItem extends PureComponent {
    static propTypes = {
        completeHandle: PropTypes.string.isRequired,
        defaultMessage: PropTypes.string.isRequired,
        id: PropTypes.string.isRequired,
        onPress: PropTypes.func.isRequired,
        theme: PropTypes.object.isRequired,
        values: PropTypes.object,
    };

    completeMention = () => {
        const {onPress, completeHandle} = this.props;
        onPress(completeHandle);
    };

    render() {
        const {
            defaultMessage,
            id,
            completeHandle,
            theme,
            values,
        } = this.props;

        const style = getStyleFromTheme(theme);

        return (
            <TouchableWithFeedback
                onPress={this.completeMention}
                underlayColor={changeOpacity(theme.buttonBg, 0.08)}
                type={'native'}
            >
                <View style={style.row}>
                    <View style={style.rowPicture}>
                        <CompassIcon
                            name='account-group-outline'
                            style={style.rowIcon}
                        />
                    </View>
                    <Text style={style.textWrapper}>
                        <Text style={style.rowUsername}>{`@${completeHandle}`}</Text>
                        <Text style={style.rowUsername}>{' - '}</Text>
                        <FormattedText
                            id={id}
                            defaultMessage={defaultMessage}
                            values={values}
                            style={style.rowFullname}
                        />
                    </Text>
                </View>
            </TouchableWithFeedback>
        );
    }
}
const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        row: {
            height: 40,
            paddingVertical: 8,
            paddingHorizontal: 9,
            flexDirection: 'row',
            alignItems: 'center',
        },
        rowPicture: {
            marginHorizontal: 8,
            width: 20,
            alignItems: 'center',
            justifyContent: 'center',
        },
        rowIcon: {
            color: changeOpacity(theme.centerChannelColor, 0.7),
            fontSize: 18,
        },
        rowUsername: {
            fontSize: 15,
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
