// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {analytics} from '@init/analytics';
import {Channel, ChannelMemberCountByGroup, ChannelMembership, ChannelNotifyProps, ChannelStats} from '@mm-redux/types/channels';
import {buildQueryString} from '@mm-redux/utils/helpers';

import {PER_PAGE_DEFAULT} from './constants';

export interface ClientChannelsMix {
    getAllChannels: (page?: number, perPage?: number, notAssociatedToGroup?: string, excludeDefaultChannels?: boolean, includeTotalCount?: boolean) => Promise<any>;
    createChannel: (channel: Channel) => Promise<Channel>;
    createDirectChannel: (userIds: string[]) => Promise<Channel>;
    createGroupChannel: (userIds: string[]) => Promise<Channel>;
    deleteChannel: (channelId: string) => Promise<any>;
    unarchiveChannel: (channelId: string) => Promise<Channel>;
    updateChannel: (channel: Channel) => Promise<Channel>;
    convertChannelToPrivate: (channelId: string) => Promise<Channel>;
    updateChannelPrivacy: (channelId: string, privacy: any) => Promise<Channel>;
    patchChannel: (channelId: string, channelPatch: Partial<Channel>) => Promise<Channel>;
    updateChannelNotifyProps: (props: ChannelNotifyProps & {channel_id: string; user_id: string}) => Promise<any>;
    getChannel: (channelId: string) => Promise<Channel>;
    getChannelByName: (teamId: string, channelName: string, includeDeleted?: boolean) => Promise<Channel>;
    getChannelByNameAndTeamName: (teamName: string, channelName: string, includeDeleted?: boolean) => Promise<Channel>;
    getChannels: (teamId: string, page?: number, perPage?: number) => Promise<Channel[]>;
    getArchivedChannels: (teamId: string, page?: number, perPage?: number) => Promise<Channel[]>;
    getMyChannels: (teamId: string, includeDeleted?: boolean, lastDeleteAt?: number) => Promise<Channel[]>;
    getMyChannelMember: (channelId: string) => Promise<ChannelMembership>;
    getMyChannelMembers: (teamId: string) => Promise<ChannelMembership[]>;
    getChannelMembers: (channelId: string, page?: number, perPage?: number) => Promise<ChannelMembership[]>;
    getChannelTimezones: (channelId: string) => Promise<string[]>;
    getChannelMember: (channelId: string, userId: string) => Promise<ChannelMembership>;
    getChannelMembersByIds: (channelId: string, userIds: string[]) => Promise<ChannelMembership[]>;
    addToChannel: (userId: string, channelId: string, postRootId?: string) => Promise<ChannelMembership>;
    removeFromChannel: (userId: string, channelId: string) => Promise<any>;
    getChannelStats: (channelId: string) => Promise<ChannelStats>;
    getChannelMemberCountsByGroup: (channelId: string, includeTimezones: boolean) => Promise<ChannelMemberCountByGroup[]>;
    viewMyChannel: (channelId: string, prevChannelId?: string) => Promise<any>;
    autocompleteChannels: (teamId: string, name: string) => Promise<Channel[]>;
    autocompleteChannelsForSearch: (teamId: string, name: string) => Promise<Channel[]>;
    searchChannels: (teamId: string, term: string) => Promise<Channel[]>;
    searchArchivedChannels: (teamId: string, term: string) => Promise<Channel[]>;
}

const ClientChannels = (superclass: any) => class extends superclass {
    getAllChannels = async (page = 0, perPage = PER_PAGE_DEFAULT, notAssociatedToGroup = '', excludeDefaultChannels = false, includeTotalCount = false) => {
        const queryData = {
            page,
            per_page: perPage,
            not_associated_to_group: notAssociatedToGroup,
            exclude_default_channels: excludeDefaultChannels,
            include_total_count: includeTotalCount,
        };
        return this.doFetch(
            `${this.getChannelsRoute()}${buildQueryString(queryData)}`,
            {method: 'get'},
        );
    };

    createChannel = async (channel: Channel) => {
        analytics.trackAPI('api_channels_create', {team_id: channel.team_id});

        return this.doFetch(
            `${this.getChannelsRoute()}`,
            {method: 'post', body: JSON.stringify(channel)},
        );
    };

    createDirectChannel = async (userIds: string[]) => {
        analytics.trackAPI('api_channels_create_direct');

        return this.doFetch(
            `${this.getChannelsRoute()}/direct`,
            {method: 'post', body: JSON.stringify(userIds)},
        );
    };

    createGroupChannel = async (userIds: string[]) => {
        analytics.trackAPI('api_channels_create_group');

        return this.doFetch(
            `${this.getChannelsRoute()}/group`,
            {method: 'post', body: JSON.stringify(userIds)},
        );
    };

    deleteChannel = async (channelId: string) => {
        analytics.trackAPI('api_channels_delete', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}`,
            {method: 'delete'},
        );
    };

    unarchiveChannel = async (channelId: string) => {
        analytics.trackAPI('api_channels_unarchive', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}/restore`,
            {method: 'post'},
        );
    };

    updateChannel = async (channel: Channel) => {
        analytics.trackAPI('api_channels_update', {channel_id: channel.id});

        return this.doFetch(
            `${this.getChannelRoute(channel.id)}`,
            {method: 'put', body: JSON.stringify(channel)},
        );
    };

    convertChannelToPrivate = async (channelId: string) => {
        analytics.trackAPI('api_channels_convert_to_private', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}/convert`,
            {method: 'post'},
        );
    };

    updateChannelPrivacy = async (channelId: string, privacy: any) => {
        analytics.trackAPI('api_channels_update_privacy', {channel_id: channelId, privacy});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}/privacy`,
            {method: 'put', body: JSON.stringify({privacy})},
        );
    };

    patchChannel = async (channelId: string, channelPatch: Partial<Channel>) => {
        analytics.trackAPI('api_channels_patch', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}/patch`,
            {method: 'put', body: JSON.stringify(channelPatch)},
        );
    };

    updateChannelNotifyProps = async (props: ChannelNotifyProps & {channel_id: string; user_id: string}) => {
        analytics.trackAPI('api_users_update_channel_notifications', {channel_id: props.channel_id});

        return this.doFetch(
            `${this.getChannelMemberRoute(props.channel_id, props.user_id)}/notify_props`,
            {method: 'put', body: JSON.stringify(props)},
        );
    };

    getChannel = async (channelId: string) => {
        analytics.trackAPI('api_channel_get', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}`,
            {method: 'get'},
        );
    };

    getChannelByName = async (teamId: string, channelName: string, includeDeleted = false) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels/name/${channelName}?include_deleted=${includeDeleted}`,
            {method: 'get'},
        );
    };

    getChannelByNameAndTeamName = async (teamName: string, channelName: string, includeDeleted = false) => {
        analytics.trackAPI('api_channel_get_by_name_and_teamName', {channel_name: channelName, team_name: teamName, include_deleted: includeDeleted});

        return this.doFetch(
            `${this.getTeamNameRoute(teamName)}/channels/name/${channelName}?include_deleted=${includeDeleted}`,
            {method: 'get'},
        );
    };

    getChannels = async (teamId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getArchivedChannels = async (teamId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels/deleted${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getMyChannels = async (teamId: string, includeDeleted = false, lastDeleteAt = 0) => {
        return this.doFetch(
            `${this.getUserRoute('me')}/teams/${teamId}/channels${buildQueryString({
                include_deleted: includeDeleted,
                last_delete_at: lastDeleteAt,
            })}`,
            {method: 'get'},
        );
    };

    getMyChannelMember = async (channelId: string) => {
        return this.doFetch(
            `${this.getChannelMemberRoute(channelId, 'me')}`,
            {method: 'get'},
        );
    };

    getMyChannelMembers = async (teamId: string) => {
        return this.doFetch(
            `${this.getUserRoute('me')}/teams/${teamId}/channels/members`,
            {method: 'get'},
        );
    };

    getChannelMembers = async (channelId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getChannelMembersRoute(channelId)}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getChannelTimezones = async (channelId: string) => {
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/timezones`,
            {method: 'get'},
        );
    };

    getChannelMember = async (channelId: string, userId: string) => {
        return this.doFetch(
            `${this.getChannelMemberRoute(channelId, userId)}`,
            {method: 'get'},
        );
    };

    getChannelMembersByIds = async (channelId: string, userIds: string[]) => {
        return this.doFetch(
            `${this.getChannelMembersRoute(channelId)}/ids`,
            {method: 'post', body: JSON.stringify(userIds)},
        );
    };

    addToChannel = async (userId: string, channelId: string, postRootId = '') => {
        analytics.trackAPI('api_channels_add_member', {channel_id: channelId});

        const member = {user_id: userId, channel_id: channelId, post_root_id: postRootId};
        return this.doFetch(
            `${this.getChannelMembersRoute(channelId)}`,
            {method: 'post', body: JSON.stringify(member)},
        );
    };

    removeFromChannel = async (userId: string, channelId: string) => {
        analytics.trackAPI('api_channels_remove_member', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelMemberRoute(channelId, userId)}`,
            {method: 'delete'},
        );
    };

    getChannelStats = async (channelId: string) => {
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/stats`,
            {method: 'get'},
        );
    };

    getChannelMemberCountsByGroup = async (channelId: string, includeTimezones: boolean) => {
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/member_counts_by_group?include_timezones=${includeTimezones}`,
            {method: 'get'},
        );
    };

    viewMyChannel = async (channelId: string, prevChannelId?: string) => {
        const data = {channel_id: channelId, prev_channel_id: prevChannelId};
        return this.doFetch(
            `${this.getChannelsRoute()}/members/me/view`,
            {method: 'post', body: JSON.stringify(data)},
        );
    };

    autocompleteChannels = async (teamId: string, name: string) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels/autocomplete${buildQueryString({name})}`,
            {method: 'get'},
        );
    };

    autocompleteChannelsForSearch = async (teamId: string, name: string) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels/search_autocomplete${buildQueryString({name})}`,
            {method: 'get'},
        );
    };

    searchChannels = async (teamId: string, term: string) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels/search`,
            {method: 'post', body: JSON.stringify({term})},
        );
    };

    searchArchivedChannels = async (teamId: string, term: string) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels/search_archived`,
            {method: 'post', body: JSON.stringify({term})},
        );
    };
};

export default ClientChannels;
