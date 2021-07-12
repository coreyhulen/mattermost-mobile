// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode} from 'react';
import {intlShape} from 'react-intl';
import {Alert, NativeModules, PermissionsAndroid} from 'react-native';
import LocalAuth from 'react-native-local-auth';
import RNFetchBlob from 'rn-fetch-blob';

import Loading from '@components/loading';
import {MAX_FILE_COUNT} from '@constants/post_draft';
import {getAppCredentials} from '@init/credentials';
import mattermostManaged from '@mattermost-managed';
import {getFormattedFileSize, lookupMimeType} from '@mm-redux/utils/file_utils';
import ShareError from '@share/components/error';
import {getExtensionFromMime} from '@utils/file';

import type {FileInfo} from '@mm-redux/types/files';
import type {Team} from '@mm-redux/types/teams';

const ShareExtension = NativeModules.MattermostShare;

export async function isAuthorized(intl: typeof intlShape): Promise<boolean> {
    try {
        const config = await mattermostManaged.getConfig();

        if (config) {
            const authNeeded = config.inAppPinCode && config.inAppPinCode === 'true';
            const vendor = config.vendor || 'Mattermost';
            if (authNeeded) {
                const isSecured = await mattermostManaged.isDeviceSecure();
                if (isSecured) {
                    try {
                        await LocalAuth.auth({
                            reason: intl.formatMessage({
                                id: 'mobile.managed.secured_by',
                                defaultMessage: 'Secured by {vendor}',
                            }, {vendor}),
                            fallbackToPasscode: true,
                            suppressEnterPassword: false,
                        });
                    } catch (err) {
                        ShareExtension.close(null);
                    }
                } else {
                    await showNotSecuredAlert(intl, vendor);

                    ShareExtension.close(null);
                }
            }
        }
    } catch {
        // do nothing
    }

    return getCredentials();
}

export async function getSharedItems(items: Array<ShareItem>, intl: typeof intlShape): Promise<ProcessedSharedItems> {
    const text = [];
    const files: Array<ShareFileInfo> = [];
    let totalSize = 0;
    let error;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.isString) {
            text.push(item.value);
        } else {
            let fileSize = {size: 0};
            const fullPath = item.value;
            try {
                fileSize = await RNFetchBlob.fs.stat(fullPath); // eslint-disable-line no-await-in-loop
            } catch (e) {
                error = intl.formatMessage({
                    id: 'mobile.extension.file_error',
                    defaultMessage: 'There was an error reading the file to be shared.\nPlease try again.',
                });
                break;
            }
            let filename = fullPath.replace(/^.*[\\/]/, '');
            let extension = filename.split('.').pop();
            if (extension === filename) {
                extension = getExtensionFromMime(item.type);
                filename = `${filename}.${extension}`;
            }

            totalSize += fileSize.size;
            files.push({
                extension,
                filename,
                fullPath,
                mimeType: item.type || lookupMimeType(filename.toLowerCase()),
                size: getFormattedFileSize(fileSize as FileInfo),
                type: item.type,
            });
        }
    }

    const value = text.join('\n');

    return {error, files, value, totalSize};
}

export async function permissionEnabled(): Promise<boolean> {
    const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    let granted;
    if (!hasPermission) {
        granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
    }

    return (hasPermission || granted === PermissionsAndroid.RESULTS.GRANTED);
}

export function getErrorElement(
    state: ShareState,
    canUploadFiles: boolean,
    maxFileSize: number,
    team: Team | undefined | null,
    intl: typeof intlShape,
): ReactNode | undefined {
    if (state.loading) {
        return <Loading/>;
    }

    if (!state.authorized) {
        return <ShareError/>;
    }

    if (!team?.id) {
        const teamRequired = intl.formatMessage({
            id: 'mobile.extension.team_required',
            defaultMessage: 'You must belong to a team before you can share files.',
        });

        return <ShareError message={teamRequired}/>;
    }

    if (!canUploadFiles) {
        const uploadsDisabled = intl.formatMessage({
            id: 'mobile.file_upload.disabled',
            defaultMessage: 'File uploads from mobile are disabled. Please contact your System Admin for more details.',
        });

        return <ShareError message={uploadsDisabled}/>;
    }

    if (state.hasPermission === false) {
        const storage = intl.formatMessage({
            id: 'mobile.extension.permission',
            defaultMessage: 'Mattermost needs access to the device storage to share files.',
        });

        return <ShareError message={storage}/>;
    }

    if (state.files.length > MAX_FILE_COUNT) {
        const fileCount = intl.formatMessage({
            id: 'mobile.extension.file_limit',
            defaultMessage: 'Sharing is limited to a maximum of 5 files.',
        });

        return <ShareError message={fileCount}/>;
    }

    if ((state.totalSize || 0) > maxFileSize) {
        const maxSize = intl.formatMessage({
            id: 'mobile.extension.max_file_size',
            defaultMessage: 'File attachments shared in Mattermost must be less than {size}.',
        }, {size: getFormattedFileSize({size: maxFileSize} as FileInfo)});

        return <ShareError message={maxSize}/>;
    }

    return undefined;
}

async function getCredentials(): Promise<boolean> {
    try {
        const credentials = await getAppCredentials();
        return Boolean(credentials);
    } catch (error) {
        return false;
    }

    return false;
}

function showNotSecuredAlert(intl: typeof intlShape, vendor: string): Promise<void> {
    const {formatMessage} = intl;

    return new Promise((resolve) => {
        Alert.alert(
            formatMessage({
                id: 'mobile.managed.blocked_by',
                defaultMessage: 'Blocked by {vendor}',
            }, {vendor}),
            formatMessage({
                id: 'mobile.managed.not_secured.android',
                defaultMessage: 'This device must be secured with a screen lock to use Mattermost.',
            }),
            [
                {
                    text: formatMessage({
                        id: 'mobile.managed.settings',
                        defaultMessage: 'Go to settings',
                    }),
                    onPress: () => {
                        mattermostManaged.goToSecuritySettings();
                    },
                },
                {
                    text: formatMessage({
                        id: 'mobile.managed.exit',
                        defaultMessage: 'Exit',
                    }),
                    onPress: () => resolve(),
                    style: 'cancel',
                },
            ],
            {onDismiss: resolve},
        );
    });
}
