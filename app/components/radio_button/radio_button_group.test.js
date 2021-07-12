// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import RadioButtonGroup from './radio_button_group';

describe('RadioButtonGroup', () => {
    const baseProps = {
        onSelect: jest.fn(),
        name: 'name',
    };

    test('should match snapshot', () => {
        const options = [{
            testID: 'radio-1',
            label: 'label-1',
            theme: Preferences.THEMES.default,
            value: 'value',
            checked: true,
            disabled: false,
        }, {
            testID: 'radio-2',
            label: 'label-2',
            theme: Preferences.THEMES.default,
            value: 'value',
            checked: false,
            disabled: true,
        }];

        const wrapper = shallowWithIntl(
            <RadioButtonGroup
                {...baseProps}
                options={options}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
