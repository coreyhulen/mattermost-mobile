// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {TouchableOpacity, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';

import CompassIcon from '@components/compass_icon';
import {Preferences} from '@mm-redux/constants';
import {canUploadFilesOnMobile} from '@mm-redux/selectors/entities/general';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {preventDoubleTap} from '@utils/tap';

export const SHARE_EXTENSION_POST_EVENT = 'share-extesion-post-event';
const theme = Preferences.THEMES.default;

const PostHeaderButton = () => {
    const canUploadFiles = useSelector(canUploadFilesOnMobile);
    const onPress = preventDoubleTap(() => {
        EventEmitter.emit(SHARE_EXTENSION_POST_EVENT);
    });

    return (
        <TouchableOpacity
            accessibilityComponentType='button'
            accessibilityTraits='button'
            delayPressIn={0}
            onPress={onPress}
            disabled={!canUploadFiles}
        >
            <View style={styles.left}>
                <CompassIcon
                    color={theme.sidebarHeaderTextColor}
                    name='send'
                    size={20}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    left: {
        alignItems: 'center',
        height: 50,
        justifyContent: 'center',
        width: 50,
    },
});

export default PostHeaderButton;
