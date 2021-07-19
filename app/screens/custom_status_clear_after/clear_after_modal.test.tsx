// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {CustomStatusDuration} from '@mm-redux/types/users';
import ClearAfterModal from '@screens/custom_status_clear_after/clear_after_modal';
import {shallowWithIntl} from 'test/intl-test-helper';

describe('screens/clear_after_modal', () => {
    const baseProps = {
        theme: Preferences.THEMES.default,
        initialDuration: CustomStatusDuration.DONT_CLEAR,
        handleClearAfterClick: jest.fn(),
    };

    it('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <ClearAfterModal {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
