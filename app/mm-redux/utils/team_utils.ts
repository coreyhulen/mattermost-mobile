// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Team} from '@mm-redux/types/teams';
import {IDMappedObjects, Dictionary} from '@mm-redux/types/utilities';

import {General} from '../constants';

export function teamListToMap(teamList: Array<Team>): IDMappedObjects<Team> {
    const teams: Dictionary<Team> = {};
    for (let i = 0; i < teamList.length; i++) {
        teams[teamList[i].id] = teamList[i];
    }
    return teams;
}

export function sortTeamsWithLocale(locale: string): (a: Team, b: Team) => number {
    return (a: Team, b: Team): number => {
        if (a.display_name !== b.display_name) {
            return a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase(), locale || General.DEFAULT_LOCALE, {numeric: true});
        }

        return a.name.toLowerCase().localeCompare(b.name.toLowerCase(), locale || General.DEFAULT_LOCALE, {numeric: true});
    };
}

export function sortTeamsByUserPreference(teams: Array<Team>, locale: string, teamsOrder = ''): Array<Team> {
    if (!teams?.length) {
        return [];
    }

    const teamsOrderList = teamsOrder.split(',').filter((t) => t);

    if (!teamsOrderList.length) {
        return [...teams].sort(sortTeamsWithLocale(locale));
    }

    const customSortedTeams = teams.filter((team) => {
        if (team !== null) {
            return teamsOrderList.includes(team.id);
        }
        return false;
    }).sort((a, b) => {
        return teamsOrderList.indexOf(a.id) - teamsOrderList.indexOf(b.id);
    });

    const otherTeams = teams.filter((team) => {
        if (team !== null) {
            return !teamsOrderList.includes(team.id);
        }
        return false;
    }).sort(sortTeamsWithLocale(locale));

    return [...customSortedTeams, ...otherTeams];
}
