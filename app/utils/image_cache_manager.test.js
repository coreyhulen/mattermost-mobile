// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-import-assign */

import RNFetchBlob from 'rn-fetch-blob';

import * as fileUtils from '@utils/file';
import {emptyFunction} from '@utils/general';
import ImageCacheManager, {getCacheFile} from '@utils/image_cache_manager';

import mattermostBucket from 'app/mattermost_bucket';

fileUtils.getExtensionFromMime = jest.fn();

describe('getCacheFile', () => {
    it('should return a path with correct extension for a non-cached file using file name', async () => {
        RNFetchBlob.fs.exists.mockReturnValue(false);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValue(null);

        const extensions = ['.pdf', '.png', '.bmp', '.jpg', '.jpeg'];
        const fileUri = 'https://file-uri';
        for (const ext of extensions) {
            const fileName = `file${ext}`;
            const {exists, path} = await getCacheFile(fileName, fileUri); // eslint-disable-line no-await-in-loop

            expect(exists).toEqual(false);
            expect(path.endsWith(ext)).toEqual(true);
        }
    });

    it('should return a path with correct extension for a non-cached file using file uri', async () => {
        RNFetchBlob.fs.exists.mockReturnValue(false);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValue(null);

        const extensions = ['.pdf', '.png', '.bmp', '.jpg', '.jpeg'];
        const fileName = '';
        for (const ext of extensions) {
            const fileUri = `https://file-uri/file${ext}`;
            const {exists, path} = await getCacheFile(fileName, fileUri); // eslint-disable-line no-await-in-loop

            expect(exists).toEqual(false);
            expect(path.endsWith(ext)).toEqual(true);
        }
    });

    it('should return a path with correct extension for a cached file using file name', async () => {
        RNFetchBlob.fs.exists.mockReturnValue(true);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValue(null);

        const extensions = ['.pdf', '.png', '.bmp', '.jpg', '.jpeg'];
        const fileUri = 'https://file-uri';
        for (const ext of extensions) {
            const fileName = `file${ext}`;
            const {exists, path} = await getCacheFile(fileName, fileUri); // eslint-disable-line no-await-in-loop

            expect(exists).toEqual(true);
            expect(path.endsWith(ext)).toEqual(true);
        }
    });

    it('should return a path with correct extension for a cached file using file uri', async () => {
        RNFetchBlob.fs.exists.mockReturnValue(true);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValue(null);

        const extensions = ['.pdf', '.png', '.bmp', '.jpg', '.jpeg'];
        const fileName = '';
        for (const ext of extensions) {
            const fileUri = `https://file-uri/file${ext}`;
            const {exists, path} = await getCacheFile(fileName, fileUri); // eslint-disable-line no-await-in-loop

            expect(exists).toEqual(true);
            expect(path.endsWith(ext)).toEqual(true);
        }
    });

    it('should return a path with default extension for a file and uri without an extension', async () => {
        RNFetchBlob.fs.exists.mockReturnValue(false);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValue(null);

        const defaultExt = 'png';
        fileUtils.getExtensionFromMime.mockReturnValue(defaultExt);

        const fileNames = ['', 'file'];
        const fileUris = ['', 'https://file-uri/file'];
        for (const fileName of fileNames) {
            for (const fileUri of fileUris) {
                const {exists, path} = await getCacheFile(fileName, fileUri); // eslint-disable-line no-await-in-loop

                expect(exists).toEqual(false);
                expect(path.endsWith(`.${defaultExt}`)).toEqual(true);
            }
        }
    });

    it('should return a path with a different extension for a file cached with the different extension', async () => {
        const pathWithDiffExt = '/path/to/file.jpeg';
        RNFetchBlob.fs.exists.mockReturnValue(false);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValue(pathWithDiffExt);

        const fileNamesUris = [
            {fileName: '', fileUri: 'https://file-uri/file.png'},
            {fileName: 'file.png', fileUri: ''},
        ];

        for (const {fileName, fileUri} of fileNamesUris) {
            const {exists, path} = await getCacheFile(fileName, fileUri); // eslint-disable-line no-await-in-loop
            expect(exists).toEqual(true);
            expect(path).toEqual(pathWithDiffExt);
        }
    });
});

describe('ImageCacheManager.cache', () => {
    const imageCacheManagerUtils = require('app/utils/image_cache_manager');
    imageCacheManagerUtils.isDownloading = jest.fn();
    RNFetchBlob.config.mockReturnValue(RNFetchBlob);
    mattermostBucket.getPreference = jest.fn().mockReturnValue({});

    beforeEach(() => {
        ImageCacheManager.listeners = {};
    });

    it('should cache a file from an http uri', async () => {
        const fileName = '';
        const fileUris = ['http://file-uri', 'https://file-uri'];
        for (const fileUri of fileUris) {
            RNFetchBlob.fs.exists.mockReturnValueOnce(false);
            RNFetchBlob.fs.existsWithDiffExt.mockReturnValueOnce(null);
            RNFetchBlob.fetch.mockReturnValueOnce({respInfo: {respType: '', headers: {}}});

            const path = await ImageCacheManager.cache(fileName, fileUri, emptyFunction); // eslint-disable-line no-await-in-loop
            expect(path).not.toEqual(null);
        }
    });

    it('should get the extension from the content disposition', async () => {
        RNFetchBlob.fs.exists.mockReturnValueOnce(false);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValueOnce(null);

        const ext = '.bmp';
        const headers = {'Content-Disposition': `inline;filename="file${ext}"; filename*=UTF-8''file${ext}`};
        RNFetchBlob.fetch.mockReturnValueOnce({respInfo: {respType: '', headers}});

        const fileName = '';
        const fileUri = 'https://file-uri';
        const path = await ImageCacheManager.cache(fileName, fileUri, emptyFunction); // eslint-disable-line no-await-in-loop
        expect(path.endsWith(ext)).toEqual(true);
    });

    it('should get the extension from the content type', async () => {
        RNFetchBlob.fs.exists.mockReturnValueOnce(false);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValueOnce(null);

        const ext = 'jpeg';
        const headers = {'Content-Type': 'image/jpeg'};
        RNFetchBlob.fetch.mockReturnValueOnce({respInfo: {respType: '', headers}});
        fileUtils.getExtensionFromMime.
            mockReturnValueOnce(ext). // first call in getCacheFile
            mockReturnValueOnce(ext); // seconds call in cache using MIME type from header

        const fileName = '';
        const fileUri = 'https://file-uri';
        const path = await ImageCacheManager.cache(fileName, fileUri, emptyFunction); // eslint-disable-line no-await-in-loop
        expect(path.endsWith(`.${ext}`)).toEqual(true);
    });

    it('should default to .png', async () => {
        RNFetchBlob.fs.exists.mockReturnValueOnce(false);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValueOnce(null);

        const ext = 'png';
        RNFetchBlob.fetch.mockReturnValueOnce({respInfo: {respType: '', headers: {}}});
        fileUtils.getExtensionFromMime.
            mockReturnValueOnce(ext). // first call in getCacheFile
            mockReturnValueOnce(null). // second call in cache using MIME type from header
            mockReturnValueOnce(ext); // third call in cache using DEFAULT_MIME_TYPE

        const fileName = '';
        const fileUri = 'https://file-uri';
        const path = await ImageCacheManager.cache(fileName, fileUri, emptyFunction); // eslint-disable-line no-await-in-loop
        expect(path.endsWith(`.${ext}`)).toEqual(true);
    });

    it('should move file if path extension and extracted extension don\'t match', async () => {
        const oldExt = 'png';
        const fileNameUris = [
            {fileName: '', fileUri: `https://file-uri/file.${oldExt}`},
            {fileName: `file${oldExt}`, fileUri: `https://file-uri/file.${oldExt}`},
        ];

        for (const {fileName, fileUri} of fileNameUris) {
            RNFetchBlob.fs.exists.mockReturnValueOnce(false);
            RNFetchBlob.fs.existsWithDiffExt.mockReturnValueOnce(null);

            const ext = 'bmp';
            const headers = {'Content-Type': 'image/bmp'};
            RNFetchBlob.fetch.mockReturnValueOnce({respInfo: {respType: '', headers}});
            fileUtils.getExtensionFromMime.
                mockReturnValueOnce(ext). // first call in getCacheFile
                mockReturnValueOnce(ext); // second call in cache using MIME type from header

            const path = await ImageCacheManager.cache(fileName, fileUri, emptyFunction); // eslint-disable-line no-await-in-loop
            expect(path.endsWith(`.${ext}`)).toEqual(true);

            const oldPath = path.replace(ext, oldExt);
            expect(RNFetchBlob.fs.mv).toHaveBeenCalledWith(oldPath, path);
        }
    });

    it('should return cached file when it exists', async () => {
        RNFetchBlob.fs.exists.mockReturnValueOnce(true);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValueOnce(null);

        const ext = '.png';
        const fileName = `file${ext}`;
        const fileUri = `http://file-uri/file${ext}`;
        const path = await ImageCacheManager.cache(fileName, fileUri, emptyFunction); // eslint-disable-line no-await-in-loop
        expect(path.endsWith(ext)).toEqual(true);
    });

    it('should not cache the file when respInfo.respType === "text"', async () => {
        RNFetchBlob.fs.exists.mockReturnValueOnce(false);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValueOnce(null);

        RNFetchBlob.fetch.mockReturnValueOnce({respInfo: {respType: 'text', headers: {}}});

        const fileName = '';
        const fileUri = 'https://file-uri';
        const path = await ImageCacheManager.cache(fileName, fileUri, emptyFunction); // eslint-disable-line no-await-in-loop
        expect(path).toEqual(null);
        expect(RNFetchBlob.fs.unlink).toHaveBeenCalled();
    });

    it('should add the listener if it is downloading', async () => {
        imageCacheManagerUtils.isDownloading.mockReturnValueOnce(true);

        const fileName = 'file.png';
        const fileUri = 'http://file-uri/file.png';
        await ImageCacheManager.cache(fileName, fileUri, emptyFunction); // eslint-disable-line no-await-in-loop

        const expectedListeners = {[fileUri]: [emptyFunction]};
        expect(ImageCacheManager.listeners).toMatchObject(expectedListeners);
    });

    it('should call listener with path if file exists', async () => {
        RNFetchBlob.fs.exists.mockReturnValueOnce(true);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValueOnce(null);

        const fileName = 'file.png';
        const fileUri = 'http://file-uri/file.png';
        const listener = jest.fn();
        const path = await ImageCacheManager.cache(fileName, fileUri, listener); // eslint-disable-line no-await-in-loop

        expect(ImageCacheManager.listeners).toMatchObject({});
        expect(listener).toHaveBeenCalledWith(path);
    });

    it('should call all listeners with path after downloading file then remove listeners', async () => {
        RNFetchBlob.fs.exists.mockReturnValueOnce(false);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValueOnce(null);
        RNFetchBlob.fetch.mockReturnValueOnce({respInfo: {respType: '', headers: {}}});

        // Ensure isDownloading returns false so that we can proceed to
        // download the file even if there are existing listeners.
        imageCacheManagerUtils.isDownloading.mockReturnValueOnce(false);

        const fileName = 'file.png';
        const fileUri = 'http://file-uri/file.png';
        const existingListener = jest.fn();
        ImageCacheManager.listeners = {[fileUri]: [existingListener]};
        const newListener = jest.fn();
        const path = await ImageCacheManager.cache(fileName, fileUri, newListener); // eslint-disable-line no-await-in-loop

        expect(ImageCacheManager.listeners).toMatchObject({});
        expect(existingListener).toHaveBeenCalledWith(path);
        expect(newListener).toHaveBeenCalledWith(path);
    });

    it('should call all listeners with the local file', async () => {
        RNFetchBlob.fs.exists.mockReturnValueOnce(false);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValueOnce(null);

        // Ensure isDownloading returns false so that we can proceed to
        // download the file even if there are existing listeners.
        imageCacheManagerUtils.isDownloading.mockReturnValueOnce(false);

        const fileName = 'file.png';
        const fileUri = 'file://file-uri/file.png';
        const existingListener = jest.fn();
        ImageCacheManager.listeners = {[fileUri]: [existingListener]};
        const newListener = jest.fn();
        await ImageCacheManager.cache(fileName, fileUri, newListener); // eslint-disable-line no-await-in-loop

        expect(ImageCacheManager.listeners).toMatchObject({});
        expect(existingListener).toHaveBeenCalledWith(fileUri);
        expect(newListener).toHaveBeenCalledWith(fileUri);
    });

    it('should parse the uri to get the correct protocol', async () => {
        const fileUri = 'HTTPS://file-uri/ABC123';
        const expectedFileUri = 'https://file-uri/ABC123';
        const fileName = null;

        const incorrectHash = fileUtils.hashCode(fileUri);
        const expectedHash = fileUtils.hashCode(expectedFileUri);
        expect(incorrectHash).not.toBe(expectedHash);

        RNFetchBlob.fs.exists.mockReturnValueOnce(false);
        RNFetchBlob.fs.existsWithDiffExt.mockReturnValueOnce(null);
        RNFetchBlob.fetch.mockReturnValueOnce({respInfo: {respType: '', headers: {}}});

        const path = await ImageCacheManager.cache(fileName, fileUri, emptyFunction); // eslint-disable-line no-await-in-loop
        const localFilename = path.substring(path.lastIndexOf('/') + 1, path.length);
        expect(localFilename).toEqual(`${expectedHash}.png`);
    });
});
