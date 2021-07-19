// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import CustomStatusEmoji from '@components/custom_status/custom_status_emoji';
import * as CustomStatusSelectors from '@selectors/custom_status';
import {renderWithRedux} from 'test/testing_library';
import {CustomStatusDuration} from '@mm-redux/types/users';

jest.mock('@selectors/custom_status');

describe('components/custom_status/custom_status_emoji', () => {
    const getCustomStatus = () => {
        return {
            emoji: 'calendar',
            text: 'In a meeting',
            duration: CustomStatusDuration.DONT_CLEAR,
        };
    };
    (CustomStatusSelectors.makeGetCustomStatus as jest.Mock).mockReturnValue(getCustomStatus);
    it('should match snapshot', () => {
        const wrapper = renderWithRedux(
            <CustomStatusEmoji/>,
        );
        expect(wrapper.toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with props', () => {
        const wrapper = renderWithRedux(
            <CustomStatusEmoji
                emojiSize={34}
            />,
        );

        expect(wrapper.toJSON()).toMatchSnapshot();
    });

    it('should not render when getCustomStatus returns null', () => {
        (CustomStatusSelectors.makeGetCustomStatus as jest.Mock).mockReturnValue(() => null);
        const wrapper = renderWithRedux(
            <CustomStatusEmoji/>,
        );

        expect(wrapper.toJSON()).toBeNull();
    });
});
