// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import InputQuickAction from './index';

describe('InputQuickAction', () => {
    const baseProps = {
        onTextChange: jest.fn(),
        testID: 'post_draft.quick_actions.input_action',
        disabled: false,
        inputType: 'at',
        theme: Preferences.THEMES.default,
        value: 'value',
    };

    test('should match snapshot', () => {
        const wrapper = shallow(<InputQuickAction {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
