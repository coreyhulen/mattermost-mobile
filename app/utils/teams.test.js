// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {General} from '@mm-redux/constants';
import {selectFirstAvailableTeam} from '@utils/teams';

describe('selectFirstAvailableTeam', () => {
    const myTeams = [{
        id: 'team-id-1',
        display_name: 'Zeta Team',
        name: 'zeta-team',
    }, {
        id: 'team-id-2',
        display_name: 'Alpha Team',
        name: 'alpha-team',
    }];
    const userTeamOrderPreference = 'team-id-1,team-id-2';

    it('should return the primary team', () => {
        const defaultTeam = selectFirstAvailableTeam(myTeams, General.DEFAULT_LOCALE, userTeamOrderPreference, 'zeTa-teAM');
        expect(defaultTeam).toBe(myTeams[0]);
    });

    it('should return the first team ordered by display_name given no team order preference', () => {
        const defaultTeam = selectFirstAvailableTeam(myTeams, General.DEFAULT_LOCALE);
        expect(defaultTeam).toBe(myTeams[1]);
    });

    it('should return the first team in team order preference when provided', () => {
        const defaultTeam = selectFirstAvailableTeam(myTeams, General.DEFAULT_LOCALE, userTeamOrderPreference);
        expect(defaultTeam).toBe(myTeams[0]);
    });

    it('should return the first team in team order preference if primary team is not found', () => {
        const defaultTeam = selectFirstAvailableTeam(myTeams, General.DEFAULT_LOCALE, userTeamOrderPreference, 'non-existent-team');
        expect(defaultTeam).toBe(myTeams[0]);
    });

    it('should return undefined is no team is found', () => {
        const defaultTeam = selectFirstAvailableTeam([], General.DEFAULT_LOCALE, userTeamOrderPreference);
        expect(defaultTeam).toBe(undefined);
    });
});
