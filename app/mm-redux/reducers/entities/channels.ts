// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';
import {ChannelTypes, UserTypes, GroupTypes} from '@mm-redux/action_types';
import {General} from '../../constants';
import {GenericAction} from '@mm-redux/types/actions';
import {Channel, ChannelMembership, ChannelStats, ChannelMemberCountByGroup, ChannelMemberCountsByGroup} from '@mm-redux/types/channels';
import {RelationOneToMany, RelationOneToOne, IDMappedObjects, UserIDMappedObjects} from '@mm-redux/types/utilities';
import {Team} from '@mm-redux/types/teams';

function removeMemberFromChannels(state: RelationOneToOne<Channel, UserIDMappedObjects<ChannelMembership>>, action: GenericAction) {
    const nextState = {...state};
    Object.keys(state).forEach((channel) => {
        nextState[channel] = {...nextState[channel]};
        delete nextState[channel][action.data.user_id];
    });
    return nextState;
}

function channelListToSet(state: any, action: GenericAction) {
    const nextState = {...state};

    action.data.forEach((channel: Channel) => {
        const nextSet = new Set(nextState[channel.team_id]);
        nextSet.add(channel.id);
        nextState[channel.team_id] = nextSet;
    });

    return nextState;
}

function removeChannelFromSet(state: any, action: GenericAction) {
    const id = action.data.team_id;
    const nextSet = new Set(state[id]);
    nextSet.delete(action.data.id);
    return {
        ...state,
        [id]: nextSet,
    };
}

function currentChannelId(state = '', action: GenericAction) {
    switch (action.type) {
    case ChannelTypes.SELECT_CHANNEL:
        return action.data;
    default:
        return state;
    }
}

function channels(state: IDMappedObjects<Channel> = {}, action: GenericAction) {
    switch (action.type) {
    case ChannelTypes.RECEIVED_CHANNEL:
        if (state[action.data.id] && action.data.type === General.DM_CHANNEL) {
            action.data.display_name = action.data.display_name || state[action.data.id].display_name;
        }
        return {
            ...state,
            [action.data.id]: action.data,
        };
    case ChannelTypes.RECEIVED_CHANNELS:
    case ChannelTypes.RECEIVED_ALL_CHANNELS: {
        const nextState = {...state};

        for (const channel of action.data) {
            if (state[channel.id] && channel.type === General.DM_CHANNEL) {
                channel.display_name = channel.display_name || state[channel.id].display_name;
            }
            nextState[channel.id] = channel;
        }
        return nextState;
    }
    case ChannelTypes.RECEIVED_CHANNEL_DELETED: {
        const {id, deleteAt} = action.data;

        if (!state[id]) {
            return state;
        }

        return {
            ...state,
            [id]: {
                ...state[id],
                delete_at: deleteAt,
            },
        };
    }
    case ChannelTypes.RECEIVED_CHANNEL_UNARCHIVED: {
        const {id} = action.data;

        if (!state[id]) {
            return state;
        }

        return {
            ...state,
            [id]: {
                ...state[id],
                delete_at: 0,
            },
        };
    }
    case ChannelTypes.UPDATE_CHANNEL_HEADER: {
        const {channelId, header} = action.data;

        if (!state[channelId]) {
            return state;
        }

        return {
            ...state,
            [channelId]: {
                ...state[channelId],
                header,
            },
        };
    }
    case ChannelTypes.UPDATE_CHANNEL_PURPOSE: {
        const {channelId, purpose} = action.data;

        if (!state[channelId]) {
            return state;
        }

        return {
            ...state,
            [channelId]: {
                ...state[channelId],
                purpose,
            },
        };
    }
    case ChannelTypes.LEAVE_CHANNEL: {
        if (action.data && action.data.type === General.PRIVATE_CHANNEL) {
            const nextState = {...state};
            Reflect.deleteProperty(nextState, action.data.id);
            return nextState;
        }
        return state;
    }
    case ChannelTypes.INCREMENT_TOTAL_MSG_COUNT: {
        const {channelId, amount, amountRoot} = action.data;
        const channel = state[channelId];

        if (!channel) {
            return state;
        }

        return {
            ...state,
            [channelId]: {
                ...channel,
                total_msg_count: channel.total_msg_count + amount,
                total_msg_count_root: channel.total_msg_count_root + amountRoot,
            },
        };
    }
    case ChannelTypes.RECEIVED_MY_CHANNELS_WITH_MEMBERS: { // Used by the mobile app
        const nextState = {...state};
        const myChannels: Array<Channel> = action.data.channels;
        let hasNewValues = false;

        if (myChannels && myChannels.length) {
            hasNewValues = true;
            myChannels.forEach((c: Channel) => {
                nextState[c.id] = c;
            });
        }

        return hasNewValues ? nextState : state;
    }

    default:
        return state;
    }
}

function channelsInTeam(state: RelationOneToMany<Team, Channel> = {}, action: GenericAction) {
    switch (action.type) {
    case ChannelTypes.RECEIVED_CHANNEL: {
        const nextSet = new Set(state[action.data.team_id]);
        nextSet.add(action.data.id);
        return {
            ...state,
            [action.data.team_id]: nextSet,
        };
    }
    case ChannelTypes.RECEIVED_CHANNELS: {
        return channelListToSet(state, action);
    }
    case ChannelTypes.LEAVE_CHANNEL: {
        if (action.data && action.data.type === General.PRIVATE_CHANNEL) {
            return removeChannelFromSet(state, action);
        }
        return state;
    }
    case ChannelTypes.RECEIVED_MY_CHANNELS_WITH_MEMBERS: { // Used by the mobile app
        const values: GenericAction = {
            type: action.type,
            teamId: action.data.teamId,
            sync: action.data.sync,
            data: action.data.channels,
        };
        return channelListToSet(state, values);
    }
    default:
        return state;
    }
}

function myMembers(state: RelationOneToOne<Channel, ChannelMembership> = {}, action: GenericAction) {
    switch (action.type) {
    case ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER: {
        const channelMember = action.data;
        return {
            ...state,
            [channelMember.channel_id]: channelMember,
        };
    }
    case ChannelTypes.RECEIVED_MY_CHANNEL_MEMBERS: {
        const nextState: any = {...state};
        const remove = action.remove as string[];
        if (remove) {
            remove.forEach((id: string) => {
                Reflect.deleteProperty(nextState, id);
            });
        }

        for (const cm of action.data) {
            nextState[cm.channel_id] = cm;
        }

        return nextState;
    }
    case ChannelTypes.RECEIVED_CHANNEL_PROPS: {
        const member = {...state[action.data.channel_id]};
        member.notify_props = action.data.notifyProps;

        return {
            ...state,
            [action.data.channel_id]: member,
        };
    }
    case ChannelTypes.INCREMENT_UNREAD_MSG_COUNT: {
        const {channelId, amount, amountRoot, onlyMentions} = action.data;
        const member = state[channelId];

        if (!member) {
            // Don't keep track of unread posts until we've loaded the actual channel member
            return state;
        }

        if (!onlyMentions) {
            // Incrementing the msg_count marks the channel as read, so don't do that if these posts should be unread
            return state;
        }

        return {
            ...state,
            [channelId]: {
                ...member,
                msg_count: member.msg_count + amount,
                msg_count_root: member.msg_count_root + amountRoot,
            },
        };
    }
    case ChannelTypes.DECREMENT_UNREAD_MSG_COUNT: {
        const {channelId, amount, amountRoot} = action.data;

        const member = state[channelId];

        if (!member) {
            // Don't keep track of unread posts until we've loaded the actual channel member
            return state;
        }

        return {
            ...state,
            [channelId]: {
                ...member,
                msg_count: member.msg_count + amount,
                msg_count_root: member.msg_count_root + amountRoot,
            },
        };
    }
    case ChannelTypes.INCREMENT_UNREAD_MENTION_COUNT: {
        const {channelId, amount, amountRoot} = action.data;
        const member = state[channelId];

        if (!member) {
            // Don't keep track of unread posts until we've loaded the actual channel member
            return state;
        }

        return {
            ...state,
            [channelId]: {
                ...member,
                mention_count: member.mention_count + amount,
                mention_count_root: member.mention_count_root + amountRoot,
            },
        };
    }
    case ChannelTypes.DECREMENT_UNREAD_MENTION_COUNT: {
        const {channelId, amount, amountRoot} = action.data;
        const member = state[channelId];

        if (!member) {
            // Don't keep track of unread posts until we've loaded the actual channel member
            return state;
        }

        return {
            ...state,
            [channelId]: {
                ...member,
                mention_count: Math.max(member.mention_count - amount, 0),
                mention_count_root: Math.max(member.mention_count_root - amountRoot, 0),
            },
        };
    }
    case ChannelTypes.RECEIVED_LAST_VIEWED_AT: {
        const {data} = action;
        let member = state[data.channel_id];

        member = {
            ...member,
            last_viewed_at: data.last_viewed_at,
        };

        return {
            ...state,
            [action.data.channel_id]: member,
        };
    }
    case ChannelTypes.LEAVE_CHANNEL: {
        const nextState = {...state};
        if (action.data) {
            Reflect.deleteProperty(nextState, action.data.id);
            return nextState;
        }

        return state;
    }
    case ChannelTypes.POST_UNREAD_SUCCESS: {
        const data = action.data;
        const channelState = state[data.channelId];

        if (!channelState) {
            return state;
        }
        return {...state, [data.channelId]: {...channelState, msg_count: data.msgCount, mention_count: data.mentionCount, msg_count_root: data.msgCountRoot, mention_count_root: data.mentionCountRoot, last_viewed_at: data.lastViewedAt}};
    }

    case ChannelTypes.RECEIVED_MY_CHANNELS_WITH_MEMBERS: { // Used by the mobile app
        const nextState: any = {...state};
        const current = Object.values(nextState);
        const {sync, teamChannels, channelMembers} = action.data;
        let hasNewValues = channelMembers && channelMembers.length > 0;

        // Remove existing channel memberships when the user is no longer a member
        if (sync) {
            const memberIds = channelMembers.map((cm: ChannelMembership) => cm.channel_id);
            const removedMembers = current.filter((cm: ChannelMembership) => {
                const id = cm.channel_id;
                return !memberIds.includes(id) && teamChannels.includes(id);
            });

            removedMembers.forEach((member: ChannelMembership) => {
                delete nextState[member.channel_id];
                hasNewValues = true;
            });
        }

        if (hasNewValues) {
            channelMembers.forEach((cm: ChannelMembership) => {
                const id: string = cm.channel_id;
                nextState[id] = cm;
            });

            return nextState;
        }

        return state;
    }

    default:
        return state;
    }
}

function membersInChannel(state: RelationOneToOne<Channel, UserIDMappedObjects<ChannelMembership>> = {}, action: GenericAction) {
    switch (action.type) {
    case ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER:
    case ChannelTypes.RECEIVED_CHANNEL_MEMBER: {
        const member = action.data;
        const members = {...(state[member.channel_id] || {})};
        members[member.user_id] = member;
        return {
            ...state,
            [member.channel_id]: members,
        };
    }
    case ChannelTypes.RECEIVED_MY_CHANNEL_MEMBERS:
    case ChannelTypes.RECEIVED_CHANNEL_MEMBERS: {
        const nextState = {...state};
        const remove = action.remove as string[];
        const currentUserId = action.currentUserId;
        if (remove && currentUserId) {
            remove.forEach((id) => {
                if (nextState[id]) {
                    Reflect.deleteProperty(nextState[id], currentUserId);
                }
            });
        }

        for (const cm of action.data) {
            if (nextState[cm.channel_id]) {
                nextState[cm.channel_id] = {...nextState[cm.channel_id]};
            } else {
                nextState[cm.channel_id] = {};
            }
            nextState[cm.channel_id][cm.user_id] = cm;
        }
        return nextState;
    }

    case UserTypes.PROFILE_NO_LONGER_VISIBLE:
        return removeMemberFromChannels(state, action);

    case ChannelTypes.LEAVE_CHANNEL:
    case ChannelTypes.REMOVE_MEMBER_FROM_CHANNEL:
    case UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL: {
        if (action.data) {
            const data = action.data;
            const members = {...(state[data.id] || {})};
            if (state[data.id]) {
                Reflect.deleteProperty(members, data.user_id);
                return {
                    ...state,
                    [data.id]: members,
                };
            }
        }

        return state;
    }
    default:
        return state;
    }
}

function stats(state: RelationOneToOne<Channel, ChannelStats> = {}, action: GenericAction) {
    switch (action.type) {
    case ChannelTypes.RECEIVED_CHANNEL_STATS: {
        const nextState = {...state};
        const stat = action.data;
        nextState[stat.channel_id] = stat;

        return nextState;
    }
    case ChannelTypes.ADD_CHANNEL_MEMBER_SUCCESS: {
        const nextState = {...state};
        const id = action.id;
        const nextStat = nextState[id];
        if (nextStat) {
            const count = nextStat.member_count + 1;
            return {
                ...nextState,
                [id]: {
                    ...nextStat,
                    member_count: count,
                },
            };
        }

        return state;
    }
    case ChannelTypes.REMOVE_CHANNEL_MEMBER_SUCCESS: {
        const nextState = {...state};
        const id = action.id;
        const nextStat = nextState[id];
        if (nextStat) {
            const count = nextStat.member_count - 1;
            return {
                ...nextState,
                [id]: {
                    ...nextStat,
                    member_count: count || 1,
                },
            };
        }

        return state;
    }
    case ChannelTypes.INCREMENT_PINNED_POST_COUNT: {
        const nextState = {...state};
        const id = action.id;
        const nextStat = nextState[id];
        if (nextStat) {
            const count = nextStat.pinnedpost_count + 1;
            return {
                ...nextState,
                [id]: {
                    ...nextStat,
                    pinnedpost_count: count,
                },
            };
        }

        return state;
    }
    case ChannelTypes.DECREMENT_PINNED_POST_COUNT: {
        const nextState = {...state};
        const id = action.id;
        const nextStat = nextState[id];
        if (nextStat) {
            const count = nextStat.pinnedpost_count - 1;
            return {
                ...nextState,
                [id]: {
                    ...nextStat,
                    pinnedpost_count: count,
                },
            };
        }

        return state;
    }
    default:
        return state;
    }
}

function groupsAssociatedToChannel(state: any = {}, action: GenericAction) {
    switch (action.type) {
    case GroupTypes.RECEIVED_ALL_GROUPS_ASSOCIATED_TO_CHANNELS_IN_TEAM: {
        const {groupsByChannelId} = action.data;
        const nextState = {...state};

        for (const channelID of Object.keys(groupsByChannelId)) {
            if (groupsByChannelId[channelID]) {
                const associatedGroupIDs = new Set<string>([]);
                for (const group of groupsByChannelId[channelID]) {
                    associatedGroupIDs.add(group.id);
                }
                const ids = Array.from(associatedGroupIDs);
                nextState[channelID] = {ids, totalCount: ids.length};
            }
        }
        return nextState;
    }
    case GroupTypes.RECEIVED_GROUPS_ASSOCIATED_TO_CHANNEL: {
        const {channelID, groups, totalGroupCount} = action.data;
        const nextState = {...state};
        const associatedGroupIDs = new Set<string>([]);
        for (const group of groups) {
            associatedGroupIDs.add(group.id);
        }
        nextState[channelID] = {ids: Array.from(associatedGroupIDs), totalCount: totalGroupCount};
        return nextState;
    }
    case GroupTypes.RECEIVED_ALL_GROUPS_ASSOCIATED_TO_CHANNEL: {
        const {channelID, groups} = action.data;
        const nextState = {...state};
        const associatedGroupIDs = new Set<string>([]);
        for (const group of groups) {
            associatedGroupIDs.add(group.id);
        }
        const ids = Array.from(associatedGroupIDs);
        nextState[channelID] = {ids, totalCount: ids.length};
        return nextState;
    }
    case GroupTypes.RECEIVED_GROUPS_NOT_ASSOCIATED_TO_CHANNEL: {
        const {channelID, groups} = action.data;
        const nextState = {...state};
        const associatedGroupIDs = new Set(state[channelID] ? state[channelID].ids : []);
        for (const group of groups) {
            associatedGroupIDs.delete(group.id);
        }
        nextState[channelID] = Array.from(associatedGroupIDs);
        return nextState;
    }
    default:
        return state;
    }
}

function totalCount(state = 0, action: GenericAction) {
    switch (action.type) {
    case ChannelTypes.RECEIVED_TOTAL_CHANNEL_COUNT: {
        return action.data;
    }
    default:
        return state;
    }
}

export function manuallyUnread(state: RelationOneToOne<Channel, boolean> = {}, action: GenericAction) {
    switch (action.type) {
    case ChannelTypes.REMOVE_MANUALLY_UNREAD: {
        if (state[action.data.channelId]) {
            const newState = {...state};
            delete newState[action.data.channelId];
            return newState;
        }
        return state;
    }
    case ChannelTypes.ADD_MANUALLY_UNREAD:
    case ChannelTypes.POST_UNREAD_SUCCESS: {
        return {...state, [action.data.channelId]: true};
    }
    default:
        return state;
    }
}

export function channelMemberCountsByGroup(state: any = {}, action: GenericAction) {
    switch (action.type) {
    case ChannelTypes.RECEIVED_CHANNEL_MEMBER_COUNTS_BY_GROUP: {
        const {channelId, memberCounts} = action.data;
        const memberCountsByGroup: ChannelMemberCountsByGroup = {};
        memberCounts.forEach((channelMemberCount: ChannelMemberCountByGroup) => {
            if (!state[channelId]?.[channelMemberCount.group_id] ||
                state[channelId]?.[channelMemberCount.group_id]?.channel_member_count !== channelMemberCount.channel_member_count ||
                state[channelId]?.[channelMemberCount.group_id]?.channel_member_timezones_count !== channelMemberCount.channel_member_timezones_count) {
                memberCountsByGroup[channelMemberCount.group_id] = channelMemberCount;
            }
        });

        if (Object.keys(memberCountsByGroup).length > 0) {
            return {
                ...state,
                [channelId]: memberCountsByGroup,
            };
        }

        return state;
    }
    default:
        return state;
    }
}

export default combineReducers({

    // the current selected channel
    currentChannelId,

    // object where every key is the channel id and has and object with the channel detail
    channels,

    // object where every key is a team id and has set of channel ids that are on the team
    channelsInTeam,

    // object where every key is the channel id and has an object with the channel members detail
    myMembers,

    // object where every key is the channel id with an object where key is a user id and has an object with the channel members detail
    membersInChannel,

    // object where every key is the channel id and has an object with the channel stats
    stats,

    groupsAssociatedToChannel,

    totalCount,

    // object where every key is the channel id, if present means a user requested to mark that channel as unread.
    manuallyUnread,

    // object where every key is the channel id containing one or several object(s) with a mapping of <group_id: ChannelMemberCountByGroup>
    channelMemberCountsByGroup,
});
