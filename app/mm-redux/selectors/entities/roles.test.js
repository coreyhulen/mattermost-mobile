// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import * as Selectors from '@mm-redux/selectors/entities/roles';
import {getMySystemPermissions, getMySystemRoles, getRoles} from '@mm-redux/selectors/entities/roles_helpers';
import deepFreezeAndThrowOnMutation from '@mm-redux/utils/deep_freeze';
import TestHelper from '@test/test_helper';

import {General} from '../../constants';

describe('Selectors.Roles', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();
    const team3 = TestHelper.fakeTeamWithId();
    const team4 = TestHelper.fakeTeamWithId();
    const myTeamMembers = {};
    myTeamMembers[team1.id] = {roles: 'test_team1_role1 test_team1_role2'};
    myTeamMembers[team2.id] = {roles: 'test_team2_role1 test_team2_role2'};
    myTeamMembers[team3.id] = {};
    myTeamMembers[team4.id] = {roles: 'test_team4_role_not_found'};

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    channel1.display_name = 'Channel Name';

    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    channel2.total_msg_count = 2;
    channel2.display_name = 'DEF';

    const channel3 = TestHelper.fakeChannelWithId(team2.id);
    channel3.total_msg_count = 2;

    const channel4 = TestHelper.fakeChannelWithId('');
    channel4.display_name = 'Channel 4';

    const channel5 = TestHelper.fakeChannelWithId(team1.id);
    channel5.type = General.PRIVATE_CHANNEL;
    channel5.display_name = 'Channel 5';

    const channel6 = TestHelper.fakeChannelWithId(team1.id);
    const channel7 = TestHelper.fakeChannelWithId('');
    channel7.display_name = '';
    channel7.type = General.GM_CHANNEL;
    channel7.total_msg_count = 1;

    const channel8 = TestHelper.fakeChannelWithId(team1.id);
    channel8.display_name = 'ABC';
    channel8.total_msg_count = 1;

    const channel9 = TestHelper.fakeChannelWithId(team1.id);
    const channel10 = TestHelper.fakeChannelWithId(team1.id);
    const channel11 = TestHelper.fakeChannelWithId(team1.id);
    channel11.type = General.PRIVATE_CHANNEL;
    const channel12 = TestHelper.fakeChannelWithId(team1.id);
    const channel13 = TestHelper.fakeChannelWithId(team1.id);

    const channels = {};
    channels[channel1.id] = channel1;
    channels[channel2.id] = channel2;
    channels[channel3.id] = channel3;
    channels[channel4.id] = channel4;
    channels[channel5.id] = channel5;
    channels[channel6.id] = channel6;
    channels[channel7.id] = channel7;
    channels[channel8.id] = channel8;
    channels[channel9.id] = channel9;
    channels[channel10.id] = channel10;
    channels[channel11.id] = channel11;
    channels[channel12.id] = channel12;
    channels[channel13.id] = channel13;

    const channelsInTeam = {};
    channelsInTeam[team1.id] = [channel1.id, channel2.id, channel5.id, channel6.id, channel8.id, channel10.id, channel11.id];
    channelsInTeam[team2.id] = [channel3.id];
    channelsInTeam[''] = [channel4.id, channel7.id, channel9.id];

    const user = TestHelper.fakeUserWithId();
    const profiles = {};
    profiles[user.id] = user;
    profiles[user.id].roles = 'test_user_role test_user_role2';

    const myChannelMembers = {};
    myChannelMembers[channel1.id] = {roles: 'test_channel_a_role1 test_channel_a_role2'};
    myChannelMembers[channel2.id] = {roles: 'test_channel_a_role1 test_channel_a_role2'};
    myChannelMembers[channel3.id] = {roles: 'test_channel_a_role1 test_channel_a_role2'};
    myChannelMembers[channel4.id] = {roles: 'test_channel_a_role1 test_channel_a_role2'};
    myChannelMembers[channel5.id] = {roles: 'test_channel_a_role1 test_channel_a_role2'};
    myChannelMembers[channel7.id] = {roles: 'test_channel_b_role1 test_channel_b_role2'};
    myChannelMembers[channel8.id] = {roles: 'test_channel_b_role1 test_channel_b_role2'};
    myChannelMembers[channel9.id] = {roles: 'test_channel_b_role1 test_channel_b_role2'};
    myChannelMembers[channel10.id] = {roles: 'test_channel_c_role1 test_channel_c_role2'};
    myChannelMembers[channel11.id] = {roles: 'test_channel_c_role1 test_channel_c_role2'};
    myChannelMembers[channel12.id] = {};
    myChannelMembers[channel13.id] = {roles: 'test_channel_not_found_role'};
    const roles = {
        test_team1_role1: {permissions: ['team1_role1']},
        test_team2_role1: {permissions: ['team2_role1']},
        test_team2_role2: {permissions: ['team2_role2']},
        test_channel_a_role1: {permissions: ['channel_a_role1']},
        test_channel_a_role2: {permissions: ['channel_a_role2']},
        test_channel_b_role2: {permissions: ['channel_b_role2']},
        test_channel_c_role1: {permissions: ['channel_c_role1']},
        test_channel_c_role2: {permissions: ['channel_c_role2']},
        test_user_role2: {permissions: ['user_role2']},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
            },
            teams: {
                currentTeamId: team1.id,
                myMembers: myTeamMembers,
            },
            channels: {
                currentChannelId: channel1.id,
                channels,
                myMembers: myChannelMembers,
            },
            roles: {
                roles,
            },
        },
    });

    it('should return my roles by scope on getMyRoles/getMySystemRoles/getMyTeamRoles/getMyChannelRoles', () => {
        const teamsRoles = {};
        teamsRoles[team1.id] = new Set(['test_team1_role1', 'test_team1_role2']);
        teamsRoles[team2.id] = new Set(['test_team2_role1', 'test_team2_role2']);
        teamsRoles[team4.id] = new Set(['test_team4_role_not_found']);
        const channelsRoles = {};
        channelsRoles[channel1.id] = new Set(['test_channel_a_role1', 'test_channel_a_role2']);
        channelsRoles[channel2.id] = new Set(['test_channel_a_role1', 'test_channel_a_role2']);
        channelsRoles[channel3.id] = new Set(['test_channel_a_role1', 'test_channel_a_role2']);
        channelsRoles[channel4.id] = new Set(['test_channel_a_role1', 'test_channel_a_role2']);
        channelsRoles[channel5.id] = new Set(['test_channel_a_role1', 'test_channel_a_role2']);
        channelsRoles[channel7.id] = new Set(['test_channel_b_role1', 'test_channel_b_role2']);
        channelsRoles[channel8.id] = new Set(['test_channel_b_role1', 'test_channel_b_role2']);
        channelsRoles[channel9.id] = new Set(['test_channel_b_role1', 'test_channel_b_role2']);
        channelsRoles[channel10.id] = new Set(['test_channel_c_role1', 'test_channel_c_role2']);
        channelsRoles[channel11.id] = new Set(['test_channel_c_role1', 'test_channel_c_role2']);
        channelsRoles[channel13.id] = new Set(['test_channel_not_found_role']);
        const myRoles = {
            system: new Set(['test_user_role', 'test_user_role2']),
            team: teamsRoles,
            channel: channelsRoles,
        };
        assert.deepEqual(Selectors.getMyRoles(testState), myRoles);
        assert.deepEqual(getMySystemRoles(testState), myRoles.system);
        assert.deepEqual(Selectors.getMyTeamRoles(testState), myRoles.team);
        assert.deepEqual(Selectors.getMyChannelRoles(testState), myRoles.channel);
    });

    it('should return current loaded roles on getRoles', () => {
        const loadedRoles = {
            test_team1_role1: {permissions: ['team1_role1']},
            test_team2_role1: {permissions: ['team2_role1']},
            test_team2_role2: {permissions: ['team2_role2']},
            test_channel_a_role1: {permissions: ['channel_a_role1']},
            test_channel_a_role2: {permissions: ['channel_a_role2']},
            test_channel_b_role2: {permissions: ['channel_b_role2']},
            test_channel_c_role1: {permissions: ['channel_c_role1']},
            test_channel_c_role2: {permissions: ['channel_c_role2']},
            test_user_role2: {permissions: ['user_role2']},
        };
        assert.deepEqual(getRoles(testState), loadedRoles);
    });

    it('should return my system permission on getMySystemPermissions', () => {
        assert.deepEqual(getMySystemPermissions(testState), new Set([
            'user_role2',
        ]));
    });

    it('should return if i have a system permission on haveISystemPermission', () => {
        assert.equal(Selectors.haveISystemPermission(testState, {permission: 'user_role2'}), true);
        assert.equal(Selectors.haveISystemPermission(testState, {permission: 'invalid_permission'}), false);
    });

    it('should return my team permissions on getMyTeamPermissions', () => {
        const {permissions, roleFound} = Selectors.getMyTeamPermissions(testState, {team: team1.id});
        const expectedPermissions = new Set(['user_role2', 'team1_role1']);
        assert.deepEqual(permissions, expectedPermissions);
        assert.equal(roleFound, true);
    });

    it('should return system permissions on getMyTeamPermissions when team not found', () => {
        const {permissions, roleFound} = Selectors.getMyTeamPermissions(testState, {team: team4.id});
        const expectedPermissions = new Set(['user_role2']);
        assert.deepEqual(permissions, expectedPermissions);
        assert.equal(roleFound, false);
    });

    it('should return if i have a team permission on haveITeamPermission', () => {
        assert.equal(Selectors.haveITeamPermission(testState, {team: team1.id, permission: 'user_role2'}), true);
        assert.equal(Selectors.haveITeamPermission(testState, {team: team1.id, permission: 'team1_role1'}), true);
        assert.equal(Selectors.haveITeamPermission(testState, {team: team1.id, permission: 'team2_role2'}), false);
        assert.equal(Selectors.haveITeamPermission(testState, {team: team1.id, permission: 'invalid_permission'}), false);
    });

    it('should return default if role not found in state on haveITeamPermission for team scoped permission', () => {
        assert.equal(Selectors.haveITeamPermission(testState, {team: team4.id, permission: 'any_permission', default: true}), true);
        assert.equal(Selectors.haveITeamPermission(testState, {team: team4.id, permission: 'any_permission', default: false}), false);
        assert.equal(Selectors.haveITeamPermission(testState, {team: team1.id, permission: 'user_role2'}), true);
    });

    it('should return my team permission on getMyCurrentTeamPermissions', () => {
        const {permissions, roleFound} = Selectors.getMyCurrentTeamPermissions(testState);
        const expectedPermissions = new Set(['user_role2', 'team1_role1']);
        assert.deepEqual(permissions, expectedPermissions);
        assert.equal(roleFound, true);
    });

    it('should return if i have a team permission on haveICurrentTeamPermission', () => {
        assert.equal(Selectors.haveICurrentTeamPermission(testState, {permission: 'user_role2'}), true);
        assert.equal(Selectors.haveICurrentTeamPermission(testState, {permission: 'team1_role1'}), true);
        assert.equal(Selectors.haveICurrentTeamPermission(testState, {permission: 'team2_role2'}), false);
        assert.equal(Selectors.haveICurrentTeamPermission(testState, {permission: 'invalid_permission'}), false);
    });

    it('should return my channel permission on getMyChannelPermissions', () => {
        const {permissions, roleFound} = Selectors.getMyChannelPermissions(testState, {team: team1.id, channel: channel1.id});
        const expectedPermissions = new Set(['user_role2', 'team1_role1', 'channel_a_role1', 'channel_a_role2']);
        assert.deepEqual(permissions, expectedPermissions);
        assert.equal(roleFound, true);
    });

    it('should only return my team permissions on getMyChannelPermissions when role not found', () => {
        const {permissions, roleFound} = Selectors.getMyChannelPermissions(testState, {team: team1.id, channel: channel13.id});
        const expectedPermissions = new Set(['user_role2', 'team1_role1']);
        assert.deepEqual(permissions, expectedPermissions);
        assert.equal(roleFound, false);
    });

    it('should return my channel permission on getMyChannelPermissions when channel roles not found', () => {
        const {permissions, roleFound} = Selectors.getMyChannelPermissions(testState, {team: team1.id, channel: channel1.id});
        const expectedPermissions = new Set(['user_role2', 'team1_role1', 'channel_a_role1', 'channel_a_role2']);
        assert.deepEqual(permissions, expectedPermissions);
        assert.equal(roleFound, true);
    });

    it('should return if i have a channel permission on haveIChannelPermission', () => {
        assert.equal(Selectors.haveIChannelPermission(testState, {team: team1.id, channel: channel1.id, permission: 'user_role2'}), true);
        assert.equal(Selectors.haveIChannelPermission(testState, {team: team1.id, channel: channel1.id, permission: 'team1_role1'}), true);
        assert.equal(Selectors.haveIChannelPermission(testState, {team: team1.id, channel: channel1.id, permission: 'team2_role2'}), false);
        assert.equal(Selectors.haveIChannelPermission(testState, {team: team1.id, channel: channel1.id, permission: 'channel_a_role1'}), true);
        assert.equal(Selectors.haveIChannelPermission(testState, {team: team1.id, channel: channel1.id, permission: 'channel_b_role1'}), false);
    });

    it('should return default if role not found in state on haveIChannelPermission for channel scoped permission', () => {
        assert.equal(Selectors.haveIChannelPermission(testState, {team: team1.id, channel: channel13.id, permission: 'any_permission', default: true}), true);
        assert.equal(Selectors.haveIChannelPermission(testState, {team: team1.id, channel: channel13.id, permission: 'any_permission', default: false}), false);
        assert.equal(Selectors.haveIChannelPermission(testState, {team: team1.id, channel: channel13.id, permission: 'user_role2'}), true);
        assert.equal(Selectors.haveIChannelPermission(testState, {team: team1.id, channel: channel13.id, permission: 'team1_role1'}), true);
    });

    it('should return if i have a channel permission on haveICurrentChannelPermission', () => {
        assert.equal(Selectors.haveICurrentChannelPermission(testState, {permission: 'user_role2'}), true);
        assert.equal(Selectors.haveICurrentChannelPermission(testState, {permission: 'team1_role1'}), true);
        assert.equal(Selectors.haveICurrentChannelPermission(testState, {permission: 'team2_role2'}), false);
        assert.equal(Selectors.haveICurrentChannelPermission(testState, {permission: 'channel_a_role1'}), true);
        assert.equal(Selectors.haveICurrentChannelPermission(testState, {permission: 'channel_b_role1'}), false);
    });
});
