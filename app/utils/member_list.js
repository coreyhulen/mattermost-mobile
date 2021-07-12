// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {t} from '@utils/i18n';

export const loadingText = {
    id: t('mobile.loading_members'),
    defaultMessage: 'Loading Members...',
};

const sectionKeyExtractor = (profile) => {
    // Group items alphabetically by first letter of username
    return profile.username[0].toUpperCase();
};

export function createProfilesSections(profiles) {
    const sections = {};
    const sectionKeys = [];
    for (const profile of profiles) {
        const sectionKey = sectionKeyExtractor(profile);

        if (!sections[sectionKey]) {
            sections[sectionKey] = [];
            sectionKeys.push(sectionKey);
        }

        sections[sectionKey].push(profile);
    }

    sectionKeys.sort();

    return sectionKeys.map((sectionKey) => {
        return {
            id: sectionKey,
            data: sections[sectionKey],
        };
    });
}

export function markSelectedProfiles(profiles, selectedProfiles) {
    return profiles.map((p) => {
        const profile = {...p};
        profile.selected = selectedProfiles[p.id];
        return profile;
    });
}
