// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Platform,
    TouchableWithoutFeedback,
    View,
    ViewPropTypes,
} from 'react-native';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {makeStyleSheetFromTheme} from '@utils/theme';

export default class UnreadIndicatorBase extends PureComponent {
	public props: any;
	public onPress: any;
	public visible: any;
	public theme: any;
    static propTypes = {
        visible: PropTypes.bool,
        style: ViewPropTypes.style,
        onPress: PropTypes.func,
        theme: PropTypes.object.isRequired,
        textStyle: ViewPropTypes.style,
    };

    static defaultProps = {
        onPress: () => true,
    };

    renderContent = () => {
        const {onPress, visible, theme} = this.props;
        const style = getStyleSheet(theme);

        const content = (
            <View
                style={[style.wrapper, this.props.style]}
                pointerEvents={visible ? 'auto' : 'none'}
                testID='channels_list.unread_indicator'
            >
                <CompassIcon
                    name='arrow-up'
                    color={theme.mentionColor}
                    style={style.arrow}
                />
                <FormattedText
                    style={[style.indicatorText, this.props.textStyle]}
                    id='sidebar.unreads'
                    defaultMessage='More unreads'
                />
            </View>
        );

        if (visible) {
            return (
                <TouchableWithoutFeedback onPress={onPress}>
                    {content}
                </TouchableWithoutFeedback>
            );
        }

        return content;
    };
}

export const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        arrow: {
            fontSize: 18,
            marginRight: 8,
            position: 'relative',
            textAlignVertical: 'center',
        },
        container: {
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            position: 'absolute',
            right: 0,
            left: 0,
        },
        indicatorText: {
            backgroundColor: 'transparent',
            color: theme.mentionColor,
            fontSize: 15,
            textAlign: 'center',
            textAlignVertical: 'center',
            ...Platform.select({
                ios: {
                    fontWeight: '700',
                },
                android: {
                    fontFamily: 'Roboto-Medium',
                },
            }),
        },
        wrapper: {
            borderRadius: 15,
            height: 25,
            flexDirection: 'row',
            paddingLeft: 16,
            paddingRight: 16,
            paddingVertical: 13.5,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            shadowColor: theme.centerChannelColor,
            shadowOffset: {
                width: 0,
                height: 6,
            },
            shadowOpacity: 0.12,
            shadowRadius: 4,
        },
    };
});
