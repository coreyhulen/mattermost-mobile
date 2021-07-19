// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import {TouchableOpacity} from 'react-native';

import Preferences from '@mm-redux/constants/preferences';
import {CustomStatusDuration} from '@mm-redux/types/users';
import {shallowWithIntl} from 'test/intl-test-helper';
import ClearAfterMenuItem from './clear_after_menu_item';

describe('screens/clear_after_menu_item', () => {
    const baseProps = {
        theme: Preferences.THEMES.default,
        duration: CustomStatusDuration.DONT_CLEAR,
        separator: false,
        isSelected: false,
        handleItemClick: jest.fn(),
    };

    it('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <ClearAfterMenuItem {...baseProps}/>,
        );

        expect(wrapper.dive().getElement()).toMatchSnapshot();
    });

    it('should match snapshot with separator and selected check', () => {
        const wrapper = shallowWithIntl(
            <ClearAfterMenuItem
                {...baseProps}
                separator={true}
                isSelected={true}
            />,
        );

        expect(wrapper.dive().getElement()).toMatchSnapshot();
    });

    it('should call handleItemClick on clicking the suggestion', () => {
        const wrapper = shallowWithIntl(
            <ClearAfterMenuItem
                {...baseProps}
            />,
        );

        wrapper.dive().find(TouchableOpacity).simulate('press');
        expect(baseProps.handleItemClick).toBeCalled();
    });
});
