// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import jestExpect from 'expect';

import {capitalize, getRandomId} from '@support/utils';

import client from './client';
import {getResponseFromError} from './common';

// ****************************************************************
// Teams
// See https://api.mattermost.com/#tag/teams
//
// Exported API function should have the following:
// - documented using JSDoc
// - meaningful description
// - match the referenced API endpoints
// - parameter/s defined by `@param`
// - return value defined by `@return`
// ****************************************************************

/**
 * Add user to team.
 * See https://api.mattermost.com/#operation/AddTeamMember
 * @param {string} userId - The ID of user to add into the team
 * @param {string} teamId - The team ID
 * @return {Object} returns {member} on success or {error, status} on error
 */
export const apiAddUserToTeam = async (userId, teamId) => {
    try {
        const response = await client.post(
            `/api/v4/teams/${teamId}/members`,
            {team_id: teamId, user_id: userId},
        );

        return {member: response.data};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Create a team.
 * See https://api.mattermost.com/#operation/CreateTeam
 * @param {string} option.type - 'O' (default) for open, 'I' for invite only
 * @param {string} option.prefix - option to add prefix to name and display name
 * @param {Object} team - fix team object to be created
 * @return {Object} returns {team} on success or {error, status} on error
 */
export const apiCreateTeam = async ({type = 'O', prefix = 'team', team = null} = {}) => {
    try {
        const response = await client.post(
            '/api/v4/teams',
            team || generateRandomTeam(type, prefix),
        );

        return {team: response.data};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Delete a team.
 * See https://api.mattermost.com/#operation/SoftDeleteTeam
 * @param {string} teamId - The team ID
 * @return {Object} returns {status} on success or {error, status} on error
 */
export const apiDeleteTeam = async (teamId) => {
    try {
        const response = await client.delete(
            `/api/v4/teams/${teamId}`,
        );

        return {status: response.status};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Delete teams.
 * @param {Array} teams - array of teams
 */
export const apiDeleteTeams = async (teams = []) => {
    let teamArray = teams;
    if (!teamArray.length > 0) {
        ({teams: teamArray} = await Team.apiGetTeams());
    }

    teamArray.forEach(async (team) => {
        const {status} = await Team.apiDeleteTeam(team.id);
        jestExpect(status).toEqual(200);
    });
};

/**
 * Remove user from team.
 * See https://api.mattermost.com/#operation/RemoveTeamMember
 * @param {string} teamId - The team ID
 * @param {string} userId - The user ID to be removed from team
 * @return {Object} returns {status} on success or {error, status} on error
 */
export const apiDeleteUserFromTeam = async (teamId, userId) => {
    try {
        const response = await client.delete(
            `/api/v4/teams/${teamId}/members/${userId}`,
        );

        return {status: response.status};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Get teams.
 * See https://api.mattermost.com/#operation/GetAllTeams
 * @return {Object} returns {teams} on success or {error, status} on error
 */
export const apiGetTeams = async () => {
    try {
        const response = await client.get('/api/v4/teams');

        return {teams: response.data};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Get teams for user.
 * See https://api.mattermost.com/#operation/GetTeamsForUser
 * @param {string} userId - The user ID
 * @return {Object} returns {teams} on success or {error, status} on error
 */
export const apiGetTeamsForUser = async (userId = 'me') => {
    try {
        const response = await client.get(`/api/v4/users/${userId}/teams`);

        return {teams: response.data};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Patch a team.
 * See https://api.mattermost.com/#operation/PatchTeam
 * @param {string} teamId - The team ID
 * @param {string} patch.display_name - Display name
 * @param {string} patch.description - Description
 * @param {string} patch.company_name - Company name
 * @param {string} patch.allowed_domains - Allowed domains
 * @param {boolean} patch.allow_open_invite - Allow open invite
 * @param {boolean} patch.group_constrained - Group constrained
 * @return {Object} returns {team} on success or {error, status} on error
 */
export const apiPatchTeam = async (teamId, teamData) => {
    try {
        const response = await client.put(
            `/api/v4/teams/${teamId}/patch`,
            teamData,
        );

        return {team: response.data};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Patch teams.
 * @param {string} patch.display_name - Display name
 * @param {string} patch.description - Description
 * @param {string} patch.company_name - Company name
 * @param {string} patch.allowed_domains - Allowed domains
 * @param {boolean} patch.allow_open_invite - Allow open invite
 * @param {boolean} patch.group_constrained - Group constrained
 * @param {Array} teams - array of teams
 */
export const apiPatchTeams = async (teamData, teams = []) => {
    let teamArray = teams;
    if (!teamArray.length > 0) {
        ({teams: teamArray} = await Team.apiGetTeams());
    }

    teamArray.forEach(async (team) => {
        await Team.apiPatchTeam(team.id, teamData);
    });
};

function generateRandomTeam(type, prefix) {
    const randomId = getRandomId();

    return {
        name: `${prefix}-${randomId}`,
        display_name: `${capitalize(prefix)} ${randomId}`,
        type,
    };
}

export const Team = {
    apiAddUserToTeam,
    apiCreateTeam,
    apiDeleteTeam,
    apiDeleteTeams,
    apiDeleteUserFromTeam,
    apiGetTeams,
    apiGetTeamsForUser,
    apiPatchTeam,
    apiPatchTeams,
};

export default Team;
