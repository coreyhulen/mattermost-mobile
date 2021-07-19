// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {createSelector} from 'reselect';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';
import {General} from '../../constants';
import {GlobalState} from '@mm-redux/types/store';
import {Config, FeatureFlags} from '@mm-redux/types/config';

export function getConfig(state: GlobalState): Partial<Config> {
    return state.entities.general.config;
}

/**
 * Safely get value of a specific or known FeatureFlag
 */
export function getFeatureFlagValue(state: GlobalState, key: keyof FeatureFlags): string | undefined {
    return getConfig(state)?.[`FeatureFlag${key}` as keyof Partial<Config>];
}

export function getLicense(state: GlobalState): any {
    return state.entities.general.license;
}

export function getSupportedTimezones(state: GlobalState): Array<string> {
    return state.entities.general.timezones;
}

export function getCurrentUrl(state: GlobalState): string {
    return state.entities.general.credentials.url;
}

export function isCompatibleWithJoinViewTeamPermissions(state: GlobalState): boolean {
    const version = state.entities.general.serverVersion;
    return isMinimumServerVersion(version, 5, 10, 0) ||
       (version.indexOf('dev') !== -1 && isMinimumServerVersion(version, 5, 8, 0)) ||
       (version.match(/^5.8.\d.\d\d\d\d.*$/) !== null && isMinimumServerVersion(version, 5, 8, 0));
}

export function hasNewPermissions(state: GlobalState): boolean {
    const version = state.entities.general.serverVersion;

    // FIXME This must be changed to 4, 9, 0 before we generate the 4.9.0 release
    return isMinimumServerVersion(version, 4, 9, 0) ||
           (version.indexOf('dev') !== -1 && isMinimumServerVersion(version, 4, 8, 0)) ||
           (version.match(/^4.8.\d.\d\d\d\d.*$/) !== null && isMinimumServerVersion(version, 4, 8, 0));
}

export const canUploadFilesOnMobile: (a: GlobalState) => boolean = createSelector(
    getConfig,
    getLicense,
    (config: Config, license: any): boolean => {
        // Defaults to true if either setting doesn't exist
        return config.EnableFileAttachments !== 'false' &&
           (license.IsLicensed === 'false' || license.Compliance === 'false' || config.EnableMobileFileUpload !== 'false');
    },
);

export const canDownloadFilesOnMobile: (a: GlobalState) => boolean = createSelector(
    getConfig,
    getLicense,
    (config: Config, license: any): boolean => {
        // Defaults to true if the setting doesn't exist
        return license.IsLicensed === 'false' || license.Compliance === 'false' || config.EnableMobileFileDownload !== 'false';
    },
);

export const getAutolinkedUrlSchemes: (a: GlobalState) => string[] = createSelector(
    getConfig,
    (config: Config): string[] => {
        if (!config.CustomUrlSchemes) {
            return General.DEFAULT_AUTOLINKED_URL_SCHEMES;
        }

        return [
            ...General.DEFAULT_AUTOLINKED_URL_SCHEMES,
            ...config.CustomUrlSchemes.split(','),
        ];
    },
);

export const getServerVersion = (state: GlobalState): string => {
    return state.entities.general.serverVersion;
};
