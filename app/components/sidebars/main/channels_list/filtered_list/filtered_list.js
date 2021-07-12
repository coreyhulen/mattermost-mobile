// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import deepEqual from 'deep-equal';
import memoize from 'memoize-one';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {
    Keyboard,
    Platform,
    SectionList,
    Text,
    View,
} from 'react-native';

import ChannelItem from '@components/sidebars/main/channels_list/channel_item';
import {ListTypes} from '@constants';
import {General} from '@mm-redux/constants';
import {sortChannelsByDisplayName} from '@mm-redux/utils/channel_utils';
import {displayUsername} from '@mm-redux/utils/user_utils';
import {t} from '@utils/i18n';

const VIEWABILITY_CONFIG = ListTypes.VISIBILITY_CONFIG_DEFAULTS;

class FilteredList extends Component {
    static propTypes = {
        testID: PropTypes.string,
        actions: PropTypes.shape({
            getProfilesInTeam: PropTypes.func.isRequired,
            makeGroupMessageVisibleIfNecessary: PropTypes.func.isRequired,
            searchChannels: PropTypes.func.isRequired,
            searchProfiles: PropTypes.func.isRequired,
        }).isRequired,
        channels: PropTypes.object.isRequired,
        currentTeam: PropTypes.object.isRequired,
        currentUserId: PropTypes.string,
        currentChannel: PropTypes.object,
        groupChannelMemberDetails: PropTypes.object,
        intl: intlShape.isRequired,
        teammateNameDisplay: PropTypes.string,
        onSelectChannel: PropTypes.func.isRequired,
        otherChannels: PropTypes.array,
        archivedChannels: PropTypes.array,
        profiles: PropTypes.object,
        teamProfiles: PropTypes.object,
        searchOrder: PropTypes.array.isRequired,
        pastDirectMessages: PropTypes.array,
        restrictDms: PropTypes.bool.isRequired,
        statuses: PropTypes.object,
        styles: PropTypes.object.isRequired,
        term: PropTypes.string,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        currentChannel: {},
        pastDirectMessages: [],
    };

    constructor(props) {
        super(props);

        this.keyboardDismissProp = {
            keyboardDismissMode: Platform.OS === 'ios' ? 'interactive' : 'none',
            onScrollBeginDrag: Keyboard.dismiss,
        };

        this.state = {
        };
    }

    componentDidMount() {
        if (this.props.restrictDms) {
            this.props.actions.getProfilesInTeam(this.props.currentTeam.id);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !deepEqual(this.props, nextProps, {strict: true}) || !deepEqual(this.state, nextState, {strict: true});
    }

    setDataSourceAndTerm(dataSource, term) {
        this.setState({dataSource, term});
    }

    componentDidUpdate(prevProps) {
        if (prevProps.term !== this.props.term) {
            const {actions, currentTeam, term} = this.props;
            const {searchChannels, searchProfiles} = actions;
            const dataSource = this.buildData(this.props, term);
            this.setDataSourceAndTerm(dataSource, term);
            clearTimeout(this.searchTimeoutId);

            this.searchTimeoutId = setTimeout(() => {
                // Android has a fatal error if we send a blank term
                if (!term) {
                    return;
                }

                searchProfiles(term, {allow_inactive: true});
                searchChannels(currentTeam.id, term);
            }, General.SEARCH_TIMEOUT_MILLISECONDS);
        }
    }

    onSelectChannel = (channel) => {
        const {actions, currentChannel} = this.props;
        const {makeGroupMessageVisibleIfNecessary} = actions;

        if (channel.type === General.GM_CHANNEL) {
            makeGroupMessageVisibleIfNecessary(channel.id);
        }

        this.props.onSelectChannel(channel, currentChannel.id);
    };

    filterChannels = (channels, term) => {
        if (!term) {
            return channels;
        }

        let text = term.toLowerCase();
        if (text.startsWith('@')) {
            text = text.substring(1);
        }

        return channels.filter((c) => {
            const fieldsToCheck = ['display_name', 'username', 'email', 'full_name', 'nickname'];

            let match = false;
            for (const field of fieldsToCheck) {
                if (c.hasOwnProperty(field) && c[field].toLowerCase().includes(text)) {
                    match = true;
                    break;
                }
            }

            return match;
        });
    };

    getSectionBuilders = () => ({
        unreads: {
            builder: this.buildUnreadChannelsForSearch,
            id: t('mobile.channel_list.unreads'),
            defaultMessage: 'UNREADS',
        },
        channels: {
            builder: this.buildChannelsForSearch,
            id: t('mobile.channel_list.channels'),
            defaultMessage: 'CHANNELS',
        },
        dms: {
            builder: this.buildCurrentDMSForSearch,
            id: t('sidebar.direct'),
            defaultMessage: 'DIRECT MESSAGES',
        },
        members: {
            builder: this.buildMembersForSearch,
            id: t('mobile.channel_list.members'),
            defaultMessage: 'MEMBERS',
        },
        nonmembers: {
            builder: this.buildOtherMembersForSearch,
            id: t('mobile.channel_list.not_member'),
            defaultMessage: 'NOT A MEMBER',
        },
        archived: {
            builder: this.buildArchivedForSearch,
            id: t('mobile.channel_list.archived'),
            defaultMessage: 'ARCHIVED',
        },
    });

    buildUnreadChannelsForSearch = (props, term) => {
        const {unreadChannels} = props.channels;

        return this.filterChannels(unreadChannels, term).map((item) => {
            item.isUnread = true;
            return item;
        });
    };

    buildCurrentDMSForSearch = (props, term) => {
        const {channels, currentUserId, teammateNameDisplay, profiles, pastDirectMessages, groupChannelMemberDetails} = props;
        const {favoriteChannels} = channels;

        const favoriteDms = favoriteChannels.filter((c) => {
            return c.type === General.DM_CHANNEL;
        });

        const directChannelUsers = [];
        let groupChannels = [];

        channels.directAndGroupChannels.forEach((c) => {
            if (c.type === General.DM_CHANNEL) {
                if (profiles.hasOwnProperty(c.teammate_id)) {
                    directChannelUsers.push(profiles[c.teammate_id]);
                }
            } else {
                groupChannels.push(c);
            }
        });

        const pastDirectMessageUsers = pastDirectMessages.map((p) => profiles[p]).filter((p) => typeof p !== 'undefined');

        const dms = [...directChannelUsers, ...pastDirectMessageUsers].map((u) => {
            const displayName = displayUsername(u, teammateNameDisplay, false);

            return {
                id: u.id,
                display_name: displayName,
                username: u.username,
                email: u.email,
                type: General.DM_CHANNEL,
                fake: true,
                nickname: u.nickname,
                fullname: `${u.first_name} ${u.last_name}`,
                delete_at: u.delete_at,
                name: `${currentUserId}__${u.id}`,
            };
        });

        groupChannels = groupChannels.map((channel) => {
            return {
                ...channel,
                ...groupChannelMemberDetails[channel.id],
            };
        });

        return this.filterChannels([...favoriteDms, ...dms, ...groupChannels], term).sort(sortChannelsByDisplayName.bind(null, props.intl.locale));
    }

    buildMembersForSearch = (props, term) => {
        const {channels, currentUserId, teammateNameDisplay, profiles, teamProfiles, pastDirectMessages, restrictDms} = props;
        const {favoriteChannels, unreadChannels} = channels;

        const favoriteAndUnreadDms = [...favoriteChannels, ...unreadChannels].filter((c) => {
            return c.type === General.DM_CHANNEL;
        });

        const directAndGroupChannelMembers = [...channels.directAndGroupChannels, ...favoriteAndUnreadDms].filter((c) => c.type === General.DM_CHANNEL).map((c) => c.teammate_id);

        const profilesToUse = restrictDms ? teamProfiles : profiles;

        const userNotInDirectOrGroupChannels = Object.values(profilesToUse).filter((u) => directAndGroupChannelMembers.indexOf(u.id) === -1 && pastDirectMessages.indexOf(u.id) === -1 && u.id !== currentUserId);

        const members = userNotInDirectOrGroupChannels.map((u) => {
            const displayName = displayUsername(u, teammateNameDisplay, false);

            return {
                id: u.id,
                display_name: displayName,
                username: u.username,
                email: u.email,
                name: `${currentUserId}__${u.id}`,
                type: General.DM_CHANNEL,
                fake: true,
                nickname: u.nickname,
                fullname: `${u.first_name} ${u.last_name}`,
                delete_at: u.delete_at,
            };
        });

        const fakeDms = this.filterChannels([...members], term);

        return [...fakeDms].sort(sortChannelsByDisplayName.bind(null, props.intl.locale));
    }

    buildChannelsForSearch = (props, term) => {
        const {
            favoriteChannels,
            publicChannels,
            privateChannels,
        } = props.channels;

        const favorites = favoriteChannels.filter((c) => {
            return c.type !== General.DM_CHANNEL && c.type !== General.GM_CHANNEL;
        });

        return this.filterChannels([...favorites, ...publicChannels, ...privateChannels], term).
            sort(sortChannelsByDisplayName.bind(null, props.intl.locale));
    }

    buildArchivedForSearch = (props, term) => {
        const {currentChannel, archivedChannels} = props;

        return this.filterChannels(archivedChannels.reduce((acc, channel) => {
            // when there is no search text, display an archived channel only if we are in it at the moment.
            if (term || channel.id === currentChannel.id) {
                acc.push({...channel});
            }

            return acc;
        }, []), term);
    }

    buildOtherMembersForSearch = (props, term) => {
        const {otherChannels} = props;

        const notMemberOf = otherChannels.map((o) => {
            return {
                ...o,
                fake: true,
            };
        });

        return this.filterChannels(notMemberOf, term);
    }

    buildSectionsForSearch = (props, term) => {
        const sections = [];
        const {searchOrder} = props;
        const sectionBuilders = this.getSectionBuilders();

        for (const section of searchOrder) {
            if (sectionBuilders.hasOwnProperty(section)) {
                const sectionBuilder = sectionBuilders[section];
                const {builder, defaultMessage, id} = sectionBuilder;
                const data = builder(props, term);

                if (data.length) {
                    sections.push({id, defaultMessage, data});
                }
            }
        }

        return sections;
    };

    buildData = memoize((props) => {
        if (!props.currentChannel) {
            return null;
        }
        return this.buildSectionsForSearch(props, props.term);
    }, ([props], [prevProps]) => props.term === prevProps.term);

    keyExtractor = (item) => item.id || item;

    renderItem = ({item}) => {
        const {testID} = this.props;
        const channelItemTestID = `${testID}.channel_item`;

        return (
            <ChannelItem
                testID={channelItemTestID}
                channelId={item.id}
                channel={item}
                isSearchResult={true}
                isUnread={item.isUnread}
                mentions={0}
                onSelectChannel={this.onSelectChannel}
            />
        );
    };

    renderSectionHeader = ({section}) => {
        const {intl, styles} = this.props;
        const {
            defaultMessage,
            id,
        } = section;

        return (
            <View style={styles.titleContainer}>
                <Text style={styles.title}>
                    {intl.formatMessage({id, defaultMessage}).toUpperCase()}
                </Text>
                <View style={styles.separatorContainer}>
                    <View style={styles.separator}/>
                </View>
            </View>
        );
    };

    render() {
        const {styles, testID} = this.props;
        const dataSource = this.buildData(this.props);
        return (
            <View style={styles.container}>
                <SectionList
                    sections={dataSource}
                    removeClippedSubviews={true}
                    renderItem={this.renderItem}
                    renderSectionHeader={this.renderSectionHeader}
                    keyExtractor={this.keyExtractor}
                    {...this.keyboardDismissProp}
                    keyboardShouldPersistTaps={'always'}
                    maxToRenderPerBatch={10}
                    stickySectionHeadersEnabled={true}
                    testID={testID}
                    viewabilityConfig={VIEWABILITY_CONFIG}
                />
            </View>
        );
    }
}

export default injectIntl(FilteredList);
