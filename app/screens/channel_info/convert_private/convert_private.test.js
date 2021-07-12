// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import ConvertPrivate from './convert_private';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('ChannelInfo -> ConvertPrivate', () => {
    const baseProps = {
        canConvert: true,
        channelId: '123',
        convertChannelToPrivate: jest.fn(),
        displayName: 'Test Channel',
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot for Convert to Private Channel', () => {
        const wrapper = shallowWithIntl(
            <ConvertPrivate
                {...baseProps}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot Convert to Private Channel', () => {
        const wrapper = shallowWithIntl(
            <ConvertPrivate
                {...baseProps}
                canConvert={false}
            />,
        );
        expect(wrapper.getElement()).toBeNull();
    });
});
