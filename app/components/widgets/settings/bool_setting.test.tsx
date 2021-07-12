// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {shallow} from 'enzyme';
import React from 'react';
import {Switch} from 'react-native';

import Preferences from '@mm-redux/constants/preferences';

import BoolSetting from './bool_setting';

describe('components/widgets/settings/TextSetting', () => {
    const theme = Preferences.THEMES.default;
    test('onChange', () => {
        const onChange = jest.fn();
        const wrapper = shallow(
            <BoolSetting
                id='elementid'
                label='Can you please check below'
                value={true}
                placeholder='This is a boolean setting.'
                optional={false}
                theme={theme}
                onChange={onChange}
            />,
        );

        wrapper.find<Switch>(Switch).simulate('valueChange', false);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('elementid', false);

        wrapper.find<Switch>(Switch).simulate('valueChange', true);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenCalledWith('elementid', true);
    });
});
