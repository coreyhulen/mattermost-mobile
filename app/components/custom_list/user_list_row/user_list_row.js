// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {intlShape} from 'react-intl';
import {
    Text,
    View,
} from 'react-native';

import ChannelIcon from '@components/channel_icon';
import CustomListRow from '@components/custom_list/custom_list_row';
import ProfilePicture from '@components/profile_picture';
import {BotTag, GuestTag} from '@components/tag';
import {General} from '@mm-redux/constants';
import {displayUsername, isShared} from '@mm-redux/utils/user_utils';
import {makeStyleSheetFromTheme, changeOpacity} from '@utils/theme';
import {isGuest} from '@utils/users';

export default class UserListRow extends React.PureComponent {
    static propTypes = {
        id: PropTypes.string.isRequired,
        isMyUser: PropTypes.bool.isRequired,
        theme: PropTypes.object.isRequired,
        user: PropTypes.object.isRequired,
        teammateNameDisplay: PropTypes.string.isRequired,
        testID: PropTypes.string,
        ...CustomListRow.propTypes,
    };

    static contextTypes = {
        intl: intlShape,
    };

    onPress = () => {
        if (this.props.onPress) {
            this.props.onPress(this.props.id, this.props.item);
        }
    };

    renderIcon = (style) => {
        const {theme, user} = this.props;
        if (!isShared(user)) {
            return null;
        }
        return (
            <ChannelIcon
                isActive={false}
                isArchived={false}
                isBot={false}
                isUnread={true}
                isInfo={true}
                size={18}
                shared={true}
                style={style.sharedUserIcon}
                theme={theme}
                type={General.DM_CHANNEL}
            />
        );
    };

    render() {
        const {formatMessage} = this.context.intl;
        const {
            enabled,
            isMyUser,
            selectable,
            selected,
            teammateNameDisplay,
            theme,
            user,
        } = this.props;

        const {id, username} = user;
        const style = getStyleFromTheme(theme);

        let usernameDisplay = `@${username}`;
        if (isMyUser) {
            usernameDisplay = formatMessage({
                id: 'mobile.more_dms.you',
                defaultMessage: '@{username} - you',
            }, {username});
        }

        const teammateDisplay = displayUsername(user, teammateNameDisplay);
        const showTeammateDisplay = teammateDisplay !== username;
        const testID = this.props.testID;
        const itemTestID = `${testID}.${id}`;
        const displayUsernameTestID = `${testID}.display_username`;
        const profilePictureTestID = `${itemTestID}.profile_picture`;

        return (
            <View style={style.container}>
                <CustomListRow
                    id={id}
                    onPress={this.onPress}
                    enabled={enabled}
                    selectable={selectable}
                    selected={selected}
                    testID={testID}
                >
                    <View style={style.profileContainer}>
                        <ProfilePicture
                            userId={id}
                            size={32}
                            iconSize={24}
                            testID={profilePictureTestID}
                        />
                    </View>
                    <View
                        style={style.textContainer}
                        testID={itemTestID}
                    >
                        <View>
                            <View style={style.indicatorContainer}>
                                <Text
                                    style={style.username}
                                    ellipsizeMode='tail'
                                    numberOfLines={1}
                                    testID={displayUsernameTestID}
                                >
                                    {usernameDisplay}
                                </Text>
                                <BotTag
                                    show={Boolean(user.is_bot)}
                                    theme={theme}
                                />
                                <GuestTag
                                    show={isGuest(user)}
                                    theme={theme}
                                />
                            </View>
                        </View>
                        {showTeammateDisplay &&
                        <View>
                            <Text
                                style={style.displayName}
                                ellipsizeMode='tail'
                                numberOfLines={1}
                            >
                                {teammateDisplay}
                            </Text>
                        </View>
                        }
                        {user.delete_at > 0 &&
                        <View>
                            <Text
                                style={style.deactivated}
                            >
                                {formatMessage({id: 'mobile.user_list.deactivated', defaultMessage: 'Deactivated'})}
                            </Text>
                        </View>
                        }
                    </View>
                    {this.renderIcon(style)}
                </CustomListRow>
            </View>
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
            flexDirection: 'row',
            marginHorizontal: 10,
            overflow: 'hidden',
        },
        profileContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            color: theme.centerChannelColor,
        },
        textContainer: {
            marginLeft: 10,
            justifyContent: 'center',
            flexDirection: 'column',
            flex: 1,
        },
        displayName: {
            fontSize: 15,
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
        username: {
            fontSize: 15,
            color: theme.centerChannelColor,
        },
        indicatorContainer: {
            flexDirection: 'row',
        },
        deactivated: {
            marginTop: 2,
            fontSize: 12,
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
        sharedUserIcon: {
            alignSelf: 'center',
            opacity: 0.75,
        },
    };
});
