// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    PanResponder,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
    ViewPropTypes,
} from 'react-native';

import {CHANNEL_ITEM_LARGE_BADGE_MAX_WIDTH, CHANNEL_ITEM_SMALL_BADGE_MAX_WIDTH, LARGE_BADGE_MAX_WIDTH, SMALL_BADGE_MAX_WIDTH} from '@constants/view';

export default class Badge extends PureComponent {
    static defaultProps = {
        extraPaddingHorizontal: 10,
        minHeight: 20,
        minWidth: 20,
    };

    static propTypes = {
        testID: PropTypes.string,
        containerStyle: ViewPropTypes.style,
        count: PropTypes.number.isRequired,
        extraPaddingHorizontal: PropTypes.number,
        style: ViewPropTypes.style,
        countStyle: Text.propTypes.style,
        minHeight: PropTypes.number,
        minWidth: PropTypes.number,
        isChannelItem: PropTypes.bool,
        onPress: PropTypes.func,
    };

    constructor(props) {
        super(props);

        this.mounted = false;
        this.layoutReady = false;

        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onStartShouldSetResponderCapture: () => true,
            onMoveShouldSetResponderCapture: () => true,
            onResponderMove: () => false,
        });
    }

    componentDidMount() {
        this.mounted = true;
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.count !== this.props.count) {
            this.layoutReady = false;
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    setBadgeRef = (ref) => {
        this.badgeRef = ref;
    };

    handlePress = () => {
        if (this.props.onPress) {
            this.props.onPress();
        }
    };

    setNativeProps = (props) => {
        if (this.mounted && this.badgeRef) {
            this.badgeRef.setNativeProps(props);
        }
    };

    onLayout = (e) => {
        if (!this.layoutReady) {
            let width;
            let maxWidth;
            if (this.props.isChannelItem) {
                maxWidth = this.props.count > 99 ? CHANNEL_ITEM_LARGE_BADGE_MAX_WIDTH : CHANNEL_ITEM_SMALL_BADGE_MAX_WIDTH;
            } else {
                maxWidth = this.props.count > 99 ? LARGE_BADGE_MAX_WIDTH : SMALL_BADGE_MAX_WIDTH;
            }

            if (e.nativeEvent.layout.width <= e.nativeEvent.layout.height) {
                width = e.nativeEvent.layout.height;
            } else {
                width = e.nativeEvent.layout.width + this.props.extraPaddingHorizontal;
            }
            width = Math.max(this.props.count < 10 ? width : width + 10, this.props.minWidth);
            const borderRadius = width / 2;

            this.setNativeProps({
                style: {
                    width,
                    borderRadius,
                    opacity: 1,
                    maxWidth,
                },
            });
            this.layoutReady = true;
        }
    };

    renderText = () => {
        const {testID, containerStyle, count, style} = this.props;
        const unreadCountTestID = `${testID}.unread_count`;
        const unreadIndicatorID = `${testID}.unread_indicator`;
        let unreadCount = null;
        let unreadIndicator = null;
        if (count < 0) {
            unreadIndicator = (
                <View
                    testID={unreadIndicatorID}
                    style={[styles.text, this.props.countStyle]}
                    onLayout={this.onLayout}
                />
            );
        } else {
            let mentionCount = count;
            if (count > 99) {
                mentionCount = '99+';
            }

            unreadCount = (
                <View style={styles.verticalAlign}>
                    <Text
                        testID={unreadCountTestID}
                        style={[styles.text, this.props.countStyle]}
                        onLayout={this.onLayout}
                    >
                        {mentionCount.toString()}
                    </Text>
                </View>
            );
        }

        return (
            <View
                testID={testID}
                style={[styles.badgeContainer, containerStyle]}
            >
                <View
                    ref={this.setBadgeRef}
                    style={[styles.badge, style, {opacity: 0}]}
                >
                    <View style={styles.wrapper}>
                        {unreadCount}
                        {unreadIndicator}
                    </View>
                </View>
            </View>
        );
    };

    render() {
        if (!this.props.count) {
            return null;
        }

        return (
            <TouchableWithoutFeedback
                {...this.panResponder.panHandlers}
                onPress={this.handlePress}
            >
                {this.renderText()}
            </TouchableWithoutFeedback>
        );
    }
}

const styles = StyleSheet.create({
    badge: {
        backgroundColor: '#444',
        height: 20,
        padding: 12,
        paddingTop: 3,
        paddingBottom: 3,
    },
    badgeContainer: {
        borderRadius: 20,
        position: 'absolute',
        right: 30,
        top: 2,
    },
    wrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    text: {
        fontSize: 14,
        color: 'white',
    },
    unreadIndicator: {
        height: 5,
        width: 5,
        backgroundColor: '#444',
        borderRadius: 5,
    },
    verticalAlign: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        textAlignVertical: 'center',
    },
});
