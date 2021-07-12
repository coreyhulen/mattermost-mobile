// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNFetchBlob from 'rn-fetch-blob';
import urlParse from 'url-parse';

import LocalConfig from '@assets/config';
import {Client4} from '@client/rest';
import {HEADER_TOKEN, HEADER_X_CLUSTER_ID, HEADER_X_VERSION_ID} from '@client/rest/constants';
import ClientError from '@client/rest/error';
import mattermostManaged from '@mattermost-managed';
import {General} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {t} from '@utils/i18n';

import mattermostBucket from 'app/mattermost_bucket';

/* eslint-disable no-throw-literal */

const DEFAULT_TIMEOUT = 10000;

let managedConfig;

mattermostManaged.addEventListener('managedConfigDidChange', (config) => {
    if (config?.timeout !== managedConfig?.timeout) {
        initFetchConfig();
        return;
    }
    managedConfig = config;
});

const handleRedirectProtocol = (url, response) => {
    const serverUrl = Client4.getUrl();
    const parsed = urlParse(url);
    const {redirects} = response.rnfbRespInfo;
    if (redirects) {
        const redirectUrl = urlParse(redirects[redirects.length - 1]);

        if (serverUrl === parsed.origin && parsed.host === redirectUrl.host && parsed.protocol !== redirectUrl.protocol) {
            Client4.setUrl(serverUrl.replace(parsed.protocol, redirectUrl.protocol));
        }
    }
};

Client4.doFetchWithResponse = async (url, options) => {
    // eslint-disable-next-line no-console
    console.log('Request endpoint', url);
    const customHeaders = LocalConfig.CustomRequestHeaders;
    let waitsForConnectivity = false;
    let timeoutIntervalForResource = 30;

    if (managedConfig?.useVPN === 'true') {
        waitsForConnectivity = true;
    }

    if (managedConfig?.timeoutVPN) {
        timeoutIntervalForResource = parseInt(managedConfig.timeoutVPN, 10);
    }

    let requestOptions = {
        ...Client4.getOptions(options),
        waitsForConnectivity,
        timeoutIntervalForResource,
    };

    if (customHeaders && Object.keys(customHeaders).length > 0) {
        requestOptions = {
            ...requestOptions,
            headers: {
                ...requestOptions.headers,
                ...LocalConfig.CustomRequestHeaders,
            },
        };
    }

    let response;
    let headers;

    let data;
    try {
        response = await fetch(url, requestOptions);
        headers = response.headers;
        if (!url.startsWith('https') && response.rnfbRespInfo && response.rnfbRespInfo.redirects && response.rnfbRespInfo.redirects.length > 1) {
            handleRedirectProtocol(url, response);
        }

        data = await response.json();
    } catch (err) {
        if (response && response.resp && response.resp.data && response.resp.data.includes('SSL certificate')) {
            throw new ClientError(Client4.getUrl(), {
                message: 'You need to use a valid client certificate in order to connect to this Mattermost server',
                status_code: 401,
                url,
                details: err,
            });
        }

        throw new ClientError(Client4.getUrl(), {
            message: 'Received invalid response from the server.',
            intl: {
                id: t('mobile.request.invalid_response'),
                defaultMessage: 'Received invalid response from the server.',
            },
            url,
            details: err,
        });
    }

    const clusterId = headers[HEADER_X_CLUSTER_ID] || headers[HEADER_X_CLUSTER_ID.toLowerCase()];
    if (clusterId && Client4.clusterId !== clusterId) {
        Client4.clusterId = clusterId; /* eslint-disable-line require-atomic-updates */
    }

    const token = headers[HEADER_TOKEN] || headers[HEADER_TOKEN.toLowerCase()];
    if (token) {
        Client4.setToken(token);
    }

    const serverVersion = headers[HEADER_X_VERSION_ID] || headers[HEADER_X_VERSION_ID.toLowerCase()];
    if (serverVersion && !headers['Cache-Control'] && Client4.serverVersion !== serverVersion) {
        Client4.serverVersion = serverVersion; /* eslint-disable-line require-atomic-updates */
        EventEmitter.emit(General.SERVER_VERSION_CHANGED, serverVersion);
    }

    if (response.ok) {
        const headersMap = new Map();
        Object.keys(headers).forEach((key) => {
            headersMap.set(key, headers[key]);
        });

        return {
            response,
            headers: headersMap,
            data,
        };
    }

    const msg = data.message || '';

    if (Client4.logToConsole) {
        console.error(msg); // eslint-disable-line no-console
    }

    throw new ClientError(Client4.getUrl(), {
        message: msg,
        server_error_id: data.id,
        status_code: data.status_code,
        url,
    });
};

const initFetchConfig = async () => {
    const fetchConfig = {
        auto: true,
        timeout: DEFAULT_TIMEOUT, // Set the base timeout for every request to 5s
    };

    try {
        managedConfig = await mattermostManaged.getConfig();

        if (managedConfig?.timeout) {
            const timeout = parseInt(managedConfig.timeout, 10);
            fetchConfig.timeout = timeout || DEFAULT_TIMEOUT;
        }
    } catch {
        // no managed config
    }

    const userAgent = await DeviceInfo.getUserAgent();
    Client4.setUserAgent(userAgent);

    if (Platform.OS === 'ios') {
        fetchConfig.certificate = await mattermostBucket.getPreference('cert');
    }

    window.fetch = new RNFetchBlob.polyfill.Fetch(fetchConfig).build();

    return true;
};

initFetchConfig();

export default initFetchConfig;
