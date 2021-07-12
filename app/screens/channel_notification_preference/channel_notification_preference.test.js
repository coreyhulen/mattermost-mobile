// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {ViewTypes} from '@constants';
import Preferences from '@mm-redux/constants/preferences';
import SectionItem from '@screens/settings/section_item';
import {shallowWithIntlMessages} from '@test/intl-test-helper';

import ChannelNotificationPreference from './channel_notification_preference';

function makeProps(pushNotificationLevel) {
    return {
        actions: {
            updateChannelNotifyProps: jest.fn(),
        },
        channelId: 'channel_id',
        globalNotifyProps: {
            push: 'mention',
        },
        userId: 'user_id',
        notifyProps: {
            push: pushNotificationLevel,
        },
        theme: Preferences.THEMES.default,
    };
}

function checkNotificationSelected(pushNotificationLevel, trueIdx) {
    const wrapper = shallowWithIntlMessages(
        <ChannelNotificationPreference
            {...makeProps(pushNotificationLevel)}
        />,
    );

    const sectionItems = wrapper.find(SectionItem);

    expect(sectionItems.exists()).toBe(true);
    expect(sectionItems.length).toBe(4);

    sectionItems.forEach((sectionItem, idx) => {
        expect(sectionItem.prop('selected')).toBe(idx === trueIdx);
    });
}

describe('ChannelNotificationPreference', () => {
    test('should match snapshot', () => {
        const baseProps = makeProps('default');
        const wrapper = shallowWithIntlMessages(
            <ChannelNotificationPreference {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should have correct setting selected', () => {
        checkNotificationSelected(null, 0);
        checkNotificationSelected(ViewTypes.NotificationLevels.DEFAULT, 0);
        checkNotificationSelected(ViewTypes.NotificationLevels.ALL, 1);
        checkNotificationSelected(ViewTypes.NotificationLevels.MENTION, 2);
        checkNotificationSelected(ViewTypes.NotificationLevels.NONE, 3);
    });

    test('should save on click', () => {
        const props = makeProps('default');
        const wrapper = shallowWithIntlMessages(
            <ChannelNotificationPreference {...props}/>,
        );

        // click on 'Never' -- last item
        wrapper.find(SectionItem).at(3).dive().simulate('press');

        expect(props.actions.updateChannelNotifyProps).toHaveBeenCalledTimes(1);
        expect(props.actions.updateChannelNotifyProps).toBeCalledWith(
            props.userId,
            props.channelId,
            {push: ViewTypes.NotificationLevels.NONE},
        );
    });
});
