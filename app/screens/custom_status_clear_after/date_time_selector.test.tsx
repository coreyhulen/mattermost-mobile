// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {renderWithRedux} from 'test/testing_library';
import DateTimeSelector from './date_time_selector';

describe('screens/date_time_selector', () => {
    const baseProps = {
        theme: Preferences.THEMES.default,
        handleChange: jest.fn(),
    };

    it('should match snapshot', () => {
        const wrapper = renderWithRedux(
            <DateTimeSelector {...baseProps}/>,
        );

        expect(wrapper.toJSON()).toMatchSnapshot();
    });
});
