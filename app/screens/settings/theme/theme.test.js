// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import Theme from './theme';
import ThemeTile from './theme_tile';

const allowedThemes = Object.keys(Preferences.THEMES).map((key) => ({
    key,
    ...Preferences.THEMES[key],
}));

describe('Theme', () => {
    const baseProps = {
        actions: {
            savePreferences: jest.fn(),
        },
        allowedThemes,
        isLandscape: false,
        isTablet: false,
        teamId: 'test-team',
        theme: Preferences.THEMES.default,
        userId: 'test-user',
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <Theme {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find(ThemeTile)).toHaveLength(4);
    });
});
