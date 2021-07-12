// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Client4} from '@client/rest';
import {ChannelTypes, PreferenceTypes, RoleTypes, UserTypes} from '@mm-redux/action_types';
import {General, Preferences} from '@mm-redux/constants';
import {getCurrentChannelId, getRedirectChannelNameForTeam, getChannelsNameMapInTeam} from '@mm-redux/selectors/entities/channels';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getMyPreferences} from '@mm-redux/selectors/entities/preferences';
import {getCurrentUserId, getUsers, getUserIdsInChannels} from '@mm-redux/selectors/entities/users';
import {ActionResult, GenericAction} from '@mm-redux/types/actions';
import {Channel, ChannelMembership} from '@mm-redux/types/channels';
import {PreferenceType} from '@mm-redux/types/preferences';
import {GlobalState} from '@mm-redux/types/store';
import {UserProfile} from '@mm-redux/types/users';
import {RelationOneToMany} from '@mm-redux/types/utilities';
import {getChannelByName as selectChannelByName, getUserIdFromChannelName, isAutoClosed} from '@mm-redux/utils/channel_utils';
import {getPreferenceKey} from '@mm-redux/utils/preference_utils';
import {isDirectChannelVisible, isGroupChannelVisible} from '@utils/channels';
import {buildPreference} from '@utils/preferences';

export async function loadSidebarDirectMessagesProfiles(state: GlobalState, channels: Array<Channel>, channelMembers: Array<ChannelMembership>) {
    const currentUserId = getCurrentUserId(state);
    const usersInChannel: RelationOneToMany<Channel, UserProfile> = getUserIdsInChannels(state);
    const directChannels = Object.values(channels).filter((c) => c.type === General.DM_CHANNEL || c.type === General.GM_CHANNEL);
    const prefs: Array<PreferenceType> = [];
    const promises: Array<Promise<ActionResult>> = []; //only fetch profiles that we don't have and the Direct channel should be visible
    const actions = [];
    const userIds: Array<string> = [];

    // Prepare preferences and start fetching profiles to batch them
    directChannels.forEach((c) => {
        const profileIds = Array.from(usersInChannel[c.id] || []);
        const profilesInChannel: Array<string> = profileIds.filter((u: string) => u !== currentUserId);
        userIds.push(...profilesInChannel);

        switch (c.type) {
        case General.DM_CHANNEL: {
            const dm = fetchDirectMessageProfileIfNeeded(state, c, channelMembers, profilesInChannel);
            if (dm.preferences.length) {
                prefs.push(...dm.preferences);
            }

            if (dm.promise) {
                promises.push(dm.promise);
            }
            break;
        }
        case General.GM_CHANNEL: {
            const gm = fetchGroupMessageProfilesIfNeeded(state, c, channelMembers, profilesInChannel);

            if (gm.preferences.length) {
                prefs.push(...gm.preferences);
            }

            if (gm.promise) {
                promises.push(gm.promise);
            }
            break;
        }
        }
    });

    // Save preferences if there are any changes
    if (prefs.length) {
        Client4.savePreferences(currentUserId, prefs);
        actions.push({
            type: PreferenceTypes.RECEIVED_PREFERENCES,
            data: prefs,
        });
    }

    const profilesAction = await getProfilesFromPromises(promises);
    const userIdsSet: Set<string> = new Set(userIds);

    if (profilesAction) {
        actions.push(profilesAction);
        profilesAction.data.forEach((d: any) => {
            const {users} = d.data;
            users.forEach((u: UserProfile) => userIdsSet.add(u.id));
        });
    }

    if (userIdsSet.size > 0) {
        try {
            const statuses = await Client4.getStatusesByIds(Array.from(userIdsSet));
            if (statuses.length) {
                actions.push({
                    type: UserTypes.RECEIVED_STATUSES,
                    data: statuses,
                });
            }
        } catch {
            // do nothing (status will get fetched later on regardless)
        }
    }

    return actions;
}

export async function fetchMyChannel(channelId: string) {
    try {
        const data = await Client4.getChannel(channelId);

        return {data};
    } catch (error) {
        return {error};
    }
}

export async function fetchMyChannelMember(channelId: string) {
    try {
        const data = await Client4.getMyChannelMember(channelId);

        return {data};
    } catch (error) {
        return {error};
    }
}

export function markChannelAsUnread(state: GlobalState, teamId: string, channelId: string, mentions: Array<string>): Array<GenericAction> {
    const {myMembers} = state.entities.channels;
    const {currentUserId} = state.entities.users;

    const actions: GenericAction[] = [{
        type: ChannelTypes.INCREMENT_TOTAL_MSG_COUNT,
        data: {
            channelId,
            amount: 1,
        },
    }, {
        type: ChannelTypes.INCREMENT_UNREAD_MSG_COUNT,
        data: {
            teamId,
            channelId,
            amount: 1,
            onlyMentions: myMembers[channelId] && myMembers[channelId].notify_props &&
                myMembers[channelId].notify_props.mark_unread === General.MENTION,
        },
    }];

    if (mentions && mentions.indexOf(currentUserId) !== -1) {
        actions.push({
            type: ChannelTypes.INCREMENT_UNREAD_MENTION_COUNT,
            data: {
                teamId,
                channelId,
                amount: 1,
            },
        });
    }

    return actions;
}

export function makeDirectChannelVisibleIfNecessary(state: GlobalState, otherUserId: string): GenericAction|null {
    const myPreferences = getMyPreferences(state);
    const currentUserId = getCurrentUserId(state);

    let preference = myPreferences[getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUserId)];

    if (!preference || preference.value === 'false') {
        preference = {
            user_id: currentUserId,
            category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW,
            name: otherUserId,
            value: 'true',
        };

        Client4.savePreferences(currentUserId, [preference]);
        return {
            type: PreferenceTypes.RECEIVED_PREFERENCES,
            data: [preference],
        };
    }

    return null;
}

export async function makeGroupMessageVisibleIfNecessary(state: GlobalState, channelId: string) {
    try {
        const myPreferences = getMyPreferences(state);
        const currentUserId = getCurrentUserId(state);

        let preference = myPreferences[getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channelId)];

        if (!preference || preference.value === 'false') {
            preference = {
                user_id: currentUserId,
                category: Preferences.CATEGORY_GROUP_CHANNEL_SHOW,
                name: channelId,
                value: 'true',
            };

            Client4.savePreferences(currentUserId, [preference]);

            const profilesInChannel = await fetchUsersInChannel(state, channelId);

            return [{
                type: UserTypes.RECEIVED_BATCHED_PROFILES_IN_CHANNEL,
                data: [profilesInChannel],
            }, {
                type: PreferenceTypes.RECEIVED_PREFERENCES,
                data: [preference],
            }];
        }

        return null;
    } catch {
        return null;
    }
}

export async function fetchChannelAndMyMember(channelId: string): Promise<Array<GenericAction>> {
    const actions: Array<GenericAction> = [];

    try {
        const [channel, member] = await Promise.all([
            Client4.getChannel(channelId),
            Client4.getMyChannelMember(channelId),
        ]);

        actions.push({
            type: ChannelTypes.RECEIVED_CHANNEL,
            data: channel,
        },
        {
            type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
            data: member,
        });

        const roles = await Client4.getRolesByNames(member.roles.split(' '));
        if (roles.length) {
            actions.push({
                type: RoleTypes.RECEIVED_ROLES,
                data: roles,
            });
        }
    } catch {
        // do nothing
    }

    return actions;
}

export async function getAddedDmUsersIfNecessary(state: GlobalState, preferences: PreferenceType[]): Promise<Array<GenericAction>> {
    const userIds: string[] = [];
    const actions: Array<GenericAction> = [];

    for (const preference of preferences) {
        if (preference.category === Preferences.CATEGORY_DIRECT_CHANNEL_SHOW && preference.value === 'true') {
            userIds.push(preference.name);
        }
    }

    if (userIds.length !== 0) {
        const profiles = getUsers(state);
        const currentUserId = getCurrentUserId(state);

        const needProfiles: string[] = [];

        for (const userId of userIds) {
            if (!profiles[userId] && userId !== currentUserId) {
                needProfiles.push(userId);
            }
        }

        if (needProfiles.length > 0) {
            const data = await Client4.getProfilesByIds(userIds);
            if (profiles.lenght) {
                actions.push({
                    type: UserTypes.RECEIVED_PROFILES_LIST,
                    data,
                });
            }
        }
    }

    return actions;
}

export function lastChannelIdForTeam(state: GlobalState, teamId: string): string {
    const {channels, myMembers} = state.entities.channels;
    const {currentUserId} = state.entities.users;
    const {myPreferences} = state.entities.preferences;
    const lastChannelForTeam = state.views.team.lastChannelForTeam[teamId];
    const lastChannelId = lastChannelForTeam && lastChannelForTeam.length ? lastChannelForTeam[0] : '';
    const lastChannel = channels[lastChannelId];

    const isDMVisible = lastChannel && lastChannel.type === General.DM_CHANNEL &&
            isDirectChannelVisible(currentUserId, myPreferences, lastChannel);

    const isGMVisible = lastChannel && lastChannel.type === General.GM_CHANNEL &&
        isGroupChannelVisible(myPreferences, lastChannel);

    if (
        myMembers[lastChannelId] &&
        lastChannel &&
        (lastChannel.team_id === teamId || isDMVisible || isGMVisible)
    ) {
        return lastChannelId;
    }

    // Fallback to default channel
    const channelsInTeam = getChannelsNameMapInTeam(state, teamId);
    const channel = selectChannelByName(channelsInTeam, getRedirectChannelNameForTeam(state, teamId));

    if (channel) {
        return channel.id;
    }

    // Handle case when the default channel cannot be found
    // so we need to get the first available channel of the team
    const teamChannels = Object.values(channelsInTeam);
    const firstChannel = teamChannels.length ? teamChannels[0].id : '';
    return firstChannel;
}

function fetchDirectMessageProfileIfNeeded(state: GlobalState, channel: Channel, channelMembers: Array<ChannelMembership>, profilesInChannel: Array<string>) {
    const currentUserId = getCurrentUserId(state);
    const myPreferences = getMyPreferences(state);
    const users = getUsers(state);
    const config = getConfig(state);
    const currentChannelId = getCurrentChannelId(state);
    const otherUserId = getUserIdFromChannelName(currentUserId, channel.name);
    const otherUser = users[otherUserId];
    const dmVisible = isDirectChannelVisible(currentUserId, myPreferences, channel);
    const dmAutoClosed = isAutoClosed(config, myPreferences, channel, channel.last_post_at, otherUser ? otherUser.delete_at : 0, currentChannelId);
    const member = channelMembers.find((cm) => cm.channel_id === channel.id);
    const dmIsUnread = member ? member.mention_count > 0 : false;
    const dmFetchProfile = dmIsUnread || (dmVisible && !dmAutoClosed);
    const preferences = [];

    // when then DM is hidden but has new messages
    if ((!dmVisible || dmAutoClosed) && dmIsUnread) {
        preferences.push(buildPreference(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, currentUserId, otherUserId));
        preferences.push(buildPreference(Preferences.CATEGORY_CHANNEL_OPEN_TIME, currentUserId, channel.id, Date.now().toString()));
    }

    if (dmFetchProfile && !profilesInChannel.includes(otherUserId) && otherUserId !== currentUserId) {
        return {
            preferences,
            promise: fetchUsersInChannel(state, channel.id),
        };
    }

    return {preferences};
}

function fetchGroupMessageProfilesIfNeeded(state: GlobalState, channel: Channel, channelMembers: Array<ChannelMembership>, profilesInChannel: Array<string>) {
    const currentUserId = getCurrentUserId(state);
    const myPreferences = getMyPreferences(state);
    const config = getConfig(state);
    const gmVisible = isGroupChannelVisible(myPreferences, channel);
    const gmAutoClosed = isAutoClosed(config, myPreferences, channel, channel.last_post_at, 0);
    const channelMember = channelMembers.find((cm) => cm.channel_id === channel.id);
    let hasMentions = false;
    let isUnread = false;

    if (channelMember) {
        hasMentions = channelMember.mention_count > 0;
        isUnread = channelMember.msg_count < channel.total_msg_count;
    }

    const gmIsUnread = hasMentions || isUnread;
    const gmFetchProfile = gmIsUnread || (gmVisible && !gmAutoClosed);
    const preferences = [];

    // when then GM is hidden but has new messages
    if ((!gmVisible || gmAutoClosed) && gmIsUnread) {
        preferences.push(buildPreference(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, currentUserId, channel.id));
        preferences.push(buildPreference(Preferences.CATEGORY_CHANNEL_OPEN_TIME, currentUserId, channel.id, Date.now().toString()));
    }

    if (gmFetchProfile && !profilesInChannel.length) {
        return {
            preferences,
            promise: fetchUsersInChannel(state, channel.id),
        };
    }

    return {preferences};
}

async function fetchUsersInChannel(state: GlobalState, channelId: string): Promise<ActionResult> {
    try {
        const currentUserId = getCurrentUserId(state);
        const profiles = await Client4.getProfilesInChannel(channelId);

        // When fetching profiles in channels we exclude our own user
        const users = profiles.filter((p: UserProfile) => p.id !== currentUserId);
        const data = {
            channelId,
            users,
        };

        return {data};
    } catch (error) {
        return {error};
    }
}

async function getProfilesFromPromises(promises: Array<Promise<ActionResult>>): Promise<GenericAction | null> {
    // Get the profiles returned by the promises
    if (!promises.length) {
        return null;
    }

    try {
        const result = await Promise.all(promises);
        const data = result.filter((p: any) => !p.error);

        return {
            type: UserTypes.RECEIVED_BATCHED_PROFILES_IN_CHANNEL,
            data,
        };
    } catch {
        return null;
    }
}
