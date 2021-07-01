// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {DeviceEventEmitter} from 'react-native';

import NetworkManager from '@app/init/network_manager';
import {Navigation} from '@constants';
import DatabaseManager from '@database/manager';
import analytics from '@init/analytics';
import {getDeviceToken} from '@app/queries/app/global';
import {getCommonSystemValues, getCurrentUserId} from '@app/queries/servers/system';
import {createSessions} from '@actions/local/systems';
import {autoUpdateTimezone, getDeviceTimezone, isTimezoneEnabled} from '@actions/local/timezone';
import {logError} from '@actions/remote/error';
import {loadRolesIfNeeded} from '@actions/remote/role';
import {getDataRetentionPolicy} from '@actions/remote/systems';
import {Client4Error} from '@typings/api/client4';
import {Config} from '@typings/database/models/servers/config';
import {
    LoadMeArgs,
    LoginArgs,
    RawMyTeam,
    RawPreference,
    RawRole,
    RawTeam,
    RawTeamMembership,
    RawUser,
} from '@typings/database/database';
import {License} from '@typings/database/models/servers/license';
import Role from '@typings/database/models/servers/role';
import User from '@typings/database/models/servers/user';
import {getCSRFFromCookie} from '@utils/security';

const HTTP_UNAUTHORIZED = 401;

// TODO: Requests should know the server url
// To select the right DB & Client

export const logout = async (serverUrl: string, skipServerLogout = false) => {
    return async () => {
        if (!skipServerLogout) {
            try {
                const client = NetworkManager.getClient(serverUrl);
                await client.logout();
            } catch (error) {
                return {error};
            }
        }

        DeviceEventEmitter.emit(Navigation.NAVIGATION_RESET);

        DatabaseManager.deleteServerDatabase(serverUrl);
        NetworkManager.invalidateClient(serverUrl);

        return {data: true};
    };
};

export const forceLogoutIfNecessary = async (serverUrl: string, err: Client4Error) => {
    const database = DatabaseManager.serverDatabases[serverUrl].database;
    if (!database) {
        return {error: `${serverUrl} database not found`};
    }

    const currentUserId = await getCurrentUserId(database);

    if ('status_code' in err && err.status_code === HTTP_UNAUTHORIZED && err?.url?.indexOf('/login') === -1 && currentUserId) {
        await logout(serverUrl);
    }

    return {error: null};
};

export const login = async (serverUrl: string, {ldapOnly = false, loginId, mfaToken, password}: LoginArgs) => {
    let deviceToken;
    let user;

    const appDatabase = DatabaseManager.appDatabase?.database;
    if (!appDatabase) {
        return {error: 'App database not found.'};
    }

    let client;
    try {
        client = NetworkManager.getClient(serverUrl);
    } catch (error) {
        return {error};
    }

    try {
        deviceToken = await getDeviceToken(appDatabase);
        user = ((await client.login(
            loginId,
            password,
            mfaToken,
            deviceToken,
            ldapOnly,
        )) as unknown) as RawUser;

        await DatabaseManager.createServerDatabase({
            config: {
                dbName: serverUrl,
                serverUrl,
            },
        });
        await DatabaseManager.setActiveServerDatabase(serverUrl);
        await getCSRFFromCookie(serverUrl);
    } catch (e) {
        return {error: e};
    }

    const result = await loadMe(serverUrl, {user, deviceToken});

    if (!result?.error) {
        await completeLogin(serverUrl, user);
    }

    return {result};
};

export const loadMe = async (serverUrl: string, {deviceToken, user}: LoadMeArgs) => {
    let currentUser = user;

    const database = DatabaseManager.serverDatabases[serverUrl].database;
    if (!database) {
        return {error: `${serverUrl} database not found`};
    }

    let client;
    try {
        client = NetworkManager.getClient(serverUrl);
    } catch (error) {
        return {error};
    }

    try {
        if (deviceToken) {
            await client.attachDevice(deviceToken);
        }

        if (!currentUser) {
            currentUser = ((await client.getMe()) as unknown) as RawUser;
        }
    } catch (e) {
        await forceLogoutIfNecessary(serverUrl, e);
        return {
            error: e,
            currentUser: undefined,
        };
    }

    try {
        const analyticsClient = analytics.create(serverUrl);
        analyticsClient.setUserId(currentUser.id);
        analyticsClient.setUserRoles(currentUser.roles);

        //todo: Ask for a unified endpoint that will serve all those values in one go.( while ensuring backward-compatibility through fallbacks to previous code-path)
        const teamsRequest = client.getMyTeams();

        // Goes into myTeam table
        const teamMembersRequest = client.getMyTeamMembers();
        const teamUnreadRequest = client.getMyTeamUnreads();

        const preferencesRequest = client.getMyPreferences();
        const configRequest = client.getClientConfigOld();
        const licenseRequest = client.getClientLicenseOld();

        const [
            teams,
            teamMembers,
            teamUnreads,
            preferences,
            config,
            license,
        ] = await Promise.all([
            teamsRequest,
            teamMembersRequest,
            teamUnreadRequest,
            preferencesRequest,
            configRequest,
            licenseRequest,
        ]);

        const operator = DatabaseManager.serverDatabases[serverUrl].operator;
        const teamRecords = operator.handleTeam({prepareRecordsOnly: true, teams: teams as RawTeam[]});
        const teamMembershipRecords = operator.handleTeamMemberships({prepareRecordsOnly: true, teamMemberships: (teamMembers as unknown) as RawTeamMembership[]});

        const myTeams = teamUnreads.map((unread) => {
            const matchingTeam = teamMembers.find((team) => team.team_id === unread.team_id);
            return {team_id: unread.team_id, roles: matchingTeam?.roles ?? '', is_unread: unread.msg_count > 0, mentions_count: unread.mention_count};
        });

        const myTeamRecords = operator.handleMyTeam({
            prepareRecordsOnly: true,
            myTeams: (myTeams as unknown) as RawMyTeam[],
        });

        const systemRecords = operator.handleSystem({
            systems: [
                {
                    name: 'config',
                    value: JSON.stringify(config),
                },
                {
                    name: 'license',
                    value: JSON.stringify(license),
                },
                {
                    name: 'currentUserId',
                    value: currentUser.id,
                },
                {
                    name: 'url',
                    value: serverUrl,
                },
            ],
            prepareRecordsOnly: true,
        });

        const userRecords = operator.handleUsers({
            users: [currentUser],
            prepareRecordsOnly: true,
        });

        const preferenceRecords = operator.handlePreferences({
            prepareRecordsOnly: true,
            preferences: (preferences as unknown) as RawPreference[],
        });

        let roles: string[] = [];
        for (const role of currentUser.roles.split(' ')) {
            roles = roles.concat(role);
        }

        for (const teamMember of teamMembers) {
            roles = roles.concat(teamMember.roles.split(' '));
        }

        const rolesToLoad = new Set<string>(roles);

        let rolesRecords: Role[] = [];
        if (rolesToLoad.size > 0) {
            const rolesByName = ((await client.getRolesByNames(Array.from(rolesToLoad))) as unknown) as RawRole[];

            if (rolesByName?.length) {
                rolesRecords = await operator.handleRole({prepareRecordsOnly: true, roles: rolesByName}) as Role[];
            }
        }

        const models = await Promise.all([teamRecords, teamMembershipRecords, myTeamRecords, systemRecords, preferenceRecords, rolesRecords, userRecords]);

        const flattenedModels = models.flat();
        if (flattenedModels?.length > 0) {
            await operator.batchRecords(flattenedModels);
        }
    } catch (e) {
        return {error: e, currentUser: undefined};
    }

    return {currentUser, error: undefined};
};

export const completeLogin = async (serverUrl: string, user: RawUser) => {
    const database = DatabaseManager.serverDatabases[serverUrl].database;
    if (!database) {
        return {error: `${serverUrl} database not found`};
    }

    const {config, license}: { config: Partial<Config>; license: Partial<License>; } = await getCommonSystemValues(database);

    if (!Object.keys(config)?.length || !Object.keys(license)?.length) {
        return null;
    }

    // Set timezone
    if (isTimezoneEnabled(config)) {
        const timezone = getDeviceTimezone();
        await autoUpdateTimezone(serverUrl, {deviceTimezone: timezone, userId: user.id});
    }

    let dataRetentionPolicy: any;
    const operator = DatabaseManager.serverDatabases[serverUrl].operator;

    // Data retention
    if (config?.DataRetentionEnableMessageDeletion === 'true' && license?.IsLicensed === 'true' && license?.DataRetention === 'true') {
        dataRetentionPolicy = await getDataRetentionPolicy(serverUrl);
        await operator.handleSystem({systems: [{name: 'dataRetentionPolicy', value: dataRetentionPolicy}], prepareRecordsOnly: false});
    }

    return null;
};

export const updateMe = async (serverUrl: string, user: User) => {
    const database = DatabaseManager.serverDatabases[serverUrl].database;
    const operator = DatabaseManager.serverDatabases[serverUrl].operator;
    if (!database) {
        return {error: `${serverUrl} database not found`};
    }

    let client;
    try {
        client = NetworkManager.getClient(serverUrl);
    } catch (error) {
        return {error};
    }

    let data;
    try {
        data = ((await client.patchMe(user._raw)) as unknown) as RawUser;
    } catch (e) {
        logError(e);
        return {error: e};
    }

    const systemRecords = operator.handleSystem({
        systems: [
            {name: 'currentUserId', value: data.id},
            {name: 'locale', value: data?.locale},
        ],
        prepareRecordsOnly: true,
    });

    const userRecord = operator.handleUsers({prepareRecordsOnly: true, users: [data]});

    //todo: ?? Do we need to write to TOS table ? See app/mm-redux/reducers/entities/users.ts/profiles/line 152 const
    // tosRecords = await DataOperator.handleIsolatedEntity({ tableName: TERMS_OF_SERVICE, values: [{}], });
    const models = await Promise.all([
        systemRecords,
        userRecord,

    // ...tosRecords,
    ]);

    if (models?.length) {
        await operator.batchRecords(models.flat());
    }

    const updatedRoles: string[] = data.roles.split(' ');
    if (updatedRoles.length) {
        await loadRolesIfNeeded(serverUrl, updatedRoles);
    }

    return {data};
};
export const getSessions = async (serverUrl: string, currentUserId: string) => {
    let client;
    try {
        client = NetworkManager.getClient(serverUrl);
    } catch {
        return;
    }

    try {
        const sessions = await client.getSessions(currentUserId);
        await createSessions(serverUrl, sessions);
    } catch (e) {
        logError(e);
        await forceLogoutIfNecessary(serverUrl, e);
    }
};

type LoadedUser = {
    currentUser?: RawUser,
    error?: Client4Error
}

export const ssoLogin = async (serverUrl: string, bearerToken: string, csrfToken: string) => {
    let deviceToken;

    const database = DatabaseManager.appDatabase?.database;
    if (!database) {
        return {error: 'App database not found'};
    }

    let client;
    try {
        client = NetworkManager.getClient(serverUrl);
    } catch (error) {
        return {error};
    }

    client.setBearerToken(bearerToken);
    client.setCSRFToken(csrfToken);

    // Setting up active database for this SSO login flow
    try {
        await DatabaseManager.createServerDatabase({
            config: {
                dbName: serverUrl,
                serverUrl,
            },
        });
        await DatabaseManager.setActiveServerDatabase(serverUrl);
        deviceToken = await getDeviceToken(database);
    } catch (e) {
        return {error: e};
    }

    let result;

    try {
        result = await loadMe(serverUrl, {deviceToken}) as unknown as LoadedUser;
        if (!result?.error && result?.currentUser) {
            await completeLogin(serverUrl, result.currentUser);
        }
    } catch (e) {
        return {error: e};
    }

    return result;
};

export const sendPasswordResetEmail = async (serverUrl: string, email: string) => {
    let client;
    try {
        client = NetworkManager.getClient(serverUrl);
    } catch (error) {
        return {error};
    }

    let response;
    try {
        response = await client.sendPasswordResetEmail(email);
    } catch (e) {
        return {
            error: e,
        };
    }
    return {
        data: response.data,
        error: undefined,
    };
};