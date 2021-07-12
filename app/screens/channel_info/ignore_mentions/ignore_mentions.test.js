// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import IgnoreMentions from './ignore_mentions';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('ChannelInfo -> IgnoreMentions', () => {
    const baseProps = {
        channelId: '123',
        ignore: false,
        theme: Preferences.THEMES.default,
        updateChannelNotifyProps: jest.fn(),
        userId: 'user-123',
    };

    test('should match snapshot for Not Ignore Mentions', () => {
        const wrapper = shallowWithIntl(
            <IgnoreMentions
                {...baseProps}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for Ignore Mentions', () => {
        const wrapper = shallowWithIntl(
            <IgnoreMentions
                {...baseProps}
                ignore={true}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
