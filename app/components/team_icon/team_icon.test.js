// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import TeamIcon from './team_icon';

describe('TeamIcon', () => {
    const baseProps = {
        testID: 'team_icon',
        displayName: 'display-name',
        lastIconUpdate: 1,
        teamId: 'team-id',
        styleContainer: {},
        styleText: {},
        styleImage: {},
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallow(<TeamIcon {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
