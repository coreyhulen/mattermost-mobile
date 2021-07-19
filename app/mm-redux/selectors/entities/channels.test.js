// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from '@mm-redux/utils/deep_freeze';
import TestHelper from 'test/test_helper';
import {sortChannelsByDisplayName, getDirectChannelName} from '@mm-redux/utils/channel_utils';
import * as Selectors from '@mm-redux/selectors/entities/channels';
import {General, Preferences} from '../../constants';

const sortUsernames = (a, b) => a.localeCompare(b, General.DEFAULT_LOCALE, {numeric: true});

describe('Selectors.Channels.getChannelsInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    it('should return channels in current team', () => {
        const user = TestHelper.fakeUserWithId();

        const profiles = {
            [user.id]: user,
        };

        const channel1 = TestHelper.fakeChannelWithId(team1.id);
        const channel2 = TestHelper.fakeChannelWithId(team2.id);
        const channel3 = TestHelper.fakeChannelWithId(team1.id);
        const channel4 = TestHelper.fakeChannelWithId('');

        const channels = {
            [channel1.id]: channel1,
            [channel2.id]: channel2,
            [channel3.id]: channel3,
            [channel4.id]: channel4,
        };

        const channelsInTeam = {
            [team1.id]: [channel1.id, channel3.id],
            [team2.id]: [channel2.id],
            '': [channel4.id],
        };

        const testState = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: user.id,
                    profiles,
                },
                teams: {
                    currentTeamId: team1.id,
                },
                channels: {
                    channels,
                    channelsInTeam,
                },
            },
        });

        const channelsInCurrentTeam = [channel1, channel3].sort(sortChannelsByDisplayName.bind(null, []));
        assert.deepEqual(Selectors.getChannelsInCurrentTeam(testState), channelsInCurrentTeam);
    });

    it('should order by user locale', () => {
        const userDe = {
            ...TestHelper.fakeUserWithId(),
            locale: 'de',
        };
        const userSv = {
            ...TestHelper.fakeUserWithId(),
            locale: 'sv',
        };

        const profilesDe = {
            [userDe.id]: userDe,
        };
        const profilesSv = {
            [userSv.id]: userSv,
        };

        const channel1 = {
            ...TestHelper.fakeChannelWithId(team1.id),
            display_name: 'z',
        };
        const channel2 = {
            ...TestHelper.fakeChannelWithId(team1.id),
            display_name: 'ä',
        };

        const channels = {
            [channel1.id]: channel1,
            [channel2.id]: channel2,
        };

        const channelsInTeam = {
            [team1.id]: [channel1.id, channel2.id],
        };

        const testStateDe = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userDe.id,
                    profiles: profilesDe,
                },
                teams: {
                    currentTeamId: team1.id,
                },
                channels: {
                    channels,
                    channelsInTeam,
                },
            },
        });

        const testStateSv = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userSv.id,
                    profiles: profilesSv,
                },
                teams: {
                    currentTeamId: team1.id,
                },
                channels: {
                    channels,
                    channelsInTeam,
                },
            },
        });

        const channelsInCurrentTeamDe = [channel1, channel2].sort(sortChannelsByDisplayName.bind(null, userDe.locale));
        const channelsInCurrentTeamSv = [channel1, channel2].sort(sortChannelsByDisplayName.bind(null, userSv.locale));

        assert.deepEqual(Selectors.getChannelsInCurrentTeam(testStateDe), channelsInCurrentTeamDe);
        assert.deepEqual(Selectors.getChannelsInCurrentTeam(testStateSv), channelsInCurrentTeamSv);
    });
});

describe('Selectors.Channels.getMyChannels', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const profiles = {
        [user.id]: user,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        display_name: 'Channel Name',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(''),
        display_name: 'Channel Name',
        type: General.DM_CHANNEL,
        name: getDirectChannelName(user.id, user2.id),
    };
    const channel5 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: [user.username, user2.username, user3.username].join(', '),
        type: General.GM_CHANNEL,
        name: '',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
        [channel5.id]: channel5,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel3.id],
        [team2.id]: [channel2.id],
        '': [channel4.id, channel5.id],
    };

    const myMembers = {
        [channel1.id]: {},
        [channel3.id]: {},
        [channel4.id]: {},
        [channel5.id]: {},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
                statuses: {},
                profilesInChannel: {
                    [channel4.id]: new Set([user.id, user2.id]),
                    [channel5.id]: new Set([user.id, user2.id, user3.id]),
                },
            },
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                channelsInTeam,
                myMembers,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('get my channels in current team and DMs', () => {
        const channelsInCurrentTeam = [channel1, channel3].sort(sortChannelsByDisplayName.bind(null, []));
        assert.deepEqual(Selectors.getMyChannels(testState), [
            ...channelsInCurrentTeam,
            {...channel4, display_name: user2.username, status: 'offline', teammate_id: user2.id},
            {...channel5, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
        ]);
    });
});

describe('Selectors.Channels.getMembersInCurrentChannel', () => {
    const channel1 = TestHelper.fakeChannelWithId('');

    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const membersInChannel = {
        [channel1.id]: {
            [user.id]: {},
            [user2.id]: {},
            [user3.id]: {},
        },
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                currentChannelId: channel1.id,
                membersInChannel,
            },
        },
    });

    it('should return members in current channel', () => {
        assert.deepEqual(Selectors.getMembersInCurrentChannel(testState), membersInChannel[channel1.id]);
    });
});

describe('Selectors.Channels.getOtherChannels', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const user = TestHelper.fakeUserWithId();

    const profiles = {
        [user.id]: user,
    };

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
        type: General.OPEN_CHANNEL,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        display_name: 'Channel Name',
        type: General.OPEN_CHANNEL,
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
        type: General.PRIVATE_CHANNEL,
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(''),
        display_name: 'Channel Name',
        type: General.DM_CHANNEL,
    };
    const channel5 = {
        ...TestHelper.fakeChannelWithId(''),
        display_name: 'Channel Name',
        type: General.OPEN_CHANNEL,
        delete_at: 444,
    };
    const channel6 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
        type: General.OPEN_CHANNEL,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
        [channel5.id]: channel5,
        [channel6.id]: channel6,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel3.id, channel5.id, channel6.id],
        [team2.id]: [channel2.id],
        '': [channel4.id],
    };

    const myMembers = {
        [channel4.id]: {},
        [channel6.id]: {},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
            },
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                channelsInTeam,
                myMembers,
            },
        },
    });

    it('get public channels not member of', () => {
        assert.deepEqual(Selectors.getOtherChannels(testState), [channel1, channel5].sort(sortChannelsByDisplayName.bind(null, [])));
    });

    it('get public, unarchived channels not member of', () => {
        assert.deepEqual(Selectors.getOtherChannels(testState, false), [channel1]);
    });
});

describe('Selectors.Channels.getArchivedChannels', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const user = TestHelper.fakeUserWithId();

    const profiles = {
        [user.id]: user,
    };

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
        type: General.OPEN_CHANNEL,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        display_name: 'Channel Name',
        type: General.OPEN_CHANNEL,
        delete_at: 222,
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
        type: General.PRIVATE_CHANNEL,
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(''),
        display_name: 'Channel Name',
        type: General.DM_CHANNEL,
    };
    const channel5 = {
        ...TestHelper.fakeChannelWithId(''),
        display_name: 'Channel Name',
        type: General.OPEN_CHANNEL,
        delete_at: 555,
    };
    const channel6 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
        type: General.OPEN_CHANNEL,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
        [channel5.id]: channel5,
        [channel6.id]: channel6,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel3.id, channel5.id, channel6.id],
        [team2.id]: [channel2.id],
        '': [channel4.id],
    };

    const myMembers = {
        [channel4.id]: {},
        [channel5.id]: {},
        [channel6.id]: {},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
            },
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                channelsInTeam,
                myMembers,
            },
        },
    });

    it('get archived channels that user is member of', () => {
        assert.deepEqual(Selectors.getArchivedChannels(testState), [channel5]);
    });
});

describe('Selectors.Channels.getChannel', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const profiles = {
        [user.id]: user,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        type: General.DM_CHANNEL,
        name: getDirectChannelName(user.id, user2.id),
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        type: General.GM_CHANNEL,
        display_name: [user.username, user2.username, user3.username].join(', '),
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
                statuses: {},
                profilesInChannel: {
                    [channel2.id]: new Set([user.id, user2.id]),
                    [channel3.id]: new Set([user.id, user2.id, user3.id]),
                },
            },
            channels: {
                channels,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('get channel', () => {
        assert.deepEqual(Selectors.getChannel(testState, channel1.id), channel1);
    });
    it('get channel as Direct Channel', () => {
        assert.deepEqual(Selectors.getChannel(testState, channel2.id), {...channel2, display_name: user2.username, status: 'offline', teammate_id: user2.id});
    });
    it('get channel as Group Message Channel', () => {
        assert.deepEqual(Selectors.getChannel(testState, channel3.id), {...channel3, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')});
    });
});

describe('Selectors.Channels.getChannelByName', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: 'ch1',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        name: 'ch2',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: 'ch3',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                channels,
            },
        },
    });
    it('get first channel that matches by name', () => {
        assert.deepEqual(Selectors.getChannelByName(testState, channel3.name), channel3);
    });

    it('return null if no channel matches by name', () => {
        assert.deepEqual(Selectors.getChannelByName(testState, 'noChannel'), null);
    });
});

describe('Selectors.Channels.getChannelsNameMapInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: 'Ch1',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        name: 'Ch2',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        name: 'Ch3',
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: 'Ch4',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel4.id],
        [team2.id]: [channel2.id, channel3.id],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                channelsInTeam,
            },
        },
    });

    it('get channel map for current team', () => {
        const channelMap = {
            [channel1.name]: channel1,
            [channel4.name]: channel4,
        };
        assert.deepEqual(Selectors.getChannelsNameMapInCurrentTeam(testState), channelMap);
    });
});

describe('Selectors.Channels.getChannelsNameMapInTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: 'Ch1',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        name: 'Ch2',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        name: 'Ch3',
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: 'Ch4',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel4.id],
        [team2.id]: [channel2.id, channel3.id],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                channels,
                channelsInTeam,
            },
        },
    });
    it('get channel map for team', () => {
        const channelMap = {
            [channel1.name]: channel1,
            [channel4.name]: channel4,
        };
        assert.deepEqual(Selectors.getChannelsNameMapInTeam(testState, team1.id), channelMap);
    });
    it('get empty map for non-existing team', () => {
        assert.deepEqual(Selectors.getChannelsNameMapInTeam(testState, 'junk'), {});
    });
});

describe('Selectors.Channels.getChannelsWithUnreadSection', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const profiles = {
        [user.id]: user,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
        display_name: 'Channel Name',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        type: General.PRIVATE_CHANNEL,
        display_name: 'Channel Name',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
        display_name: 'Channel Name',
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(''),
        type: General.DM_CHANNEL,
        display_name: 'Channel Name',
        name: getDirectChannelName(user.id, user2.id),
    };
    const channel5 = {
        ...TestHelper.fakeChannelWithId(''),
        type: General.GM_CHANNEL,
        display_name: [user.username, user2.username, user3.username].join(', '),
        name: '',
        total_msg_count: 2,
    };
    const channel6 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
        display_name: 'Channel Name',
    };
    const channel7 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.PRIVATE_CHANNEL,
        display_name: 'Channel Name',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
        [channel5.id]: channel5,
        [channel6.id]: channel6,
        [channel7.id]: channel7,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel3.id, channel6.id, channel7.id],
        [team2.id]: [channel2.id],
        '': [channel4.id, channel5.id],
    };

    const myMembers = {
        [channel1.id]: {msg_count: 1, mention_count: 1},
        [channel3.id]: {msg_count: 0, mention_count: 0},
        [channel4.id]: {msg_count: 0, mention_count: 1},
        [channel5.id]: {msg_count: 1, mention_count: 0},
        [channel6.id]: {msg_count: 0, mention_count: 0},
        [channel7.id]: {msg_count: 0, mention_count: 0},
    };

    const myPreferences = {
        [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel1.id}`]: {
            value: 'true',
        },
        [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel3.id}`]: {
            value: 'true',
        },
        [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel4.id}`]: {
            value: 'false',
        },
        [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel5.id}`]: {
            value: 'true',
        },
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
                statuses: {},
                profilesInChannel: {
                    [channel4.id]: new Set([user.id, user2.id]),
                    [channel5.id]: new Set([user.id, user2.id, user3.id]),
                },
            },
            teams: {
                currentTeamId: team1.id,
            },
            posts: {
                posts: {},
                postsInChannel: {},
            },
            channels: {
                currentChannelId: channel1.id,
                channels,
                channelsInTeam,
                myMembers,
            },
            preferences: {
                myPreferences,
            },
            general: {
                config: {},
            },
        },
    });

    it('get channels by category including unreads', () => {
        const categories = Selectors.getChannelsWithUnreadSection(testState);
        const {
            unreadChannels,
            favoriteChannels,
            publicChannels,
            privateChannels,
            directAndGroupChannels,
        } = categories;

        assert.equal(unreadChannels.length, 3);
        assert.equal(favoriteChannels.length, 1);
        assert.equal(publicChannels.length, 1);
        assert.equal(privateChannels.length, 1);
        assert.equal(directAndGroupChannels.length, 0);
    });
});

describe('Selectors.Channels.getGroupChannels', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const profiles = {
        [user.id]: user,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
        display_name: 'Channel Name',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.PRIVATE_CHANNEL,
        display_name: 'Channel Name',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(''),
        type: General.GM_CHANNEL,
        display_name: [user.username, user3.username].join(', '),
        name: '',
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(''),
        type: General.DM_CHANNEL,
        display_name: 'Channel Name',
        name: getDirectChannelName(user.id, user2.id),
    };
    const channel5 = {
        ...TestHelper.fakeChannelWithId(''),
        type: General.GM_CHANNEL,
        display_name: [user.username, user2.username, user3.username].join(', '),
        name: '',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
        [channel5.id]: channel5,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
        '': [channel3.id, channel4.id, channel5.id],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
                statuses: {},
                profilesInChannel: {
                    [channel3.id]: new Set([user.id, user3.id]),
                    [channel4.id]: new Set([user.id, user2.id]),
                    [channel5.id]: new Set([user.id, user2.id, user3.id]),
                },
            },
            channels: {
                channels,
                channelsInTeam,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('get group channels', () => {
        assert.deepEqual(Selectors.getGroupChannels(testState), [
            {...channel3, display_name: [user3.username].sort(sortUsernames).join(', ')},
            {...channel5, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
        ]);
    });
});

describe('Selectors.Channels.getChannelIdsInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    const channel3 = TestHelper.fakeChannelWithId(team2.id);
    const channel4 = TestHelper.fakeChannelWithId(team2.id);
    const channel5 = TestHelper.fakeChannelWithId('');

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
        [team2.id]: [channel3.id, channel4.id],
        // eslint-disable-next-line no-useless-computed-key
        ['']: [channel5.id],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channelsInTeam,
            },
        },
    });

    it('get channel ids in current team strict equal', () => {
        const newChannel = TestHelper.fakeChannelWithId(team2.id);
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channelsInTeam: {
                        ...testState.entities.channels.channelsInTeam,
                        [team2.id]: [
                            ...testState.entities.channels.channelsInTeam[team2.id],
                            newChannel.id,
                        ],
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getChannelIdsInCurrentTeam(testState);
        const fromModifiedState = Selectors.getChannelIdsInCurrentTeam(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);

        // it should't have a direct channel
        assert.equal(fromModifiedState.includes(channel5.id), false, 'should not have direct channel on a team');
    });
});

describe('Selectors.Channels.getChannelIdsForCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    const channel3 = TestHelper.fakeChannelWithId(team2.id);
    const channel4 = TestHelper.fakeChannelWithId(team2.id);
    const channel5 = TestHelper.fakeChannelWithId('');

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
        [team2.id]: [channel3.id, channel4.id],
        // eslint-disable-next-line no-useless-computed-key
        ['']: [channel5.id],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channelsInTeam,
            },
        },
    });

    it('get channel ids for current team strict equal', () => {
        const anotherChannel = TestHelper.fakeChannelWithId(team2.id);
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channelsInTeam: {
                        ...testState.entities.channels.channelsInTeam,
                        [team2.id]: [
                            ...testState.entities.channels.channelsInTeam[team2.id],
                            anotherChannel.id,
                        ],
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getChannelIdsForCurrentTeam(testState);
        const fromModifiedState = Selectors.getChannelIdsForCurrentTeam(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);

        // it should have a direct channel
        assert.ok(fromModifiedState.includes(channel5.id));
    });
});

describe('Selectors.Channels.isCurrentChannelFavorite', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);

    const myPreferences = {
        [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel1.id}`]: {
            name: channel1.id,
            category: Preferences.CATEGORY_FAVORITE_CHANNEL,
            value: 'true',
        },
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                currentChannelId: channel1.id,
            },
            preferences: {
                myPreferences,
            },
        },
    });

    it('isCurrentChannelFavorite', () => {
        assert.ok(Selectors.isCurrentChannelFavorite(testState) === true);

        const newState = {
            entities: {
                channels: {
                    currentChannelId: channel2.id,
                },
                preferences: {
                    myPreferences,
                },
            },
        };
        assert.ok(Selectors.isCurrentChannelFavorite(newState) === false);
    });
});

describe('Selectors.Channels.isCurrentChannelMuted', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);

    const myMembers = {
        [channel1.id]: {channel_id: channel1.id},
        [channel2.id]: {channel_id: channel2.id, notify_props: {mark_unread: 'mention'}},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                currentChannelId: channel1.id,
                myMembers,
            },
        },
    });

    it('isCurrentChannelMuted', () => {
        assert.ok(Selectors.isCurrentChannelMuted(testState) === false);

        const newState = {
            entities: {
                channels: {
                    ...testState.entities.channels,
                    currentChannelId: channel2.id,
                },
            },
        };
        assert.ok(Selectors.isCurrentChannelMuted(newState) === true);
    });
});

describe('Selectors.Channels.isCurrentChannelArchived', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        delete_at: 1,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                currentChannelId: channel1.id,
                channels,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('isCurrentChannelArchived', () => {
        assert.ok(Selectors.isCurrentChannelArchived(testState) === false);

        const newState = {
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    currentChannelId: channel2.id,
                },
            },
        };

        assert.ok(Selectors.isCurrentChannelArchived(newState) === true);
    });
});

describe('Selectors.Channels.isCurrentChannelDefault', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: General.DEFAULT_CHANNEL,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                currentChannelId: channel1.id,
                channels,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('isCurrentChannelDefault', () => {
        assert.ok(Selectors.isCurrentChannelDefault(testState) === false);

        const newState = {
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    currentChannelId: channel2.id,
                },
            },
        };

        assert.ok(Selectors.isCurrentChannelDefault(newState) === true);
    });
});

describe('Selectors.Channels.getSortedFavoriteChannelWithUnreadsIds', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
        // eslint-disable-next-line no-useless-computed-key
        ['']: [],
    };

    const myMembers = {
        [channel1.id]: {channel_id: channel1.id},
        [channel2.id]: {channel_id: channel2.id},
    };

    const user1 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
    };

    const myPreferences = {
        [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel1.id}`]: {
            name: channel1.id,
            value: 'true',
        },
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                currentChannelId: channel1.id,
                channels,
                myMembers,
                channelsInTeam,
            },
            users: {
                profiles,
                currentUserId: user1.id,
            },
            posts: {
                posts: {},
                postsInChannel: {},
            },
            preferences: {
                myPreferences,
            },
            general: {
                config: {},
            },
        },
    });

    it('Should not include deleted users in favorites', () => {
        const newDmChannel = TestHelper.fakeDmChannel(user1.id, 'newfakeId');
        newDmChannel.total_msg_count = 1;
        newDmChannel.display_name = '';
        newDmChannel.name = getDirectChannelName(user1.id, 'newfakeId');

        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [newDmChannel.id]: newDmChannel,
                    },
                    channelsInTeam: {
                        ...testState.entities.channels.channelsInTeam,
                        '': [
                            ...testState.entities.channels.channelsInTeam[''],
                            newDmChannel.id,
                        ],
                    },
                    myMembers: {
                        ...testState.entities.channels.myMembers,
                        [newDmChannel.id]: {channel_id: newDmChannel.id, user_id: user1.id, msg_count: 1, mention_count: 0, notifyProps: {}},
                    },
                },
                preferences: {
                    myPreferences: {
                        ...testState.entities.preferences.myPreferences,
                        [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${newDmChannel.id}`]: {
                            name: newDmChannel.id,
                            category: Preferences.CATEGORY_FAVORITE_CHANNEL,
                            value: 'true',
                        },
                        [`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--newfakeId`]: {
                            category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW,
                            name: 'newfakeId',
                            value: 'true',
                        },
                    },
                },
            },

        };
        const fromOriginalState = Selectors.getSortedFavoriteChannelWithUnreadsIds(testState);
        const fromModifiedState = Selectors.getSortedFavoriteChannelWithUnreadsIds(newState);
        assert.ok(fromOriginalState.length === 1);
        assert.ok(fromModifiedState.length === 1);
    });
});

describe('Selectors.Channels.getChannelsWithUserProfiles', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = {
        ...TestHelper.fakeChannelWithId(''),
        type: General.GM_CHANNEL,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id],
        // eslint-disable-next-line no-useless-computed-key
        ['']: [channel2.id],
    };

    const user1 = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const profilesInChannel = {
        [channel1.id]: new Set([user1.id, user2.id]),
        [channel2.id]: new Set([user1.id, user2.id, user3.id]),
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                channels,
                channelsInTeam,
            },
            users: {
                currentUserId: user1.id,
                profiles,
                profilesInChannel,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('getChannelsWithUserProfiles', () => {
        const channelWithUserProfiles = Selectors.getChannelsWithUserProfiles(testState);
        assert.equal(channelWithUserProfiles.length, 1);
        assert.equal(channelWithUserProfiles[0].profiles.length, 2);
    });
});

describe('Selectors.Channels.getRedirectChannelNameForTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const teams = {
        [team1.id]: team1,
        [team2.id]: team2,
    };

    const myTeamMembers = {
        [team1.id]: {},
        [team2.id]: {},
    };

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    const channel3 = TestHelper.fakeChannelWithId(team1.id);

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
    };

    const user1 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
    };

    const myChannelMembers = {
        [channel1.id]: {channel_id: channel1.id},
        [channel2.id]: {channel_id: channel2.id},
        [channel3.id]: {channel_id: channel3.id},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                teams,
                myMembers: myTeamMembers,
            },
            channels: {
                channels,
                myMembers: myChannelMembers,
            },
            users: {
                currentUserId: user1.id,
                profiles,
            },
            general: {},
        },
    });

    it('getRedirectChannelNameForTeam without advanced permissions', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                general: {
                    ...testState.entities.general,
                    serverVersion: '4.8.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team1.id), General.DEFAULT_CHANNEL);
    });

    it('getRedirectChannelNameForTeam with advanced permissions but without JOIN_PUBLIC_CHANNELS permission', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        'new-not-member-channel': {
                            id: 'new-not-member-channel',
                            display_name: '111111',
                            name: 'new-not-member-channel',
                            team_id: team1.id,
                        },
                        [channel1.id]: {
                            id: channel1.id,
                            display_name: 'aaaaaa',
                            name: 'test-channel',
                            team_id: team1.id,
                        },
                    },
                },
                roles: {
                    roles: {
                        system_user: {permissions: []},
                    },
                },
                general: {
                    ...testState.entities.general,
                    serverVersion: '5.12.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team1.id), 'test-channel');
    });

    it('getRedirectChannelNameForTeam with advanced permissions and with JOIN_PUBLIC_CHANNELS permission', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        system_user: {permissions: ['join_public_channels']},
                    },
                },
                general: {
                    ...testState.entities.general,
                    serverVersion: '5.12.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team1.id), General.DEFAULT_CHANNEL);
    });

    it('getRedirectChannelNameForTeam with advanced permissions but without JOIN_PUBLIC_CHANNELS permission but being member of town-square', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        'new-not-member-channel': {
                            id: 'new-not-member-channel',
                            display_name: '111111',
                            name: 'new-not-member-channel',
                            team_id: team1.id,
                        },
                        [channel1.id]: {
                            id: channel1.id,
                            display_name: 'Town Square',
                            name: 'town-square',
                            team_id: team1.id,
                        },
                    },
                },
                roles: {
                    roles: {
                        system_user: {permissions: []},
                    },
                },
                general: {
                    ...testState.entities.general,
                    serverVersion: '5.12.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team1.id), General.DEFAULT_CHANNEL);
    });

    it('getRedirectChannelNameForTeam without advanced permissions in not current team', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                general: {
                    ...testState.entities.general,
                    serverVersion: '4.8.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team2.id), General.DEFAULT_CHANNEL);
    });

    it('getRedirectChannelNameForTeam with advanced permissions but without JOIN_PUBLIC_CHANNELS permission in not current team', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        'new-not-member-channel': {
                            id: 'new-not-member-channel',
                            display_name: '111111',
                            name: 'new-not-member-channel',
                            team_id: team2.id,
                        },
                        [channel3.id]: {
                            id: channel3.id,
                            display_name: 'aaaaaa',
                            name: 'test-channel',
                            team_id: team2.id,
                        },
                    },
                },
                roles: {
                    roles: {
                        system_user: {permissions: []},
                    },
                },
                general: {
                    ...testState.entities.general,
                    serverVersion: '5.12.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team2.id), 'test-channel');
    });

    it('getRedirectChannelNameForTeam with advanced permissions and with JOIN_PUBLIC_CHANNELS permission in not current team', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        system_user: {permissions: ['join_public_channels']},
                    },
                },
                general: {
                    ...testState.entities.general,
                    serverVersion: '5.12.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team2.id), General.DEFAULT_CHANNEL);
    });

    it('getRedirectChannelNameForTeam with advanced permissions but without JOIN_PUBLIC_CHANNELS permission but being member of town-square in not current team', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        'new-not-member-channel': {
                            id: 'new-not-member-channel',
                            display_name: '111111',
                            name: 'new-not-member-channel',
                            team_id: team2.id,
                        },
                        [channel3.id]: {
                            id: channel3.id,
                            display_name: 'Town Square',
                            name: 'town-square',
                            team_id: team2.id,
                        },
                    },
                },
                roles: {
                    roles: {
                        system_user: {permissions: []},
                    },
                },
                general: {
                    ...testState.entities.general,
                    serverVersion: '5.12.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team2.id), General.DEFAULT_CHANNEL);
    });
});

describe('Selectors.Channels.getDirectAndGroupChannels', () => {
    const user1 = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(''),
        display_name: [user1.username, user2.username, user3.username].join(', '),
        type: General.GM_CHANNEL,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(''),
        name: getDirectChannelName(user1.id, user2.id),
        type: General.DM_CHANNEL,
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(''),
        name: getDirectChannelName(user1.id, user3.id),
        type: General.DM_CHANNEL,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
    };

    const profiles = {
        [user1.id]: user1,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const profilesInChannel = {
        [channel1.id]: new Set([user1.id, user2.id, user3.id]),
        [channel2.id]: new Set([user1.id, user2.id]),
        [channel3.id]: new Set([user1.id, user3.id]),
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user1.id,
                profiles,
                profilesInChannel,
            },
            channels: {
                channels,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('will return no channels if there is no active user', () => {
        const state = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    currentUserId: null,
                },
            },
        };

        assert.deepEqual(Selectors.getDirectAndGroupChannels(state), []);
    });

    it('will return only direct and group message channels', () => {
        const state = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                },
            },
        };

        assert.deepEqual(Selectors.getDirectAndGroupChannels(state), [
            {...channel1, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
            {...channel2, display_name: user2.username},
            {...channel3, display_name: user3.username},
        ]);
    });

    it('will not error out on undefined channels', () => {
        const state = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                },
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        ['undefined']: undefined, //eslint-disable-line no-useless-computed-key
                    },
                },
            },
        };

        assert.deepEqual(Selectors.getDirectAndGroupChannels(state), [
            {...channel1, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
            {...channel2, display_name: user2.username},
            {...channel3, display_name: user3.username},
        ]);
    });
});

describe('Selectors.Channels.getOrderedChannelIds', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
        last_post_at: 0,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
        last_post_at: 0,
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
        last_post_at: 0,
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
        last_post_at: 0,
    };
    const channel5 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
        last_post_at: 0,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
        [channel5.id]: channel5,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id, channel3.id, channel4.id, channel5.id],
    };

    const user1 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
    };

    const myChannelMembers = {
        [channel1.id]: {},
        [channel2.id]: {},
        [channel3.id]: {},
        [channel4.id]: {},
        [channel5.id]: {},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                myMembers: myChannelMembers,
                channelsInTeam,
            },
            users: {
                currentUserId: user1.id,
                profiles,
            },
            posts: {
                posts: {},
                postsInChannel: {},
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });
    it('get ordered channel ids by_type in current team strict equal', () => {
        const chan5 = {...testState.entities.channels.channels[channel5.id]};
        chan5.header = 'This should not change the results';

        const sidebarPrefs = {
            grouping: 'by_type',
            sorting: 'alpha',
            unreads_at_top: 'true',
            favorite_at_top: 'true',
        };

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel5.id]: chan5,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getOrderedChannelIds(
            testState,
            null,
            sidebarPrefs.grouping,
            sidebarPrefs.sorting,
            sidebarPrefs.unreads_at_top === 'true',
            sidebarPrefs.favorite_at_top === 'true',
        );

        const fromModifiedState = Selectors.getOrderedChannelIds(
            modifiedState,
            null,
            sidebarPrefs.grouping,
            sidebarPrefs.sorting,
            sidebarPrefs.unreads_at_top === 'true',
            sidebarPrefs.favorite_at_top === 'true',
        );

        assert.deepEqual(fromOriginalState, fromModifiedState);

        chan5.total_msg_count = 10;

        const unreadChannelState = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                channels: {
                    ...modifiedState.entities.channels,
                    channels: {
                        ...modifiedState.entities.channels.channels,
                        [channel5.id]: chan5,
                    },
                    myMembers: {
                        ...modifiedState.entities.channels.myMembers,
                        [channel5.id]: {
                            ...modifiedState.entities.channels.myMembers[channel5.id],
                            mention_count: 1,
                        },
                    },
                },
            },
        };

        const fromUnreadState = Selectors.getOrderedChannelIds(
            unreadChannelState,
            null,
            sidebarPrefs.grouping,
            sidebarPrefs.sorting,
            sidebarPrefs.unreads_at_top === 'true',
            sidebarPrefs.favorite_at_top === 'true',
        );

        assert.notDeepEqual(fromModifiedState, fromUnreadState);

        const favoriteChannelState = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                preferences: {
                    ...modifiedState.entities.preferences,
                    [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel4.id}`]: {
                        name: channel4.id,
                        category: Preferences.CATEGORY_FAVORITE_CHANNEL,
                        value: 'true',
                    },
                },
            },
        };

        const fromFavoriteState = Selectors.getOrderedChannelIds(
            favoriteChannelState,
            null,
            sidebarPrefs.grouping,
            sidebarPrefs.sorting,
            sidebarPrefs.unreads_at_top === 'true',
            sidebarPrefs.favorite_at_top === 'true',
        );

        assert.notDeepEqual(fromUnreadState, fromFavoriteState);
    });

    it('get ordered channel ids by recency order in current team strict equal', () => {
        const chan2 = {...testState.entities.channels.channels[channel2.id]};
        chan2.header = 'This should not change the results';

        const sidebarPrefs = {
            grouping: 'never',
            sorting: 'recent',
            unreads_at_top: 'false',
            favorite_at_top: 'false',
        };

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel2.id]: chan2,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getOrderedChannelIds(
            testState,
            null,
            sidebarPrefs.grouping,
            sidebarPrefs.sorting,
            sidebarPrefs.unreads_at_top === 'true',
            sidebarPrefs.favorite_at_top === 'true',
        );

        const fromModifiedState = Selectors.getOrderedChannelIds(
            modifiedState,
            null,
            sidebarPrefs.grouping,
            sidebarPrefs.sorting,
            sidebarPrefs.unreads_at_top === 'true',
            sidebarPrefs.favorite_at_top === 'true',
        );

        assert.deepEqual(fromOriginalState, fromModifiedState);

        chan2.last_post_at = (new Date()).getTime() + 500;
        const recencyInChan2State = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                channels: {
                    ...modifiedState.entities.channels,
                    channels: {
                        ...modifiedState.entities.channels.channels,
                        [chan2.id]: chan2,
                    },
                },
            },
        };

        const fromRecencyInChan2State = Selectors.getOrderedChannelIds(
            recencyInChan2State,
            null,
            sidebarPrefs.grouping,
            sidebarPrefs.sorting,
            sidebarPrefs.unreads_at_top === 'true',
            sidebarPrefs.favorite_at_top === 'true',
        );
        assert.notDeepEqual(fromModifiedState, fromRecencyInChan2State);
        assert.ok(fromRecencyInChan2State[0].items[0] === chan2.id);

        const chan3 = {...testState.entities.channels.channels[channel3.id]};
        chan3.last_post_at = (new Date()).getTime() + 500;
        const recencyInChan3State = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                channels: {
                    ...modifiedState.entities.channels,
                    channels: {
                        ...modifiedState.entities.channels.channels,
                        [channel1.id]: chan3,
                    },
                },
            },
        };

        const fromRecencyInChan3State = Selectors.getOrderedChannelIds(
            recencyInChan3State,
            null,
            sidebarPrefs.grouping,
            sidebarPrefs.sorting,
            sidebarPrefs.unreads_at_top === 'true',
            sidebarPrefs.favorite_at_top === 'true',
        );

        assert.notDeepEqual(fromRecencyInChan2State, fromRecencyInChan3State);
        assert.ok(fromRecencyInChan3State[0].items[0] === chan3.id);
    });
});

describe('Selectors.Channels.canManageAnyChannelMembersInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.PRIVATE_CHANNEL,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const user1 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
    };

    const myChannelMembers = {
        [channel1.id]: {},
        [channel2.id]: {},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                myMembers: myChannelMembers,
            },
            users: {
                profiles,
                currentUserId: user1.id,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('will return false if channel_user does not have permissions to manage channel members', () => {
        const newState = {
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        channel_user: {
                            permissions: [],
                        },
                    },
                },
                channels: {
                    ...testState.entities.channels,
                    myMembers: {
                        ...testState.entities.channels.myMembers,
                        [channel1.id]: {
                            ...testState.entities.channels.myMembers[channel1.id],
                            roles: 'channel_user',
                        },
                        [channel2.id]: {
                            ...testState.entities.channels.myMembers[channel2.id],
                            roles: 'channel_user',
                        },
                    },
                },
            },
        };

        assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === false);
    });

    it('will return true if channel_user has permissions to manage public channel members', () => {
        const newState = {
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        channel_user: {
                            permissions: ['manage_public_channel_members'],
                        },
                    },
                },
                channels: {
                    ...testState.entities.channels,
                    myMembers: {
                        ...testState.entities.channels.myMembers,
                        [channel1.id]: {
                            ...testState.entities.channels.myMembers[channel1.id],
                            roles: 'channel_user',
                        },
                        [channel2.id]: {
                            ...testState.entities.channels.myMembers[channel2.id],
                            roles: 'channel_user',
                        },
                    },
                },
            },
        };

        assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === true);
    });

    it('will return true if channel_user has permissions to manage private channel members', () => {
        const newState = {
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        channel_user: {
                            permissions: ['manage_private_channel_members'],
                        },
                    },
                },
                channels: {
                    ...testState.entities.channels,
                    myMembers: {
                        ...testState.entities.channels.myMembers,
                        [channel1.id]: {
                            ...testState.entities.channels.myMembers[channel1.id],
                            roles: 'channel_user',
                        },
                        [channel2.id]: {
                            ...testState.entities.channels.myMembers[channel2.id],
                            roles: 'channel_user',
                        },
                    },
                },
            },
        };

        assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === true);
    });

    it('will return false if channel admins have permissions, but the user is not a channel admin of any channel', () => {
        const newState = {
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        channel_admin: {
                            permissions: ['manage_public_channel_members'],
                        },
                    },
                },
                channels: {
                    ...testState.entities.channels,
                    myMembers: {
                        ...testState.entities.channels.myMembers,
                        [channel1.id]: {
                            ...testState.entities.channels.myMembers[channel1.id],
                            roles: 'channel_user',
                        },
                        [channel2.id]: {
                            ...testState.entities.channels.myMembers[channel2.id],
                            roles: 'channel_user',
                        },
                    },
                },
            },
        };

        assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === false);
    });

    it('will return true if channel admins have permission, and the user is a channel admin of some channel', () => {
        const newState = {
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        channel_admin: {
                            permissions: ['manage_public_channel_members'],
                        },
                    },
                },
                channels: {
                    ...testState.entities.channels,
                    myMembers: {
                        ...testState.entities.channels.myMembers,
                        [channel1.id]: {
                            ...testState.entities.channels.myMembers[channel1.id],
                            roles: 'channel_user channel_admin',
                        },
                        [channel2.id]: {
                            ...testState.entities.channels.myMembers[channel2.id],
                            roles: 'channel_user',
                        },
                    },
                },
            },
        };

        assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === true);
    });

    it('will return true if team admins have permission, and the user is a team admin', () => {
        const newState = {
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        team_admin: {
                            permissions: ['manage_public_channel_members'],
                        },
                    },
                },
                users: {
                    ...testState.entities.users,
                    profiles: {
                        ...testState.entities.users.profiles,
                        [user1.id]: {
                            ...testState.entities.users.profiles[user1.id],
                            roles: 'team_admin',
                        },
                    },
                },
            },
        };

        assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === true);
    });
});

describe('Selectors.Channels.filterPostIds', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const user1 = TestHelper.fakeUserWithId();

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                channels,
            },
            posts: {
                posts: {},
            },
        },
    });

    it('filters post IDs by the given condition', () => {
        const posts = {
            a: {id: 'a', channel_id: channel1.id, create_at: 1, user_id: user1.id},
            b: {id: 'b', channel_id: channel2.id, create_at: 2, user_id: user1.id},
            c: {id: 'c', root_id: 'a', channel_id: channel1.id, create_at: 3, user_id: 'b'},
        };
        const testStateC = JSON.parse(JSON.stringify(testState));
        testStateC.entities.posts.posts = posts;
        testStateC.entities.channels.channels[channel2.id].delete_at = 1;

        const filterPostIDsByArchived = Selectors.filterPostIds((channel) => channel.delete_at !== 0);
        const filterPostIDsByUserB = Selectors.filterPostIds((channel, post) => post.user_id === 'b');

        const filterPostIDsInvalid = Selectors.filterPostIds((channel, post) => foo === 'b'); // eslint-disable-line
        let filterErrorMessage;
        try {
            const result = ['bar'].filter((item) => foo === 'b'); // eslint-disable-line
        } catch (e) {
            filterErrorMessage = e.message;
        }

        const postIDs = Object.keys(posts);

        assert.deepEqual(filterPostIDsByArchived(testStateC, postIDs), ['b']);
        assert.deepEqual(filterPostIDsByUserB(testStateC, postIDs), ['c']);

        assert.throws(() => Selectors.filterPostIds(), TypeError);

        assert.throws(() => filterPostIDsInvalid(testStateC, postIDs), ReferenceError, filterErrorMessage);
    });
});

describe('Selectors.Channels.getSortedPrivateChannelIds', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.PRIVATE_CHANNEL,
        display_name: 'DEF',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.PRIVATE_CHANNEL,
        display_name: 'GHI',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
    };

    const myChannelMembers = {
        [channel1.id]: {},
        [channel2.id]: {},
    };

    const user1 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                channelsInTeam,
                myMembers: myChannelMembers,
            },
            users: {
                currentUserId: user1.id,
                profiles,
            },
            posts: {
                posts: {},
                postsInChannel: {},
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });
    it('get sorted private channel ids in current team strict equal', () => {
        const chan2 = {...testState.entities.channels.channels[channel2.id]};
        chan2.header = 'This should not change the results';

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel2.id]: chan2,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getSortedPrivateChannelIds(testState);
        const fromModifiedState = Selectors.getSortedPrivateChannelIds(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);
        assert.ok(fromModifiedState[0] === channel1.id);

        chan2.display_name = 'abc';
        const updateState = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                channels: {
                    ...modifiedState.entities.channels,
                    channels: {
                        ...modifiedState.entities.channels.channels,
                        [channel2.id]: chan2,
                    },
                },
            },
        };

        const fromUpdateState = Selectors.getSortedPrivateChannelIds(updateState);
        assert.ok(fromModifiedState !== fromUpdateState);
        assert.ok(fromUpdateState[0] === channel2.id);
    });
});

describe('Selectors.Channels.getSortedPublicChannelIds', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'DEF',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'GHI',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
    };

    const myChannelMembers = {
        [channel1.id]: {},
        [channel2.id]: {},
    };

    const user1 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                channelsInTeam,
                myMembers: myChannelMembers,
            },
            users: {
                currentUserId: user1.id,
                profiles,
            },
            posts: {
                posts: {},
                postsInChannel: {},
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });
    it('get sorted public channel ids in current team strict equal', () => {
        const chan2 = {...testState.entities.channels.channels[channel2.id]};
        chan2.header = 'This should not change the results';

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel2.id]: chan2,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getSortedPublicChannelIds(testState);
        const fromModifiedState = Selectors.getSortedPublicChannelIds(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);
        assert.ok(fromModifiedState[0] === channel1.id);

        chan2.display_name = 'abc';
        const updateState = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                channels: {
                    ...modifiedState.entities.channels,
                    channels: {
                        ...modifiedState.entities.channels.channels,
                        [channel2.id]: chan2,
                    },
                },
            },
        };

        const fromUpdateState = Selectors.getSortedPublicChannelIds(updateState);
        assert.ok(fromModifiedState !== fromUpdateState);
        assert.ok(fromUpdateState[0] === channel2.id);
    });
});

describe('Selectors.Channels.getSortedFavoriteChannelIds', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'DEF',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'GHI',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
    };

    const myChannelMembers = {
        [channel1.id]: {notify_props: {}},
        [channel2.id]: {notify_props: {}},
    };

    const user1 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
    };

    const myPreferences = {
        [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel1.id}`]: {
            name: channel1.id,
            value: 'true',
        },
        [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel2.id}`]: {
            name: channel2.id,
            value: 'true',
        },
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                channelsInTeam,
                myMembers: myChannelMembers,
            },
            users: {
                currentUserId: user1.id,
                profiles,
            },
            posts: {
                posts: {},
                postsInChannel: {},
            },
            preferences: {
                myPreferences,
            },
            general: {
                config: {},
            },
        },
    });

    it('get sorted favorite channel ids in current team strict equal', () => {
        const chan1 = {...testState.entities.channels.channels[channel1.id]};
        chan1.total_msg_count = 10;

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel1.id]: chan1,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getSortedFavoriteChannelIds(testState);
        const fromModifiedState = Selectors.getSortedFavoriteChannelIds(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);
        assert.ok(fromModifiedState[0] === channel1.id);

        const chan2 = {...testState.entities.channels.channels[channel2.id]};
        chan2.display_name = 'abc';

        const updateState = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                channels: {
                    ...modifiedState.entities.channels,
                    channels: {
                        ...modifiedState.entities.channels.channels,
                        [channel2.id]: chan2,
                    },
                },
            },
        };

        const fromUpdateState = Selectors.getSortedFavoriteChannelIds(updateState);
        assert.ok(fromModifiedState !== fromUpdateState);
        assert.ok(fromUpdateState[0] === channel2.id);
    });
});

describe('Selectors.Channels.getSortedUnreadChannelIds', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'DEF',
    };
    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'ABC',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id, channel3.id],
    };

    const myChannelMembers = {
        [channel1.id]: {mention_count: 1, msg_count: 0, notify_props: {}},
        [channel2.id]: {mention_count: 0, msg_count: 0, notify_props: {}},
        [channel3.id]: {mention_count: 0, msg_count: 0, notify_props: {}},
    };

    const user1 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                myMembers: myChannelMembers,
                channelsInTeam,
            },
            users: {
                currentUserId: user1.id,
                profiles,
            },
            posts: {
                posts: {},
                postsInChannel: {},
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('get sorted unread channel ids in current team strict equal', () => {
        const chan1 = {...testState.entities.channels.channels[channel1.id]};
        chan1.total_msg_count = 10;

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel1.id]: chan1,
                    },
                },
            },
        };

        // When adding a mention to channel3 with display_name 'ABC' states are !== and channel3 is above all others
        const mentionState = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                channels: {
                    ...modifiedState.entities.channels,
                    myMembers: {
                        ...modifiedState.entities.channels.myMembers,
                        [channel3.id]: {
                            ...modifiedState.entities.channels.myMembers[channel3.id],
                            mention_count: 1,
                        },
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getSortedUnreadChannelIds(testState);
        const fromModifiedState = Selectors.getSortedUnreadChannelIds(modifiedState);
        const fromMentionState = Selectors.getSortedUnreadChannelIds(mentionState);

        // mentions should be prioritized to the top
        assert.ok(fromOriginalState === fromModifiedState);
        assert.ok(fromMentionState !== fromModifiedState);

        // channel3 and channel1 are above all others
        // since default order is "alpha", channel3 with display_name "ABC" should come first
        assert.ok(fromMentionState[0] === channel3.id);

        // followed by channel1 with display_name "DEF"
        assert.ok(fromMentionState[1] === channel1.id);

        const hasMentionMutedChannelState = {
            ...mentionState,
            entities: {
                ...mentionState.entities,
                channels: {
                    ...mentionState.entities.channels,
                    myMembers: {
                        ...mentionState.entities.channels.myMembers,
                        [channel3.id]: {
                            mention_count: 1,
                            notify_props: {
                                mark_unread: 'mention',
                            },
                        },
                    },
                },
            },
        };

        const fromHasMentionMutedChannelState = Selectors.getSortedUnreadChannelIds(hasMentionMutedChannelState);

        // For channels with mentions, non-muted channel1 should come first before muted channel3.
        assert.ok(fromHasMentionMutedChannelState[0] === channel1.id);
        assert.ok(fromHasMentionMutedChannelState[1] === channel3.id);
    });
});

describe('Selectors.Channels.getUnreadChannelIds', () => {
    const user1 = TestHelper.fakeUserWithId();
    user1.username = 'user';
    const user2 = TestHelper.fakeUserWithId();
    user2.username = 'user2';
    const user3 = TestHelper.fakeUserWithId();
    user3.username = 'user3';
    const fakeUser = TestHelper.fakeUserWithId('fakeUserId');
    fakeUser.username = 'fakeUser';
    const profiles = {
        [fakeUser.id]: fakeUser,
        [user1.id]: user1,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const team1 = TestHelper.fakeTeamWithId();
    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'ABC',
        total_msg_count: 2,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'DEF',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'GHI',
        total_msg_count: 2,
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(''),
        display_name: [user1.username, user2.username, user3.username].join(', '),
        type: General.GM_CHANNEL,
        total_msg_count: 3,
        last_post_at: Date.now(),
    };
    const channel5 = {
        ...TestHelper.fakeDmChannel(user1.id, 'fakeUserId'),
        total_msg_count: 3,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
        [channel5.id]: channel5,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id, channel3.id],
        // eslint-disable-next-line no-useless-computed-key
        ['']: [channel4.id],
    };

    const myChannelMembers = {
        [channel1.id]: {mention_count: 0, msg_count: 1, notify_props: {}},
        [channel2.id]: {mention_count: 1, msg_count: 1, notify_props: {}},
        [channel3.id]: {mention_count: 1, msg_count: 0, notify_props: {}},
        [channel4.id]: {mention_count: 0, msg_count: 2, notify_props: {}},
        [channel5.id]: {mention_count: 2, msg_count: 3, notify_props: {}},
    };
    const membersInChannel = {
        [channel4.id]: {
            [user1.id]: {channel_id: channel4.id, user_id: user1.id},
        },
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                myMembers: myChannelMembers,
                channelsInTeam,
                membersInChannel,
            },
            users: {
                currentUserId: user1.id,
                profiles,
                profilesInChannel: {
                    [channel4.id]: null,
                },
            },
            posts: {
                posts: {},
                postsInChannel: {},
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    test('channels should be sorted alphabetically with mentions coming first', () => {
        expect(Selectors.getSortedUnreadChannelIds(testState)).toEqual([
            channel2.id, // has mention and display name is "DEF"
            channel3.id, // has mention and display name is "GHI"
            channel1.id, // has unread and display name is "ABC"
            channel4.id, // has unread and display name is "user, user2, user3"
        ]);

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    myMembers: {
                        ...testState.entities.channels.myMembers,
                        [channel1.id]: {
                            ...testState.entities.channels.myMembers[channel1.id],
                            mention_count: 1,
                        },
                    },
                },
            },
        };

        expect(Selectors.getSortedUnreadChannelIds(modifiedState)).toEqual([
            channel1.id, // has mention and display name is "ABC"
            channel2.id, // has mention and display name is "DEF"
            channel3.id, // has mention and display name is "GHI"
            channel4.id, // has unread and display name is "user, user2, user3"
        ]);
    });

    test('selector should return the same array as long as the order stays the same', () => {
        const fromOriginalState = Selectors.getSortedUnreadChannelIds(testState);

        // Adding messages to an already unread channel shouldn't change the order
        let modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel2.id]: {
                            ...testState.entities.channels.channels[channel2.id],
                            total_msg_count: 10,
                        },
                    },
                },
            },
        };

        expect(Selectors.getSortedUnreadChannelIds(modifiedState)).toBe(fromOriginalState);

        // Adding a mention to a channel that didn't have mentions before should change the order
        modifiedState = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                channels: {
                    ...modifiedState.entities.channels,
                    myMembers: {
                        ...modifiedState.entities.channels.myMembers,
                        [channel4.id]: {
                            ...modifiedState.entities.channels.myMembers[channel4.id],
                            mention_count: 1,
                        },
                    },
                },
            },
        };

        expect(Selectors.getSortedUnreadChannelIds(modifiedState)).not.toBe(fromOriginalState);
    });
});

describe('Selectors.Channels.getUnreadChannelIds', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
    };

    const myChannelMembers = {
        [channel1.id]: {},
        [channel2.id]: {},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                channelsInTeam,
                myMembers: myChannelMembers,
            },
            general: {
                config: {},
            },
            preferences: {
                myPreferences: {},
            },
        },
    });
    it('get unread channel ids in current team strict equal', () => {
        const chan2 = {...testState.entities.channels.channels[channel2.id]};
        chan2.total_msg_count = 10;

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel2.id]: chan2,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getUnreadChannelIds(testState);
        const fromModifiedState = Selectors.getUnreadChannelIds(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);
    });

    it('get unread channel ids in current team and keep specified channel as unread', () => {
        const chan2 = {...testState.entities.channels.channels[channel2.id]};
        chan2.total_msg_count = 10;

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel2.id]: chan2,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getUnreadChannelIds(testState);
        const fromModifiedState = Selectors.getUnreadChannelIds(modifiedState, {id: channel1.id});

        assert.ok(fromOriginalState !== fromModifiedState);
        assert.ok(fromModifiedState.includes(channel1.id));
    });
});

describe('Selectors.Channels.getDirectChannelIds', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const user1 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
    };

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const myChannelMembers = {
        [channel1.id]: {},
        [channel2.id]: {},
    };

    const profilesInChannel = {
        [channel1.id]: new Set([user1.id]),
        [channel2.id]: new Set([user1.id]),
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                channels,
                myMembers: myChannelMembers,
            },
            users: {
                currentUserId: user1.id,
                profiles,
                profilesInChannel,
            },
            posts: {
                posts: {},
                postsInChannel: {},
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });
    it('get direct channel ids strict equal', () => {
        const chan1 = {...testState.entities.channels.channels[channel1.id]};
        chan1.total_msg_count += 1; // no reason to set it to 1, this is just to make sure the state changed

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel1.id]: chan1,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getDirectChannelIds(testState);
        const fromModifiedState = Selectors.getDirectChannelIds(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);

        // it should't have a channel that belongs to a team
        assert.equal(fromModifiedState.includes(channel1.id), false, 'should not have a channel that belongs to a team');
    });

    it('get direct channel ids for channels with non-null values', () => {
        const user2 = TestHelper.fakeUserWithId();
        const user3 = TestHelper.fakeUserWithId();
        const dmChannel1 = TestHelper.fakeDmChannel(user1.id, user2.id);
        const dmChannel2 = TestHelper.fakeDmChannel(user1.id, user3.id);

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profiles: {
                        ...testState.entities.users.profiles,
                        [user2.id]: user2,
                        [user3.id]: user3,
                    },
                },
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [dmChannel1.id]: dmChannel1,
                        [dmChannel2.id]: null,
                    },
                },
                preferences: {
                    ...testState.entities.preferences,
                    myPreferences: {
                        [`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--${dmChannel1.teammate_id}`]: {
                            category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW,
                            name: dmChannel1.teammate_id,
                            value: 'true',
                        },
                        [`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--${dmChannel2.teammate_id}`]: {
                            category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW,
                            name: dmChannel2.teammate_id,
                            value: 'true',
                        },
                    },
                },
            },
        };

        const fromModifiedState = Selectors.getDirectChannelIds(modifiedState);
        assert.equal(fromModifiedState.length, 1);
        assert.equal(fromModifiedState[0], dmChannel1.id);
    });
});

describe('Selectors.Channels.getUnreadsInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        total_msg_count: 2,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        total_msg_count: 8,
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        total_msg_count: 5,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
    };

    const myChannelMembers = {
        [channel1.id]: {notify_props: {}, mention_count: 1, msg_count: 0},
        [channel2.id]: {notify_props: {}, mention_count: 4, msg_count: 0},
        [channel3.id]: {notify_props: {}, mention_count: 4, msg_count: 5},
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                currentChannelId: channel1.id,
                channels,
                channelsInTeam,
                myMembers: myChannelMembers,
            },
            users: {
                profiles: {},
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('get unreads for current team', () => {
        assert.deepEqual(Selectors.getUnreadsInCurrentTeam(testState), {mentionCount: 4, messageCount: 1});
    });

    it('get unreads for current read channel', () => {
        const testState2 = {...testState,
            entities: {...testState.entities,
                channels: {...testState.entities.channels,
                    currentChannelId: channel3.id,
                },
            },
        };
        assert.equal(Selectors.countCurrentChannelUnreadMessages(testState2), 0);
    });

    it('get unreads for current unread channel', () => {
        assert.equal(Selectors.countCurrentChannelUnreadMessages(testState), 2);
    });

    it('get unreads for channel not on members', () => {
        const testState2 = {...testState,
            entities: {...testState.entities,
                channels: {...testState.entities.channels,
                    currentChannelId: 'some_other_id',
                },
            },
        };
        assert.equal(Selectors.countCurrentChannelUnreadMessages(testState2), 0);
    });

    it('get unreads with a missing profile entity', () => {
        const newProfiles = {
            ...testState.entities.users.profiles,
        };
        Reflect.deleteProperty(newProfiles, 'fakeUserId');
        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profiles: newProfiles,
                },
            },
        };

        assert.deepEqual(Selectors.getUnreadsInCurrentTeam(newState), {mentionCount: 4, messageCount: 1});
    });

    it('get unreads with a deactivated user', () => {
        const newProfiles = {
            ...testState.entities.users.profiles,
            fakeUserId: {
                ...testState.entities.users.profiles.fakeUserId,
                delete_at: 100,
            },
        };

        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profiles: newProfiles,
                },
            },
        };
        assert.deepEqual(Selectors.getUnreadsInCurrentTeam(newState), {mentionCount: 4, messageCount: 1});
    });

    it('get unreads with a deactivated channel', () => {
        const newChannels = {
            ...testState.entities.channels.channels,
            [channel2.id]: {
                ...testState.entities.channels.channels[channel2.id],
                delete_at: 100,
            },
        };

        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: newChannels,
                },
            },
        };

        assert.deepEqual(Selectors.getUnreadsInCurrentTeam(newState), {mentionCount: 0, messageCount: 0});
    });
});

describe('Selectors.Channels.getUnreads', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const teams = {
        [team1.id]: team1,
        [team2.id]: team2,
    };

    const myTeamMembers = {
        [team1.id]: {mention_count: 16, msg_count: 32},
        [team2.id]: {mention_count: 64, msg_count: 128},
    };

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        total_msg_count: 2,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        total_msg_count: 8,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const myChannelMembers = {
        [channel1.id]: {notify_props: {}, mention_count: 1, msg_count: 0},
        [channel2.id]: {notify_props: {}, mention_count: 4, msg_count: 0},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
                teams,
                myMembers: myTeamMembers,
            },
            threads: {
                count: {},
            },
            channels: {
                channels,
                myMembers: myChannelMembers,
            },
            users: {
                profiles: {},
            },
            general: {
                config: {},
            },
            preferences: {
                myPreferences: {},
            },
        },
    });

    it('get unreads', () => {
        assert.deepEqual(Selectors.getUnreads(testState), {mentionCount: 69, messageCount: 130});
    });

    it('get unreads with a missing profile entity', () => {
        const newProfiles = {
            ...testState.entities.users.profiles,
        };
        Reflect.deleteProperty(newProfiles, 'fakeUserId');
        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profiles: newProfiles,
                },
            },
        };

        assert.deepEqual(Selectors.getUnreads(newState), {mentionCount: 69, messageCount: 130});
    });

    it('get unreads with a deactivated user', () => {
        const newProfiles = {
            ...testState.entities.users.profiles,
            fakeUserId: {
                ...testState.entities.users.profiles.fakeUserId,
                delete_at: 100,
            },
        };

        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profiles: newProfiles,
                },
            },
        };
        assert.deepEqual(Selectors.getUnreads(newState), {mentionCount: 69, messageCount: 130});
    });

    it('get unreads with a deactivated channel', () => {
        const newChannels = {
            ...testState.entities.channels.channels,
            [channel2.id]: {
                ...testState.entities.channels.channels[channel2.id],
                delete_at: 100,
            },
        };

        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: newChannels,
                },
            },
        };

        assert.deepEqual(Selectors.getUnreads(newState), {mentionCount: 65, messageCount: 129});
    });
});

describe('Selectors.Channels.getUnreads', () => {
    const team1 = {id: 'team1', delete_at: 0};
    const team2 = {id: 'team2', delete_at: 0};

    const channelA = {id: 'channelA', name: 'channelA', team_id: 'team1', total_msg_count: 11, delete_at: 0};
    const channelB = {id: 'channelB', name: 'channelB', team_id: 'team1', total_msg_count: 13, delete_at: 0};
    const channelC = {id: 'channelB', name: 'channelB', team_id: 'team2', total_msg_count: 17, delete_at: 0};

    const dmChannel = {id: 'dmChannel', name: 'user1__user2', team_id: '', total_msg_count: 11, delete_at: 0, type: General.DM_CHANNEL};
    const gmChannel = {id: 'gmChannel', name: 'gmChannel', team_id: 'team1', total_msg_count: 11, delete_at: 0, type: General.GM_CHANNEL};

    test('should return the correct number of messages and mentions from channels on the current team', () => {
        const myMemberA = {mention_count: 2, msg_count: 3, notify_props: {mark_unread: 'all'}};
        const myMemberB = {mention_count: 5, msg_count: 7, notify_props: {mark_unread: 'all'}};

        const state = {
            entities: {
                channels: {
                    channels: {
                        channelA,
                        channelB,
                    },
                    myMembers: {
                        channelA: myMemberA,
                        channelB: myMemberB,
                    },
                },
                teams: {
                    currentTeamId: 'team1',
                    myMembers: {},
                    teams: {
                        team1,
                    },
                },
                users: {
                    currentUserId: 'user1',
                    profiles: {},
                },
                threads: {
                    count: {},
                },
                general: {
                    config: {},
                },
                preferences: {
                    myPreferences: {},
                },
            },
        };

        const {messageCount, mentionCount} = Selectors.getUnreads(state);

        expect(messageCount).toBe(2); // channelA and channelB are unread
        expect(mentionCount).toBe(myMemberA.mention_count + myMemberB.mention_count);
    });

    test('should not count messages from channel with mark_unread set to "mention"', () => {
        const myMemberA = {mention_count: 2, msg_count: 3, notify_props: {mark_unread: 'mention'}};
        const myMemberB = {mention_count: 5, msg_count: 7, notify_props: {mark_unread: 'all'}};

        const state = {
            entities: {
                channels: {
                    channels: {
                        channelA,
                        channelB,
                    },
                    myMembers: {
                        channelA: myMemberA,
                        channelB: myMemberB,
                    },
                },
                teams: {
                    currentTeamId: 'team1',
                    myMembers: {},
                    teams: {
                        team1,
                    },
                },
                users: {
                    currentUserId: 'user1',
                    profiles: {},
                },
                threads: {
                    count: {},
                },
                general: {
                    config: {},
                },
                preferences: {
                    myPreferences: {},
                },
            },
        };

        const {messageCount, mentionCount} = Selectors.getUnreads(state);

        expect(messageCount).toBe(1); // channelA and channelB are unread, but only channelB is counted because of its mark_unread
        expect(mentionCount).toBe(myMemberA.mention_count + myMemberB.mention_count);
    });

    test('should count mentions from DM channels', () => {
        const dmMember = {mention_count: 2, msg_count: 3, notify_props: {mark_unread: 'all'}};

        const state = {
            entities: {
                channels: {
                    channels: {
                        dmChannel,
                    },
                    myMembers: {
                        dmChannel: dmMember,
                    },
                },
                teams: {
                    currentTeamId: 'team1',
                    myMembers: {},
                    teams: {
                        team1,
                    },
                },
                users: {
                    currentUserId: 'user1',
                    profiles: {
                        user2: {delete_at: 0},
                    },
                },
                threads: {
                    count: {},
                },
                general: {
                    config: {},
                },
                preferences: {
                    myPreferences: {},
                },
            },
        };

        const {messageCount, mentionCount} = Selectors.getUnreads(state);

        expect(messageCount).toBe(1); // dmChannel is unread
        expect(mentionCount).toBe(dmMember.mention_count);
    });

    test('should not count mentions from DM channel with archived user', () => {
        const dmMember = {mention_count: 2, msg_count: 3, notify_props: {mark_unread: 'all'}};

        const state = {
            entities: {
                channels: {
                    channels: {
                        dmChannel,
                    },
                    myMembers: {
                        dmChannel: dmMember,
                    },
                },
                teams: {
                    currentTeamId: 'team1',
                    myMembers: {},
                    teams: {
                        team1,
                    },
                },
                users: {
                    currentUserId: 'user1',
                    profiles: {
                        user2: {delete_at: 1},
                    },
                },
                threads: {
                    count: {},
                },
                general: {
                    config: {},
                },
                preferences: {
                    myPreferences: {},
                },
            },
        };

        const {messageCount, mentionCount} = Selectors.getUnreads(state);

        expect(messageCount).toBe(0);
        expect(mentionCount).toBe(0);
    });

    test('should count mentions from GM channels', () => {
        const gmMember = {mention_count: 2, msg_count: 3, notify_props: {mark_unread: 'all'}};

        const state = {
            entities: {
                channels: {
                    channels: {
                        gmChannel,
                    },
                    myMembers: {
                        gmChannel: gmMember,
                    },
                },
                teams: {
                    currentTeamId: 'team1',
                    myMembers: {},
                    teams: {
                        team1,
                    },
                },
                users: {
                    currentUserId: 'user1',
                    profiles: {},
                },
                threads: {
                    count: {},
                },
                general: {
                    config: {},
                },
                preferences: {
                    myPreferences: {},
                },
            },
        };

        const {messageCount, mentionCount} = Selectors.getUnreads(state);

        expect(messageCount).toBe(1); // gmChannel is unread
        expect(mentionCount).toBe(gmMember.mention_count);
    });

    test('should count mentions and messages for other teams from team members', () => {
        const myMemberA = {mention_count: 2, msg_count: 3, notify_props: {mark_unread: 'all'}};
        const myMemberC = {mention_count: 5, msg_count: 7, notify_props: {mark_unread: 'all'}};

        const teamMember1 = {msg_count: 1, mention_count: 2};
        const teamMember2 = {msg_count: 3, mention_count: 6};

        const state = {
            entities: {
                channels: {
                    channels: {
                        channelA,
                        channelC,
                    },
                    myMembers: {
                        channelA: myMemberA,
                        channelC: myMemberC,
                    },
                },
                teams: {
                    currentTeamId: 'team1',
                    myMembers: {
                        team1: teamMember1,
                        team2: teamMember2,
                    },
                    teams: {
                        team1,
                        team2,
                    },
                },
                users: {
                    currentUserId: 'user1',
                    profiles: {},
                },
                threads: {
                    count: {},
                },
                general: {
                    config: {},
                },
                preferences: {
                    myPreferences: {},
                },
            },
        };

        const {messageCount, mentionCount} = Selectors.getUnreads(state);

        expect(messageCount).toBe(4); // channelA and channelC are unread
        expect(mentionCount).toBe(myMemberA.mention_count + teamMember2.mention_count);
    });
});

describe('Selectors.Channels.getMyFirstChannelForTeams', () => {
    test('should return the first channel in each team', () => {
        const state = {
            entities: {
                channels: {
                    channels: {
                        channelA: {id: 'channelA', name: 'channelA', team_id: 'team1'},
                        channelB: {id: 'channelB', name: 'channelB', team_id: 'team2'},
                        channelC: {id: 'channelC', name: 'channelC', team_id: 'team1'},
                    },
                    myMembers: {
                        channelA: {},
                        channelB: {},
                        channelC: {},
                    },
                },
                teams: {
                    myMembers: {
                        team1: {},
                        team2: {},
                    },
                    teams: {
                        team1: {id: 'team1', delete_at: 0},
                        team2: {id: 'team2', delete_at: 0},
                    },
                },
                users: {
                    currentUserId: 'user',
                    profiles: {
                        user: {},
                    },
                },
            },
        };

        expect(Selectors.getMyFirstChannelForTeams(state)).toEqual({
            team1: state.entities.channels.channels.channelA,
            team2: state.entities.channels.channels.channelB,
        });
    });

    test('should only return channels that the current user is a member of', () => {
        const state = {
            entities: {
                channels: {
                    channels: {
                        channelA: {id: 'channelA', name: 'channelA', team_id: 'team1'},
                        channelB: {id: 'channelB', name: 'channelB', team_id: 'team1'},
                    },
                    myMembers: {
                        channelB: {},
                    },
                },
                teams: {
                    myMembers: {
                        team1: {},
                    },
                    teams: {
                        team1: {id: 'team1', delete_at: 0},
                    },
                },
                users: {
                    currentUserId: 'user',
                    profiles: {
                        user: {},
                    },
                },
            },
        };

        expect(Selectors.getMyFirstChannelForTeams(state)).toEqual({
            team1: state.entities.channels.channels.channelB,
        });
    });

    test('should only return teams that the current user is a member of', () => {
        const state = {
            entities: {
                channels: {
                    channels: {
                        channelA: {id: 'channelA', name: 'channelA', team_id: 'team1'},
                        channelB: {id: 'channelB', name: 'channelB', team_id: 'team2'},
                    },
                    myMembers: {
                        channelA: {},
                        channelB: {},
                    },
                },
                teams: {
                    myMembers: {
                        team1: {},
                    },
                    teams: {
                        team1: {id: 'team1', delete_at: 0},
                        team2: {id: 'team2', delete_at: 0},
                    },
                },
                users: {
                    currentUserId: 'user',
                    profiles: {
                        user: {},
                    },
                },
            },
        };

        expect(Selectors.getMyFirstChannelForTeams(state)).toEqual({
            team1: state.entities.channels.channels.channelA,
        });
    });
});

test('Selectors.Channels.isManuallyUnread', () => {
    const state = {
        entities: {
            channels: {
                manuallyUnread: {
                    channel1: true,
                    channel2: false,
                },
            },
        },
    };

    assert.equal(Selectors.isManuallyUnread(state, 'channel1'), true);
    assert.equal(Selectors.isManuallyUnread(state, undefined), false);
    assert.equal(Selectors.isManuallyUnread(state, 'channel2'), false);
    assert.equal(Selectors.isManuallyUnread(state, 'channel3'), false);
});

test('Selectors.Channels.getChannelMemberCountsByGroup', () => {
    const memberCounts = {
        'group-1': {
            group_id: 'group-1',
            channel_member_count: 1,
            channel_member_timezones_count: 1,
        },
        'group-2': {
            group_id: 'group-2',
            channel_member_count: 999,
            channel_member_timezones_count: 131,
        },
    };

    const state = {
        entities: {
            channels: {
                channelMemberCountsByGroup: {
                    channel1: memberCounts,
                },
            },
        },
    };

    assert.deepEqual(Selectors.getChannelMemberCountsByGroup(state, 'channel1'), memberCounts);
    assert.deepEqual(Selectors.getChannelMemberCountsByGroup(state, undefined), {});
    assert.deepEqual(Selectors.getChannelMemberCountsByGroup(state, 'undefined'), {});
});
