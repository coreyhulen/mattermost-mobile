// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    Animated,
    Platform,
    Text,
} from 'react-native';

import FormattedText from '@components/formatted_text';
import {TYPING_VISIBLE, TYPING_HEIGHT} from '@constants/post_draft';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {makeStyleSheetFromTheme} from '@utils/theme';

export default class Typing extends PureComponent {
    static propTypes = {
        theme: PropTypes.object.isRequired,
        typing: PropTypes.array.isRequired,
        registerTypingAnimation: PropTypes.func.isRequired,
    };

    static defaultProps = {
        typing: [],
    };

    typingBottom = new Animated.Value(0);

    componentDidMount() {
        this.removeTypingAnimation = this.props.registerTypingAnimation(this.typingAnimation);
    }

    componentDidUpdate(prevProps) {
        if (this.props.typing.length && !prevProps.typing.length) {
            EventEmitter.emit(TYPING_VISIBLE, true);
        } else if (!this.props.typing.length) {
            EventEmitter.emit(TYPING_VISIBLE, false);
        }
    }

    componentWillUnmount() {
        this.removeTypingAnimation();
    }

    typingAnimation = (visible = false) => {
        const [bottom, duration] = visible ?
            [TYPING_HEIGHT, 200] :
            [0, 400];

        return Animated.timing(this.typingBottom, {
            toValue: bottom,
            duration,
            useNativeDriver: false,
        });
    }

    renderTyping = () => {
        const {typing} = this.props;
        const nextTyping = [...typing];
        const numUsers = nextTyping.length;

        switch (numUsers) {
        case 0:
            return null;
        case 1:
            return (
                <FormattedText
                    id='msg_typing.isTyping'
                    defaultMessage='{user} is typing...'
                    values={{
                        user: nextTyping[0],
                    }}
                />
            );
        default: {
            const last = nextTyping.pop();
            return (
                <FormattedText
                    id='msg_typing.areTyping'
                    defaultMessage='{users} and {last} are typing...'
                    values={{
                        users: (nextTyping.join(', ')),
                        last,
                    }}
                />
            );
        }
        }
    };

    render() {
        const style = getStyleSheet(this.props.theme);

        return (
            <Animated.View style={{bottom: this.typingBottom}}>
                <Text
                    style={style.typing}
                    ellipsizeMode='tail'
                    numberOfLines={1}
                >
                    {this.renderTyping()}
                </Text>
            </Animated.View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        typing: {
            position: 'absolute',
            paddingLeft: 10,
            paddingTop: 3,
            fontSize: 11,
            ...Platform.select({
                android: {
                    marginBottom: 5,
                },
                ios: {
                    marginBottom: 2,
                },
            }),
            color: theme.centerChannelColor,
            backgroundColor: 'transparent',
        },
    };
});
