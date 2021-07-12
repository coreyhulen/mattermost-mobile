// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as reselect from 'reselect';

import {getChannel} from '@mm-redux/selectors/entities/channels';
import {getCurrentUserLocale} from '@mm-redux/selectors/entities/i18n';
import {getTeam} from '@mm-redux/selectors/entities/teams';
import {UserMentionKey} from '@mm-redux/selectors/entities/users';
import {Group} from '@mm-redux/types/groups';
import {GlobalState} from '@mm-redux/types/store';
import {Dictionary, NameMappedObjects} from '@mm-redux/types/utilities';
import {filterGroupsMatchingTerm} from '@mm-redux/utils/group_utils';

const emptyList: any[] = [];
const emptySyncables = {
    teams: [],
    channels: [],
};

export function getAllGroups(state: GlobalState) {
    return state.entities.groups?.groups || {};
}

export function getMyGroups(state: GlobalState) {
    return state.entities.groups?.myGroups || {};
}

export function getGroup(state: GlobalState, id: string) {
    return getAllGroups(state)[id];
}

export function getGroupMemberCount(state: GlobalState, id: string) {
    const memberData = state.entities.groups.members;
    const groupMemberData = memberData[id];
    if (!groupMemberData) {
        return 0;
    }
    return memberData[id].totalMemberCount;
}

function getGroupSyncables(state: GlobalState, id: string) {
    return state.entities.groups.syncables[id] || emptySyncables;
}

export function getGroupTeams(state: GlobalState, id: string) {
    return getGroupSyncables(state, id).teams;
}

export function getGroupChannels(state: GlobalState, id: string) {
    return getGroupSyncables(state, id).channels;
}

export function getGroupMembers(state: GlobalState, id: string) {
    const groupMemberData = state.entities.groups.members[id];
    if (!groupMemberData) {
        return emptyList;
    }
    return groupMemberData.members;
}

export const getAssociatedGroupsForReference = reselect.createSelector(
    (state: GlobalState, teamId: string, channelId: string) => {
        const team = getTeam(state, teamId);
        const channel = getChannel(state, channelId);
        let groupsForReference = [];
        if (team && team.group_constrained && channel && channel.group_constrained) {
            const groupsFromChannel = getGroupsAssociatedToChannelForReference(state, channelId);
            const groupsFromTeam = getGroupsAssociatedToTeamForReference(state, teamId);
            groupsForReference = groupsFromChannel.concat(groupsFromTeam.filter((item) => groupsFromChannel.indexOf(item) < 0));
        } else if (team && team.group_constrained) {
            groupsForReference = getGroupsAssociatedToTeamForReference(state, teamId);
        } else if (channel && channel.group_constrained) {
            groupsForReference = getGroupsAssociatedToChannelForReference(state, channelId);
        } else {
            groupsForReference = getAllAssociatedGroupsForReference(state);
        }
        return groupsForReference;
    },
    (state: GlobalState) => getCurrentUserLocale(state),
    (groupsForReference: Array<Group>, locale: string) => {
        return groupsForReference.sort((groupA: Group, groupB: Group) => groupA.name.localeCompare(groupB.name, locale));
    },
);

export const searchAssociatedGroupsForReferenceLocal = reselect.createSelector(
    (state: GlobalState, term: string, teamId: string, channelId: string) => getAssociatedGroupsForReference(state, teamId, channelId),
    (state: GlobalState, term: string) => term,
    (groups: Array<Group>, term: string) => {
        if (!groups || groups.length === 0) {
            return emptyList;
        }
        const filteredGroups = filterGroupsMatchingTerm(groups, term);
        return filteredGroups;
    },
);

export const getAssociatedGroupsForReferenceMap = reselect.createSelector(
    getAssociatedGroupsForReference,
    (allGroups) => {
        return new Map(allGroups.map((group) => [`@${group.name}`, group]));
    },
);

const teamGroupIDs = (state: GlobalState, teamID: string) => state.entities.teams.groupsAssociatedToTeam[teamID]?.ids || [];

const channelGroupIDs = (state: GlobalState, channelID: string) => state.entities.channels.groupsAssociatedToChannel[channelID]?.ids || [];

const getTeamGroupIDSet = reselect.createSelector(
    teamGroupIDs,
    (teamIDs) => new Set(teamIDs),
);

const getChannelGroupIDSet = reselect.createSelector(
    channelGroupIDs,
    (channelIDs) => new Set(channelIDs),
);

export const getGroupsNotAssociatedToTeam = reselect.createSelector(
    getAllGroups,
    (state: GlobalState, teamID: string) => getTeamGroupIDSet(state, teamID),
    (allGroups, teamGroupIDSet) => {
        return Object.values(allGroups).filter((group) => !teamGroupIDSet.has(group.id));
    },
);

export const getGroupsAssociatedToTeam = reselect.createSelector(
    getAllGroups,
    (state: GlobalState, teamID: string) => getTeamGroupIDSet(state, teamID),
    (allGroups, teamGroupIDSet) => {
        return Object.values(allGroups).filter((group) => teamGroupIDSet.has(group.id));
    },
);

export const getGroupsNotAssociatedToChannel = reselect.createSelector(
    getAllGroups,
    (state: GlobalState, channelID: string) => getChannelGroupIDSet(state, channelID),
    (allGroups, channelGroupIDSet) => {
        return Object.values(allGroups).filter((group) => !channelGroupIDSet.has(group.id));
    },
);

export const getGroupsAssociatedToChannel = reselect.createSelector(
    getAllGroups,
    (state: GlobalState, channelID: string) => getChannelGroupIDSet(state, channelID),
    (allGroups, channelGroupIDSet) => {
        return Object.values(allGroups).filter((group) => channelGroupIDSet.has(group.id));
    },
);

export const getGroupsAssociatedToTeamForReference = reselect.createSelector(
    getAllGroups,
    (state: GlobalState, teamID: string) => getTeamGroupIDSet(state, teamID),
    (allGroups, teamGroupIDSet) => {
        return Object.values(allGroups).filter((group) => teamGroupIDSet.has(group.id) && group.allow_reference && group.delete_at === 0);
    },
);

export const getGroupsAssociatedToChannelForReference = reselect.createSelector(
    getAllGroups,
    (state: GlobalState, channelID: string) => getChannelGroupIDSet(state, channelID),
    (allGroups, channelGroupIDSet) => {
        return Object.values(allGroups).filter((group) => channelGroupIDSet.has(group.id) && group.allow_reference && group.delete_at === 0);
    },
);

export const getAllAssociatedGroupsForReference = reselect.createSelector(
    getAllGroups,
    (allGroups) => {
        return Object.values(allGroups).filter((group) => group.allow_reference && group.delete_at === 0);
    },
);

export const getAssociatedGroupsByName: (state: GlobalState, teamID: string, channelId: string) => NameMappedObjects<Group> = reselect.createSelector(
    getAssociatedGroupsForReference,
    (groups) => {
        const groupsByName: Dictionary<Group> = {};

        Object.values(groups).forEach((group) => {
            groupsByName[group.name] = group;
        });

        return groupsByName;
    },
);

export const getAllGroupsForReferenceByName: (state: GlobalState) => NameMappedObjects<Group> = reselect.createSelector(
    getAllAssociatedGroupsForReference,
    (groups) => {
        const groupsByName: Dictionary<Group> = {};

        Object.values(groups).forEach((group) => {
            groupsByName[group.name] = group;
        });

        return groupsByName;
    },
);

export const getMyAllowReferencedGroups = reselect.createSelector(
    getMyGroups,
    (myGroups) => {
        return Object.values(myGroups).filter((group) => group.allow_reference && group.delete_at === 0);
    },
);

export const getMyGroupMentionKeys: (state: GlobalState) => UserMentionKey[] = reselect.createSelector(
    getMyAllowReferencedGroups,
    (groups: Array<Group>) => {
        const keys: UserMentionKey[] = [];
        groups.forEach((group) => keys.push({key: `@${group.name}`}));
        return keys;
    },
);

export const getMyGroupsAssociatedToChannelForReference: (state: GlobalState, teamId: string, channelId: string) => Group[] = reselect.createSelector(
    getMyGroups,
    getAssociatedGroupsByName,
    (myGroups, groups) => {
        return Object.values(myGroups).filter((group) => group.allow_reference && group.delete_at === 0 && groups[group.name]);
    },
);

export const getMyGroupMentionKeysForChannel: (state: GlobalState, teamId: string, channelId: string) => UserMentionKey[] = reselect.createSelector(
    getMyGroupsAssociatedToChannelForReference,
    (groups: Array<Group>) => {
        const keys: UserMentionKey[] = [];
        groups.forEach((group) => keys.push({key: `@${group.name}`}));
        return keys;
    },
);
