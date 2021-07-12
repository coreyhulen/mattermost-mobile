// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Platform} from 'react-native';

import Config from '@assets/config';
import {Client4} from '@client/rest';
import {getCurrentChannel, getMyCurrentChannelMembership} from '@mm-redux/selectors/entities/channels';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getCurrentTeam, getCurrentTeamMembership} from '@mm-redux/selectors/entities/teams';
import {getCurrentUser} from '@mm-redux/selectors/entities/users';

export const LOGGER_EXTENSION = 'extension';
export const LOGGER_JAVASCRIPT = 'javascript';
export const LOGGER_JAVASCRIPT_WARNING = 'javascript_warning';
export const LOGGER_NATIVE = 'native';
export const LOGGER_REDUX = 'redux';

export const BREADCRUMB_UNCAUGHT_APP_ERROR = 'uncaught-app-error';
export const BREADCRUMB_UNCAUGHT_NON_ERROR = 'uncaught-non-error';

let Sentry;
export function initializeSentry() {
    if (!Config.SentryEnabled) {
        return;
    }

    if (!Sentry) {
        Sentry = require('@sentry/react-native');
    }

    const dsn = getDsn();

    if (!dsn) {
        console.warn('Sentry is enabled, but not configured on this platform'); // eslint-disable-line no-console
        return;
    }

    Sentry.init({dsn, ...Config.SentryOptions});
}

function getDsn() {
    if (Platform.OS === 'android') {
        return Config.SentryDsnAndroid;
    } else if (Platform.OS === 'ios') {
        return Config.SentryDsnIos;
    }

    return '';
}

export function captureJSException(error, isFatal, store) {
    if (!error || !store) {
        console.warn('captureJSException called with missing arguments', error, store); // eslint-disable-line no-console
        return;
    }

    if (error instanceof Error) {
        captureException(error, LOGGER_JAVASCRIPT, store);
    } else {
        captureNonErrorAsBreadcrumb(error, isFatal);
    }
}

export function captureException(error, logger, store) {
    if (!error || !logger || !store) {
        console.warn('captureException called with missing arguments', error, logger, store); // eslint-disable-line no-console
        return;
    }

    capture(() => {
        Sentry.captureException(error, {logger});
    }, store);
}

export function captureExceptionWithoutState(err, logger) {
    if (!Config.SentryEnabled) {
        return;
    }

    if (err && logger) {
        try {
            Sentry.captureException(err, {logger});
        } catch (error) {
            // do nothing...
        }
    }
}

export function captureMessage(message, logger, store) {
    if (message && logger && store) {
        capture(() => {
            Sentry.captureMessage(message, {logger});
        }, store);
    }
}

export function captureNonErrorAsBreadcrumb(obj, isFatal) {
    if (!obj || typeof obj !== 'object') {
        console.warning('Invalid object passed to captureNonErrorAsBreadcrumb', obj); // eslint-disable-line no-console
        return;
    }

    const isAppError = Boolean(obj.server_error_id);

    const breadcrumb = {
        category: isAppError ? BREADCRUMB_UNCAUGHT_APP_ERROR : BREADCRUMB_UNCAUGHT_NON_ERROR,
        data: {
            isFatal: String(isFatal),
        },
        level: 'warn',
    };

    if (obj.message) {
        breadcrumb.message = obj.message;
    } else if (obj.intl && obj.intl.defaultMessage) {
        breadcrumb.message = obj.intl.defaultMessage;
    } else {
        breadcrumb.message = 'no message provided';
    }

    if (obj.server_error_id) {
        breadcrumb.data.server_error_id = obj.server_error_id;
    }

    if (obj.status_code) {
        breadcrumb.data.status_code = obj.status_code;
    }

    if (obj.url) {
        const match = (/^(?:https?:\/\/)[^/]+(\/.*)$/);

        if (match && match.length >= 2) {
            breadcrumb.data.url = match[1];
        }
    }

    try {
        Sentry.addBreadcrumb(breadcrumb);
    } catch (e) {
        // Do nothing since this is only here to make sure we don't crash when handling an exception
        console.warn('Failed to capture breadcrumb of non-error', e); // eslint-disable-line no-console
    }
}

// Wrapper function to any calls to Sentry so that we can gather any necessary extra data
// before sending.
function capture(captureFunc, store) {
    if (!Config.SentryEnabled) {
        return;
    }

    try {
        const state = store.getState();
        const config = getConfig(state);

        // Don't contact Sentry if we're connected to a server with diagnostics disabled. Note that this will
        // still log if we're not connected to any server.
        if (config && config.EnableDiagnostics != null && config.EnableDiagnostics !== 'true') {
            return;
        }

        let hasUserContext = false;
        const userContext = getUserContext(state);
        if (Object.keys(userContext).length) {
            hasUserContext = true;
            Sentry.setUserContext(userContext);
        }

        const extraContext = getExtraContext(state);
        if (Object.keys(extraContext).length) {
            Sentry.setExtraContext(extraContext);
        }

        const buildTags = getBuildTags(state);
        if (Object.keys(buildTags).length) {
            Sentry.setTagsContext(buildTags);
        }

        if (hasUserContext) {
            console.warn('Capturing with Sentry at ' + getDsn() + '...'); // eslint-disable-line no-console

            captureFunc();
        } else {
            console.warn('No user context, skipping capture'); // eslint-disable-line no-console
        }
    } catch (e) {
        // Don't want this to get into an infinite loop again...
        console.warn('Exception occured while sending to Sentry'); // eslint-disable-line no-console
        console.warn(e); // eslint-disable-line no-console
    }
}

function getUserContext(state) {
    const currentUser = getCurrentUser(state);

    if (!currentUser) {
        return {};
    }

    return {
        userID: currentUser.id, // This can be changed to id after we upgrade to Sentry >= 0.14.10,
        email: '',
        username: '',
        extra: {
            locale: currentUser.locale,
            roles: currentUser.roles,
        },
    };
}

function getExtraContext(state) {
    const context = {};

    const currentTeam = getCurrentTeam(state);
    if (currentTeam) {
        context.currentTeam = {
            id: currentTeam.id,
        };
    }

    const currentTeamMember = getCurrentTeamMembership(state);
    if (currentTeamMember) {
        context.currentTeamMember = {
            roles: currentTeamMember.roles,
        };
    }

    const currentChannel = getCurrentChannel(state);
    if (currentChannel) {
        context.currentChannel = {
            id: currentChannel.id,
            type: currentChannel.type,
        };
    }

    const currentChannelMember = getMyCurrentChannelMembership(state);
    if (currentChannelMember) {
        context.currentChannelMember = {
            roles: currentChannelMember.roles,
        };
    }

    const config = getConfig(state);
    if (config) {
        context.config = {
            BuildDate: config.BuildDate,
            BuildEnterpriseReady: config.BuildEnterpriseReady,
            BuildHash: config.BuildHash,
            BuildHashEnterprise: config.BuildHashEnterprise,
            BuildNumber: config.BuildNumber,
        };
    }

    return context;
}

function getBuildTags(state) {
    const tags = {};

    const config = getConfig(state);
    if (config) {
        tags.serverBuildHash = config.BuildHash;
        tags.serverBuildNumber = config.BuildNumber;
    }

    return tags;
}

// Given a URL from an API request, return a URL that has any parts removed that are either sensitive or that would
// prevent properly grouping the messages in Sentry.
export function cleanUrlForLogging(original) {
    let url = original;

    // Trim the host name
    url = url.substring(Client4.getUrl().length);

    // Filter the query string
    const index = url.indexOf('?');
    if (index !== -1) {
        url = url.substring(0, index);
    }

    // A non-exhaustive whitelist to exclude parts of the URL that are unimportant (eg IDs) or may be sentsitive
    // (eg email addresses). We prefer filtering out fields that aren't recognized because there should generally
    // be enough left over for debugging.
    //
    // Note that new API routes don't need to be added here since this shouldn't be happening for newly added routes.
    const whitelist = [
        'api', 'v4', 'users', 'teams', 'scheme', 'name', 'members', 'channels', 'posts', 'reactions', 'commands',
        'files', 'preferences', 'hooks', 'incoming', 'outgoing', 'oauth', 'apps', 'emoji', 'brand', 'image',
        'data_retention', 'jobs', 'plugins', 'roles', 'system', 'timezones', 'schemes', 'redirect_location', 'patch',
        'mfa', 'password', 'reset', 'send', 'active', 'verify', 'terms_of_service', 'login', 'logout', 'ids',
        'usernames', 'me', 'username', 'email', 'default', 'sessions', 'revoke', 'all', 'device', 'status',
        'search', 'switch', 'authorized', 'authorize', 'deauthorize', 'tokens', 'disable', 'enable', 'exists', 'unread',
        'invite', 'batch', 'stats', 'import', 'schemeRoles', 'direct', 'group', 'convert', 'view', 'search_autocomplete',
        'thread', 'info', 'flagged', 'pinned', 'pin', 'unpin', 'opengraph', 'actions', 'thumbnail', 'preview', 'link',
        'delete', 'logs', 'ping', 'config', 'client', 'license', 'websocket', 'webrtc', 'token', 'regen_token',
        'autocomplete', 'execute', 'regen_secret', 'policy', 'type', 'cancel', 'reload', 'environment', 's3_test', 'file',
        'caches', 'invalidate', 'database', 'recycle', 'compliance', 'reports', 'cluster', 'ldap', 'test', 'sync', 'saml',
        'certificate', 'public', 'private', 'idp', 'elasticsearch', 'purge_indexes', 'analytics', 'old', 'webapp', 'fake',
    ];

    url = url.split('/').map((part) => {
        if (part !== '' && whitelist.indexOf(part) === -1) {
            return '<filtered>';
        }

        return part;
    }).join('/');

    if (index !== -1) {
        // Add this on afterwards since it wouldn't pass the whitelist
        url += '?<filtered>';
    }

    return url;
}
