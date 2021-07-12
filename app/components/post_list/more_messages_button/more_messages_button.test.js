// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Animated, AppState} from 'react-native';

import ViewTypes from '@constants/view';
import Preferences from '@mm-redux/constants/preferences';
import EventEmitter from '@mm-redux/utils/event_emitter';
import * as PostListUtils from '@mm-redux/utils/post_list';
import {shallowWithIntl} from '@test/intl-test-helper';

import MoreMessagesButton, {
    MIN_INPUT,
    MAX_INPUT,
    INDICATOR_BAR_FACTOR,
    CANCEL_TIMER_DELAY,
} from './more_messages_button';

describe('MoreMessagesButton', () => {
    const baseProps = {
        theme: Preferences.THEMES.default,
        postIds: [],
        channelId: 'channel-id',
        unreadCount: 10,
        loadingPosts: false,
        manuallyUnread: false,
        newMessageLineIndex: 0,
        scrollToIndex: jest.fn(),
        resetUnreadMessageCount: jest.fn(),
        registerViewableItemsListener: jest.fn(() => {
            return jest.fn();
        }),
        registerScrollEndIndexListener: jest.fn(() => {
            return jest.fn();
        }),
    };

    it('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <MoreMessagesButton {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    describe('constructor', () => {
        it('should set state and instance values', () => {
            const instance = new MoreMessagesButton({...baseProps});
            expect(instance.state).toStrictEqual({moreText: ''});
            expect(instance.top).toEqual(new Animated.Value(0));
            expect(instance.disableViewableItems).toBe(false);
        });
    });

    describe('lifecycle methods', () => {
        AppState.addEventListener = jest.fn();
        AppState.removeEventListener = jest.fn();

        test('componentDidMount should register app state listener, indicator visibility listener, viewable items listener, and scroll end index listener', () => {
            EventEmitter.on = jest.fn();
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            instance.onAppStateChange = jest.fn();
            instance.onIndicatorBarVisible = jest.fn();
            instance.onViewableItemsChanged = jest.fn();
            instance.onScrollEndIndex = jest.fn();

            // While componentDidMount is called when the component is mounted with `shallow()` above,
            // instance.onIndicatorBarVisible, instance.onViewableItemsChanged, and instance.onScrollEndIndex
            // have not yet been mocked so we call componentDidMount again.
            instance.componentDidMount();

            expect(AppState.addEventListener).toHaveBeenCalledWith('change', instance.onAppStateChange);
            expect(EventEmitter.on).toHaveBeenCalledWith(ViewTypes.INDICATOR_BAR_VISIBLE, instance.onIndicatorBarVisible);
            expect(baseProps.registerViewableItemsListener).toHaveBeenCalledWith(instance.onViewableItemsChanged);
            expect(instance.removeViewableItemsListener).toBeDefined();
            expect(baseProps.registerScrollEndIndexListener).toHaveBeenCalledWith(instance.onScrollEndIndex);
            expect(instance.removeScrollEndIndexListener).toBeDefined();
        });

        test('componentWillUnmount should remove the app state listener, the indicator bar visible listener, the viewable items listener, the scroll end index listener, and clear all timers', () => {
            jest.useFakeTimers();
            EventEmitter.off = jest.fn();
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            instance.onAppStateChange = jest.fn();
            instance.onIndicatorBarVisible = jest.fn();
            instance.removeViewableItemsListener = jest.fn();
            instance.removeScrollEndIndexListener = jest.fn();

            instance.componentWillUnmount();
            expect(AppState.removeEventListener).toHaveBeenCalledWith('change', instance.onAppStateChange);
            expect(EventEmitter.off).toHaveBeenCalledWith(ViewTypes.INDICATOR_BAR_VISIBLE, instance.onIndicatorBarVisible);
            expect(instance.removeViewableItemsListener).toHaveBeenCalled();
            expect(instance.removeScrollEndIndexListener).toHaveBeenCalled();
        });

        test('componentDidUpdate should call reset when the channelId changes', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            instance.reset = jest.fn();

            wrapper.setProps({channelId: baseProps.channelId});
            expect(instance.reset).not.toHaveBeenCalled();

            wrapper.setProps({channelId: `not-${baseProps.channelId}`});
            expect(instance.reset).toHaveBeenCalled();
        });

        test('componentDidUpdate should force cancel when the component updates and manuallyUnread changes from falsy to true', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            instance.cancel = jest.fn();

            wrapper.setProps({test: 1});
            expect(instance.cancel).not.toHaveBeenCalled();

            wrapper.setProps({manuallyUnread: true});
            expect(instance.cancel).toHaveBeenCalledTimes(1);
            expect(instance.cancel.mock.calls[0][0]).toBe(true);

            wrapper.setProps({test: 2});
            expect(instance.cancel).toHaveBeenCalledTimes(1);

            wrapper.setProps({manuallyUnread: false});
            expect(instance.cancel).toHaveBeenCalledTimes(1);

            wrapper.setProps({test: 3});
            expect(instance.cancel).toHaveBeenCalledTimes(1);

            wrapper.setProps({manuallyUnread: true});
            expect(instance.cancel).toHaveBeenCalledTimes(2);
            expect(instance.cancel.mock.calls[1][0]).toBe(true);
        });

        test('componentDidUpdate should force cancel when the component updates and newMessageLineIndex is -1', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            instance.cancel = jest.fn();

            wrapper.setProps({test: 1});
            expect(instance.cancel).not.toHaveBeenCalled();

            wrapper.setProps({newMessageLineIndex: 2});
            expect(instance.cancel).not.toHaveBeenCalled();

            wrapper.setProps({newMessageLineIndex: -1});
            expect(instance.cancel).toHaveBeenCalledTimes(1);
            expect(instance.cancel.mock.calls[0][0]).toBe(true);
        });

        test('componentDidUpdate should set pressed to false and call uncancel when the newMessageLineIndex changes but is not -1', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            instance.pressed = true;
            instance.uncancel = jest.fn();
            instance.viewableItems = [{index: 100}];

            wrapper.setProps({newMessageLineIndex: baseProps.newMessageLineIndex});
            expect(instance.pressed).toBe(true);
            expect(instance.uncancel).not.toHaveBeenCalled();

            wrapper.setProps({newMessageLineIndex: -1});
            expect(instance.pressed).toBe(true);
            expect(instance.uncancel).not.toHaveBeenCalled();

            wrapper.setProps({newMessageLineIndex: 100});
            expect(instance.pressed).toBe(false);
            expect(instance.uncancel).toHaveBeenCalledTimes(1);

            wrapper.setProps({newMessageLineIndex: 101});
            expect(instance.pressed).toBe(false);
            expect(instance.uncancel).toHaveBeenCalledTimes(2);
        });

        test('componentDidUpdate should call showMoreText with the read count derived from the previous new message line', () => {
            const prevNewMessageLineIndex = 10;
            const props = {
                ...baseProps,
                newMessageLineIndex: prevNewMessageLineIndex,
            };
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...props}/>,
            );
            const instance = wrapper.instance();
            instance.getReadCount = jest.fn((count) => {
                return count;
            });
            instance.showMoreText = jest.fn();

            wrapper.setProps({newMessageLineIndex: prevNewMessageLineIndex + 1});
            expect(instance.getReadCount).toHaveBeenCalledWith(prevNewMessageLineIndex);
            expect(instance.showMoreText).toHaveBeenCalledWith(10);
        });

        test('componentDidUpdate should call uncancel and onViewableItemsChanged when the unreadCount increases from 0', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            instance.uncancel = jest.fn();
            instance.onViewableItemsChanged = jest.fn();
            instance.viewableItems = [{index: 1}];

            wrapper.setProps({unreadCount: 0});
            expect(instance.uncancel).not.toHaveBeenCalled();
            expect(instance.onViewableItemsChanged).not.toHaveBeenCalled();

            wrapper.setProps({unreadCount: 1});
            expect(instance.uncancel).toHaveBeenCalledTimes(1);
            expect(instance.onViewableItemsChanged).toHaveBeenCalledTimes(1);
            expect(instance.onViewableItemsChanged).toHaveBeenCalledWith(instance.viewableItems);

            wrapper.setProps({unreadCount: 2});
            expect(instance.uncancel).toHaveBeenCalledTimes(1);
            expect(instance.onViewableItemsChanged).toHaveBeenCalledTimes(1);
        });

        test('componentDidUpdate should call hide when the unreadCount decreases to 0', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            instance.hide = jest.fn();
            instance.viewableItems = [{index: 1}];

            wrapper.setProps({unreadCount: 2});
            expect(instance.hide).not.toHaveBeenCalled();

            wrapper.setProps({unreadCount: 1});
            expect(instance.hide).not.toHaveBeenCalled();

            wrapper.setProps({unreadCount: 0});
            expect(instance.hide).toHaveBeenCalledTimes(1);
        });
    });

    describe('onAppStateChange', () => {
        it('should call resetUnreadMessageCount when app state is not active', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();

            let appState = 'active';
            instance.onAppStateChange(appState);
            expect(baseProps.resetUnreadMessageCount).not.toHaveBeenCalled();

            appState = 'inactive';
            instance.onAppStateChange(appState);
            expect(baseProps.resetUnreadMessageCount).toHaveBeenCalledTimes(1);
            expect(baseProps.resetUnreadMessageCount).toHaveBeenCalledWith(baseProps.channelId);

            appState = 'background';
            instance.onAppStateChange(appState);
            expect(baseProps.resetUnreadMessageCount).toHaveBeenCalledTimes(2);
            expect(baseProps.resetUnreadMessageCount).toHaveBeenCalledWith(baseProps.channelId);

            appState = '';
            instance.onAppStateChange(appState);
            expect(baseProps.resetUnreadMessageCount).toHaveBeenCalledTimes(3);
            expect(baseProps.resetUnreadMessageCount).toHaveBeenCalledWith(baseProps.channelId);
        });
    });

    describe('onIndicatorBarVisible', () => {
        Animated.spring = jest.fn(() => ({
            start: jest.fn(),
        }));
        const wrapper = shallowWithIntl(
            <MoreMessagesButton {...baseProps}/>,
        );
        const instance = wrapper.instance();

        it('should set indicatorBarVisible but not animate if not visible', () => {
            instance.buttonVisible = false;
            expect(instance.indicatorBarVisible).toBe(false);

            instance.onIndicatorBarVisible(true);
            expect(instance.indicatorBarVisible).toBe(true);
            expect(Animated.spring).not.toHaveBeenCalled();

            instance.onIndicatorBarVisible(false);
            expect(instance.indicatorBarVisible).toBe(false);
            expect(Animated.spring).not.toHaveBeenCalledTimes(1);
        });

        it('should animate to MAX_INPUT - INDICATOR_BAR_FACTOR if visible and indicator bar hides', () => {
            instance.buttonVisible = true;
            instance.onIndicatorBarVisible(false);
            expect(Animated.spring).toHaveBeenCalledWith(instance.top, {
                toValue: MAX_INPUT - INDICATOR_BAR_FACTOR,
                useNativeDriver: true,
            });
        });

        it('should animate to MAX_INPUT if visible and indicator becomes visible', () => {
            instance.buttonVisible = true;
            instance.onIndicatorBarVisible(true);
            expect(Animated.spring).toHaveBeenCalledWith(instance.top, {
                toValue: MAX_INPUT,
                useNativeDriver: true,
            });
        });
    });

    describe('reset', () => {
        it('should reset values and call hide', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            wrapper.setProps({unreadCount: 10});
            instance.setState({moreText: '60+ new messages'});
            const autoCancelTimer = jest.fn();
            instance.autoCancelTimer = autoCancelTimer;
            instance.hide = jest.fn();
            instance.disableViewableItems = true;
            instance.viewableItems = [{index: 1}];
            instance.pressed = true;
            instance.canceled = true;

            instance.reset();
            expect(clearTimeout).toHaveBeenCalledWith(autoCancelTimer);
            expect(instance.autoCancelTimer).toBeNull();
            expect(instance.hide).toHaveBeenCalled();
            expect(instance.disableViewableItems).toBe(false);
            expect(instance.viewableItems).toStrictEqual([]);
            expect(instance.pressed).toBe(false);
            expect(instance.state.moreText).toEqual('');
            expect(instance.canceled).toBe(false);
        });
    });

    describe('show', () => {
        Animated.spring = jest.fn(() => ({
            start: jest.fn(),
        }));
        const wrapper = shallowWithIntl(
            <MoreMessagesButton {...baseProps}/>,
        );
        const instance = wrapper.instance();
        instance.componentDidUpdate = jest.fn();

        it('should not animate when already visible', () => {
            instance.buttonVisible = true;
            wrapper.setState({moreText: '1 new message'});
            wrapper.setProps({deepLinkURL: null});
            instance.canceled = false;

            instance.show();
            expect(Animated.spring).not.toHaveBeenCalled();
        });

        it('should not animate when not visible but state.moreText is empty', () => {
            instance.buttonVisible = false;
            wrapper.setState({moreText: ''});
            wrapper.setProps({deepLinkURL: null});
            instance.canceled = false;

            instance.show();
            expect(Animated.spring).not.toHaveBeenCalled();
        });

        it('should not animate when not visible and state.moreText is not empty but props.deepLinkURL is set', () => {
            instance.buttonVisible = false;
            wrapper.setState({moreText: '1 new message'});
            wrapper.setProps({deepLinkURL: 'deeplink-url'});
            instance.canceled = false;

            instance.show();
            expect(Animated.spring).not.toHaveBeenCalled();
        });

        it('should not animate when not visible, state.moreText is not empty and props.deepLinkURL is not set but canceled is true', () => {
            instance.buttonVisible = false;
            wrapper.setState({moreText: '1 new message'});
            wrapper.setProps({deepLinkURL: null});
            instance.canceled = true;

            instance.show();
            expect(Animated.spring).not.toHaveBeenCalled();
        });

        it('should animate when not visible, state.moreText is not empty, props.deepLinkURL is not set, canceled is false, but unreadCount is 0', () => {
            instance.buttonVisible = false;
            wrapper.setState({moreText: '1 new message'});
            wrapper.setProps({deepLinkURL: null, unreadCount: 0});
            instance.canceled = false;

            instance.show();
            expect(Animated.spring).not.toHaveBeenCalled();
        });

        it('should animate when not visible, state.moreText is not empty, props.deepLinkURL is not set, canceled is false, and unreadCount is > 0', () => {
            instance.buttonVisible = false;
            wrapper.setState({moreText: '1 new message'});
            wrapper.setProps({deepLinkURL: null, unreadCount: 1});
            instance.canceled = false;

            instance.show();
            expect(instance.buttonVisible).toBe(true);
            expect(Animated.spring).toHaveBeenCalledWith(instance.top, {
                toValue: MAX_INPUT - INDICATOR_BAR_FACTOR,
                useNativeDriver: true,
            });
        });

        it('should account for the indicator bar height when the indicator is visible', () => {
            instance.indicatorBarVisible = true;
            instance.buttonVisible = false;
            wrapper.setState({moreText: '1 new message'});
            wrapper.setProps({deepLinkURL: null, unreadCount: 1});
            instance.canceled = false;

            instance.show();
            expect(instance.buttonVisible).toBe(true);
            expect(Animated.spring).toHaveBeenCalledWith(instance.top, {
                toValue: MAX_INPUT,
                useNativeDriver: true,
            });
        });
    });

    describe('hide', () => {
        Animated.spring = jest.fn(() => ({
            start: jest.fn(),
        }));
        const wrapper = shallowWithIntl(
            <MoreMessagesButton {...baseProps}/>,
        );
        const instance = wrapper.instance();

        it('should not animate when not visible', () => {
            instance.buttonVisible = false;

            instance.hide();
            expect(Animated.spring).not.toHaveBeenCalled();
        });

        it('should animate when visible', () => {
            instance.buttonVisible = true;

            instance.hide();
            expect(instance.buttonVisible).toBe(false);
            expect(Animated.spring).toHaveBeenCalledWith(instance.top, {
                toValue: MIN_INPUT + INDICATOR_BAR_FACTOR,
                useNativeDriver: true,
            });
        });

        it('should account for the indicator bar height when the indicator is visible', () => {
            instance.indicatorBarVisible = true;
            instance.buttonVisible = true;

            instance.hide();
            expect(instance.buttonVisible).toBe(false);
            expect(Animated.spring).toHaveBeenCalledWith(instance.top, {
                toValue: MIN_INPUT,
                useNativeDriver: true,
            });
        });
    });

    describe('cancel', () => {
        jest.useFakeTimers();

        it('should set canceled, hide button, and disable viewable items handler when forced', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            instance.componentDidUpdate = jest.fn();
            instance.canceled = false;
            instance.hide = jest.fn();
            instance.disableViewableItems = false;

            instance.cancel(true);
            expect(instance.canceled).toBe(true);
            expect(instance.hide).toHaveBeenCalledTimes(1);
            expect(instance.disableViewableItems).toBe(true);
        });

        it('should set canceled, hide button, and disable viewable items handler when not forced but indicator bar is not visible and posts are not loading', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            instance.componentDidUpdate = jest.fn();
            instance.canceled = false;
            instance.hide = jest.fn();
            instance.disableViewableItems = false;
            instance.indicatorBarVisible = false;
            wrapper.setProps({loadingPosts: false});

            instance.cancel(false);
            expect(instance.canceled).toBe(true);
            expect(instance.hide).toHaveBeenCalledTimes(1);
            expect(instance.disableViewableItems).toBe(true);
        });

        it('should delay cancel when not forced but indicator bar is visible', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            instance.componentDidUpdate = jest.fn();
            instance.canceled = false;
            instance.hide = jest.fn();
            instance.disableViewableItems = false;
            instance.indicatorBarVisible = true;
            instance.autoCancelTimer = null;

            instance.cancel(false);
            expect(instance.canceled).toBe(false);
            expect(instance.hide).not.toHaveBeenCalled();
            expect(instance.disableViewableItems).toBe(false);
            expect(instance.autoCancelTimer).toBeDefined();
            expect(setTimeout).toHaveBeenCalledWith(instance.cancel, CANCEL_TIMER_DELAY);

            jest.runOnlyPendingTimers();
        });

        it('should delay cancel when not forced and indicator bar is not visible but posts are loading', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            instance.componentDidUpdate = jest.fn();
            instance.canceled = false;
            instance.hide = jest.fn();
            instance.disableViewableItems = false;
            instance.indicatorBarVisible = false;
            instance.autoCancelTimer = null;
            wrapper.setProps({loadingPosts: true});

            instance.cancel(false);
            expect(instance.canceled).toBe(false);
            expect(instance.hide).not.toHaveBeenCalled();
            expect(instance.disableViewableItems).toBe(false);
            expect(instance.autoCancelTimer).toBeDefined();
            expect(setTimeout).toHaveBeenCalledWith(instance.cancel, CANCEL_TIMER_DELAY);

            jest.runOnlyPendingTimers();
        });
    });

    describe('uncancel', () => {
        it('should set canceled and disableViewableItems to false and clear autoCancelTimer', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();
            const autoCancelTimer = jest.fn();
            instance.autoCancelTimer = autoCancelTimer;
            instance.canceled = true;
            instance.disableViewableItems = true;

            instance.uncancel();
            expect(clearTimeout).toHaveBeenCalledWith(autoCancelTimer);
            expect(instance.autoCancelTimer).toBeNull();
            expect(instance.canceled).toBe(false);
            expect(instance.disableViewableItems).toBe(false);
        });
    });

    describe('onMoreMessagesPress', () => {
        const wrapper = shallowWithIntl(
            <MoreMessagesButton {...baseProps}/>,
        );
        const instance = wrapper.instance();

        it('should return early when pressed is true', () => {
            instance.pressed = true;
            instance.onMoreMessagesPress();

            expect(baseProps.scrollToIndex).not.toHaveBeenCalled();
            expect(instance.pressed).toBe(true);
        });

        it('should set pressed to true and scroll to the initial index', () => {
            instance.pressed = false;
            instance.onMoreMessagesPress();

            expect(instance.pressed).toBe(true);
            expect(baseProps.scrollToIndex).toHaveBeenCalledWith(baseProps.newMessageLineIndex, true);
        });
    });

    describe('onViewableItemsChanged', () => {
        jest.useFakeTimers();

        const wrapper = shallowWithIntl(
            <MoreMessagesButton {...baseProps}/>,
        );
        const instance = wrapper.instance();
        instance.componentDidUpdate = jest.fn();
        instance.cancel = jest.fn();
        instance.getReadCount = jest.fn((count) => {
            return count;
        });
        instance.showMoreText = jest.fn();

        beforeEach(() => {
            jest.clearAllMocks();
            jest.clearAllTimers();
        });

        it('should return early when newMessageLineIndex <= 0', () => {
            const viewableItems = [{index: 0}, {index: 1}];

            wrapper.setProps({newMessageLineIndex: 0});
            instance.onViewableItemsChanged(viewableItems);
            expect(clearTimeout).not.toHaveBeenCalled();

            wrapper.setProps({newMessageLineIndex: -1});
            instance.onViewableItemsChanged(viewableItems);
            expect(clearTimeout).not.toHaveBeenCalled();
        });

        it('should return early when viewableItems length is 0', () => {
            const viewableItems = [];
            wrapper.setProps({newMessageLineIndex: 1, unreadCount: 10});

            instance.onViewableItemsChanged(viewableItems);
            expect(clearTimeout).not.toHaveBeenCalled();
        });

        it('should return early when disableViewableItems is true', () => {
            const viewableItems = [{index: 0}];
            wrapper.setProps({newMessageLineIndex: 1, unreadCount: 10});
            instance.disableViewableItems = true;

            instance.onViewableItemsChanged(viewableItems);
            expect(clearTimeout).not.toHaveBeenCalled();
        });

        it('should force cancel and also scroll to newMessageLineIndex when the channel is first loaded and the newMessageLineIndex is viewable', () => {
            // When the channel is first loaded index 0 will be viewable
            const viewableItems = [{index: 0}, {index: 1}, {index: 2}];
            const newMessageLineIndex = 2;
            wrapper.setProps({newMessageLineIndex, unreadCount: 10});
            instance.disableViewableItems = false;

            instance.onViewableItemsChanged(viewableItems);
            jest.runOnlyPendingTimers();

            expect(instance.cancel).toHaveBeenCalledTimes(1);
            expect(instance.cancel).toHaveBeenCalledWith(true);
            expect(baseProps.scrollToIndex).toHaveBeenCalledWith(newMessageLineIndex, true);
        });

        it('should force cancel and also scroll to newMessageLineIndex when the channel is first loaded and the newMessageLineIndex will be the next viewable item', () => {
            // When the channel is first loaded index 0 will be viewable
            const viewableItems = [{index: 0}, {index: 1}, {index: 2}];
            const newMessageLineIndex = 3;
            wrapper.setProps({newMessageLineIndex, unreadCount: 10});
            instance.disableViewableItems = false;

            instance.onViewableItemsChanged(viewableItems);
            jest.runOnlyPendingTimers();

            expect(instance.cancel).toHaveBeenCalledTimes(1);
            expect(instance.cancel).toHaveBeenCalledWith(true);
            expect(baseProps.scrollToIndex).toHaveBeenCalledWith(newMessageLineIndex, true);
        });

        it('should force cancel when the New Message line has been reached and there are no more unread messages', () => {
            const viewableItems = [{index: 1}, {index: 2}, {index: 3}];
            const newMessageLineIndex = 3;
            wrapper.setProps({newMessageLineIndex, unreadCount: newMessageLineIndex});
            instance.disableViewableItems = false;
            instance.autoCancelTimer = null;
            instance.cancel = jest.fn();

            instance.onViewableItemsChanged(viewableItems);
            jest.runOnlyPendingTimers();

            expect(instance.cancel).toHaveBeenCalledWith(true);
            expect(instance.autoCancelTimer).toBeNull();
            expect(setTimeout).not.toHaveBeenCalled();
        });

        it('should set autoCancelTimer when the New Message line has been reached but there are still unread messages', () => {
            const viewableItems = [{index: 1}, {index: 2}, {index: 3}];
            const newMessageLineIndex = 3;
            wrapper.setProps({newMessageLineIndex, unreadCount: newMessageLineIndex + 1});
            instance.disableViewableItems = false;
            instance.autoCancelTimer = null;
            instance.cancel = jest.fn();

            instance.onViewableItemsChanged(viewableItems);
            jest.runOnlyPendingTimers();

            expect(instance.autoCancelTimer).toBeDefined();
            expect(setTimeout).toHaveBeenCalledWith(instance.cancel, CANCEL_TIMER_DELAY);
        });

        it('should call showMoreText with the read count derived from endIndex when endIndex is reached', () => {
            const viewableItems = [{index: 1}, {index: 2}, {index: 3}];
            const newMessageLineIndex = 10;
            wrapper.setProps({newMessageLineIndex});
            wrapper.setState({moreText: '10 new messages'});
            instance.disableViewableItems = false;

            instance.endIndex = null;
            instance.onViewableItemsChanged(viewableItems);
            jest.runOnlyPendingTimers();
            expect(instance.getReadCount).not.toHaveBeenCalled();
            expect(instance.showMoreText).not.toHaveBeenCalled();
            expect(instance.endIndex).toBeNull();

            instance.endIndex = 4;
            instance.onViewableItemsChanged(viewableItems);
            jest.runOnlyPendingTimers();
            expect(instance.getReadCount).not.toHaveBeenCalled();
            expect(instance.showMoreText).not.toHaveBeenCalled();
            expect(instance.endIndex).toEqual(4);

            instance.endIndex = 3;
            instance.onViewableItemsChanged(viewableItems);
            jest.runOnlyPendingTimers();
            expect(instance.getReadCount).toHaveBeenCalledWith(3);
            expect(instance.showMoreText).toHaveBeenCalledWith(3);
            expect(instance.endIndex).toBeNull();
        });

        it('should call showMoreText with 0 when moreText is empty', () => {
            const viewableItems = [{index: 1}, {index: 2}, {index: 3}];
            const newMessageLineIndex = 10;
            wrapper.setProps({newMessageLineIndex});
            instance.disableViewableItems = false;
            instance.endIndex = null;

            wrapper.setState({moreText: '1 new message'});
            instance.onViewableItemsChanged(viewableItems);
            jest.runOnlyPendingTimers();
            expect(instance.showMoreText).not.toHaveBeenCalled();

            wrapper.setState({moreText: ''});
            instance.onViewableItemsChanged(viewableItems);
            jest.runOnlyPendingTimers();
            expect(instance.showMoreText).toHaveBeenCalledWith(0);
        });
    });

    describe('showMoreText', () => {
        const props = {
            ...baseProps,
            unreadCount: 10,
        };
        const wrapper = shallowWithIntl(
            <MoreMessagesButton {...props}/>,
        );
        const instance = wrapper.instance();
        instance.cancel = jest.fn();
        instance.moreText = jest.fn((text) => {
            return text;
        });
        instance.setState = jest.fn();
        instance.show = jest.fn();

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should not set moreText when props.unreadCount - readCount is <= 0', () => {
            let readCount = props.unreadCount + 1;
            instance.showMoreText(readCount);
            expect(instance.moreText).not.toHaveBeenCalled();
            expect(instance.setState).not.toHaveBeenCalled();

            readCount = props.unreadCount;
            instance.showMoreText(readCount);
            expect(instance.moreText).not.toHaveBeenCalled();
            expect(instance.setState).not.toHaveBeenCalled();
        });

        it('should set moreText when props.unreadCount - readCount is > 0', () => {
            const moreCount = 1;
            const readCount = props.unreadCount - moreCount;
            instance.showMoreText(readCount);
            expect(instance.cancel).not.toHaveBeenCalled();
            expect(instance.moreText).toHaveBeenCalledWith(moreCount);
            expect(instance.setState).toHaveBeenCalledWith({moreText: moreCount}, instance.show);
        });
    });

    describe('getReadCount', () => {
        PostListUtils.messageCount = jest.fn().mockImplementation((postIds) => postIds.length); // eslint-disable-line no-import-assign

        const wrapper = shallowWithIntl(
            <MoreMessagesButton {...baseProps}/>,
        );
        const instance = wrapper.instance();

        it('should return the count of posts up to the lastViewableIndex', () => {
            const postIds = ['post1', 'post2', 'post3'];
            wrapper.setProps({postIds});

            let lastViewableIndex = 0;
            let readCount = instance.getReadCount(lastViewableIndex);
            expect(readCount).toEqual(1);

            lastViewableIndex = 1;
            readCount = instance.getReadCount(lastViewableIndex);
            expect(readCount).toEqual(2);

            lastViewableIndex = 2;
            readCount = instance.getReadCount(lastViewableIndex);
            expect(readCount).toEqual(3);

            lastViewableIndex = 3;
            readCount = instance.getReadCount(lastViewableIndex);
            expect(readCount).toEqual(3);
        });
    });

    describe('onScrollEndIndex', () => {
        it('should set pressed to false', () => {
            const wrapper = shallowWithIntl(
                <MoreMessagesButton {...baseProps}/>,
            );
            const instance = wrapper.instance();

            instance.pressed = true;
            instance.onScrollEndIndex();
            expect(instance.pressed).toBe(false);
        });
    });

    describe('moreText', () => {
        const wrapper = shallowWithIntl(
            <MoreMessagesButton {...baseProps}/>,
        );
        const instance = wrapper.instance();

        it('should return defaultMessage of `{count} new messages` when count is > 1 and count equals unreadCount', () => {
            let moreCount = 2;
            wrapper.setProps({unreadCount: moreCount});
            let message = instance.moreText(moreCount);
            expect(message).toEqual('2 new messages');

            moreCount = 3;
            wrapper.setProps({unreadCount: moreCount});
            message = instance.moreText(moreCount);
            expect(message).toEqual('3 new messages');
        });

        it('should return defaultMessage of `{count} more new messages` when count > 1 and count does not equal unreadCount', () => {
            let moreCount = 2;
            wrapper.setProps({unreadCount: 10});
            let message = instance.moreText(moreCount);
            expect(message).toEqual('2 more new messages');

            moreCount = 3;
            message = instance.moreText(moreCount);
            expect(message).toEqual('3 more new messages');
        });

        it('should return defaultMessage of `1 new message` when count === 1 and count equals unreadCount', () => {
            const moreCount = 1;
            wrapper.setProps({unreadCount: 1});
            const message = instance.moreText(moreCount);
            expect(message).toEqual('1 new message');
        });

        it('should return defaultMessage of `1 more new message` when count === 1 and count does not equal unreadCount', () => {
            const moreCount = 1;
            wrapper.setProps({unreadCount: 10});
            const message = instance.moreText(moreCount);
            expect(message).toEqual('1 more new message');
        });
    });
});
