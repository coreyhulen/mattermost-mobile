// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';

import {ChannelTypes, TeamTypes, UserTypes, GroupTypes} from '@mm-redux/action_types';
import {GenericAction} from '@mm-redux/types/actions';
import {Team, TeamMembership, TeamUnread} from '@mm-redux/types/teams';
import {UserProfile} from '@mm-redux/types/users';
import {RelationOneToOne, IDMappedObjects} from '@mm-redux/types/utilities';
import {teamListToMap} from '@mm-redux/utils/team_utils';

function currentTeamId(state = '', action: GenericAction) {
    switch (action.type) {
    case TeamTypes.SELECT_TEAM:
        return action.data;

    default:
        return state;
    }
}

function teams(state: IDMappedObjects<Team> = {}, action: GenericAction) {
    switch (action.type) {
    case TeamTypes.RECEIVED_TEAMS_LIST:
        return Object.assign({}, state, teamListToMap(action.data));
    case UserTypes.LOGIN: // Used by the mobile app
        return Object.assign({}, state, teamListToMap(action.data.teams));
    case TeamTypes.RECEIVED_TEAMS:
        return Object.assign({}, state, action.data);

    case TeamTypes.CREATED_TEAM:
    case TeamTypes.UPDATED_TEAM:
    case TeamTypes.PATCHED_TEAM:
    case TeamTypes.RECEIVED_TEAM:
        return {
            ...state,
            [action.data.id]: action.data,
        };

    case TeamTypes.RECEIVED_TEAM_DELETED: {
        const nextState = {...state};
        const teamId = action.data.id;
        if (nextState.hasOwnProperty(teamId)) {
            Reflect.deleteProperty(nextState, teamId);
            return nextState;
        }

        return state;
    }

    default:
        return state;
    }
}

function myMembers(state: RelationOneToOne<Team, TeamMembership> = {}, action: GenericAction) {
    function updateState(receivedTeams: IDMappedObjects<Team> = {}, currentState: RelationOneToOne<Team, TeamMembership> = {}) {
        return Object.keys(receivedTeams).forEach((teamId) => {
            if (receivedTeams[teamId].delete_at > 0 && currentState[teamId]) {
                Reflect.deleteProperty(currentState, teamId);
            }
        });
    }

    switch (action.type) {
    case TeamTypes.RECEIVED_MY_TEAM_MEMBER: {
        const nextState = {...state};
        const member = action.data;
        if (member.delete_at === 0) {
            nextState[member.team_id] = member;
        }
        return nextState;
    }
    case TeamTypes.RECEIVED_MY_TEAM_MEMBERS: {
        const nextState: RelationOneToOne<Team, TeamMembership> = {};
        const members = action.data;
        for (const m of members) {
            if (m.delete_at == null || m.delete_at === 0) {
                const prevMember = state[m.team_id] || {mention_count: 0, msg_count: 0};
                nextState[m.team_id] = {
                    ...prevMember,
                    ...m,
                };
            }
        }
        return nextState;
    }
    case TeamTypes.RECEIVED_TEAMS_LIST: {
        const nextState = {...state};
        const receivedTeams = teamListToMap(action.data);
        updateState(receivedTeams, nextState);
        return nextState;
    }
    case TeamTypes.RECEIVED_TEAMS: {
        const nextState = {...state};
        const receivedTeams = action.data;
        updateState(receivedTeams, nextState);
        return nextState;
    }
    case TeamTypes.RECEIVED_MY_TEAM_UNREADS: {
        const nextState = {...state};
        const unreads = action.data;
        for (const u of unreads) {
            const msgCount = u.msg_count < 0 ? 0 : u.msg_count;
            const mentionCount = u.mention_count < 0 ? 0 : u.mention_count;
            const m = {
                ...state[u.team_id],
                mention_count: mentionCount,
                msg_count: msgCount,
            };
            nextState[u.team_id] = m;
        }

        return nextState;
    }
    case ChannelTypes.INCREMENT_UNREAD_MSG_COUNT: {
        const {teamId, amount, onlyMentions} = action.data;
        const member = state[teamId];

        if (!member) {
            // Don't keep track of unread posts until we've loaded the actual team member
            return state;
        }

        if (onlyMentions) {
            // Incrementing the msg_count marks the team as unread, so don't do that if these posts shouldn't be unread
            return state;
        }

        return {
            ...state,
            [teamId]: {
                ...member,
                msg_count: member.msg_count + amount,
            },
        };
    }
    case ChannelTypes.DECREMENT_UNREAD_MSG_COUNT: {
        const {teamId, amount} = action.data;
        const member = state[teamId];

        if (!member) {
            // Don't keep track of unread posts until we've loaded the actual team member
            return state;
        }

        return {
            ...state,
            [teamId]: {
                ...member,
                msg_count: Math.max(member.msg_count - Math.abs(amount), 0),
            },
        };
    }
    case ChannelTypes.INCREMENT_UNREAD_MENTION_COUNT: {
        const {teamId, amount} = action.data;
        const member = state[teamId];

        if (!member) {
            // Don't keep track of unread posts until we've loaded the actual team member
            return state;
        }

        return {
            ...state,
            [teamId]: {
                ...member,
                mention_count: member.mention_count + amount,
            },
        };
    }
    case ChannelTypes.DECREMENT_UNREAD_MENTION_COUNT: {
        const {teamId, amount} = action.data;
        const member = state[teamId];

        if (!member) {
            // Don't keep track of unread posts until we've loaded the actual team member
            return state;
        }

        return {
            ...state,
            [teamId]: {
                ...member,
                mention_count: Math.max(member.mention_count - amount, 0),
            },
        };
    }

    case TeamTypes.LEAVE_TEAM:
    case TeamTypes.RECEIVED_TEAM_DELETED: {
        const nextState = {...state};
        const data = action.data;
        Reflect.deleteProperty(nextState, data.id);
        return nextState;
    }
    case ChannelTypes.POST_UNREAD_SUCCESS: {
        const {teamId, deltaMsgs, mentionCount, msgCount} = action.data;

        const teamState = state[teamId];
        if (!teamState) {
            return state;
        }

        const newTeamState = {
            ...teamState,
            msg_count: (typeof teamState.msg_count === 'undefined' ? msgCount : teamState.msg_count - deltaMsgs),
            mention_count: (typeof teamState.mention_count === 'undefined' ? mentionCount : teamState.mention_count + mentionCount),
        };

        return {...state, [teamId]: newTeamState};
    }

    case UserTypes.LOGIN: {// Used by the mobile app
        const {teamMembers, teamUnreads} = action.data;
        const nextState = {...state};

        for (const m of teamMembers) {
            if (m.delete_at == null || m.delete_at === 0) {
                const unread = teamUnreads.find((u: TeamUnread) => u.team_id === m.team_id);
                if (unread) {
                    m.mention_count = unread.mention_count;
                    m.msg_count = unread.msg_count;
                }
                nextState[m.team_id] = m;
            }
        }

        return nextState;
    }
    default:
        return state;
    }
}

function membersInTeam(state: RelationOneToOne<Team, RelationOneToOne<UserProfile, TeamMembership>> = {}, action: GenericAction) {
    switch (action.type) {
    case TeamTypes.RECEIVED_MEMBER_IN_TEAM: {
        const data = action.data;
        const members = {...(state[data.team_id] || {})};
        members[data.user_id] = data;
        return {
            ...state,
            [data.team_id]: members,
        };
    }
    case TeamTypes.RECEIVED_TEAM_MEMBERS: {
        const data = action.data;
        if (data && data.length) {
            const nextState = {...state};
            for (const member of data) {
                if (nextState[member.team_id]) {
                    nextState[member.team_id] = {...nextState[member.team_id]};
                } else {
                    nextState[member.team_id] = {};
                }
                nextState[member.team_id][member.user_id] = member;
            }

            return nextState;
        }

        return state;
    }
    case TeamTypes.RECEIVED_MEMBERS_IN_TEAM: {
        const data = action.data;
        if (data && data.length) {
            const teamId = data[0].team_id;
            const members = {...(state[teamId] || {})};
            for (const member of data) {
                members[member.user_id] = member;
            }

            return {
                ...state,
                [teamId]: members,
            };
        }

        return state;
    }
    case TeamTypes.REMOVE_MEMBER_FROM_TEAM: {
        const data = action.data;
        const members = state[data.team_id];
        if (members) {
            const nextState = {...members};
            Reflect.deleteProperty(nextState, data.user_id);
            return {
                ...state,
                [data.team_id]: nextState,
            };
        }

        return state;
    }
    case TeamTypes.RECEIVED_TEAM_DELETED: {
        const nextState = {...state};
        const teamId = action.data.id;
        if (nextState.hasOwnProperty(teamId)) {
            Reflect.deleteProperty(nextState, teamId);
            return nextState;
        }

        return state;
    }
    default:
        return state;
    }
}

function stats(state: any = {}, action: GenericAction) {
    switch (action.type) {
    case TeamTypes.RECEIVED_TEAM_STATS: {
        const stat = action.data;
        return {
            ...state,
            [stat.team_id]: stat,
        };
    }
    case TeamTypes.RECEIVED_TEAM_DELETED: {
        const nextState = {...state};
        const teamId = action.data.id;
        if (nextState.hasOwnProperty(teamId)) {
            Reflect.deleteProperty(nextState, teamId);
            return nextState;
        }

        return state;
    }
    default:
        return state;
    }
}

function groupsAssociatedToTeam(state: RelationOneToOne<Team, {ids: string[]; totalCount: number}> = {}, action: GenericAction) {
    switch (action.type) {
    case GroupTypes.RECEIVED_GROUPS_ASSOCIATED_TO_TEAM: {
        const {teamID, groups, totalGroupCount} = action.data;
        const nextState = {...state};
        const associatedGroupIDs = new Set(state[teamID] ? state[teamID].ids : []);
        for (const group of groups) {
            associatedGroupIDs.add(group.id);
        }
        nextState[teamID] = {ids: Array.from(associatedGroupIDs), totalCount: totalGroupCount};
        return nextState;
    }
    case GroupTypes.RECEIVED_ALL_GROUPS_ASSOCIATED_TO_TEAM: {
        const {teamID, groups} = action.data;
        const nextState = {...state};
        const associatedGroupIDs = new Set<string>([]);
        for (const group of groups) {
            associatedGroupIDs.add(group.id);
        }
        const ids = Array.from(associatedGroupIDs);
        nextState[teamID] = {ids, totalCount: ids.length};
        return nextState;
    }
    case GroupTypes.RECEIVED_GROUPS_NOT_ASSOCIATED_TO_TEAM: {
        const {teamID, groups} = action.data;
        const nextState = {...state};
        const associatedGroupIDs = new Set(state[teamID] ? state[teamID].ids : []);
        for (const group of groups) {
            associatedGroupIDs.delete(group.id);
        }
        nextState[teamID] = {ids: Array.from(associatedGroupIDs), totalCount: associatedGroupIDs.size};
        return nextState;
    }
    default:
        return state;
    }
}

function totalCount(state = 0, action: GenericAction) {
    switch (action.type) {
    case TeamTypes.RECEIVED_TOTAL_TEAM_COUNT: {
        return action.data;
    }
    default:
        return state;
    }
}

export default combineReducers({

    // the current selected team
    currentTeamId,

    // object where every key is the team id and has and object with the team detail
    teams,

    // object where every key is the team id and has and object with the team members detail
    myMembers,

    // object where every key is the team id and has an object of members in the team where the key is user id
    membersInTeam,

    // object where every key is the team id and has an object with the team stats
    stats,

    groupsAssociatedToTeam,

    totalCount,
});
