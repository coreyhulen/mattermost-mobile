// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {DeviceTypes} from '@constants';
import {
    generateId,
    getLocalPath,
    getLocalFilePathFromFile,
    getExtensionFromContentDisposition,
    hashCode,
} from '@utils/file';

describe('getExtensionFromContentDisposition', () => {
    it('should return the extracted the extension', () => {
        const exts = [
            'png',
            'PNG',
            'gif',
            'GIF',
            'bmp',
            'BMP',
            'jpg',
            'JPG',
            'jpeg',
            'JPEG',
        ];

        exts.forEach((ext) => {
            const contentDisposition = `inline;filename="test_image.${ext}"; filename*=UTF-8''test_image.${ext}"`;
            const extension = getExtensionFromContentDisposition(contentDisposition);
            expect(extension).toBe(ext.toLowerCase());
        });
    });

    it('should return null for an invalid extension', () => {
        const invalidExt = 'invalid';
        const contentDisposition = `inline;filename="test_image.${invalidExt}"; filename*=UTF-8''test_image.${invalidExt}"`;
        const extension = getExtensionFromContentDisposition(contentDisposition);
        expect(extension).toBe(null);
    });

    it('should return null for no content disposition', () => {
        const contentDispositions = [
            undefined,
            null,
            '',
        ];

        contentDispositions.forEach((contentDisposition) => {
            const extension = getExtensionFromContentDisposition(contentDisposition);
            expect(extension).toBe(null);
        });
    });

    it('should return the path for the file', () => {
        const file = {
            id: generateId(),
            name: 'Some Video file.mp4',
            extension: 'mp4',
        };

        const localFile = getLocalFilePathFromFile('Videos', file);
        const [filename] = file.name.split('.');
        expect(localFile).toBe(`Videos/${filename}-${hashCode(file.id)}.${file.extension}`);
    });

    it('should return the undefined as the path if it does not have an id and name set', () => {
        const file = {
            extension: 'mp4',
        };

        const localFile = getLocalFilePathFromFile('Videos', file);
        expect(localFile).toBeUndefined();
    });

    it('should return the undefined as the path if it does not have an extension set', () => {
        const file = {
            id: generateId(),
        };
        const localFile = getLocalFilePathFromFile('Videos', file);
        expect(localFile).toBeUndefined();
    });

    it('should return the same path as the local file', () => {
        const file = {
            localPath: 'some/path/filename.mp4',
        };

        const localFile = getLocalPath(file);
        expect(localFile).toEqual(file.localPath);
    });

    it('should return the path for the video file', () => {
        const file = {
            id: generateId(),
            name: 'Some Video file.mp4',
            extension: 'mp4',
        };

        const localFile = getLocalPath(file);
        const [filename] = file.name.split('.');
        expect(localFile).toBe(`${DeviceTypes.VIDEOS_PATH}/${filename}-${hashCode(file.id)}.${file.extension}`);
    });

    it('should return the path for the image file', () => {
        const file = {
            id: generateId(),
            name: 'Some animated image.gif',
            extension: 'gif',
        };

        const localFile = getLocalPath(file);
        const [filename] = file.name.split('.');
        expect(localFile).toBe(`${DeviceTypes.IMAGES_PATH}/${filename}-${hashCode(file.id)}.${file.extension}`);
    });

    it('should return the path for the document file', () => {
        const file = {
            id: generateId(),
            name: 'Some other document.txt',
            extension: 'txt',
        };

        const localFile = getLocalPath(file);
        const [filename] = file.name.split('.');
        expect(localFile).toBe(`${DeviceTypes.DOCUMENTS_PATH}/${filename}-${hashCode(file.id)}.${file.extension}`);
    });

    it('should return the path for the document file including multiple dots in the filename', () => {
        const file = {
            id: generateId(),
            name: 'Some.other.document.txt',
            extension: 'txt',
        };
        const expectedFilename = 'Some.other.document';
        const localFile = getLocalPath(file);
        expect(localFile).toBe(`${DeviceTypes.DOCUMENTS_PATH}/${expectedFilename}-${hashCode(file.id)}.${file.extension}`);
    });
});
