// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Alert} from 'react-native';

import Device from '@constants/device';
import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import PostInput from './post_input';

describe('PostInput', () => {
    const baseProps = {
        testID: 'post_draft.post.input',
        channelDisplayName: 'Test Channel',
        channelId: 'channel-id',
        cursorPositionEvent: '',
        handleCommentDraftChanged: jest.fn(),
        handlePostDraftChanged: jest.fn(),
        inputEventType: '',
        maxMessageLength: 4000,
        onPasteFiles: jest.fn(),
        onSend: jest.fn(),
        readonly: false,
        rootId: '',
        theme: Preferences.THEMES.default,
        updateInitialValue: jest.fn(),
        userTyping: jest.fn(),
    };

    test('should match, full snapshot', () => {
        const wrapper = shallowWithIntl(
            <PostInput {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should emit the event but no text is save to draft', () => {
        const wrapper = shallowWithIntl(
            <PostInput {...baseProps}/>,
        );

        const instance = wrapper.instance();

        instance.changeDraft = jest.fn();
        instance.handleAppStateChange('active');
        expect(instance.changeDraft).not.toBeCalled();
    });

    test('should emit the event and text is save to draft', async () => {
        const wrapper = shallowWithIntl(
            <PostInput {...baseProps}/>,
        );

        const instance = wrapper.instance();
        const value = 'some text';

        instance.setValue(value);
        instance.handleAppStateChange('background');
        await TestHelper.wait(200);
        expect(baseProps.handlePostDraftChanged).toHaveBeenCalledWith(baseProps.channelId, value);
        expect(baseProps.handlePostDraftChanged).toHaveBeenCalledTimes(1);
    });

    test('should not send multiple alerts when message is too long', () => {
        const wrapper = shallowWithIntl(
            <PostInput {...baseProps}/>,
        );

        const instance = wrapper.instance();
        const longString = [...Array(baseProps.maxMessageLength + 2).keys()].map(() => Math.random().toString(36).slice(0, 1)).join('');

        instance.handleTextChange(longString);
        instance.handleTextChange(longString.slice(1));

        expect(Alert.alert).toBeCalled();
        expect(Alert.alert).toHaveBeenCalledTimes(1);
    });

    test('should save the draft onChangeText for tablets', async () => {
        Device.IS_TABLET = true;
        const wrapper = shallowWithIntl(
            <PostInput {...baseProps}/>,
        );

        const instance = wrapper.instance();
        const value = 'some text';

        instance.handleTextChange(value);
        await TestHelper.wait(200);

        expect(baseProps.handlePostDraftChanged).toBeCalled();
        expect(baseProps.handlePostDraftChanged).toHaveBeenCalledTimes(1);
    });

    test('should not save the draft onEndEditing for tablets', async () => {
        Device.IS_TABLET = true;
        const wrapper = shallowWithIntl(
            <PostInput {...baseProps}/>,
        );

        const instance = wrapper.instance();
        const value = 'some text';

        instance.handleEndEditing(value);
        await TestHelper.wait(200);

        expect(baseProps.handlePostDraftChanged).not.toBeCalled();
    });
});

