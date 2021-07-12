// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {analytics} from '@init/analytics';
import {General} from '@mm-redux/constants';
import {UserCustomStatus, UserProfile, UserStatus} from '@mm-redux/types/users';
import {buildQueryString, isMinimumServerVersion} from '@mm-redux/utils/helpers';

import {PER_PAGE_DEFAULT} from './constants';

export interface ClientUsersMix {
    createUser: (user: UserProfile, token: string, inviteId: string) => Promise<UserProfile>;
    patchMe: (userPatch: Partial<UserProfile>) => Promise<UserProfile>;
    patchUser: (userPatch: Partial<UserProfile> & {id: string}) => Promise<UserProfile>;
    updateUser: (user: UserProfile) => Promise<UserProfile>;
    demoteUserToGuest: (userId: string) => Promise<any>;
    getKnownUsers: () => Promise<string[]>;
    sendPasswordResetEmail: (email: string) => Promise<any>;
    setDefaultProfileImage: (userId: string) => Promise<any>;
    login: (loginId: string, password: string, token?: string, deviceId?: string, ldapOnly?: boolean) => Promise<UserProfile>;
    loginById: (id: string, password: string, token?: string, deviceId?: string) => Promise<UserProfile>;
    logout: () => Promise<any>;
    getProfiles: (page?: number, perPage?: number, options?: Record<string, any>) => Promise<UserProfile[]>;
    getProfilesByIds: (userIds: string[], options?: Record<string, any>) => Promise<UserProfile[]>;
    getProfilesByUsernames: (usernames: string[]) => Promise<UserProfile[]>;
    getProfilesInTeam: (teamId: string, page?: number, perPage?: number, sort?: string, options?: Record<string, any>) => Promise<UserProfile[]>;
    getProfilesNotInTeam: (teamId: string, groupConstrained: boolean, page?: number, perPage?: number) => Promise<UserProfile[]>;
    getProfilesWithoutTeam: (page?: number, perPage?: number, options?: Record<string, any>) => Promise<UserProfile[]>;
    getProfilesInChannel: (channelId: string, page?: number, perPage?: number, sort?: string) => Promise<UserProfile[]>;
    getProfilesInGroupChannels: (channelsIds: string[]) => Promise<{[x: string]: UserProfile[]}>;
    getProfilesNotInChannel: (teamId: string, channelId: string, groupConstrained: boolean, page?: number, perPage?: number) => Promise<UserProfile[]>;
    getMe: () => Promise<UserProfile>;
    getUser: (userId: string) => Promise<UserProfile>;
    getUserByUsername: (username: string) => Promise<UserProfile>;
    getUserByEmail: (email: string) => Promise<UserProfile>;
    getProfilePictureUrl: (userId: string, lastPictureUpdate: number) => string;
    getDefaultProfilePictureUrl: (userId: string) => string;
    autocompleteUsers: (name: string, teamId: string, channelId: string, options?: Record<string, any>) => Promise<{users: UserProfile[]; out_of_channel?: UserProfile[]}>;
    getSessions: (userId: string) => Promise<any>;
    checkUserMfa: (loginId: string) => Promise<{mfa_required: boolean}>;
    attachDevice: (deviceId: string) => Promise<any>;
    searchUsers: (term: string, options: any) => Promise<UserProfile[]>;
    getStatusesByIds: (userIds: string[]) => Promise<UserStatus[]>;
    getStatus: (userId: string) => Promise<UserStatus>;
    updateStatus: (status: UserStatus) => Promise<UserStatus>;
    updateCustomStatus: (customStatus: UserCustomStatus) => Promise<{status: string}>;
    unsetCustomStatus: () => Promise<{status: string}>;
    removeRecentCustomStatus: (customStatus: UserCustomStatus) => Promise<{status: string}>;
}

const ClientUsers = (superclass: any) => class extends superclass {
    createUser = async (user: UserProfile, token: string, inviteId: string) => {
        analytics.trackAPI('api_users_create');

        const queryParams: any = {};

        if (token) {
            queryParams.t = token;
        }

        if (inviteId) {
            queryParams.iid = inviteId;
        }

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString(queryParams)}`,
            {method: 'post', body: JSON.stringify(user)},
        );
    }

    patchMe = async (userPatch: Partial<UserProfile>) => {
        return this.doFetch(
            `${this.getUserRoute('me')}/patch`,
            {method: 'put', body: JSON.stringify(userPatch)},
        );
    }

    patchUser = async (userPatch: Partial<UserProfile> & {id: string}) => {
        analytics.trackAPI('api_users_patch');

        return this.doFetch(
            `${this.getUserRoute(userPatch.id)}/patch`,
            {method: 'put', body: JSON.stringify(userPatch)},
        );
    }

    updateUser = async (user: UserProfile) => {
        analytics.trackAPI('api_users_update');

        return this.doFetch(
            `${this.getUserRoute(user.id)}`,
            {method: 'put', body: JSON.stringify(user)},
        );
    }

    demoteUserToGuest = async (userId: string) => {
        analytics.trackAPI('api_users_demote_user_to_guest');

        return this.doFetch(
            `${this.getUserRoute(userId)}/demote`,
            {method: 'post'},
        );
    }

    getKnownUsers = async () => {
        analytics.trackAPI('api_get_known_users');

        return this.doFetch(
            `${this.getUsersRoute()}/known`,
            {method: 'get'},
        );
    }

    sendPasswordResetEmail = async (email: string) => {
        analytics.trackAPI('api_users_send_password_reset');

        return this.doFetch(
            `${this.getUsersRoute()}/password/reset/send`,
            {method: 'post', body: JSON.stringify({email})},
        );
    }

    setDefaultProfileImage = async (userId: string) => {
        analytics.trackAPI('api_users_set_default_profile_picture');

        return this.doFetch(
            `${this.getUserRoute(userId)}/image`,
            {method: 'delete'},
        );
    };

    login = async (loginId: string, password: string, token = '', deviceId = '', ldapOnly = false) => {
        analytics.trackAPI('api_users_login');

        if (ldapOnly) {
            analytics.trackAPI('api_users_login_ldap');
        }

        const body: any = {
            device_id: deviceId,
            login_id: loginId,
            password,
            token,
        };

        if (ldapOnly) {
            body.ldap_only = 'true';
        }

        const {data} = await this.doFetchWithResponse(
            `${this.getUsersRoute()}/login`,
            {
                method: 'post',
                body: JSON.stringify(body),
                headers: {'Cache-Control': 'no-store'},
            },
        );

        return data;
    };

    loginById = async (id: string, password: string, token = '', deviceId = '') => {
        analytics.trackAPI('api_users_login');
        const body: any = {
            device_id: deviceId,
            id,
            password,
            token,
        };

        const {data} = await this.doFetchWithResponse(
            `${this.getUsersRoute()}/login`,
            {method: 'post', body: JSON.stringify(body)},
        );

        return data;
    };

    logout = async () => {
        analytics.trackAPI('api_users_logout');

        const {response} = await this.doFetchWithResponse(
            `${this.getUsersRoute()}/logout`,
            {method: 'post'},
        );

        if (response.ok) {
            this.token = '';
        }

        this.serverVersion = '';

        return response;
    };

    getProfiles = async (page = 0, perPage = PER_PAGE_DEFAULT, options = {}) => {
        analytics.trackAPI('api_profiles_get');

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({page, per_page: perPage, ...options})}`,
            {method: 'get'},
        );
    };

    getProfilesByIds = async (userIds: string[], options = {}) => {
        analytics.trackAPI('api_profiles_get_by_ids');

        return this.doFetch(
            `${this.getUsersRoute()}/ids${buildQueryString(options)}`,
            {method: 'post', body: JSON.stringify(userIds)},
        );
    };

    getProfilesByUsernames = async (usernames: string[]) => {
        analytics.trackAPI('api_profiles_get_by_usernames');

        return this.doFetch(
            `${this.getUsersRoute()}/usernames`,
            {method: 'post', body: JSON.stringify(usernames)},
        );
    };

    getProfilesInTeam = async (teamId: string, page = 0, perPage = PER_PAGE_DEFAULT, sort = '', options = {}) => {
        analytics.trackAPI('api_profiles_get_in_team', {team_id: teamId, sort});

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({...options, in_team: teamId, page, per_page: perPage, sort})}`,
            {method: 'get'},
        );
    };

    getProfilesNotInTeam = async (teamId: string, groupConstrained: boolean, page = 0, perPage = PER_PAGE_DEFAULT) => {
        analytics.trackAPI('api_profiles_get_not_in_team', {team_id: teamId, group_constrained: groupConstrained});

        const queryStringObj: any = {not_in_team: teamId, page, per_page: perPage};
        if (groupConstrained) {
            queryStringObj.group_constrained = true;
        }

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString(queryStringObj)}`,
            {method: 'get'},
        );
    };

    getProfilesWithoutTeam = async (page = 0, perPage = PER_PAGE_DEFAULT, options = {}) => {
        analytics.trackAPI('api_profiles_get_without_team');

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({...options, without_team: 1, page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getProfilesInChannel = async (channelId: string, page = 0, perPage = PER_PAGE_DEFAULT, sort = '') => {
        analytics.trackAPI('api_profiles_get_in_channel', {channel_id: channelId});

        const serverVersion = this.getServerVersion();
        let queryStringObj;
        if (isMinimumServerVersion(serverVersion, 4, 7)) {
            queryStringObj = {in_channel: channelId, page, per_page: perPage, sort};
        } else {
            queryStringObj = {in_channel: channelId, page, per_page: perPage};
        }
        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString(queryStringObj)}`,
            {method: 'get'},
        );
    };

    getProfilesInGroupChannels = async (channelsIds: string[]) => {
        analytics.trackAPI('api_profiles_get_in_group_channels', {channelsIds});

        return this.doFetch(
            `${this.getUsersRoute()}/group_channels`,
            {method: 'post', body: JSON.stringify(channelsIds)},
        );
    };

    getProfilesNotInChannel = async (teamId: string, channelId: string, groupConstrained: boolean, page = 0, perPage = PER_PAGE_DEFAULT) => {
        analytics.trackAPI('api_profiles_get_not_in_channel', {team_id: teamId, channel_id: channelId, group_constrained: groupConstrained});

        const queryStringObj: any = {in_team: teamId, not_in_channel: channelId, page, per_page: perPage};
        if (groupConstrained) {
            queryStringObj.group_constrained = true;
        }

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString(queryStringObj)}`,
            {method: 'get'},
        );
    };

    getMe = async () => {
        return this.doFetch(
            `${this.getUserRoute('me')}`,
            {method: 'get'},
        );
    };

    getUser = async (userId: string) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}`,
            {method: 'get'},
        );
    };

    getUserByUsername = async (username: string) => {
        return this.doFetch(
            `${this.getUsersRoute()}/username/${username}`,
            {method: 'get'},
        );
    };

    getUserByEmail = async (email: string) => {
        return this.doFetch(
            `${this.getUsersRoute()}/email/${email}`,
            {method: 'get'},
        );
    };

    getProfilePictureUrl = (userId: string, lastPictureUpdate: number) => {
        const params: any = {};

        if (lastPictureUpdate) {
            params._ = lastPictureUpdate;
        }

        return `${this.getUserRoute(userId)}/image${buildQueryString(params)}`;
    };

    getDefaultProfilePictureUrl = (userId: string) => {
        return `${this.getUserRoute(userId)}/image/default`;
    };

    autocompleteUsers = async (name: string, teamId: string, channelId: string, options = {
        limit: General.AUTOCOMPLETE_LIMIT_DEFAULT,
    }) => {
        return this.doFetch(`${this.getUsersRoute()}/autocomplete${buildQueryString({
            in_team: teamId,
            in_channel: channelId,
            name,
            limit: options.limit,
        })}`, {
            method: 'get',
        });
    };

    getSessions = async (userId: string) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/sessions`,
            {method: 'get'},
        );
    };

    checkUserMfa = async (loginId: string) => {
        return this.doFetch(
            `${this.getUsersRoute()}/mfa`,
            {method: 'post', body: JSON.stringify({login_id: loginId})},
        );
    };

    attachDevice = async (deviceId: string) => {
        return this.doFetch(
            `${this.getUsersRoute()}/sessions/device`,
            {method: 'put', body: JSON.stringify({device_id: deviceId})},
        );
    };

    searchUsers = async (term: string, options: any) => {
        analytics.trackAPI('api_search_users');

        return this.doFetch(
            `${this.getUsersRoute()}/search`,
            {method: 'post', body: JSON.stringify({term, ...options})},
        );
    };

    getStatusesByIds = async (userIds: string[]) => {
        return this.doFetch(
            `${this.getUsersRoute()}/status/ids`,
            {method: 'post', body: JSON.stringify(userIds)},
        );
    };

    getStatus = async (userId: string) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/status`,
            {method: 'get'},
        );
    };

    updateStatus = async (status: UserStatus) => {
        return this.doFetch(
            `${this.getUserRoute(status.user_id)}/status`,
            {method: 'put', body: JSON.stringify(status)},
        );
    };

    updateCustomStatus = (customStatus: UserCustomStatus) => {
        return this.doFetch(
            `${this.getUserRoute('me')}/status/custom`,
            {method: 'put', body: JSON.stringify(customStatus)},
        );
    };

    unsetCustomStatus = () => {
        return this.doFetch(
            `${this.getUserRoute('me')}/status/custom`,
            {method: 'delete'},
        );
    };

    removeRecentCustomStatus = (customStatus: UserCustomStatus) => {
        return this.doFetch(
            `${this.getUserRoute('me')}/status/custom/recent/delete`,
            {method: 'post', body: JSON.stringify(customStatus)},
        );
    };
};

export default ClientUsers;
