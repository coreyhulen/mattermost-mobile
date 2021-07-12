// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Dimensions, Keyboard, Platform} from 'react-native';
import {Options, SharedElementTransition, StackAnimationOptions, ViewAnimationOptions} from 'react-native-navigation';
import parseUrl from 'url-parse';

import {goToScreen} from '@actions/navigation';
import {FileInfo} from '@mm-redux/types/files';

import {generateId, isImage, lookupMimeType} from './file';

export function openGalleryAtIndex(index: number, files: FileInfo[]) {
    Keyboard.dismiss();
    requestAnimationFrame(() => {
        const screen = 'Gallery';
        const passProps = {
            index,
            files,
        };
        const windowHeight = Dimensions.get('window').height;
        const sharedElementTransitions: SharedElementTransition[] = [];

        const contentPush = {} as ViewAnimationOptions;
        const contentPop = {} as ViewAnimationOptions;
        const file = files[index];

        if (isImage(file)) {
            sharedElementTransitions.push({
                fromId: `image-${file.id}`,
                toId: `gallery-${file.id}`,
                duration: 300,
                interpolation: {type: 'accelerateDecelerate'},
            });
        } else {
            contentPush.y = {
                from: windowHeight,
                to: 0,
                duration: 300,
                interpolation: {type: 'decelerate'},
            };

            if (Platform.OS === 'ios') {
                contentPop.translationY = {
                    from: 0,
                    to: windowHeight,
                    duration: 300,
                };
            } else {
                contentPop.y = {
                    from: 0,
                    to: windowHeight,
                    duration: 300,
                };
                contentPop.alpha = {
                    from: 1,
                    to: 0,
                    duration: 100,
                };
            }
        }

        const options: Options = {
            layout: {
                backgroundColor: '#000',
                componentBackgroundColor: '#000',
                orientation: ['portrait', 'landscape'],
            },
            topBar: {
                background: {
                    color: '#000',
                },
                visible: Platform.OS === 'android',
            },
            animations: {
                push: {
                    waitForRender: true,
                    sharedElementTransitions,
                },
            },
        };

        if (Object.keys(contentPush).length) {
            options.animations!.push = {
                ...options.animations!.push,
                ...Platform.select<ViewAnimationOptions | StackAnimationOptions>({
                    android: contentPush,
                    ios: {
                        content: contentPush,
                    },
                }),
            };
        }

        if (Object.keys(contentPop).length) {
            options.animations!.pop = Platform.select<ViewAnimationOptions | StackAnimationOptions>({
                android: contentPop,
                ios: {
                    content: contentPop,
                },
            });
        }

        goToScreen(screen, '', passProps, options);
    });
}

export function openGallerWithMockFile(uri: string, postId: string, height: number, width: number, fileId?: string) {
    const url = decodeURIComponent(uri);
    let filename = parseUrl(url.substr(url.lastIndexOf('/'))).pathname.replace('/', '');
    let extension = filename.split('.').pop();

    if (!extension || extension === filename) {
        const ext = filename.indexOf('.') === -1 ? '.png' : filename.substring(filename.lastIndexOf('.'));
        filename = `${filename}${ext}`;
        extension = ext;
    }

    const file: FileInfo = {
        id: fileId || generateId(),
        clientId: 'mock_client_id',
        create_at: Date.now(),
        delete_at: 0,
        extension,
        has_preview_image: true,
        height,
        mime_type: lookupMimeType(filename),
        name: filename,
        post_id: postId,
        size: 0,
        update_at: 0,
        uri,
        user_id: 'mock_user_id',
        width,
    };

    openGalleryAtIndex(0, [file]);
}
