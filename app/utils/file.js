// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import mimeDB from 'mime-db';
import {Platform} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

import {DeviceTypes} from '@constants';

const EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
const CONTENT_DISPOSITION_REGEXP = /inline;filename=".*\.([a-z]+)";/i;
const DEFAULT_SERVER_MAX_FILE_SIZE = 50 * 1024 * 1024;// 50 Mb

export const GENERAL_SUPPORTED_DOCS_FORMAT = [
    'application/json',
    'application/msword',
    'application/pdf',
    'application/rtf',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/x-x509-ca-cert',
    'application/xml',
    'text/csv',
    'text/plain',
];

const SUPPORTED_DOCS_FORMAT = Platform.select({
    android: GENERAL_SUPPORTED_DOCS_FORMAT,
    ios: [
        ...GENERAL_SUPPORTED_DOCS_FORMAT,
        'application/vnd.apple.pages',
        'application/vnd.apple.numbers',
        'application/vnd.apple.keynote',
    ],
});

const SUPPORTED_VIDEO_FORMAT = Platform.select({
    ios: ['video/mp4', 'video/x-m4v', 'video/quicktime'],
    android: ['video/3gpp', 'video/x-matroska', 'video/mp4', 'video/webm'],
});

const types = {};
const extensions = {};

export function generateId() {
    // Implementation taken from http://stackoverflow.com/a/2117523
    let id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

    id = id.replace(/[xy]/g, (c) => {
        const r = Math.floor(Math.random() * 16);

        let v;
        if (c === 'x') {
            v = r;
        } else {
            v = (r & 0x3) | 0x8;
        }

        return v.toString(16);
    });

    return 'uid' + id;
}

const vectorIconsDir = 'vectorIcons';
const dirsToExclude = ['Cache.db', 'WebKit', 'WebView', vectorIconsDir];
async function getDirectorySize(fileStats) {
    if (fileStats?.length) {
        const total = await fileStats.reduce(async (previousPromise, stat) => {
            const value = await previousPromise;

            const exclude = dirsToExclude.find((f) => stat.path.includes(f));
            if (exclude) {
                return value;
            }

            if (stat.type === 'directory') {
                const stats = await RNFetchBlob.fs.lstat(stat.path);
                const dirSize = await getDirectorySize(stats, 0);
                return value + dirSize;
            }

            return value + parseInt(stat.size, 10);
        }, Promise.resolve(0));

        return total;
    }

    return 0;
}

export async function getFileCacheSize() {
    const cacheStats = await RNFetchBlob.fs.lstat(RNFetchBlob.fs.dirs.CacheDir);
    const size = await getDirectorySize(cacheStats);

    return size;
}

export async function deleteFileCache() {
    const cacheDir = RNFetchBlob.fs.dirs.CacheDir;
    const isCacheDir = await RNFetchBlob.fs.isDir(cacheDir);
    if (isCacheDir) {
        try {
            if (Platform.OS === 'ios') {
                await RNFetchBlob.fs.unlink(cacheDir);
                await RNFetchBlob.fs.mkdir(cacheDir);
            } else {
                const cacheStats = await RNFetchBlob.fs.lstat(RNFetchBlob.fs.dirs.CacheDir);
                if (cacheStats?.length) {
                    cacheStats.forEach((stat) => {
                        if (!stat.path.includes(vectorIconsDir)) {
                            RNFetchBlob.fs.unlink(stat.path);
                        }
                    });
                }
            }
        } catch (e) {
            // do nothing
        }
    }

    return true;
}

export function lookupMimeType(filename) {
    if (!Object.keys(extensions).length) {
        populateMaps();
    }

    const ext = filename.split('.').pop()?.toLowerCase();
    return types[ext] || 'application/octet-stream';
}

export function buildFileUploadData(file) {
    const re = /heic/i;
    const uri = file.uri;
    let name = file.fileName || file.name || file.path || file.uri;
    let mimeType = lookupMimeType(name.toLowerCase());
    let extension = name.split('.').pop().replace('.', '');

    if (re.test(extension)) {
        extension = 'JPG';
        name = name.replace(re, 'jpg');
        mimeType = 'image/jpeg';
    }

    return {
        uri,
        name,
        type: mimeType,
        extension,
    };
}

export const encodeHeaderURIStringToUTF8 = (string) => {
    return encodeURIComponent(string) + '"; filename*="utf-8\'\'' + encodeURIComponent(string);
};

export const getAllowedServerMaxFileSize = (config) => {
    return config && config.MaxFileSize ? parseInt(config.MaxFileSize, 10) : DEFAULT_SERVER_MAX_FILE_SIZE;
};

export const isGif = (file) => {
    let mime = file?.mime_type || file?.type || '';
    if (mime && mime.includes(';')) {
        mime = mime.split(';')[0];
    } else if (!mime && file?.name) {
        mime = lookupMimeType(file.name);
    }

    return mime === 'image/gif';
};

export const isImage = (file) => (file?.has_preview_image || isGif(file) || file?.type?.startsWith('image/'));

export const isDocument = (file) => {
    let mime = file?.mime_type || file?.type || '';
    if (mime && mime.includes(';')) {
        mime = mime.split(';')[0];
    } else if (!mime && file?.name) {
        mime = lookupMimeType(file.name);
    }

    return SUPPORTED_DOCS_FORMAT.includes(mime);
};

export const isVideo = (file) => {
    let mime = file?.mime_type || file?.type || '';
    if (mime && mime.includes(';')) {
        mime = mime.split(';')[0];
    } else if (!mime && file?.name) {
        mime = lookupMimeType(file.name);
    }

    return SUPPORTED_VIDEO_FORMAT.includes(mime);
};

/**
 * Get the default extension for a MIME type.
 *
 * @param {string} type
 * @return {string}
 */

export function getExtensionFromMime(type) {
    if (!Object.keys(extensions).length) {
        populateMaps();
    }

    if (!type || typeof type !== 'string') {
        return undefined;
    }

    // TODO: use media-typer
    const match = EXTRACT_TYPE_REGEXP.exec(type);

    // get extensions
    const exts = match && extensions[match[1].toLowerCase()];

    if (!exts || !exts.length) {
        return undefined;
    }

    return exts[0];
}

/**
 * Populate the extensions and types maps.
 * @private
 */

function populateMaps() {
    // source preference (least -> most)
    const preference = ['nginx', 'apache', undefined, 'iana'];

    Object.keys(mimeDB).forEach((type) => {
        const mime = mimeDB[type];
        const exts = mime.extensions;

        if (!exts || !exts.length) {
            return;
        }

        extensions[type] = exts;

        for (let i = 0; i < exts.length; i++) {
            const extension = exts[i];

            if (types[extension]) {
                const from = preference.indexOf(mimeDB[types[extension]].source);
                const to = preference.indexOf(mime.source);

                if (types[extension] !== 'application/octet-stream' &&
                    (from > to || (from === to && types[extension].substr(0, 12) === 'application/'))) {
                    continue;
                }
            }

            types[extension] = type;
        }
    });
}

export const hashCode = (str) => {
    let hash = 0;
    let i;
    let chr;
    if (!str || str.length === 0) {
        return hash;
    }

    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

export function getLocalFilePathFromFile(dir, file) {
    if (dir) {
        if (file?.name) {
            let extension = file.extension;
            let filename = file.name;

            if (!extension) {
                extension = getExtensionFromMime(file.mime_type);
            }

            if (extension && filename.includes(`.${extension}`)) {
                filename = filename.replace(`.${extension}`, '');
            } else {
                const fileParts = file.name.split('.');

                if (fileParts.length > 1) {
                    extension = fileParts.pop();
                    filename = fileParts.join('.');
                }
            }

            return `${dir}/${filename}-${hashCode(file.id)}.${extension}`;
        } else if (file?.id && file?.extension) {
            return `${dir}/${file.id}.${file.extension}`;
        }
    }

    return undefined;
}

export function getLocalPath(file) {
    if (file.localPath) {
        return file.localPath;
    } else if (isVideo(file)) {
        return getLocalFilePathFromFile(DeviceTypes.VIDEOS_PATH, file);
    } else if (isImage(file)) {
        return getLocalFilePathFromFile(DeviceTypes.IMAGES_PATH, file);
    }

    return getLocalFilePathFromFile(DeviceTypes.DOCUMENTS_PATH, file);
}

export function getExtensionFromContentDisposition(contentDisposition) {
    const match = CONTENT_DISPOSITION_REGEXP.exec(contentDisposition);
    let extension = match && match[1];
    if (extension) {
        if (!Object.keys(types).length) {
            populateMaps();
        }

        extension = extension.toLowerCase();
        if (types[extension]) {
            return extension;
        }

        return null;
    }

    return null;
}
