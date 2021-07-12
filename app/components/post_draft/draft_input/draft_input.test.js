// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Alert} from 'react-native';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import DraftInput from './draft_input';

jest.useFakeTimers();

async function createPost() {
    return {data: true, failed: false};
}

describe('DraftInput', () => {
    const baseProps = {
        registerTypingAnimation: jest.fn(),
        addReactionToLatestPost: jest.fn(),
        createPost: jest.fn(createPost),
        executeCommand: jest.fn(),
        handleCommentDraftChanged: jest.fn(),
        handlePostDraftChanged: jest.fn(),
        handleClearFiles: jest.fn(),
        handleClearFailedFiles: jest.fn(),
        handleRemoveLastFile: jest.fn(),
        initUploadFiles: jest.fn(),
        userTyping: jest.fn(),
        handleCommentDraftSelectionChanged: jest.fn(),
        setStatus: jest.fn(),
        selectPenultimateChannel: jest.fn(),
        getChannelTimezones: jest.fn(),
        getChannelMemberCountsByGroup: jest.fn(),
        canUploadFiles: true,
        channelId: 'channel-id',
        channelDisplayName: 'Test Channel',
        channelTeamId: 'channel-team-id',
        channelIsReadOnly: false,
        currentUserId: 'current-user-id',
        deactivatedChannel: false,
        files: [],
        maxFileSize: 1024,
        maxMessageLength: 4000,
        rootId: '',
        theme: Preferences.THEMES.default,
        uploadFileRequestStatus: 'NOT_STARTED',
        value: '',
        userIsOutOfOffice: false,
        channelIsArchived: false,
        onCloseChannel: jest.fn(),
        cursorPositionEvent: '',
        valueEvent: '',
        isLandscape: false,
        screenId: 'NavigationScreen1',
        canPost: true,
        currentChannelMembersCount: 50,
        enableConfirmNotificationsToChannel: true,
        useChannelMentions: true,
        useGroupMentions: true,
        groupsWithAllowReference: new Map([
            ['@developers', {
                id: 'developers',
                name: 'developers',
            }],
            ['@qa', {
                id: 'qa',
                name: 'qa',
            }],
        ]),
        channelMemberCountsByGroup: {
            developers: {
                channel_member_count: 10,
                channel_member_timezones_count: 0,
            },
            qa: {
                channel_member_count: 3,
                channel_member_timezones_count: 0,
            },
        },
        membersCount: 10,
        addRecentUsedEmojisInMessage: jest.fn(),
        handleGotoLocation: jest.fn(),
    };
    const ref = React.createRef();

    test('should send an alert when sending a message with a channel mention', () => {
        const wrapper = shallowWithIntl(
            <DraftInput
                {...baseProps}
                ref={ref}
            />,
        );
        const message = '@all';
        const instance = wrapper.instance();
        expect(instance.input).toEqual({current: null});
        instance.input = {
            current: {
                getValue: () => message,
                setValue: jest.fn(),
                changeDraft: jest.fn(),
                resetTextInput: jest.fn(),
            },
        };

        instance.handleSendMessage();
        jest.runOnlyPendingTimers();
        expect(Alert.alert).toBeCalled();
        expect(Alert.alert).toHaveBeenCalledWith('Confirm sending notifications to entire channel', expect.anything(), expect.anything());
    });

    test('should send an alert when sending a message with a group mention with group with count more than NOTIFY_ALL', () => {
        const wrapper = shallowWithIntl(
            <DraftInput
                {...baseProps}
                ref={ref}
            />,
        );
        const message = '@developers';
        const instance = wrapper.instance();
        expect(instance.input).toEqual({current: null});
        instance.input = {
            current: {
                getValue: () => message,
                setValue: jest.fn(),
                changeDraft: jest.fn(),
                resetTextInput: jest.fn(),
            },
        };
        instance.handleSendMessage();
        jest.runOnlyPendingTimers();
        expect(Alert.alert).toBeCalled();
    });

    test('should not send an alert when sending a message with a group mention with group with count less than NOTIFY_ALL', () => {
        const wrapper = shallowWithIntl(
            <DraftInput
                {...baseProps}
                ref={ref}
            />,
        );
        const message = '@qa';
        const instance = wrapper.instance();
        expect(instance.input).toEqual({current: null});
        instance.input = {
            current: {
                getValue: () => message,
                setValue: jest.fn(),
                changeDraft: jest.fn(),
                resetTextInput: jest.fn(),
            },
        };

        instance.handleSendMessage();
        jest.runOnlyPendingTimers();
        expect(Alert.alert).not.toBeCalled();
    });

    test('should not send an alert when sending a message with a channel mention when the user does not have channel mentions permission', () => {
        const wrapper = shallowWithIntl(
            <DraftInput
                {...baseProps}
                useChannelMentions={false}
                ref={ref}
            />,
        );
        const message = '@all';
        const instance = wrapper.instance();
        expect(instance.input).toEqual({current: null});
        instance.input = {
            current: {
                getValue: () => message,
                setValue: jest.fn(),
                changeDraft: jest.fn(),
                resetTextInput: jest.fn(),
            },
        };

        instance.handleSendMessage();
        jest.runOnlyPendingTimers();
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    test('should not send an alert when sending a message with a channel mention when the user does not have group mentions permission', () => {
        const wrapper = shallowWithIntl(
            <DraftInput
                {...baseProps}
                useGroupMentions={false}
                ref={ref}
            />,
        );
        const message = '@developer';
        const instance = wrapper.instance();
        expect(instance.input).toEqual({current: null});
        instance.input = {
            current: {
                getValue: () => message,
                setValue: jest.fn(),
                changeDraft: jest.fn(),
                resetTextInput: jest.fn(),
            },
        };

        instance.handleSendMessage();
        jest.runOnlyPendingTimers();
        expect(Alert.alert).not.toHaveBeenCalled();
    });
});
