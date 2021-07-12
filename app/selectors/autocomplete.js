// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import * as Autocomplete from '@constants/autocomplete';
import {General} from '@mm-redux/constants';
import {getMyChannels, getOtherChannels} from '@mm-redux/selectors/entities/channels';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {
    getCurrentUser, getProfilesInCurrentChannel,
    getProfilesNotInCurrentChannel, getProfilesInCurrentTeam,
} from '@mm-redux/selectors/entities/users';
import {sortChannelsByDisplayName} from '@mm-redux/utils/channel_utils';
import {sortByUsername} from '@mm-redux/utils/user_utils';
import {getCurrentLocale} from '@selectors/i18n';

export const getMatchTermForAtMention = (() => {
    let lastMatchTerm = null;
    let lastValue;
    let lastIsSearch;
    return (value, isSearch) => {
        if (value !== lastValue || isSearch !== lastIsSearch) {
            const regex = isSearch ? Autocomplete.AT_MENTION_SEARCH_REGEX : Autocomplete.AT_MENTION_REGEX;
            let term = value;
            if (term.startsWith('from: @') || term.startsWith('from:@')) {
                term = term.replace('@', '');
            }

            const match = term.match(regex);
            lastValue = value;
            lastIsSearch = isSearch;
            if (match) {
                lastMatchTerm = (isSearch ? match[1] : match[2]).toLowerCase();
            } else {
                lastMatchTerm = null;
            }
        }
        return lastMatchTerm;
    };
})();

export const getMatchTermForChannelMention = (() => {
    let lastMatchTerm = null;
    let lastValue;
    let lastIsSearch;
    return (value, isSearch) => {
        if (value !== lastValue || isSearch !== lastIsSearch) {
            const regex = isSearch ? Autocomplete.CHANNEL_MENTION_SEARCH_REGEX : Autocomplete.CHANNEL_MENTION_REGEX;
            const match = value.match(regex);
            lastValue = value;
            lastIsSearch = isSearch;
            if (match) {
                if (isSearch) {
                    lastMatchTerm = match[1].toLowerCase();
                } else if (match.index > 0 && value[match.index - 1] === '~') {
                    lastMatchTerm = null;
                } else {
                    lastMatchTerm = match[2].toLowerCase();
                }
            } else {
                lastMatchTerm = null;
            }
        }
        return lastMatchTerm;
    };
})();

export const filterMembersInChannel = createSelector(
    getProfilesInCurrentChannel,
    (state, matchTerm) => matchTerm,
    (profilesInChannel, matchTerm) => {
        if (matchTerm === null) {
            return null;
        }

        let profiles;
        if (matchTerm) {
            profiles = profilesInChannel.filter((p) => {
                const fullName = `${p.first_name.toLowerCase()} ${p.last_name.toLowerCase()}`;
                return (p.delete_at === 0 && (
                    p.username.toLowerCase().includes(matchTerm) || p.email.toLowerCase().includes(matchTerm) ||
                    p.first_name.toLowerCase().includes(matchTerm) || p.last_name.toLowerCase().includes(matchTerm) ||
                    fullName.includes(matchTerm) ||
                    p.nickname.toLowerCase().includes(matchTerm)));
            });
        } else {
            profiles = profilesInChannel.filter((p) => p.delete_at === 0);
        }

        // already sorted
        return profiles.map((p) => p.id);
    },
);

export const filterMembersNotInChannel = createSelector(
    getProfilesNotInCurrentChannel,
    (state, matchTerm) => matchTerm,
    (profilesNotInChannel, matchTerm) => {
        if (matchTerm === null) {
            return null;
        }

        let profiles;
        if (matchTerm) {
            profiles = profilesNotInChannel.filter((p) => {
                const fullName = `${p.first_name.toLowerCase()} ${p.last_name.toLowerCase()}`;
                return (
                    p.username.toLowerCase().includes(matchTerm) ||
                    p.email.toLowerCase().includes(matchTerm) ||
                    p.first_name.toLowerCase().includes(matchTerm) ||
                    fullName.includes(matchTerm) ||
                    p.last_name.toLowerCase().includes(matchTerm) ||
                    p.nickname.toLowerCase().includes(matchTerm)
                ) && p.delete_at === 0;
            });
        } else {
            profiles = profilesNotInChannel.filter((p) => p.delete_at === 0);
        }

        return profiles.map((p) => {
            return p.id;
        });
    },
);

export const filterMembersInCurrentTeam = createSelector(
    getProfilesInCurrentTeam,
    getCurrentUser,
    (state, matchTerm) => matchTerm,
    (profilesInTeam, currentUser, matchTerm) => {
        if (matchTerm === null) {
            return null;
        }

        // FIXME: We need to include the currentUser here as is not in profilesInTeam on the redux store
        let profiles;
        if (matchTerm) {
            profiles = [...profilesInTeam, currentUser].filter((p) => {
                return (p.username.toLowerCase().includes(matchTerm) || p.email.toLowerCase().includes(matchTerm) ||
                    p.first_name.toLowerCase().includes(matchTerm) || p.last_name.toLowerCase().includes(matchTerm) ||
                    p.nickname.toLowerCase().includes(matchTerm));
            });
        } else {
            profiles = [...profilesInTeam, currentUser];
        }

        return profiles.sort(sortByUsername).map((p) => p.id);
    },
);

export const filterMyChannels = createSelector(
    getMyChannels,
    (state, opts) => opts,
    (myChannels, matchTerm) => {
        if (matchTerm === null) {
            return null;
        }

        let channels;
        if (matchTerm) {
            channels = myChannels.filter((c) => {
                return (c.type === General.OPEN_CHANNEL || c.type === General.PRIVATE_CHANNEL) &&
                    (c.name.toLowerCase().startsWith(matchTerm) || c.display_name.toLowerCase().startsWith(matchTerm));
            });
        } else {
            channels = myChannels.filter((c) => {
                return (c.type === General.OPEN_CHANNEL || c.type === General.PRIVATE_CHANNEL);
            });
        }

        return channels.map((c) => c.id);
    },
);

export const filterOtherChannels = createSelector(
    getOtherChannels,
    (state, matchTerm) => matchTerm,
    (otherChannels, matchTerm) => {
        if (matchTerm === null) {
            return null;
        }

        let channels;
        if (matchTerm) {
            channels = otherChannels.filter((c) => {
                return (c.name.toLowerCase().startsWith(matchTerm) || c.display_name.toLowerCase().startsWith(matchTerm));
            });
        } else {
            channels = otherChannels;
        }

        return channels.map((c) => c.id);
    },
);

export const filterPublicChannels = createSelector(
    getMyChannels,
    getOtherChannels,
    getCurrentLocale,
    (state, matchTerm) => matchTerm,
    getConfig,
    (myChannels, otherChannels, locale, matchTerm, config) => {
        if (matchTerm === null) {
            return null;
        }

        let channels;
        if (matchTerm) {
            channels = myChannels.filter((c) => {
                return c.type === General.OPEN_CHANNEL &&
                    (c.name.toLowerCase().startsWith(matchTerm) || c.display_name.toLowerCase().startsWith(matchTerm));
            }).concat(
                otherChannels.filter((c) => c.name.toLowerCase().startsWith(matchTerm) || c.display_name.toLowerCase().startsWith(matchTerm)),
            );
        } else {
            channels = myChannels.filter((c) => {
                return (c.type === General.OPEN_CHANNEL);
            }).concat(otherChannels);
        }

        const viewArchivedChannels = config.ExperimentalViewArchivedChannels === 'true';
        if (!viewArchivedChannels) {
            channels = channels.filter((c) => c.delete_at === 0);
        }

        return channels.sort(sortChannelsByDisplayName.bind(null, locale)).map((c) => c.id);
    },
);

export const filterPrivateChannels = createSelector(
    getMyChannels,
    (state, matchTerm) => matchTerm,
    getConfig,
    (myChannels, matchTerm, config) => {
        if (matchTerm === null) {
            return null;
        }

        let channels;
        if (matchTerm) {
            channels = myChannels.filter((c) => {
                return c.type === General.PRIVATE_CHANNEL &&
                    (c.name.toLowerCase().startsWith(matchTerm) || c.display_name.toLowerCase().startsWith(matchTerm));
            });
        } else {
            channels = myChannels.filter((c) => {
                return c.type === General.PRIVATE_CHANNEL;
            });
        }

        const viewArchivedChannels = config.ExperimentalViewArchivedChannels === 'true';
        if (!viewArchivedChannels) {
            channels = channels.filter((c) => c.delete_at === 0);
        }

        return channels.map((c) => c.id);
    },
);

export const filterDirectAndGroupMessages = createSelector(
    getMyChannels,
    (state) => state.entities.channels.channels,
    (state, matchTerm) => matchTerm,
    (myChannels, originalChannels, matchTerm) => {
        if (matchTerm === null) {
            return null;
        }
        let mt = matchTerm;
        if (matchTerm.startsWith('@')) {
            mt = matchTerm.substr(1);
        }

        let channels;
        if (mt) {
            channels = myChannels.filter((c) => {
                if (c.type === General.DM_CHANNEL && (originalChannels[c.id].display_name.toLowerCase().startsWith(mt))) {
                    return true;
                }
                if (c.type === General.GM_CHANNEL && (c.name.toLowerCase().startsWith(mt) || c.display_name.toLowerCase().replace(/ /g, '').startsWith(mt))) {
                    return true;
                }
                return false;
            });
        } else {
            channels = myChannels.filter((c) => {
                return c.type === General.DM_CHANNEL || c.type === General.GM_CHANNEL;
            });
        }

        return channels.map((c) => c.id);
    },
);

export const makeGetMatchTermForDateMention = () => {
    let lastMatchTerm = null;
    let lastValue;
    return (value) => {
        if (value !== lastValue) {
            const regex = Autocomplete.DATE_MENTION_SEARCH_REGEX;
            const match = value.match(regex);
            lastValue = value;
            if (match) {
                lastMatchTerm = match[1];
            } else {
                lastMatchTerm = null;
            }
        }
        return lastMatchTerm;
    };
};
