// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import CustomStatusModal from '@screens/custom_status/custom_status_modal';

import {shallowWithIntl} from 'test/intl-test-helper';
import {CustomStatusDuration} from '@mm-redux/types/users';

describe('screens/custom_status_modal', () => {
    const customStatus = {
        emoji: 'calendar',
        text: 'In a meeting',
        duration: CustomStatusDuration.DONT_CLEAR,
    };

    const baseProps = {
        actions: {
            setCustomStatus: jest.fn(),
            unsetCustomStatus: jest.fn(),
            removeRecentCustomStatus: jest.fn(),
        },
        theme: Preferences.THEMES.default,
        customStatus,
        recentCustomStatuses: [customStatus],
    };

    it('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <CustomStatusModal {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    it('should match snapshot when user has no custom status set', () => {
        const wrapper = shallowWithIntl(
            <CustomStatusModal
                {...baseProps}
                customStatus={null}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    it('should match snapshot when user has no recent custom status', () => {
        const wrapper = shallowWithIntl(
            <CustomStatusModal
                {...baseProps}
                recentCustomStatuses={[]}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
