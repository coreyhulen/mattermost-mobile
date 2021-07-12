// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import path from 'path';

import merge from 'deepmerge';
import jestExpect from 'expect';

import testConfig from '@support/test_config';

import client from './client';
import {apiUploadFile, getResponseFromError} from './common';
import defaultServerConfig from './default_config.json';

// ****************************************************************
// System
// See https://api.mattermost.com/#tag/system
//
// Exported API function should have the following:
// - documented using JSDoc
// - meaningful description
// - match the referenced API endpoints
// - parameter/s defined by `@param`
// - return value defined by `@return`
// ****************************************************************

/* eslint-disable no-console */

/**
 * Check system health.
 */
export const apiCheckSystemHealth = async () => {
    const {data} = await apiPingServerStatus();
    jestExpect(data.status).toEqual('OK');
    jestExpect(data.database_status).toEqual('OK');
    jestExpect(data.filestore_status).toEqual('OK');
};

/**
 * Send a test email.
 * See https://api.mattermost.com/#operation/TestEmail
 * @return {Object} returns response on success or {error, status} on error
 */
export const apiEmailTest = async () => {
    try {
        return await client.post('/api/v4/email/test');
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Get client license.
 * See https://api.mattermost.com/#operation/GetClientLicense
 * @return {Object} returns {license} on success or {error, status} on error
 */
export const apiGetClientLicense = async () => {
    try {
        const response = await client.get('/api/v4/license/client?format=old');

        return {license: response.data};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Get configuration.
 * See https://api.mattermost.com/#operation/GetConfig
 * @return {Object} returns {config} on success or {error, status} on error
 */
export const apiGetConfig = async () => {
    try {
        const response = await client.get('/api/v4/config');

        return {config: response.data};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Ping server status.
 * See https://api.mattermost.com/#operation/GetPing
 * @return {Object} returns {data} on success or {error, status} on error
 */
export const apiPingServerStatus = async () => {
    try {
        const response = await client.get('/api/v4/system/ping?get_server_status=true');
        return {data: response.data};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Require server license to successfully continue.
 * @return {Object} returns {license} on success or fail when no license
 */
export const apiRequireLicense = async () => {
    const {license} = await getClientLicense();

    if (license.IsLicensed !== 'true') {
        console.error('Server has no Enterprise license.');
    }
    jestExpect(license.IsLicensed).toEqual('true');

    return {license};
};

/**
 * Require server license with specific feature to successfully continue.
 * @param {string} key - feature, e.g. LDAP
 * @return {Object} returns {license} on success or fail when no license or no license to specific feature.
 */
export const apiRequireLicenseForFeature = async (key = '') => {
    const {license} = await getClientLicense();

    if (license.IsLicensed !== 'true') {
        console.error('Server has no Enterprise license.');
    }
    jestExpect(license.IsLicensed).toEqual('true');

    let hasLicenseKey = false;
    for (const [k, v] of Object.entries(license)) {
        if (k === key && v === 'true') {
            hasLicenseKey = true;
            break;
        }
    }

    if (!hasLicenseKey) {
        console.error(`Server has no license for "${key}" feature.`);
    }
    jestExpect(hasLicenseKey).toEqual(true);

    return {license};
};

/**
 * Require SMTP server to be running.
 */
export const apiRequireSMTPServer = async () => {
    const {status} = await apiEmailTest();
    jestExpect(status).toEqual(200);
};

/**
 * Update configuration.
 * See https://api.mattermost.com/#operation/UpdateConfig
 * @param {Object} newConfig - specific config to update
 * @return {Object} returns {config} on success or {error, status} on error
 */
export const apiUpdateConfig = async (newConfig = {}) => {
    try {
        const {config: currentConfig} = await apiGetConfig();
        const config = merge.all([currentConfig, getDefaultConfig(), newConfig]);

        const response = await client.put(
            '/api/v4/config',
            config,
        );

        return {config: response.data};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Upload server license with file expected at "/detox/e2e/support/fixtures/mattermost-license.txt"
 * See https://api.mattermost.com/#operation/UploadLicenseFile
 * @return {Object} returns response on success or {error, status} on error
 */
export const apiUploadLicense = async () => {
    const absFilePath = path.resolve(__dirname, '../../support/fixtures/mattermost-license.txt');
    return apiUploadFile('license', absFilePath, {url: '/api/v4/license', method: 'POST'});
};

/**
 * Get client license.
 * If no license, try to upload if license file is available at "/support/fixtures/mattermost-license.txt".
 * @return {Object} returns {license} on success or upload when no license or get updated license.
 */
async function getClientLicense() {
    const {license} = await apiGetClientLicense();
    if (license.IsLicensed === 'true') {
        return {license};
    }

    // Upload a license if server is currently not loaded with license
    const response = await apiUploadLicense();
    if (response.error) {
        console.warn(response.error.message);
        return {license};
    }

    // Get an updated client license
    const out = await apiGetClientLicense();
    return {license: out.license};
}

function getDefaultConfig() {
    const fromEnv = {
        LdapSettings: {
            LdapServer: testConfig.ldapServer,
            LdapPort: testConfig.ldapPort,
        },
        ServiceSettings: {SiteURL: testConfig.siteUrl},
    };

    return merge(defaultServerConfig, fromEnv);
}

export const System = {
    apiCheckSystemHealth,
    apiEmailTest,
    apiGetClientLicense,
    apiGetConfig,
    apiPingServerStatus,
    apiRequireLicense,
    apiRequireLicenseForFeature,
    apiRequireSMTPServer,
    apiUpdateConfig,
    apiUploadLicense,
};

export default System;
