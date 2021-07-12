// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {shallow} from 'enzyme';
import React from 'react';

import {RequestStatus} from '@mm-redux/constants';
import Preferences from '@mm-redux/constants/preferences';

import SelectTeam from './select_team.js';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

const getTeams = async () => {
    return {
        error: {},
    };
};

describe('SelectTeam', () => {
    const actions = {
        getTeams,
        handleTeamChange: jest.fn(),
        addUserToTeam: jest.fn(),
        logout: jest.fn(),
    };

    const baseProps = {
        actions,
        currentChannelId: 'someId',
        currentUserIsGuest: false,
        currentUserId: 'fakeid',
        currentUrl: 'test',
        userWithoutTeams: false,
        teams: [],
        theme: Preferences.THEMES.default,
        teamsRequest: {
            status: RequestStatus.FAILURE,
        },
        componentId: 'component-id',
        serverVersion: '5.18',
    };

    test('should match snapshot for fail of teams', async () => {
        const wrapper = shallow(
            <SelectTeam {...baseProps}/>,
        );
        expect(wrapper.state('loading')).toEqual(true);
        await getTeams();
        expect(wrapper.state('loading')).toEqual(false);
        wrapper.update();
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for teams', async () => {
        const props = {
            ...baseProps,
            teams: [{
                id: 'kemjcpu9bi877yegqjs18ndp4r',
                invite_id: 'ojsnudhqzbfzpk6e4n6ip1hwae',
                name: 'test',
            }],
            teamsRequest: {
                status: RequestStatus.SUCCESS,
            },
        };

        const wrapper = shallow(
            <SelectTeam {...props}/>,
        );
        expect(wrapper.state('page')).toEqual(0);
        await getTeams();
        expect(wrapper.state('page')).toEqual(1);
        wrapper.update();
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when user is a guest', async () => {
        const props = {
            ...baseProps,
            currentUserIsGuest: true,
            teams: [{
                id: 'kemjcpu9bi877yegqjs18ndp4r',
                invite_id: 'ojsnudhqzbfzpk6e4n6ip1hwae',
                name: 'test',
            }],
            teamsRequest: {
                status: RequestStatus.SUCCESS,
            },
        };

        const wrapper = shallow(
            <SelectTeam {...props}/>,
        );
        await getTeams();
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should call addUserToTeam', async () => {
        const props = {
            ...baseProps,
        };

        const wrapper = shallow(
            <SelectTeam {...props}/>,
        );
        wrapper.instance().onSelectTeam({id: 'test_id', invite_id: 'test_invite_id'});

        expect(props.actions.addUserToTeam).toBeCalledWith('test_id', 'fakeid');
    });
});
