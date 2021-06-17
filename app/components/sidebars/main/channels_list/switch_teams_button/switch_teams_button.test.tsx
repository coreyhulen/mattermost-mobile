// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {shallow} from 'enzyme';

import Preferences from '@mm-redux/constants/preferences';

import SwitchTeamsButton from './switch_teams_button';

describe('SwitchTeamsButton', () => {
    const baseProps = {
        onShowTeams: jest.fn(),
        testID: 'main.sidebar.channels_list.switch_teams.button',
        currentTeamId: 'current-team-id',
        mentionCount: 1,
        teamsCount: 2,
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallow(<SwitchTeamsButton {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
