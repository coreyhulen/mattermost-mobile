// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import SelectTimezone from './select_timezone';

describe('Settings SelectTimezone', () => {
    const baseProps = {
        onBack: jest.fn(),
        selectedTimezone: 'selected-timezone',
        initialScrollIndex: 1,
        timezones: [],
        theme: Preferences.THEMES.default,
        isLandscape: false,
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(<SelectTimezone {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
