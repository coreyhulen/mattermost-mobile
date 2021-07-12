// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import NotificationPreference from './notification_preference';

describe('NotificationPreference', () => {
    const baseProps = {
        testID: 'test-id',
        channelId: 'channel-id',
        userId: 'user-id',
        notifyProps: {
            push: 'default',
        },
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <NotificationPreference {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
