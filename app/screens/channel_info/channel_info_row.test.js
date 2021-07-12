// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import ChannelInfoRow from './channel_info_row';

describe('ChannelInfoRow', () => {
    const baseProps = {
        action: jest.fn(),
        testID: 'test-id',
        defaultMessage: 'default-message',
        detail: 'detail',
        icon: 'icon',
        iconColor: '#ababab',
        image: 1,
        imageTintColor: '#ffffff',
        rightArrow: true,
        textId: 'text-id',
        togglable: false,
        textColor: '#000000',
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <ChannelInfoRow {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
