// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode, useRef} from 'react';
import {intlShape, injectIntl} from 'react-intl';
import {Keyboard, Platform, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import FastImage from 'react-native-fast-image';

import {showModal} from '@actions/navigation';
import {Client4} from '@client/rest';
import CompassIcon from '@components/compass_icon';
import SystemAvatar from '@components/post_list/system_avatar';
import ProfilePicture from '@components/profile_picture';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {ViewTypes} from '@constants';
import {fromAutoResponder, isSystemMessage} from '@mm-redux/utils/post_utils';
import {preventDoubleTap} from '@utils/tap';

import type {Post} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';
import type {ImageSource} from 'react-native-vector-icons/Icon';

type AvatarProps = {
    enablePostIconOverride?: boolean;
    intl: typeof intlShape;
    isBoot: boolean;
    pendingPostStyle?: StyleProp<ViewStyle>;
    post: Post;
    theme: Theme;
    userId: string;
}

const style = StyleSheet.create({
    buffer: {
        marginRight: Platform.select({android: 2, ios: 3}),
    },
    profilePictureContainer: {
        marginBottom: 5,
        marginLeft: 12,
        marginRight: Platform.select({android: 11, ios: 10}),
        marginTop: 10,
    },
});

const Avatar = ({enablePostIconOverride, intl, isBoot, pendingPostStyle, post, theme, userId}: AvatarProps) => {
    if (isSystemMessage(post) && !fromAutoResponder(post) && !isBoot) {
        return (<SystemAvatar theme={theme}/>);
    }

    const closeButton = useRef<ImageSource>();
    const fromWebHook = post.props?.from_webhook === 'true';
    const iconOverride = enablePostIconOverride && post.props?.use_user_icon !== 'true';
    if (fromWebHook && iconOverride) {
        const isEmoji = Boolean(post.props?.override_icon_emoji);
        const frameSize = ViewTypes.PROFILE_PICTURE_SIZE;
        const pictureSize = isEmoji ? ViewTypes.PROFILE_PICTURE_EMOJI_SIZE : ViewTypes.PROFILE_PICTURE_SIZE;
        const borderRadius = isEmoji ? 0 : ViewTypes.PROFILE_PICTURE_SIZE / 2;
        const overrideIconUrl = Client4.getAbsoluteUrl(post.props?.override_icon_url);

        let iconComponent: ReactNode;
        if (overrideIconUrl) {
            const source = {uri: overrideIconUrl};
            iconComponent = (
                <FastImage
                    source={source}
                    style={{
                        height: pictureSize,
                        width: pictureSize,
                    }}
                />
            );
        } else {
            iconComponent = (
                <CompassIcon
                    name='webhook'
                    size={32}
                />
            );
        }

        return (
            <View style={[style.profilePictureContainer, pendingPostStyle]}>
                <View
                    style={[{
                        borderRadius,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: frameSize,
                        width: frameSize,
                    }, style.buffer]}
                >
                    {iconComponent}
                </View>
            </View>
        );
    }

    const onViewUserProfile = preventDoubleTap(() => {
        const screen = 'UserProfile';
        const title = intl.formatMessage({id: 'mobile.routes.user_profile', defaultMessage: 'Profile'});
        const passProps = {userId};

        if (!closeButton.current) {
            closeButton.current = CompassIcon.getImageSourceSync('close', 24, theme.sidebarHeaderTextColor);
        }

        const options = {
            topBar: {
                leftButtons: [{
                    id: 'close-settings',
                    icon: closeButton.current,
                    testID: 'close.settings.button',
                }],
            },
        };

        Keyboard.dismiss();
        showModal(screen, title, passProps, options);
    });

    let component = (
        <ProfilePicture
            userId={userId}
            size={ViewTypes.PROFILE_PICTURE_SIZE}
            iconSize={24}
            showStatus={!fromAutoResponder(post)}
            testID='post_profile_picture.profile_picture'
        />
    );

    if (!fromWebHook) {
        component = (
            <TouchableWithFeedback
                onPress={onViewUserProfile}
                type={'opacity'}
            >
                {component}
            </TouchableWithFeedback>
        );
    }

    return (
        <View style={[style.profilePictureContainer, pendingPostStyle]}>
            {component}
        </View>
    );
};

export default injectIntl(Avatar);
