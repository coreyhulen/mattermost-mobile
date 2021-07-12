// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as reselect from 'reselect';

import {Permissions, Preferences} from '@mm-redux/constants';
import {getConfig, getCurrentUrl, isCompatibleWithJoinViewTeamPermissions} from '@mm-redux/selectors/entities/general';
import {get as getPreference} from '@mm-redux/selectors/entities/preferences';
import {haveISystemPermission} from '@mm-redux/selectors/entities/roles_helpers';
import {GlobalState} from '@mm-redux/types/store';
import {Team, TeamMembership} from '@mm-redux/types/teams';
import {IDMappedObjects} from '@mm-redux/types/utilities';
import {createIdsSelector} from '@mm-redux/utils/helpers';
import {sortTeamsByUserPreference, sortTeamsWithLocale} from '@mm-redux/utils/team_utils';
import {isTeamAdmin} from '@mm-redux/utils/user_utils';

export function getCurrentTeamId(state: GlobalState) {
    return state.entities.teams.currentTeamId;
}

export const getTeamByName = reselect.createSelector(getTeams, (state: GlobalState, name: string) => name, (teams: IDMappedObjects<Team>, name: string): Team|undefined => {
    return Object.values(teams).find((team: Team) => team.name === name);
});
export function getTeams(state: GlobalState): IDMappedObjects<Team> {
    return state.entities.teams.teams;
}

export function getTeamStats(state: GlobalState) {
    return state.entities.teams.stats;
}

export function getTeamMemberships(state: GlobalState) {
    return state.entities.teams.myMembers;
}

export function getMembersInTeams(state: GlobalState) {
    return state.entities.teams.membersInTeam;
}

export const getTeamsList = reselect.createSelector(
    getTeams,
    (teams) => {
        return Object.values(teams);
    },
);

export const getCurrentTeam = reselect.createSelector(
    getTeams,
    getCurrentTeamId,
    (teams, currentTeamId) => {
        return teams[currentTeamId];
    },
);

export function getTeam(state: GlobalState, id: string): Team {
    const teams = getTeams(state);
    return teams[id];
}

export const getCurrentTeamMembership = reselect.createSelector(
    getCurrentTeamId,
    getTeamMemberships,
    (currentTeamId: string, teamMemberships: {[x: string]: TeamMembership}): TeamMembership => {
        return teamMemberships[currentTeamId];
    },
);

export const isCurrentUserCurrentTeamAdmin = reselect.createSelector(
    getCurrentTeamMembership,
    (member) => {
        if (member) {
            const roles = member.roles || '';
            return isTeamAdmin(roles);
        }
        return false;
    },
);

export const getCurrentTeamUrl = reselect.createSelector(
    getCurrentUrl,
    getCurrentTeam,
    (state) => getConfig(state).SiteURL,
    (currentURL, currentTeam, siteURL) => {
        const rootURL = `${currentURL || siteURL}`;
        if (!currentTeam) {
            return rootURL;
        }

        return `${rootURL}/${currentTeam.name}`;
    },
);

export const getCurrentRelativeTeamUrl = reselect.createSelector(
    getCurrentTeam,
    (currentTeam) => {
        if (!currentTeam) {
            return '/';
        }
        return `/${currentTeam.name}`;
    },
);

export const getCurrentTeamStats = reselect.createSelector(
    getCurrentTeamId,
    getTeamStats,
    (currentTeamId, teamStats) => {
        return teamStats[currentTeamId];
    },
);

export const getMyTeams = reselect.createSelector(
    getTeams,
    getTeamMemberships,
    (teams, members) => {
        return Object.values(teams).filter((t) => t && members[t.id] && t.delete_at === 0);
    },
);

export const getMyTeamMember = reselect.createSelector(
    getTeamMemberships,
    (state: GlobalState, teamId: string) => teamId,
    (teamMemberships, teamId) => {
        return teamMemberships[teamId] || {};
    },
);

export const getMembersInCurrentTeam = reselect.createSelector(
    getCurrentTeamId,
    getMembersInTeams,
    (currentTeamId, teamMembers) => {
        return teamMembers[currentTeamId];
    },
);

export function getTeamMember(state: GlobalState, teamId: string, userId: string) {
    const members = getMembersInTeams(state)[teamId];
    if (members) {
        return members[userId];
    }

    return null;
}

export const getListableTeamIds = createIdsSelector(
    getTeams,
    getTeamMemberships,
    (state) => haveISystemPermission(state, {permission: Permissions.LIST_PUBLIC_TEAMS}),
    (state) => haveISystemPermission(state, {permission: Permissions.LIST_PRIVATE_TEAMS}),
    isCompatibleWithJoinViewTeamPermissions,
    (teams, myMembers, canListPublicTeams, canListPrivateTeams, compatibleWithJoinViewTeamPermissions) => {
        return Object.keys(teams).filter((id) => {
            const team = teams[id];
            const member = myMembers[id];
            let canList = team.allow_open_invite;
            if (compatibleWithJoinViewTeamPermissions) {
                canList = (canListPrivateTeams && !team.allow_open_invite) || (canListPublicTeams && team.allow_open_invite);
            }
            return team.delete_at === 0 && canList && !member;
        });
    },
);

export const getListableTeams = reselect.createSelector(
    getTeams,
    getListableTeamIds,
    (teams, listableTeamIds) => {
        return listableTeamIds.map((id) => teams[id]);
    },
);

export const getSortedListableTeams = reselect.createSelector(
    getTeams,
    getListableTeamIds,
    (state: GlobalState, locale: string) => locale,
    (teams, listableTeamIds, locale) => {
        const listableTeams: {[x: string]: Team} = {};

        for (const id of listableTeamIds) {
            listableTeams[id] = teams[id];
        }

        return Object.values(listableTeams).sort(sortTeamsWithLocale(locale));
    },
);

export const getJoinableTeamIds = createIdsSelector(
    getTeams,
    getTeamMemberships,
    (state: GlobalState) => haveISystemPermission(state, {permission: Permissions.JOIN_PUBLIC_TEAMS}),
    (state: GlobalState) => haveISystemPermission(state, {permission: Permissions.JOIN_PRIVATE_TEAMS}),
    isCompatibleWithJoinViewTeamPermissions,
    (teams, myMembers, canJoinPublicTeams, canJoinPrivateTeams, compatibleWithJoinViewTeamPermissions) => {
        return Object.keys(teams).filter((id) => {
            const team = teams[id];
            const member = myMembers[id];
            let canJoin = team.allow_open_invite;
            if (compatibleWithJoinViewTeamPermissions) {
                canJoin = (canJoinPrivateTeams && !team.allow_open_invite) || (canJoinPublicTeams && team.allow_open_invite);
            }
            return team.delete_at === 0 && canJoin && !member;
        });
    },
);

export const getJoinableTeams = reselect.createSelector(
    getTeams,
    getJoinableTeamIds,
    (teams, joinableTeamIds) => {
        return joinableTeamIds.map((id) => teams[id]);
    },
);

export const getSortedJoinableTeams = reselect.createSelector(
    getTeams,
    getJoinableTeamIds,
    (state: GlobalState, locale: string) => locale,
    (teams, joinableTeamIds, locale) => {
        const joinableTeams: {[x: string]: Team} = {};

        for (const id of joinableTeamIds) {
            joinableTeams[id] = teams[id];
        }

        return Object.values(joinableTeams).sort(sortTeamsWithLocale(locale));
    },
);

export const getMySortedTeamIds = createIdsSelector(
    getMyTeams,
    (state: GlobalState) => getPreference(state, Preferences.TEAMS_ORDER, '', ''),
    (state: GlobalState, locale: string) => locale,
    (teams, userTeamOrderPreference, locale) => {
        return sortTeamsByUserPreference(teams, locale, userTeamOrderPreference).map((t) => t.id);
    },
);

export const getMyTeamsCount = reselect.createSelector(
    getMyTeams,
    (teams) => {
        return teams.length;
    },
);

// returns the badge number to show (excluding the current team)
// > 0 means is returning the mention count
// 0 means that there are no unread messages
// -1 means that there are unread messages but no mentions
export const getChannelDrawerBadgeCount = reselect.createSelector(
    getCurrentTeamId,
    getTeamMemberships,
    (currentTeamId, teamMembers) => {
        let mentionCount = 0;
        let messageCount = 0;
        Object.values(teamMembers).forEach((m: TeamMembership) => {
            if (m.team_id !== currentTeamId) {
                mentionCount += (m.mention_count || 0);
                messageCount += (m.msg_count || 0);
            }
        });

        let badgeCount = 0;
        if (mentionCount) {
            badgeCount = mentionCount;
        } else if (messageCount) {
            badgeCount = -1;
        }

        return badgeCount;
    },
);

// returns the badge for a team
// > 0 means is returning the mention count
// 0 means that there are no unread messages
// -1 means that there are unread messages but no mentions
export function makeGetBadgeCountForTeamId() {
    return reselect.createSelector(
        getTeamMemberships,
        (state: GlobalState, id: string) => id,
        (members, teamId) => {
            const member = members[teamId];
            let badgeCount = 0;

            if (member) {
                if (member.mention_count) {
                    badgeCount = member.mention_count;
                } else if (member.msg_count) {
                    badgeCount = -1;
                }
            }

            return badgeCount;
        },
    );
}
