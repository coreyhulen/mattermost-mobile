// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import Pinned from './pinned';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('ChannelInfo -> Pinned', () => {
    const baseProps = {
        channelId: '123',
        pinnedCount: 0,
        theme: Preferences.THEMES.default,
        userId: 'user-123',
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <Pinned
                {...baseProps}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
