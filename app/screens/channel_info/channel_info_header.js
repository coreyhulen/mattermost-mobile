// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import PropTypes from 'prop-types';
import {
    Platform,
    Text,
    TouchableHighlight,
    View,
} from 'react-native';
import {intlShape} from 'react-intl';
import Clipboard from '@react-native-community/clipboard';

import {popToRoot} from '@actions/navigation';
import ChannelIcon from '@components/channel_icon';
import FormattedDate from '@components/formatted_date';
import FormattedText from '@components/formatted_text';
import Markdown from '@components/markdown';
import {General} from '@mm-redux/constants';
import BottomSheet from '@utils/bottom_sheet';
import {t} from '@utils/i18n';
import {getMarkdownTextStyles, getMarkdownBlockStyles} from '@utils/markdown';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import mattermostManaged from 'app/mattermost_managed';

export default class ChannelInfoHeader extends React.PureComponent {
    static propTypes = {
        createAt: PropTypes.number.isRequired,
        creator: PropTypes.string,
        memberCount: PropTypes.number,
        displayName: PropTypes.string.isRequired,
        header: PropTypes.string,
        onPermalinkPress: PropTypes.func,
        purpose: PropTypes.string,
        teammateId: PropTypes.string,
        theme: PropTypes.object.isRequired,
        type: PropTypes.string.isRequired,
        isArchived: PropTypes.bool.isRequired,
        isTeammateGuest: PropTypes.bool.isRequired,
        hasGuests: PropTypes.bool.isRequired,
        isGroupConstrained: PropTypes.bool,
        testID: PropTypes.string,
        timeZone: PropTypes.string,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    renderHasGuestText = (style) => {
        const {type, hasGuests, isTeammateGuest} = this.props;
        if (!hasGuests) {
            return null;
        }
        if (type === General.DM_CHANNEL && !isTeammateGuest) {
            return null;
        }

        let messageId;
        let defaultMessage;

        if (type === General.GM_CHANNEL) {
            messageId = t('channel.hasGuests');
            defaultMessage = 'This group message has guests';
        } else if (type === General.DM_CHANNEL) {
            messageId = t('channel.isGuest');
            defaultMessage = 'This person is a guest';
        } else {
            messageId = t('channel.channelHasGuests');
            defaultMessage = 'This channel has guests';
        }
        return (
            <View style={style.section}>
                <View style={style.row}>
                    <FormattedText
                        style={style.header}
                        id={messageId}
                        defaultMessage={defaultMessage}
                    />
                </View>
            </View>
        );
    }

    handleLongPress = (text, actionText) => {
        const {formatMessage} = this.context.intl;

        const config = mattermostManaged.getCachedConfig();

        if (config?.copyAndPasteProtection !== 'true') {
            const cancelText = formatMessage({id: 'mobile.post.cancel', defaultMessage: 'Cancel'});

            BottomSheet.showBottomSheetWithOptions({
                options: [actionText, cancelText],
                cancelButtonIndex: 1,
            }, (value) => {
                if (value === 0) {
                    this.handleCopy(text);
                }
            });
        }
    };

    handleCopy = (text) => {
        Clipboard.setString(text);
    }

    handleHeaderLongPress = () => {
        const {formatMessage} = this.context.intl;
        const {header} = this.props;
        this.handleLongPress(
            header,
            formatMessage({id: 'mobile.channel_info.copy_header', defaultMessage: 'Copy Header'}),
        );
    }

    handlePurposeLongPress = () => {
        const {formatMessage} = this.context.intl;
        const {purpose} = this.props;
        this.handleLongPress(
            purpose,
            formatMessage({id: 'mobile.channel_info.copy_purpose', defaultMessage: 'Copy Purpose'}),
        );
    }

    render() {
        const {
            createAt,
            creator,
            displayName,
            header,
            memberCount,
            onPermalinkPress,
            purpose,
            teammateId,
            theme,
            type,
            isArchived,
            isGroupConstrained,
            testID,
            timeZone,
        } = this.props;

        const style = getStyleSheet(theme);
        const textStyles = getMarkdownTextStyles(theme);
        const blockStyles = getMarkdownBlockStyles(theme);
        const baseTextStyle = Platform.select({
            ios: {...style.detail, lineHeight: 20},
            android: style.detail,
        });

        return (
            <View style={style.container}>
                <View style={[style.channelNameContainer, style.row]}>
                    <ChannelIcon
                        isInfo={true}
                        membersCount={memberCount}
                        size={24}
                        userId={teammateId}
                        theme={theme}
                        type={type}
                        isArchived={isArchived}
                        testID={`${testID}.channel_icon`}
                    />
                    <Text
                        ellipsizeMode='tail'
                        numberOfLines={1}
                        style={style.channelName}
                        testID={`${testID}.display_name`}
                    >
                        {displayName}
                    </Text>
                </View>
                {this.renderHasGuestText(style)}
                {purpose.length > 0 &&
                    <View style={style.section}>
                        <TouchableHighlight
                            underlayColor={changeOpacity(theme.centerChannelColor, 0.1)}
                            onLongPress={this.handlePurposeLongPress}
                        >
                            <View style={style.row}>
                                <FormattedText
                                    style={style.header}
                                    id='channel_info.purpose'
                                    defaultMessage='Purpose'
                                />
                                <Text
                                    style={baseTextStyle}
                                    testID={`${testID}.purpose`}
                                >
                                    {purpose}
                                </Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                }
                {header.length > 0 &&
                    <View style={style.section}>
                        <TouchableHighlight
                            underlayColor={changeOpacity(theme.centerChannelColor, 0.1)}
                            onLongPress={this.handleHeaderLongPress}
                        >
                            <View style={style.row}>
                                <FormattedText
                                    style={style.header}
                                    id='channel_info.header'
                                    defaultMessage='Header'
                                />
                                <Markdown
                                    onPermalinkPress={onPermalinkPress}
                                    baseTextStyle={baseTextStyle}
                                    textStyles={textStyles}
                                    blockStyles={blockStyles}
                                    disableGallery={true}
                                    value={header}
                                    onChannelLinkPress={popToRoot}
                                    disableAtChannelMentionHighlight={true}
                                    testID={`${testID}.header`}
                                />
                            </View>
                        </TouchableHighlight>
                    </View>
                }
                {isGroupConstrained &&
                    <Text style={[style.createdBy, style.row]}>
                        <FormattedText
                            id='mobile.routes.channelInfo.groupManaged'
                            defaultMessage='Members are managed by linked groups'
                        />
                    </Text>
                }
                {creator &&
                    <Text style={[style.createdBy, style.row]}>
                        <FormattedText
                            id='mobile.routes.channelInfo.createdBy'
                            defaultMessage='Created by {creator} on '
                            values={{
                                creator,
                            }}
                        />
                        <FormattedDate
                            format='LL'
                            timeZone={timeZone}
                            value={createAt}
                        />
                    </Text>
                }
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            backgroundColor: theme.centerChannelBg,
            marginBottom: 40,
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.1),
        },
        channelName: {
            flex: 1,
            fontSize: 15,
            fontWeight: '600',
            color: theme.centerChannelColor,
            marginLeft: 13,
        },
        channelNameContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
        },
        createdBy: {
            flexDirection: 'row',
            fontSize: 12,
            marginTop: 5,
            color: changeOpacity(theme.centerChannelColor, 0.5),
            backgroundColor: 'transparent',
        },
        detail: {
            fontSize: 13,
            color: theme.centerChannelColor,
        },
        header: {
            fontSize: 13,
            marginBottom: 10,
            color: theme.centerChannelColor,
            backgroundColor: 'transparent',
        },
        section: {
            marginTop: 15,
        },
        row: {
            paddingHorizontal: 15,
        },
    };
});
