// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {Keyboard, View} from 'react-native';

import {showModalOverCurrentContext} from '@actions/navigation';
import Markdown from '@components/markdown';
import SystemAvatar from '@components/post_list/system_avatar';
import SystemHeader from '@components/post_list/system_header';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {Posts} from '@mm-redux/constants';
import {emptyFunction} from '@utils/general';
import {getMarkdownTextStyles} from '@utils/markdown';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import LastUsers from './last_users';
import {postTypeMessages} from './messages';

import type {Post} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';

type Props = {
    canDelete: boolean;
    currentUserId?: string;
    currentUsername?: string;
    intl: typeof intlShape;
    post: Post;
    showJoinLeave: boolean;
    testID?: string;
    theme: Theme;
    usernamesById: Record<string, string>;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        baseText: {
            color: theme.centerChannelColor,
            opacity: 0.6,
        },
        body: {
            flex: 1,
            paddingBottom: 2,
            paddingTop: 2,
        },
        container: {
            flexDirection: 'row',
        },
        content: {
            flex: 1,
            flexDirection: 'column',
            marginRight: 12,
        },
        displayName: {
            color: theme.centerChannelColor,
            fontSize: 15,
            fontWeight: '600',
            flexGrow: 1,
            paddingVertical: 2,
        },
        displayNameContainer: {
            maxWidth: '60%',
            marginRight: 5,
            marginBottom: 3,
        },
        header: {
            flex: 1,
            flexDirection: 'row',
            marginTop: 10,
        },
        profilePictureContainer: {
            marginBottom: 5,
            marginLeft: 12,
            marginRight: 13,
            marginTop: 10,
        },
        time: {
            color: theme.centerChannelColor,
            fontSize: 12,
            marginTop: 5,
            opacity: 0.5,
            flex: 1,
        },
    };
});

const CombinedUserActivity = ({
    canDelete, currentUserId, currentUsername, intl, post,
    showJoinLeave, testID, theme, usernamesById,
}: Props) => {
    const itemTestID = `${testID}.${post.id}`;
    const textStyles = getMarkdownTextStyles(theme);
    const {allUsernames, messageData} = post.props.user_activity;
    const styles = getStyleSheet(theme);
    const content = [];
    const removedUserIds: string[] = [];

    const getUsernames = (userIds: string[]) => {
        const someone = intl.formatMessage({id: 'channel_loader.someone', defaultMessage: 'Someone'});
        const usernames = userIds.reduce((acc: string[], id: string) => {
            if (id !== currentUserId && id !== currentUsername) {
                const name = usernamesById[id];
                acc.push(name ? `@${name}` : someone);
            }
            return acc;
        }, []);

        if (currentUserId && userIds.includes(currentUserId)) {
            usernames.unshift(allUsernames[currentUserId]);
        } else if (currentUsername && userIds.includes(currentUsername)) {
            usernames.unshift(allUsernames[currentUsername]);
        }

        return usernames;
    };

    const onLongPress = () => {
        if (!canDelete) {
            return;
        }

        const screen = 'PostOptions';
        const passProps = {
            canDelete,
            isSystemMessage: true,
            post,
        };
        Keyboard.dismiss();
        requestAnimationFrame(() => {
            showModalOverCurrentContext(screen, passProps);
        });
    };

    const renderMessage = (postType: string, userIds: string[], actorId: string) => {
        let actor = '';
        if (usernamesById[actorId]) {
            actor = `@${usernamesById[actorId]}`;
        }

        if (actor && (actorId === currentUserId || actorId === currentUsername)) {
            actor = intl.formatMessage({id: 'combined_system_message.you', defaultMessage: 'You'}).toLowerCase();
        }

        const usernames = getUsernames(userIds);
        const numOthers = usernames.length - 1;

        if (numOthers > 1) {
            return (
                <LastUsers
                    key={postType + actorId}
                    actor={actor}
                    postType={postType}
                    theme={theme}
                    usernames={usernames}
                />
            );
        }

        const firstUser = usernames[0];
        const secondUser = usernames[1];
        let localeHolder;
        if (numOthers === 0) {
            localeHolder = postTypeMessages[postType].one;

            if (
                (userIds[0] === currentUserId || userIds[0] === currentUsername) &&
                postTypeMessages[postType].one_you
            ) {
                localeHolder = postTypeMessages[postType].one_you;
            }
        } else if (numOthers === 1) {
            localeHolder = postTypeMessages[postType].two;
        }

        const formattedMessage = intl.formatMessage(localeHolder, {firstUser, secondUser, actor});
        return (
            <Markdown
                key={postType + actorId}
                baseTextStyle={styles.baseText}
                textStyles={textStyles}
                value={formattedMessage}
            />
        );
    };

    for (const message of messageData) {
        const {postType, actorId} = message;
        let userIds = message.userIds;

        if (!showJoinLeave && actorId !== currentUserId) {
            const affectsCurrentUser = userIds.indexOf(currentUserId) !== -1;

            if (affectsCurrentUser) {
                // Only show the message that the current user was added, etc
                userIds = [currentUserId];
            } else {
                // Not something the current user did or was affected by
                continue;
            }
        }

        if (postType === Posts.POST_TYPES.REMOVE_FROM_CHANNEL) {
            removedUserIds.push(...userIds);
            continue;
        }

        content.push(renderMessage(postType, userIds, actorId));
    }

    if (removedUserIds.length > 0) {
        const uniqueRemovedUserIds = removedUserIds.filter((id, index, arr) => arr.indexOf(id) === index);
        content.push(renderMessage(Posts.POST_TYPES.REMOVE_FROM_CHANNEL, uniqueRemovedUserIds, currentUserId || ''));
    }

    return (
        <View
            testID={testID}
        >
            <TouchableWithFeedback
                testID={itemTestID}
                onPress={emptyFunction}
                onLongPress={onLongPress}
                delayLongPress={200}
                underlayColor={changeOpacity(theme.centerChannelColor, 0.1)}
                cancelTouchOnPanning={true}
            >
                <View style={styles.container}>
                    <SystemAvatar theme={theme}/>
                    <View style={styles.content}>
                        <SystemHeader
                            createAt={post.create_at}
                            theme={theme}
                        />
                        <View style={styles.body}>
                            {content}
                        </View>
                    </View>
                </View>
            </TouchableWithFeedback>
        </View>
    );
};

export default injectIntl(CombinedUserActivity);
