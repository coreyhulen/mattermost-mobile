// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode} from 'react';
import {intlShape, injectIntl} from 'react-intl';
import {Text} from 'react-native';

import AtMention from '@components/at_mention';
import FormattedText from '@components/formatted_text';
import {General} from '@mm-redux/constants';
import {t} from '@utils/i18n';
import {getMarkdownTextStyles} from '@utils/markdown';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import type {Post} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';
import type {UserProfile} from '@mm-redux/types/users';

type AddMembersProps = {
    addChannelMember: (channelId: string, userId: string, postRootId?: string) => void;
    channelType: string;
    currentUser: UserProfile;
    intl: typeof intlShape;
    post: Post;
    removePost: (post: Post) => void;
    sendAddToChannelEphemeralPost: (user: UserProfile, addedUsernames: string[], message: string, channelId: string, rootPostId?: string) => void;
    theme: Theme;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        message: {
            color: changeOpacity(theme.centerChannelColor, 0.6),
            fontSize: 15,
            lineHeight: 20,
        },
    };
});

const AddMembers = ({addChannelMember, channelType, currentUser, intl, post, removePost, sendAddToChannelEphemeralPost, theme}: AddMembersProps) => {
    const styles = getStyleSheet(theme);
    const textStyles = getMarkdownTextStyles(theme);
    const postId: string = post.props.add_channel_member.post_id;
    const noGroupsUsernames = post.props.add_channel_member?.not_in_groups_usernames;
    let userIds = post.props.add_channel_member?.not_in_channel_user_ids;
    let usernames = post.props.add_channel_member?.not_in_channel_usernames;

    if (!postId || !channelType) {
        return null;
    }

    if (!userIds) {
        userIds = post.props.add_channel_member?.user_ids;
    }
    if (!usernames) {
        usernames = post.props.add_channel_member?.usernames;
    }

    const handleAddChannelMember = () => {
        if (post && post.channel_id) {
            userIds.forEach((userId: string, index: number) => {
                addChannelMember(post.channel_id, userId);

                if (post.root_id) {
                    const message = intl.formatMessage(
                        {
                            id: 'api.channel.add_member.added',
                            defaultMessage: '{addedUsername} added to the channel by {username}.',
                        },
                        {
                            username: currentUser.username,
                            addedUsername: usernames[index],
                        },
                    );

                    sendAddToChannelEphemeralPost(currentUser, usernames[index], message, post.channel_id, post.root_id);
                }
            });

            removePost(post);
        }
    };

    const generateAtMentions = (names: string[]) => {
        if (names.length === 1) {
            return (
                <AtMention
                    mentionName={names[0]}
                    mentionStyle={textStyles.mention}
                    theme={theme}
                />
            );
        } else if (names.length > 1) {
            function andSeparator(key: string) {
                return (
                    <FormattedText
                        key={key}
                        id={'post_body.check_for_out_of_channel_mentions.link.and'}
                        defaultMessage={' and '}
                        style={textStyles}
                    />
                );
            }

            function commaSeparator(key: string) {
                return <Text key={key}>{', '}</Text>;
            }

            return (
                <Text>
                    {
                        names.map((username: string) => {
                            return (
                                <AtMention
                                    key={username}
                                    mentionStyle={textStyles.mention}
                                    mentionName={username}
                                    theme={theme}
                                />
                            );
                        }).reduce((acc: ReactNode[], el: ReactNode, idx: number, arr: ReactNode[]) => {
                            if (idx === 0) {
                                return [el];
                            } else if (idx === arr.length - 1) {
                                return [...acc, andSeparator(`separator-${idx}`), el];
                            }

                            return [...acc, commaSeparator(`commma-separator-${idx}`), el];
                        }, [])
                    }
                </Text>
            );
        }

        return '';
    };

    let linkId;
    let linkText;
    if (channelType === General.PRIVATE_CHANNEL) {
        linkId = t('post_body.check_for_out_of_channel_mentions.link.private');
        linkText = 'add them to this private channel';
    } else if (channelType === General.OPEN_CHANNEL) {
        linkId = t('post_body.check_for_out_of_channel_mentions.link.public');
        linkText = 'add them to the channel';
    }

    let outOfChannelMessageID;
    let outOfChannelMessageText;
    const outOfChannelAtMentions = generateAtMentions(usernames);
    if (usernames.length === 1) {
        outOfChannelMessageID = t('post_body.check_for_out_of_channel_mentions.message.one');
        outOfChannelMessageText = 'was mentioned but is not in the channel. Would you like to ';
    } else if (usernames.length > 1) {
        outOfChannelMessageID = t('post_body.check_for_out_of_channel_mentions.message.multiple');
        outOfChannelMessageText = 'were mentioned but they are not in the channel. Would you like to ';
    }

    let outOfGroupsMessageID;
    let outOfGroupsMessageText;
    const outOfGroupsAtMentions = generateAtMentions(noGroupsUsernames);
    if (noGroupsUsernames?.length) {
        outOfGroupsMessageID = t('post_body.check_for_out_of_channel_groups_mentions.message');
        outOfGroupsMessageText = 'did not get notified by this mention because they are not in the channel. They are also not a member of the groups linked to this channel.';
    }

    let outOfChannelMessage = null;
    if (usernames.length) {
        outOfChannelMessage = (
            <Text>
                {outOfChannelAtMentions}
                {' '}
                <FormattedText
                    id={outOfChannelMessageID}
                    defaultMessage={outOfChannelMessageText}
                    style={styles.message}
                />
                <Text
                    style={textStyles.link}
                    testID='add_channel_member_link'
                    onPress={handleAddChannelMember}
                >
                    <FormattedText
                        id={linkId}
                        defaultMessage={linkText}
                    />
                </Text>
                <FormattedText
                    id={'post_body.check_for_out_of_channel_mentions.message_last'}
                    defaultMessage={'? They will have access to all message history.'}
                    style={styles.message}
                />
            </Text>
        );
    }

    let outOfGroupsMessage = null;
    if (noGroupsUsernames?.length) {
        outOfGroupsMessage = (
            <Text>
                {outOfGroupsAtMentions}
                {' '}
                <FormattedText
                    id={outOfGroupsMessageID}
                    defaultMessage={outOfGroupsMessageText}
                    style={styles.message}
                />
            </Text>
        );
    }

    return (
        <>
            {outOfChannelMessage}
            {outOfGroupsMessage}
        </>
    );
};

export default injectIntl(AddMembers);
