// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {loadSidebar} from '@actions/views/channel';
import {Client4} from '@client/rest';
import {ChannelTypes, RoleTypes} from '@mm-redux/action_types';
import {getRedirectChannelNameForTeam, getChannelsNameMapInTeam} from '@mm-redux/selectors/entities/channels';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {DispatchFunc, GetStateFunc} from '@mm-redux/types/actions';
import {Channel, ChannelMembership} from '@mm-redux/types/channels';
import {Role} from '@mm-redux/types/roles';
import {getChannelByName, getChannelsIdForTeam} from '@mm-redux/utils/channel_utils';

const MAX_RETRIES = 3;

interface TeamChannelsData {
    channels?: Channel[];
    channelMembers?: ChannelMembership[];
    roles?: Role[];
    sync: boolean;
    teamId: string;
    teamChannels: string[];
}

export function loadTeamChannels(teamId?: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        if (teamId) {
            const state = getState();
            const currentUserId = getCurrentUserId(state);
            const actions = [];
            const data: TeamChannelsData = {
                sync: true,
                teamId,
                teamChannels: getChannelsIdForTeam(state, teamId),
            };

            if (currentUserId) {
                for (let i = 0; i <= MAX_RETRIES; i++) {
                    try {
                        const [channels, channelMembers] = await Promise.all([ //eslint-disable-line no-await-in-loop
                            Client4.getMyChannels(teamId, true),
                            Client4.getMyChannelMembers(teamId),
                        ]);

                        data.channels = channels;
                        data.channelMembers = channelMembers;
                        break;
                    } catch (err) {
                        if (i === MAX_RETRIES) {
                            return {error: err};
                        }
                    }
                }

                if (data.channels) {
                    actions.push({
                        type: ChannelTypes.RECEIVED_MY_CHANNELS_WITH_MEMBERS,
                        data,
                    });

                    const rolesToLoad = new Set<string>();
                    const members = data.channelMembers;
                    if (members) {
                        for (const member of members) {
                            for (const role of member.roles.split(' ')) {
                                rolesToLoad.add(role);
                            }
                        }
                    }

                    if (rolesToLoad.size > 0) {
                        try {
                            data.roles = await Client4.getRolesByNames(Array.from(rolesToLoad));
                            if (data.roles?.length) {
                                actions.push({
                                    type: RoleTypes.RECEIVED_ROLES,
                                    data: data.roles,
                                });
                            }
                        } catch {
                            //eslint-disable-next-line no-console
                            console.log('Could not retrieve channel members roles for the user');
                        }
                    }

                    dispatch(batchActions(actions, 'BATCH_LOAD_CHANNELS_FOR_TEAM'));
                    dispatch(loadSidebar(data));
                }
            }
        }

        return {data: true};
    };
}

export function getTeamDefaultChannel(teamId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const channelsInTeam = getChannelsNameMapInTeam(state, teamId);
        const redirectChannel = getChannelByName(channelsInTeam, getRedirectChannelNameForTeam(state, teamId));

        return redirectChannel;
    };
}
