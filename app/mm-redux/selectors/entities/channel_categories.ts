// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';
import shallowEquals from 'shallow-equals';

import {General, Preferences} from '../../constants';
import {CategoryTypes} from '../../constants/channel_categories';

import {getCurrentChannelId, getMyChannelMemberships, makeGetChannelsForIds} from '@mm-redux/selectors/entities/channels';
import {getCurrentUserLocale} from '@mm-redux/selectors/entities/i18n';
import {getLastPostPerChannel} from '@mm-redux/selectors/entities/posts';
import {getMyPreferences, getTeammateNameDisplaySetting, shouldAutocloseDMs, getInt} from '@mm-redux/selectors/entities/preferences';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';

import {Channel, ChannelMembership} from '@mm-redux/types/channels';
import {ChannelCategory, ChannelCategoryType, CategorySorting} from '@mm-redux/types/channel_categories';
import {GlobalState} from '@mm-redux/types/store';
import {UserProfile} from '@mm-redux/types/users';
import {IDMappedObjects, RelationOneToOne} from '@mm-redux/types/utilities';

import {getUserIdFromChannelName, isUnreadChannel, isChannelMuted} from '@mm-redux/utils/channel_utils';
import {getPreferenceKey} from '@mm-redux/utils/preference_utils';
import {displayUsername} from '@mm-redux/utils/user_utils';

export function getAllCategoriesByIds(state: GlobalState) {
    return state.entities.channelCategories.byId;
}

export function getCategory(state: GlobalState, categoryId: string) {
    return getAllCategoriesByIds(state)[categoryId];
}

// getCategoryInTeamByType returns the first category found of the given type on the given team. This is intended for use
// with only non-custom types of categories.
export function getCategoryInTeamByType(state: GlobalState, teamId: string, categoryType: ChannelCategoryType) {
    return getCategoryWhere(
        state,
        (category) => category.type === categoryType && category.team_id === teamId,
    );
}

// getCategoryInTeamWithChannel returns the category on a given team containing the given channel ID.
export function getCategoryInTeamWithChannel(state: GlobalState, teamId: string, channelId: string) {
    return getCategoryWhere(
        state,
        (category) => category.team_id === teamId && category.channel_ids.includes(channelId),
    );
}

// getCategoryWhere returns the first category meeting the given condition. This should not be used with a condition
// that matches multiple categories.
export function getCategoryWhere(state: GlobalState, condition: (category: ChannelCategory) => boolean) {
    const categoriesByIds = getAllCategoriesByIds(state);

    return Object.values(categoriesByIds).find(condition);
}

export function getCategoryIdsForTeam(state: GlobalState, teamId: string): string[] {
    return state.entities.channelCategories.orderByTeam[teamId];
}

export function makeGetCategoriesForTeam(): (state: GlobalState, teamId: string) => ChannelCategory[] {
    return createSelector(
        getCategoryIdsForTeam,
        (state: GlobalState) => state.entities.channelCategories.byId,
        (categoryIds, categoriesById) => {
            if (!categoryIds) {
                return [];
            }

            return categoryIds.map((id) => categoriesById[id]);
        },
    );
}

// makeFilterArchivedChannels returns a selector that filters a given list of channels based on whether or not the channel
// is archived or is currently being viewed. The selector returns the original array if no channels are filtered out.
export function makeFilterArchivedChannels(): (state: GlobalState, channels: Channel[]) => Channel[] {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        getCurrentChannelId,
        (channels: Channel[], currentChannelId: string) => {
            const filtered = channels.filter((channel) => channel && (channel.id === currentChannelId || channel.delete_at === 0));

            return filtered.length === channels.length ? channels : filtered;
        },
    );
}

function getDefaultAutocloseCutoff() {
    return Date.now() - (7 * 24 * 60 * 60 * 1000);
}

// legacyMakeFilterAutoclosedDMs returns a selector that filters a given list of channels based on whether or not the channel has
// been autoclosed by either being an inactive DM/GM or a DM with a deactivated user. The exact requirements for being
// inactive are complicated, but they are intended to include the channel not having been opened, posted in, or viewed
// recently. The selector returns the original array if no channels are filtered out.
export function legacyMakeFilterAutoclosedDMs(getAutocloseCutoff = getDefaultAutocloseCutoff): (state: GlobalState, channels: Channel[], categoryType: string) => Channel[] {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        (state: GlobalState, channels: Channel[], categoryType: string) => categoryType,
        getMyPreferences,
        shouldAutocloseDMs,
        getCurrentChannelId,
        (state: GlobalState) => state.entities.users.profiles,
        getCurrentUserId,
        getMyChannelMemberships,
        getLastPostPerChannel,
        (channels, categoryType, myPreferences, autocloseDMs, currentChannelId, profiles, currentUserId, myMembers, lastPosts) => {
            if (categoryType !== CategoryTypes.DIRECT_MESSAGES) {
                // Only autoclose DMs that haven't been assigned to a category
                return channels;
            }

            // Ideally, this would come from a selector, but that would cause the filter to recompute too often
            const cutoff = getAutocloseCutoff();

            const filtered = channels.filter((channel) => {
                if (channel.type !== General.DM_CHANNEL && channel.type !== General.GM_CHANNEL) {
                    return true;
                }

                if (isUnreadChannel(myMembers, channel)) {
                    // Unread DMs/GMs are always visible
                    return true;
                }

                if (currentChannelId === channel.id) {
                    // The current channel is always visible
                    return true;
                }

                // viewTime is the time the channel was last viewed by the user
                const viewTimePref = myPreferences[getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel.id)];
                const viewTime = parseInt(viewTimePref ? viewTimePref.value! : '0', 10);

                // Recently viewed channels will never be hidden. Note that viewTime is not set correctly at the time of writing.
                if (viewTime > cutoff) {
                    return true;
                }

                // openTime is the time the channel was last opened (like from the More DMs list) after having been closed
                const openTimePref = myPreferences[getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel.id)];
                const openTime = parseInt(openTimePref ? openTimePref.value! : '0', 10);

                // DMs with deactivated users will be visible if you're currently viewing them and they were opened
                // since the user was deactivated
                if (channel.type === General.DM_CHANNEL) {
                    const teammateId = getUserIdFromChannelName(currentUserId, channel.name);
                    const teammate = profiles[teammateId];

                    if (!teammate || teammate.delete_at > openTime) {
                        return false;
                    }
                }

                // Skip the rest of the checks if autoclosing inactive DMs is disabled
                if (!autocloseDMs) {
                    return true;
                }

                // Keep the channel open if it had a recent post. If we have posts loaded for the channel, use the create_at
                // of the last post in the channel since channel.last_post_at isn't kept up to date on the client. If we don't
                // have posts loaded, then fall back to the last_post_at.
                const lastPost = lastPosts[channel.id];

                if (lastPost && lastPost.create_at > cutoff) {
                    return true;
                }

                if (openTime > cutoff) {
                    return true;
                }

                if (channel.last_post_at && channel.last_post_at > cutoff) {
                    return true;
                }

                return false;
            });

            return filtered.length === channels.length ? channels : filtered;
        },
    );
}

export function makeFilterAutoclosedDMs(): (state: GlobalState, channels: Channel[], categoryType: string) => Channel[] {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        (state: GlobalState, channels: Channel[], categoryType: string) => categoryType,
        getCurrentChannelId,
        (state: GlobalState) => state.entities.users.profiles,
        getCurrentUserId,
        getMyChannelMemberships,
        (state: GlobalState) => getInt(state, Preferences.CATEGORY_SIDEBAR_SETTINGS, Preferences.LIMIT_VISIBLE_DMS_GMS, 20),
        getMyPreferences,
        (channels, categoryType, currentChannelId, profiles, currentUserId, myMembers, limitPref, myPreferences) => {
            if (categoryType !== CategoryTypes.DIRECT_MESSAGES) {
                // Only autoclose DMs that haven't been assigned to a category
                return channels;
            }

            const getTimestampFromPrefs = (category: string, name: string) => {
                const pref = myPreferences[getPreferenceKey(category, name)];
                return parseInt(pref ? pref.value! : '0', 10);
            };
            const getLastViewedAt = (channel: Channel) => {
                // The server only ever sets the last_viewed_at to the time of the last post in channel, so we may need
                // to use the preferences added for the previous version of autoclosing DMs.
                return Math.max(
                    myMembers[channel.id]?.last_viewed_at,
                    getTimestampFromPrefs(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel.id),
                    getTimestampFromPrefs(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel.id),
                );
            };

            let unreadCount = 0;
            let visibleChannels = channels.filter((channel) => {
                if (isUnreadChannel(myMembers, channel)) {
                    unreadCount++;

                    // Unread DMs/GMs are always visible
                    return true;
                }

                if (channel.id === currentChannelId) {
                    return true;
                }

                // DMs with deactivated users will be visible if you're currently viewing them and they were opened
                // since the user was deactivated
                if (channel.type === General.DM_CHANNEL) {
                    const teammateId = getUserIdFromChannelName(currentUserId, channel.name);
                    const teammate = profiles[teammateId];

                    const lastViewedAt = getLastViewedAt(channel);

                    if (!teammate || teammate.delete_at > lastViewedAt) {
                        return false;
                    }
                }

                return true;
            });

            visibleChannels.sort((channelA, channelB) => {
                // Should always prioritise the current channel
                if (channelA.id === currentChannelId) {
                    return -1;
                } else if (channelB.id === currentChannelId) {
                    return 1;
                }

                // Second priority is for unread channels
                if (isUnreadChannel(myMembers, channelA) && !isUnreadChannel(myMembers, channelB)) {
                    return -1;
                } else if (!isUnreadChannel(myMembers, channelA) && isUnreadChannel(myMembers, channelB)) {
                    return 1;
                }

                // Third priority is last_viewed_at
                const channelAlastViewed = getLastViewedAt(channelA) || 0;
                const channelBlastViewed = getLastViewedAt(channelB) || 0;

                if (channelAlastViewed > channelBlastViewed) {
                    return -1;
                } else if (channelBlastViewed > channelAlastViewed) {
                    return 1;
                }

                return 0;
            });

            // The limit of DMs user specifies to be rendered in the sidebar
            const remaining = Math.max(limitPref, unreadCount);
            visibleChannels = visibleChannels.slice(0, remaining);

            const visibleChannelsSet = new Set(visibleChannels);
            const filteredChannels = channels.filter((channel) => visibleChannelsSet.has(channel));

            return filteredChannels.length === channels.length ? channels : filteredChannels;
        },
    );
}

export function makeFilterManuallyClosedDMs(): (state: GlobalState, channels: Channel[]) => Channel[] {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        getMyPreferences,
        getCurrentChannelId,
        getCurrentUserId,
        getMyChannelMemberships,
        (channels, myPreferences, currentChannelId, currentUserId, myMembers) => {
            const filtered = channels.filter((channel) => {
                let preference;

                if (channel.type !== General.DM_CHANNEL && channel.type !== General.GM_CHANNEL) {
                    return true;
                }

                if (isUnreadChannel(myMembers, channel)) {
                    // Unread DMs/GMs are always visible
                    return true;
                }

                if (currentChannelId === channel.id) {
                    // The current channel is always visible
                    return true;
                }

                if (channel.type === General.DM_CHANNEL) {
                    const teammateId = getUserIdFromChannelName(currentUserId, channel.name);

                    preference = myPreferences[getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, teammateId)];
                } else {
                    preference = myPreferences[getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channel.id)];
                }

                return preference && preference.value !== 'false';
            });

            // Only return a new array if anything was removed
            return filtered.length === channels.length ? channels : filtered;
        },
    );
}

export function makeCompareChannels(getDisplayName: (channel: Channel) => string, locale: string, myMembers: RelationOneToOne<Channel, ChannelMembership>) {
    return (a: Channel, b: Channel) => {
        // Sort muted channels last
        const aMuted = isChannelMuted(myMembers[a.id]);
        const bMuted = isChannelMuted(myMembers[b.id]);

        if (aMuted && !bMuted) {
            return 1;
        } else if (!aMuted && bMuted) {
            return -1;
        }

        // And then sort alphabetically
        return getDisplayName(a).localeCompare(getDisplayName(b), locale, {numeric: true});
    };
}

export function makeSortChannelsByName(): (state: GlobalState, channels: Channel[]) => Channel[] {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        (state: GlobalState) => getCurrentUserLocale(state),
        getMyChannelMemberships,
        (channels: Channel[], locale: string, myMembers: RelationOneToOne<Channel, ChannelMembership>) => {
            const getDisplayName = (channel: Channel) => channel.display_name;

            return [...channels].sort(makeCompareChannels(getDisplayName, locale, myMembers));
        },
    );
}

export function makeSortChannelsByNameWithDMs(): (state: GlobalState, channels: Channel[]) => Channel[] {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        getCurrentUserId,
        (state: GlobalState) => state.entities.users.profiles,
        getTeammateNameDisplaySetting,
        (state: GlobalState) => getCurrentUserLocale(state),
        getMyChannelMemberships,
        (channels: Channel[], currentUserId: string, profiles: IDMappedObjects<UserProfile>, teammateNameDisplay: string, locale: string, myMembers: RelationOneToOne<Channel, ChannelMembership>) => {
            const cachedNames: RelationOneToOne<Channel, string> = {};

            const getDisplayName = (channel: Channel): string => {
                if (cachedNames[channel.id]) {
                    return cachedNames[channel.id];
                }

                let displayName;

                // TODO it might be easier to do this by using channel members to find the users
                if (channel.type === General.DM_CHANNEL) {
                    const teammateId = getUserIdFromChannelName(currentUserId, channel.name);
                    const teammate = profiles[teammateId];

                    displayName = displayUsername(teammate, teammateNameDisplay, false);
                } else if (channel.type === General.GM_CHANNEL) {
                    const usernames = channel.display_name.split(', ');

                    const userDisplayNames = [];
                    for (const username of usernames) {
                        const user = Object.values(profiles).find((profile) => profile.username === username);

                        if (!user) {
                            continue;
                        }

                        if (user.id === currentUserId) {
                            continue;
                        }

                        userDisplayNames.push(displayUsername(user, teammateNameDisplay, false));
                    }

                    displayName = userDisplayNames.sort((a, b) => a.localeCompare(b, locale, {numeric: true})).join(', ');
                } else {
                    displayName = channel.display_name;
                }

                cachedNames[channel.id] = displayName;

                return displayName;
            };

            return [...channels].sort(makeCompareChannels(getDisplayName, locale, myMembers));
        },
    );
}

export function makeSortChannelsByRecency(): (state: GlobalState, channels: Channel[]) => Channel[] {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        getLastPostPerChannel,
        (channels, lastPosts) => {
            return [...channels].sort((a, b) => {
                // If available, get the last post time from the loaded posts for the channel, but fall back to the
                // channel's last_post_at if that's not available. The last post time from the loaded posts is more
                // accurate because channel.last_post_at is not updated on the client as new messages come in.

                let aLastPostAt = a.last_post_at;
                if (lastPosts[a.id] && lastPosts[a.id].create_at > a.last_post_at) {
                    aLastPostAt = lastPosts[a.id].create_at;
                }

                let bLastPostAt = b.last_post_at;
                if (lastPosts[b.id] && lastPosts[b.id].create_at > b.last_post_at) {
                    bLastPostAt = lastPosts[b.id].create_at;
                }

                return bLastPostAt - aLastPostAt;
            });
        },
    );
}

export function makeSortChannels() {
    const sortChannelsByName = makeSortChannelsByName();
    const sortChannelsByNameWithDMs = makeSortChannelsByNameWithDMs();
    const sortChannelsByRecency = makeSortChannelsByRecency();

    return (state: GlobalState, originalChannels: Channel[], category: ChannelCategory) => {
        let channels = originalChannels;

        // While this function isn't memoized, sortChannelsByX should be since they know what parts of state
        // will affect sort order.

        if (category.sorting === CategorySorting.Recency) {
            channels = sortChannelsByRecency(state, channels);
        } else if (category.sorting === CategorySorting.Alphabetical || category.sorting === CategorySorting.Default) {
            if (channels.some((channel) => channel.type === General.DM_CHANNEL || channel.type === General.GM_CHANNEL)) {
                channels = sortChannelsByNameWithDMs(state, channels);
            } else {
                channels = sortChannelsByName(state, channels);
            }
        }

        return channels;
    };
}

export function makeGetChannelIdsForCategory() {
    const getChannels = makeGetChannelsForIds();
    const filterAndSortChannelsForCategory = makeFilterAndSortChannelsForCategory();

    let lastChannelIds: string[] = [];

    return (state: GlobalState, category: ChannelCategory) => {
        const channels = getChannels(state, category.channel_ids);

        const filteredChannelIds = filterAndSortChannelsForCategory(state, channels, category).map((channel) => channel.id);

        if (shallowEquals(filteredChannelIds, lastChannelIds)) {
            return lastChannelIds;
        }

        lastChannelIds = filteredChannelIds;
        return lastChannelIds;
    };
}

// Returns a selector that takes an array of channels and the category they belong to and returns the array sorted and
// with inactive DMs/GMs and archived channels filtered out.
export function makeFilterAndSortChannelsForCategory() {
    const filterArchivedChannels = makeFilterArchivedChannels();
    const filterAutoclosedDMs = makeFilterAutoclosedDMs();

    const filterManuallyClosedDMs = makeFilterManuallyClosedDMs();

    const sortChannels = makeSortChannels();

    return (state: GlobalState, originalChannels: Channel[], category: ChannelCategory) => {
        let channels = originalChannels;

        channels = filterArchivedChannels(state, channels);
        channels = filterManuallyClosedDMs(state, channels);

        channels = filterAutoclosedDMs(state, channels, category.type);

        channels = sortChannels(state, channels, category);

        return channels;
    };
}

export function makeGetChannelsByCategory() {
    const getCategoriesForTeam = makeGetCategoriesForTeam();

    // Memoize by category. As long as the categories don't change, we can keep using the same selectors for each category.
    let getChannels: RelationOneToOne<ChannelCategory, ReturnType<typeof makeGetChannelsForIds>>;
    let filterAndSortChannels: RelationOneToOne<ChannelCategory, ReturnType<typeof makeFilterAndSortChannelsForCategory>>;

    let lastCategoryIds: ReturnType<typeof getCategoryIdsForTeam> = [];
    let lastChannelsByCategory: RelationOneToOne<ChannelCategory, Channel[]> = {};

    return (state: GlobalState, teamId: string) => {
        const categoryIds = getCategoryIdsForTeam(state, teamId);

        // Create an instance of filterAndSortChannels for each category. As long as we don't add or remove new categories,
        // we can reuse these selectors to memoize the results of each category. This will also create new selectors when
        // categories are reordered, but that should be rare enough that it won't meaningfully affect performance.
        if (categoryIds !== lastCategoryIds) {
            lastCategoryIds = categoryIds;
            lastChannelsByCategory = {};

            getChannels = {};
            filterAndSortChannels = {};

            if (categoryIds) {
                for (const categoryId of categoryIds) {
                    getChannels[categoryId] = makeGetChannelsForIds();
                    filterAndSortChannels[categoryId] = makeFilterAndSortChannelsForCategory();
                }
            }
        }

        const categories = getCategoriesForTeam(state, teamId);

        const channelsByCategory: RelationOneToOne<ChannelCategory, Channel[]> = {};

        for (const category of categories) {
            const channels = getChannels[category.id](state, category.channel_ids);
            channelsByCategory[category.id] = filterAndSortChannels[category.id](state, channels, category);
        }

        // Do a shallow equality check of channelsByCategory to avoid returning a new object containing the same data
        if (shallowEquals(channelsByCategory, lastChannelsByCategory)) {
            return lastChannelsByCategory;
        }

        lastChannelsByCategory = channelsByCategory;
        return channelsByCategory;
    };
}
