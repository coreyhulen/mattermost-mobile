// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {intlShape} from 'react-intl';
import {ActivityIndicator, Animated, AppState, AppStateStatus, Text, View, ViewToken} from 'react-native';

import CompassIcon from '@components/compass_icon';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import ViewTypes, {INDICATOR_BAR_HEIGHT} from '@constants/view';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {messageCount} from '@mm-redux/utils/post_list';
import {t} from '@utils/i18n';
import {makeStyleSheetFromTheme, hexToHue} from '@utils/theme';

import type {Theme} from '@mm-redux/types/preferences';

const HIDDEN_TOP = -400;
const SHOWN_TOP = 0;
export const INDICATOR_BAR_FACTOR = Math.abs(INDICATOR_BAR_HEIGHT / (HIDDEN_TOP - SHOWN_TOP));
export const MIN_INPUT = 0;
export const MAX_INPUT = 1;

const TOP_INTERPOL_CONFIG: Animated.InterpolationConfigType = {
    inputRange: [
        MIN_INPUT,
        MIN_INPUT + INDICATOR_BAR_FACTOR,
        MAX_INPUT - INDICATOR_BAR_FACTOR,
        MAX_INPUT,
    ],
    outputRange: [
        HIDDEN_TOP - INDICATOR_BAR_HEIGHT,
        HIDDEN_TOP,
        SHOWN_TOP,
        SHOWN_TOP + INDICATOR_BAR_HEIGHT,
    ],
    extrapolate: 'clamp',
};

export const CANCEL_TIMER_DELAY = 400;

type MoreMessagesButtonState = {
    moreText: string;
}

type MoreMessagesButtonProps = {
    channelId?: string;
    deepLinkURL?: string;
    loadingPosts?: boolean;
    manuallyUnread?: boolean;
    newMessageLineIndex: number;
    postIds: string[];
    registerScrollEndIndexListener: (fn: (endIndex: number) => void) => () => void;
    registerViewableItemsListener: (fn: (viewableItems: ViewToken[]) => void) => () =>void;
    resetUnreadMessageCount: (channelId: string) => void;
    scrollToIndex: (index: number, animated?: boolean) => void;
    theme: Theme;
    testID?: string;
    unreadCount: number;
}

export default class MoreMessageButton extends React.PureComponent<MoreMessagesButtonProps, MoreMessagesButtonState> {
    static contextTypes = {
        intl: intlShape.isRequired,
    };

    autoCancelTimer: undefined | null | NodeJS.Timeout;
    buttonVisible = false;
    canceled = false;
    disableViewableItems = false;
    endIndex: number | null = null;
    indicatorBarVisible = false;
    pressed = false;
    removeViewableItemsListener: undefined | (() => void) = undefined;
    removeScrollEndIndexListener: undefined | (() => void) = undefined;
    state: MoreMessagesButtonState = {moreText: ''};
    top = new Animated.Value(0);
    viewableItems: ViewToken[] = [];

    componentDidMount() {
        AppState.addEventListener('change', this.onAppStateChange);
        EventEmitter.on(ViewTypes.INDICATOR_BAR_VISIBLE, this.onIndicatorBarVisible);
        this.removeViewableItemsListener = this.props.registerViewableItemsListener(this.onViewableItemsChanged);
        this.removeScrollEndIndexListener = this.props.registerScrollEndIndexListener(this.onScrollEndIndex);
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this.onAppStateChange);
        EventEmitter.off(ViewTypes.INDICATOR_BAR_VISIBLE, this.onIndicatorBarVisible);
        if (this.removeViewableItemsListener) {
            this.removeViewableItemsListener();
        }
        if (this.removeScrollEndIndexListener) {
            this.removeScrollEndIndexListener();
        }
    }

    componentDidUpdate(prevProps: MoreMessagesButtonProps) {
        const {channelId, unreadCount, newMessageLineIndex, manuallyUnread} = this.props;

        if (channelId !== prevProps.channelId) {
            this.reset();
            return;
        }

        if ((manuallyUnread && !prevProps.manuallyUnread) || newMessageLineIndex === -1) {
            this.cancel(true);
            return;
        }

        if (newMessageLineIndex !== prevProps.newMessageLineIndex) {
            if (this.autoCancelTimer) {
                clearTimeout(this.autoCancelTimer);
                this.autoCancelTimer = null;
            }
            this.pressed = false;
            this.uncancel();

            const readCount = this.getReadCount(prevProps.newMessageLineIndex);
            this.showMoreText(readCount);
        }

        // The unreadCount might not be set until after all the viewable items are rendered.
        // In this case we want to manually call onViewableItemsChanged with the stored
        // viewableItems.
        if (unreadCount > prevProps.unreadCount && prevProps.unreadCount === 0) {
            this.uncancel();
            this.onViewableItemsChanged(this.viewableItems);
        }

        if (unreadCount === 0 && prevProps.unreadCount > 0) {
            this.hide();
        }
    }

    onAppStateChange = (appState: AppStateStatus) => {
        const isActive = appState === 'active';
        const {channelId} = this.props;
        if (!isActive && channelId) {
            this.props.resetUnreadMessageCount(channelId);
        }
    }

    onIndicatorBarVisible = (indicatorVisible: boolean) => {
        this.indicatorBarVisible = indicatorVisible;
        if (this.buttonVisible) {
            const toValue = this.indicatorBarVisible ? MAX_INPUT : MAX_INPUT - INDICATOR_BAR_FACTOR;
            Animated.spring(this.top, {
                toValue,
                useNativeDriver: true,
            }).start();
        }
    }

    reset = () => {
        if (this.autoCancelTimer) {
            clearTimeout(this.autoCancelTimer);
            this.autoCancelTimer = null;
        }
        this.hide();
        this.setState({moreText: ''});
        this.viewableItems = [];
        this.pressed = false;
        this.canceled = false;
        this.disableViewableItems = false;
    }

    show = () => {
        if (!this.buttonVisible && this.state.moreText && !this.props.deepLinkURL && !this.canceled && this.props.unreadCount > 0) {
            this.buttonVisible = true;
            const toValue = this.indicatorBarVisible ? MAX_INPUT : MAX_INPUT - INDICATOR_BAR_FACTOR;
            Animated.spring(this.top, {
                toValue,
                useNativeDriver: true,
            }).start();
        }
    }

    hide = () => {
        if (this.buttonVisible) {
            this.buttonVisible = false;
            const toValue = this.indicatorBarVisible ? MIN_INPUT : MIN_INPUT + INDICATOR_BAR_FACTOR;
            Animated.spring(this.top, {
                toValue,
                useNativeDriver: true,
            }).start();
        }
    }

    cancel = (force = false) => {
        if (!force && (this.indicatorBarVisible || this.props.loadingPosts)) {
            // If we haven't forced cancel and the indicator bar is visible or
            // we're still loading posts, then to avoid the autoCancelTimer from
            // hiding the button we continue delaying the cancel call.
            if (this.autoCancelTimer) {
                clearTimeout(this.autoCancelTimer);
            }
            this.autoCancelTimer = setTimeout(this.cancel, CANCEL_TIMER_DELAY);

            return;
        }

        this.canceled = true;
        this.disableViewableItems = true;
        this.hide();
    }

    uncancel = () => {
        if (this.autoCancelTimer) {
            clearTimeout(this.autoCancelTimer);
            this.autoCancelTimer = null;
        }
        this.canceled = false;
        this.disableViewableItems = false;
    }

    onMoreMessagesPress = () => {
        if (this.pressed) {
            // Prevent multiple taps on the more messages button
            // from calling scrollToIndex.
            return;
        }

        const {newMessageLineIndex, scrollToIndex} = this.props;
        this.pressed = true;
        scrollToIndex(newMessageLineIndex, true);
    }

    onViewableItemsChanged = (viewableItems: ViewToken[]) => {
        this.viewableItems = viewableItems;
        const {newMessageLineIndex, scrollToIndex} = this.props;

        if (newMessageLineIndex <= 0 || viewableItems.length === 0 || this.disableViewableItems) {
            return;
        }

        const lastViewableIndex = viewableItems[viewableItems.length - 1]?.index || 0;
        const nextViewableIndex = lastViewableIndex + 1;
        if (viewableItems[0].index === 0 && nextViewableIndex >= newMessageLineIndex) {
            // Auto scroll if the first post is viewable and
            // * the new message line is viewable OR
            // * the new message line will be the first next viewable item
            scrollToIndex(newMessageLineIndex, true);
            this.cancel(true);

            return;
        }

        let readCount;
        if (lastViewableIndex >= newMessageLineIndex) {
            readCount = this.getReadCount(lastViewableIndex);
            const moreCount = this.props.unreadCount - readCount;
            if (moreCount <= 0) {
                this.cancel(true);
            } else {
                // In some cases the last New Message line is reached but, since the
                // unreadCount is off, the button will never hide. We call cancel with
                // a delay for this case and clear the timer in componentDidUpdate if
                // and when the newMessageLineIndex changes.
                this.autoCancelTimer = setTimeout(this.cancel, CANCEL_TIMER_DELAY);
            }
        } else if (this.endIndex && lastViewableIndex >= this.endIndex) {
            // If auto-scrolling failed ot reach the New Message line, update
            // the button text to reflect the read count up to the item that
            // was auto-scrolled to.
            readCount = this.getReadCount(this.endIndex);
            this.endIndex = null;
            this.showMoreText(readCount);
        } else if (this.state.moreText === '') {
            readCount = 0;
            this.showMoreText(readCount);
        }
    }

    showMoreText = (readCount: number) => {
        const moreCount = this.props.unreadCount - readCount;

        if (moreCount > 0) {
            const moreText = this.moreText(moreCount);
            this.setState({moreText}, this.show);
        }
    }

    getReadCount = (lastViewableIndex: number) => {
        const {postIds} = this.props;

        const viewedPostIds = postIds.slice(0, lastViewableIndex + 1);
        const readCount = messageCount(viewedPostIds);

        return readCount;
    }

    moreText = (count: number) => {
        const {unreadCount} = this.props;
        const {formatMessage} = this.context.intl;
        const isInitialMessage = unreadCount === count;

        return formatMessage({
            id: t('mobile.more_messages_button.text'),
            defaultMessage: '{count} {isInitialMessage, select, true {new} other {more new}} {count, plural, one {message} other {messages}}',
        }, {isInitialMessage, count});
    }

    onScrollEndIndex = (endIndex: number) => {
        this.pressed = false;
        this.endIndex = endIndex;
    }

    render() {
        const {theme, loadingPosts, testID} = this.props;

        const styles = getStyleSheet(theme);
        const {moreText} = this.state;
        const translateY = this.top.interpolate(TOP_INTERPOL_CONFIG);
        const underlayColor = `hsl(${hexToHue(theme.buttonBg)}, 50%, 38%)`;

        return (
            <Animated.View style={[styles.animatedContainer, styles.roundBorder, {transform: [{translateY}]}]}>
                <TouchableWithFeedback
                    type={'native'}
                    onPress={this.onMoreMessagesPress}
                    underlayColor={underlayColor}
                    style={styles.roundBorder}
                    testID={testID}
                >
                    <View style={[styles.container, styles.roundBorder]}>
                        <View style={styles.iconContainer}>
                            {loadingPosts &&
                                <ActivityIndicator
                                    animating={true}
                                    size='small'
                                    color={theme.buttonColor}
                                />
                            }
                            {!loadingPosts &&
                                <CompassIcon
                                    name='arrow-up'
                                    style={styles.icon}
                                />
                            }
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.text}>{moreText}</Text>
                        </View>
                        <TouchableWithFeedback
                            type={'none'}
                            onPress={this.cancel}
                        >
                            <View style={styles.cancelContainer}>
                                <CompassIcon
                                    name='close'
                                    style={styles.icon}
                                />
                            </View>
                        </TouchableWithFeedback>
                    </View>
                </TouchableWithFeedback>
            </Animated.View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        animatedContainer: {
            flex: 1,
            position: 'absolute',
            zIndex: 1,
            elevation: 1,
            margin: 8,
            backgroundColor: theme.buttonBg,
        },
        container: {
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            paddingLeft: 11,
            paddingRight: 5,
            paddingVertical: 1,
            width: '100%',
            height: 40,
            shadowColor: theme.centerChannelColor,
            shadowOffset: {
                width: 0,
                height: 6,
            },
            shadowOpacity: 0.12,
            shadowRadius: 4,
        },
        roundBorder: {
            borderRadius: 4,
        },
        iconContainer: {
            width: 22,
        },
        textContainer: {
            flex: 10,
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingLeft: 4,
        },
        cancelContainer: {
            flex: 1,
            alignItems: 'flex-end',
        },
        text: {
            fontWeight: 'bold',
            color: theme.buttonColor,
            paddingLeft: 0,
            alignSelf: 'center',
        },
        icon: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.buttonColor,
            alignSelf: 'center',
        },
    };
});
