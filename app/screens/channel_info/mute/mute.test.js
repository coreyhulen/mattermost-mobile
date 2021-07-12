// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import Mute from './mute';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('ChannelInfo -> Mute', () => {
    const baseProps = {
        channelId: '123',
        isChannelMuted: false,
        theme: Preferences.THEMES.default,
        updateChannelNotifyProps: jest.fn(),
        userId: 'user-123',
    };

    test('should match snapshot for Not Muted', () => {
        const wrapper = shallowWithIntl(
            <Mute
                {...baseProps}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for Muted', () => {
        const wrapper = shallowWithIntl(
            <Mute
                {...baseProps}
                isChannelMuted={true}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
