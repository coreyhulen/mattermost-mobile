// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import Favorite from './favorite';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('ChannelInfo -> Favorite', () => {
    const baseProps = {
        channelId: '123',
        favoriteChannel: jest.fn(),
        isFavorite: false,
        unfavoriteChannel: jest.fn(),
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot for Favorite Channel', () => {
        const wrapper = shallowWithIntl(
            <Favorite
                {...baseProps}
                isFavorite={true}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for Unfavorite Channel', () => {
        const wrapper = shallowWithIntl(
            <Favorite
                {...baseProps}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
