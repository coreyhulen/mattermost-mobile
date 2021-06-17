// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {shallow} from 'enzyme';

import Preferences from '@mm-redux/constants/preferences';

import TeamsListItem from './teams_list_item';

describe('TeamsListItem', () => {
    const baseProps = {
        selectTeam: jest.fn(),
        testID: 'main.sidebar.teams_list.flat_list.teams_list_item',
        currentTeamId: 'current-team-id',
        currentUrl: 'current-url',
        displayName: 'display-name',
        mentionCount: 1,
        name: 'name',
        teamId: 'team-id',
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallow(<TeamsListItem {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
