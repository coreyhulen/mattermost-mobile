// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {lastChannelIdForTeam} from '@actions/helpers/channels';
import {NavigationTypes} from '@constants';
import {ChannelTypes, TeamTypes} from '@mm-redux/action_types';
import {getMyTeams} from '@mm-redux/actions/teams';
import {Preferences, RequestStatus} from '@mm-redux/constants';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {get as getPreference} from '@mm-redux/selectors/entities/preferences';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {getCurrentLocale} from '@selectors/i18n';
import {selectFirstAvailableTeam} from '@utils/teams';

export function handleTeamChange(teamId) {
    return async (dispatch, getState) => {
        const state = getState();
        const {currentTeamId} = state.entities.teams;
        if (currentTeamId === teamId) {
            return;
        }

        const actions = [{type: TeamTypes.SELECT_TEAM, data: teamId}];
        const {channels, myMembers} = state.entities.channels;
        const channelId = lastChannelIdForTeam(state, teamId);

        if (channelId) {
            const channel = channels[channelId];
            const member = myMembers[channelId];

            actions.push({
                type: ChannelTypes.SELECT_CHANNEL,
                data: channelId,
                extra: {
                    channel,
                    member,
                    teamId,
                },
            });
        } else {
            actions.push({type: ChannelTypes.SELECT_CHANNEL, data: '', extra: {}});
        }

        dispatch(batchActions(actions, 'BATCH_SWITCH_TEAM'));
    };
}

export function selectDefaultTeam() {
    return async (dispatch, getState) => {
        const state = getState();

        const {ExperimentalPrimaryTeam} = getConfig(state);
        const locale = getCurrentLocale(state);
        const userTeamOrderPreference = getPreference(state, Preferences.TEAMS_ORDER, '', '');
        const {teams, myMembers} = state.entities.teams;
        const myTeams = Object.keys(teams).reduce((result, id) => {
            if (myMembers[id]) {
                result.push(teams[id]);
            }

            return result;
        }, []);

        let defaultTeam = selectFirstAvailableTeam(myTeams, locale, userTeamOrderPreference, ExperimentalPrimaryTeam);

        if (defaultTeam) {
            dispatch(handleTeamChange(defaultTeam.id));
        } else if (state.requests.teams.getTeams.status === RequestStatus.FAILURE || state.requests.teams.getMyTeams.status === RequestStatus.FAILURE) {
            EventEmitter.emit(NavigationTypes.NAVIGATION_ERROR_TEAMS);
        } else {
            // If for some reason we reached this point cause of a failure in rehydration or something
            // lets fetch the teams one more time to make sure the user does not belong to any team
            const {data, error} = await dispatch(getMyTeams());
            if (error) {
                EventEmitter.emit(NavigationTypes.NAVIGATION_ERROR_TEAMS);
                return;
            }

            if (data) {
                defaultTeam = selectFirstAvailableTeam(data, locale, userTeamOrderPreference, ExperimentalPrimaryTeam);
            }

            if (defaultTeam) {
                dispatch(handleTeamChange(defaultTeam.id));
            } else {
                EventEmitter.emit(NavigationTypes.NAVIGATION_NO_TEAMS);
            }
        }
    };
}

export default {
    handleTeamChange,
    selectDefaultTeam,
};
