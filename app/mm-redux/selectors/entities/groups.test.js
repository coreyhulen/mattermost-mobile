// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import * as Selectors from '@mm-redux/selectors/entities/groups';
import deepFreezeAndThrowOnMutation from '@mm-redux/utils/deep_freeze';

describe('Selectors.Groups', () => {
    const teamID = 'c6ubwm63apgftbjs71enbjjpsh';
    const expectedAssociatedGroupID1 = 'xh585kyz3tn55q6ipfo57btwnc';
    const expectedAssociatedGroupID2 = 'emdwu98u6jg9xfn9p5zu48bojo';
    const teamAssociatedGroupIDs = [expectedAssociatedGroupID1, expectedAssociatedGroupID2];

    const channelID = 'c6ubwm63apgftbjs71enbjjpzz';
    const expectedAssociatedGroupID3 = 'xos794c6tfb57eog481acokozc';
    const expectedAssociatedGroupID4 = 'tnd8zod9f3fdtqosxjmhwucbth';
    const channelAssociatedGroupIDs = [expectedAssociatedGroupID3, expectedAssociatedGroupID4];
    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            groups: {
                syncables: {},
                members: {},
                groups: {
                    [expectedAssociatedGroupID1]: {
                        id: expectedAssociatedGroupID1,
                        name: '9uobsi3xb3y5tfjb3ze7umnh1o',
                        display_name: 'abc',
                        description: '',
                        source: 'ldap',
                        remote_id: 'abc',
                        create_at: 1553808969975,
                        update_at: 1553808969975,
                        delete_at: 0,
                        has_syncables: false,
                        member_count: 2,
                        allow_reference: true,
                    },
                    [expectedAssociatedGroupID3]: {
                        id: expectedAssociatedGroupID3,
                        name: '5mte953ncbfpunpr3zmtopiwbo',
                        display_name: 'developers',
                        description: '',
                        source: 'ldap',
                        remote_id: 'developers',
                        create_at: 1553808970570,
                        update_at: 1553808970570,
                        delete_at: 0,
                        has_syncables: false,
                        member_count: 5,
                        allow_reference: false,
                    },
                    [expectedAssociatedGroupID4]: {
                        id: expectedAssociatedGroupID4,
                        name: 'nobctj4brfgtpj3a1peiyq47tc',
                        display_name: 'engineering',
                        description: '',
                        source: 'ldap',
                        create_at: 1553808971099,
                        remote_id: 'engineering',
                        update_at: 1553808971099,
                        delete_at: 0,
                        has_syncables: false,
                        member_count: 8,
                        allow_reference: true,
                    },
                    [expectedAssociatedGroupID2]: {
                        id: expectedAssociatedGroupID2,
                        name: '7ybu9oy77jgedqp4pph8f4j5ge',
                        display_name: 'xyz',
                        description: '',
                        source: 'ldap',
                        remote_id: 'xyz',
                        create_at: 1553808972099,
                        update_at: 1553808972099,
                        delete_at: 0,
                        has_syncables: false,
                        member_count: 2,
                        allow_reference: false,
                    },
                },
            },
            teams: {
                groupsAssociatedToTeam: {
                    [teamID]: {ids: teamAssociatedGroupIDs},
                },
            },
            channels: {
                groupsAssociatedToChannel: {
                    [channelID]: {ids: channelAssociatedGroupIDs},
                },
            },
        },
    });

    it('getGroupsAssociatedToTeam', () => {
        const expected = [
            testState.entities.groups.groups[expectedAssociatedGroupID1],
            testState.entities.groups.groups[expectedAssociatedGroupID2],
        ];
        assert.deepEqual(Selectors.getGroupsAssociatedToTeam(testState, teamID), expected);
    });

    it('getGroupsNotAssociatedToTeam', () => {
        const expected = Object.entries(testState.entities.groups.groups).filter(([groupID]) => !teamAssociatedGroupIDs.includes(groupID)).map(([, group]) => group);
        assert.deepEqual(Selectors.getGroupsNotAssociatedToTeam(testState, teamID), expected);
    });

    it('getGroupsAssociatedToChannel', () => {
        const expected = [
            testState.entities.groups.groups[expectedAssociatedGroupID3],
            testState.entities.groups.groups[expectedAssociatedGroupID4],
        ];
        assert.deepEqual(Selectors.getGroupsAssociatedToChannel(testState, channelID), expected);
    });

    it('getGroupsNotAssociatedToChannel', () => {
        const expected = Object.entries(testState.entities.groups.groups).filter(([groupID]) => !channelAssociatedGroupIDs.includes(groupID)).map(([, group]) => group);
        assert.deepEqual(Selectors.getGroupsNotAssociatedToChannel(testState, channelID), expected);
    });

    it('getGroupsAssociatedToTeamForReference', () => {
        const expected = [
            testState.entities.groups.groups[expectedAssociatedGroupID1],
        ];
        assert.deepEqual(Selectors.getGroupsAssociatedToTeamForReference(testState, teamID), expected);
    });

    it('getGroupsAssociatedToChannelForReference', () => {
        const expected = [
            testState.entities.groups.groups[expectedAssociatedGroupID4],
        ];
        assert.deepEqual(Selectors.getGroupsAssociatedToChannelForReference(testState, channelID), expected);
    });

    it('getAllAssociatedGroupsForReference', () => {
        const expected = [
            testState.entities.groups.groups[expectedAssociatedGroupID1],
            testState.entities.groups.groups[expectedAssociatedGroupID4],
        ];
        assert.deepEqual(Selectors.getAllAssociatedGroupsForReference(testState, channelID), expected);
    });
});
