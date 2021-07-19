// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {RNFetchBlobFetchRepsonse} from 'rn-fetch-blob';
import urlParse from 'url-parse';

import {Options} from '@mm-redux/types/client4';

import * as ClientConstants from './constants';
import ClientError from './error';

export default class ClientBase {
    clusterId = '';
    csrf = '';
    defaultHeaders: {[x: string]: string} = {};
    diagnosticId = '';
    enableLogging = false;
    includeCookies = true;
    logToConsole = false;
    managedConfig: any = null;
    serverVersion = '';
    token = '';
    translations = {
        connectionError: 'There appears to be a problem with your internet connection.',
        unknownError: 'We received an unexpected status code from the server.',
    };
    userAgent: string|null = null;
    url = '';
    urlVersion = '/api/v4';

    getAbsoluteUrl(baseUrl: string) {
        if (typeof baseUrl !== 'string' || !baseUrl.startsWith('/')) {
            return baseUrl;
        }
        return this.getUrl() + baseUrl;
    }

    getOptions(options: Options) {
        const newOptions: Options = {...options};

        const headers: {[x: string]: string} = {
            [ClientConstants.HEADER_REQUESTED_WITH]: 'XMLHttpRequest',
            ...this.defaultHeaders,
        };

        if (this.token) {
            headers[ClientConstants.HEADER_AUTH] = `${ClientConstants.HEADER_BEARER} ${this.token}`;
        }

        const csrfToken = this.csrf || '';
        if (options.method && options.method.toLowerCase() !== 'get' && csrfToken) {
            headers[ClientConstants.HEADER_X_CSRF_TOKEN] = csrfToken;
        }

        if (this.includeCookies) {
            newOptions.credentials = 'include';
        }

        if (this.userAgent) {
            headers[ClientConstants.HEADER_USER_AGENT] = this.userAgent;
        }

        if (newOptions.headers) {
            Object.assign(headers, newOptions.headers);
        }

        return {
            ...newOptions,
            headers,
        };
    }

    getServerVersion() {
        return this.serverVersion;
    }

    getToken() {
        return this.token;
    }

    getUrl() {
        return this.url;
    }

    getUrlVersion() {
        return this.urlVersion;
    }

    getWebSocketUrl = () => {
        return `${this.getBaseRoute()}/websocket`;
    }

    setAcceptLanguage(locale: string) {
        this.defaultHeaders['Accept-Language'] = locale;
    }

    setCSRF(csrfToken: string) {
        this.csrf = csrfToken;
    }

    setDiagnosticId(diagnosticId: string) {
        this.diagnosticId = diagnosticId;
    }

    setEnableLogging(enable: boolean) {
        this.enableLogging = enable;
    }

    setIncludeCookies(include: boolean) {
        this.includeCookies = include;
    }

    setManagedConfig(config: any) {
        this.managedConfig = config;
    }

    setUserAgent(userAgent: string) {
        this.userAgent = userAgent;
    }

    setToken(token: string) {
        this.token = token;
    }

    setUrl(url: string) {
        this.url = url.replace(/\/+$/, '');
    }

    // Routes
    getBaseRoute() {
        return `${this.url}${this.urlVersion}`;
    }

    getUsersRoute() {
        return `${this.getBaseRoute()}/users`;
    }

    getUserRoute(userId: string) {
        return `${this.getUsersRoute()}/${userId}`;
    }

    getTeamsRoute() {
        return `${this.getBaseRoute()}/teams`;
    }

    getTeamRoute(teamId: string) {
        return `${this.getTeamsRoute()}/${teamId}`;
    }

    getTeamNameRoute(teamName: string) {
        return `${this.getTeamsRoute()}/name/${teamName}`;
    }

    getTeamMembersRoute(teamId: string) {
        return `${this.getTeamRoute(teamId)}/members`;
    }

    getTeamMemberRoute(teamId: string, userId: string) {
        return `${this.getTeamMembersRoute(teamId)}/${userId}`;
    }

    getChannelsRoute() {
        return `${this.getBaseRoute()}/channels`;
    }

    getChannelRoute(channelId: string) {
        return `${this.getChannelsRoute()}/${channelId}`;
    }

    getChannelMembersRoute(channelId: string) {
        return `${this.getChannelRoute(channelId)}/members`;
    }

    getChannelMemberRoute(channelId: string, userId: string) {
        return `${this.getChannelMembersRoute(channelId)}/${userId}`;
    }

    getPostsRoute() {
        return `${this.getBaseRoute()}/posts`;
    }

    getPostRoute(postId: string) {
        return `${this.getPostsRoute()}/${postId}`;
    }

    getSharedChannelsRoute() {
        return `${this.getBaseRoute()}/sharedchannels`;
    }

    getReactionsRoute() {
        return `${this.getBaseRoute()}/reactions`;
    }

    getCommandsRoute() {
        return `${this.getBaseRoute()}/commands`;
    }

    getFilesRoute() {
        return `${this.getBaseRoute()}/files`;
    }

    getFileRoute(fileId: string) {
        return `${this.getFilesRoute()}/${fileId}`;
    }

    getPreferencesRoute(userId: string) {
        return `${this.getUserRoute(userId)}/preferences`;
    }

    getIncomingHooksRoute() {
        return `${this.getBaseRoute()}/hooks/incoming`;
    }

    getIncomingHookRoute(hookId: string) {
        return `${this.getBaseRoute()}/hooks/incoming/${hookId}`;
    }

    getOutgoingHooksRoute() {
        return `${this.getBaseRoute()}/hooks/outgoing`;
    }

    getOutgoingHookRoute(hookId: string) {
        return `${this.getBaseRoute()}/hooks/outgoing/${hookId}`;
    }

    getOAuthRoute() {
        return `${this.url}/oauth`;
    }

    getOAuthAppsRoute() {
        return `${this.getBaseRoute()}/oauth/apps`;
    }

    getOAuthAppRoute(appId: string) {
        return `${this.getOAuthAppsRoute()}/${appId}`;
    }

    getEmojisRoute() {
        return `${this.getBaseRoute()}/emoji`;
    }

    getEmojiRoute(emojiId: string) {
        return `${this.getEmojisRoute()}/${emojiId}`;
    }

    getBrandRoute() {
        return `${this.getBaseRoute()}/brand`;
    }

    getBrandImageUrl(timestamp: string) {
        return `${this.getBrandRoute()}/image?t=${timestamp}`;
    }

    getDataRetentionRoute() {
        return `${this.getBaseRoute()}/data_retention`;
    }

    getRolesRoute() {
        return `${this.getBaseRoute()}/roles`;
    }

    getTimezonesRoute() {
        return `${this.getBaseRoute()}/system/timezones`;
    }

    getRedirectLocationRoute() {
        return `${this.getBaseRoute()}/redirect_location`;
    }

    getBotsRoute() {
        return `${this.getBaseRoute()}/bots`;
    }

    getBotRoute(botUserId: string) {
        return `${this.getBotsRoute()}/${botUserId}`;
    }

    getUserThreadsRoute(userID: string, teamID: string): string {
        return `${this.getUserRoute(userID)}/teams/${teamID}/threads`;
    }

    getUserThreadRoute(userId: string, teamId: string, threadId: string): string {
        return `${this.getUserThreadsRoute(userId, teamId)}/${threadId}`;
    }

    getAppsProxyRoute() {
        return `${this.url}/plugins/com.mattermost.apps`;
    }

    // Client Helpers
    handleRedirectProtocol = (url: string, response: RNFetchBlobFetchRepsonse) => {
        const serverUrl = this.getUrl();
        const parsed = urlParse(url);
        const {redirects} = response.rnfbRespInfo;
        if (redirects) {
            const redirectUrl = urlParse(redirects[redirects.length - 1]);

            if (serverUrl === parsed.origin && parsed.host === redirectUrl.host && parsed.protocol !== redirectUrl.protocol) {
                this.setUrl(serverUrl.replace(parsed.protocol, redirectUrl.protocol));
            }
        }
    };

    doFetch = async (url: string, options: Options) => {
        const {data} = await this.doFetchWithResponse(url, options);

        return data;
    };

    doFetchWithResponse = async (url: string, options: Options) => {
        const response = await fetch(url, this.getOptions(options));
        const headers = parseAndMergeNestedHeaders(response.headers);

        let data;
        try {
            data = await response.json();
        } catch (err) {
            throw new ClientError(this.getUrl(), {
                message: 'Received invalid response from the server.',
                intl: {
                    id: 'mobile.request.invalid_response',
                    defaultMessage: 'Received invalid response from the server.',
                },
                url,
            });
        }

        if (headers.has(ClientConstants.HEADER_X_VERSION_ID) && !headers.get('Cache-Control')) {
            const serverVersion = headers.get(ClientConstants.HEADER_X_VERSION_ID);
            if (serverVersion && this.serverVersion !== serverVersion) {
                this.serverVersion = serverVersion;
            }
        }

        if (headers.has(ClientConstants.HEADER_X_CLUSTER_ID)) {
            const clusterId = headers.get(ClientConstants.HEADER_X_CLUSTER_ID);
            if (clusterId && this.clusterId !== clusterId) {
                this.clusterId = clusterId;
            }
        }

        if (response.ok) {
            return {
                response,
                headers,
                data,
            };
        }

        const msg = data.message || '';

        if (this.logToConsole) {
            console.error(msg); // eslint-disable-line no-console
        }

        throw new ClientError(this.getUrl(), {
            message: msg,
            server_error_id: data.id,
            status_code: data.status_code,
            url,
        });
    };
}

function parseAndMergeNestedHeaders(originalHeaders: any) {
    const headers = new Map();
    let nestedHeaders = new Map();
    originalHeaders.forEach((val: string, key: string) => {
        const capitalizedKey = key.replace(/\b[a-z]/g, (l) => l.toUpperCase());
        let realVal = val;
        if (val && val.match(/\n\S+:\s\S+/)) {
            const nestedHeaderStrings = val.split('\n');
            realVal = nestedHeaderStrings.shift() as string;
            const moreNestedHeaders = new Map(
                nestedHeaderStrings.map((h: any) => h.split(/:\s/)),
            );
            nestedHeaders = new Map([...nestedHeaders, ...moreNestedHeaders]);
        }
        headers.set(capitalizedKey, realVal);
    });
    return new Map([...headers, ...nestedHeaders]);
}
