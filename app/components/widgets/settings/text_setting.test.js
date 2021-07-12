// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import TextSetting from './text_setting.js';

describe('components/widgets/settings/TextSetting', () => {
    const theme = Preferences.THEMES.default;
    test('onChange', () => {
        const onChange = jest.fn();
        const wrapper = shallow(
            <TextSetting
                id='string.id'
                label='some label'
                value='some value'
                onChange={onChange}
                theme={theme}
            />,
        );

        wrapper.instance().onChangeText('somenewvalue');

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('string.id', 'somenewvalue');
    });
});
