// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import * as Selectors from '@mm-redux/selectors/entities/preferences';
import deepFreezeAndThrowOnMutation from '@mm-redux/utils/deep_freeze';
import {getPreferenceKey} from '@mm-redux/utils/preference_utils';

import {General, Preferences} from '../../constants';

describe('Selectors.Preferences', () => {
    const category1 = 'testcategory1';
    const category2 = 'testcategory2';
    const directCategory = Preferences.CATEGORY_DIRECT_CHANNEL_SHOW;
    const groupCategory = Preferences.CATEGORY_GROUP_CHANNEL_SHOW;
    const favCategory = Preferences.CATEGORY_FAVORITE_CHANNEL;

    const name1 = 'testname1';
    const value1 = 'true';
    const pref1 = {category: category1, name: name1, value: value1};

    const name2 = 'testname2';
    const value2 = '42';
    const pref2 = {category: category2, name: name2, value: value2};

    const dm1 = 'teammate1';
    const dmPref1 = {category: directCategory, name: dm1, value: 'true'};
    const dm2 = 'teammate2';
    const dmPref2 = {category: directCategory, name: dm2, value: 'false'};

    const gp1 = 'group1';
    const prefGp1 = {category: groupCategory, name: gp1, value: 'true'};
    const gp2 = 'group2';
    const prefGp2 = {category: groupCategory, name: gp2, value: 'false'};

    const fav1 = 'favorite1';
    const favPref1 = {category1: favCategory, name: fav1, value: 'true'};
    const fav2 = 'favorite2';
    const favPref2 = {category1: favCategory, name: fav2, value: 'false'};

    const currentUserId = 'currentuserid';

    const myPreferences = {};
    myPreferences[`${category1}--${name1}`] = pref1;
    myPreferences[`${category2}--${name2}`] = pref2;
    myPreferences[`${directCategory}--${dm1}`] = dmPref1;
    myPreferences[`${directCategory}--${dm2}`] = dmPref2;
    myPreferences[`${groupCategory}--${gp1}`] = prefGp1;
    myPreferences[`${groupCategory}--${gp2}`] = prefGp2;
    myPreferences[`${favCategory}--${fav1}`] = favPref1;
    myPreferences[`${favCategory}--${fav2}`] = favPref2;

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId,
            },
            preferences: {
                myPreferences,
            },
        },
    });

    describe('get preference', () => {
        it('should return the requested value', () => {
            assert.deepEqual(Selectors.get(testState, category1, name1), 'true');
        });

        describe('should fallback to the default', () => {
            it('if name unknown', () => {
                assert.deepEqual(Selectors.get(testState, category1, 'unknown name'), '');
            });

            it('if category unknown', () => {
                assert.deepEqual(Selectors.get(testState, 'unknown category', name1), '');
            });
        });

        describe('should fallback to the overridden default', () => {
            it('if name unknown', () => {
                assert.deepEqual(Selectors.get(testState, category1, 'unknown name', 'fallback'), 'fallback');
            });

            it('if category unknown', () => {
                assert.deepEqual(Selectors.get(testState, 'unknown category', name1, 'fallback'), 'fallback');
            });
        });
    });

    describe('get bool preference', () => {
        it('should return the requested value', () => {
            assert.deepEqual(Selectors.getBool(testState, category1, name1), value1 === 'true');
        });

        describe('should fallback to the default', () => {
            it('if name unknown', () => {
                assert.deepEqual(Selectors.getBool(testState, category1, 'unknown name'), false);
            });

            it('if category unknown', () => {
                assert.deepEqual(Selectors.getBool(testState, 'unknown category', name1), false);
            });
        });

        describe('should fallback to the overridden default', () => {
            it('if name unknown', () => {
                assert.deepEqual(Selectors.getBool(testState, category1, 'unknown name', true), true);
            });

            it('if category unknown', () => {
                assert.deepEqual(Selectors.getBool(testState, 'unknown category', name1, true), true);
            });
        });
    });

    describe('get int preference', () => {
        it('should return the requested value', () => {
            assert.deepEqual(Selectors.getInt(testState, category2, name2), value2);
        });

        describe('should fallback to the default', () => {
            it('if name unknown', () => {
                assert.deepEqual(Selectors.getInt(testState, category2, 'unknown name'), 0);
            });

            it('if category unknown', () => {
                assert.deepEqual(Selectors.getInt(testState, 'unknown category', name2), 0);
            });
        });

        describe('should fallback to the overridden default', () => {
            it('if name unknown', () => {
                assert.deepEqual(Selectors.getInt(testState, category2, 'unknown name', 100), 100);
            });

            it('if category unknown', () => {
                assert.deepEqual(Selectors.getInt(testState, 'unknown category', name2, 100), 100);
            });
        });
    });

    it('get preferences by category', () => {
        const getCategory = Selectors.makeGetCategory();
        assert.deepEqual(getCategory(testState, category1), [pref1]);
    });

    it('get direct channel show preferences', () => {
        assert.deepEqual(Selectors.getDirectShowPreferences(testState), [dmPref1, dmPref2]);
    });

    it('get group channel show preferences', () => {
        assert.deepEqual(Selectors.getGroupShowPreferences(testState), [prefGp1, prefGp2]);
    });

    it('get teammate name display setting', () => {
        assert.equal(
            Selectors.getTeammateNameDisplaySetting({
                entities: {
                    general: {
                        config: {
                            TeammateNameDisplay: General.TEAMMATE_NAME_DISPLAY.SHOW_NICKNAME_FULLNAME,
                        },
                    },
                    preferences: {
                        myPreferences: {},
                    },
                },
            }),
            General.TEAMMATE_NAME_DISPLAY.SHOW_NICKNAME_FULLNAME,
        );
    });

    describe('get theme', () => {
        it('default theme', () => {
            const currentTeamId = '1234';

            assert.equal(Selectors.getTheme({
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'default',
                        },
                    },
                    teams: {
                        currentTeamId,
                    },
                    preferences: {
                        myPreferences: {
                        },
                    },
                },
            }), Preferences.THEMES.default);
        });

        it('custom theme', () => {
            const currentTeamId = '1234';
            const theme = {sidebarBg: '#ff0000'};

            assert.equal(Selectors.getTheme({
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'default',
                        },
                    },
                    teams: {
                        currentTeamId,
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                                category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify(theme),
                            },
                        },
                    },
                },
            }).sidebarBg, theme.sidebarBg);
        });

        it('team-specific theme', () => {
            const currentTeamId = '1234';
            const otherTeamId = 'abcd';
            const theme = {sidebarBg: '#ff0000'};

            assert.deepEqual(Selectors.getTheme({
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'default',
                        },
                    },
                    teams: {
                        currentTeamId,
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                                category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify({}),
                            },
                            [getPreferenceKey(Preferences.CATEGORY_THEME, currentTeamId)]: {
                                category: Preferences.CATEGORY_THEME, name: currentTeamId, value: JSON.stringify(theme),
                            },
                            [getPreferenceKey(Preferences.CATEGORY_THEME, otherTeamId)]: {
                                category: Preferences.CATEGORY_THEME, name: otherTeamId, value: JSON.stringify({}),
                            },
                        },
                    },
                },
            }).sidebarBg, theme.sidebarBg);
        });

        it('mentionBj backwards compatability theme', () => {
            const currentTeamId = '1234';
            const theme = {mentionBj: '#ff0000'};

            assert.equal(Selectors.getTheme({
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'default',
                        },
                    },
                    teams: {
                        currentTeamId,
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                                category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify(theme),
                            },
                        },
                    },
                },
            }).mentionBg, theme.mentionBj);

            theme.mentionBg = '#ff0001';
            assert.equal(Selectors.getTheme({
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'default',
                        },
                    },
                    teams: {
                        currentTeamId,
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                                category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify(theme),
                            },
                        },
                    },
                },
            }).mentionBg, theme.mentionBg);
        });

        it('memoization', () => {
            const currentTeamId = '1234';
            const otherTeamId = 'abcd';

            let state = {
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'default',
                        },
                    },
                    teams: {
                        currentTeamId,
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                                category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify({}),
                            },
                            [getPreferenceKey(Preferences.CATEGORY_THEME, currentTeamId)]: {
                                category: Preferences.CATEGORY_THEME, name: currentTeamId, value: JSON.stringify({sidebarBg: '#ff0000'}),
                            },
                            [getPreferenceKey(Preferences.CATEGORY_THEME, otherTeamId)]: {
                                category: Preferences.CATEGORY_THEME, name: otherTeamId, value: JSON.stringify({}),
                            },
                        },
                    },
                },
            };

            const before = Selectors.getTheme(state);

            assert.equal(before, Selectors.getTheme(state));

            state = {
                ...state,
                entities: {
                    ...state.entities,
                    preferences: {
                        ...state.entities.preferences,
                        myPreferences: {
                            ...state.entities.preferences.myPreferences,
                            somethingUnrelated: {
                                category: 'somethingUnrelated', name: '', value: JSON.stringify({}),
                            },
                        },
                    },
                },
            };

            assert.equal(before, Selectors.getTheme(state));

            state = {
                ...state,
                entities: {
                    ...state.entities,
                    preferences: {
                        ...state.entities.preferences,
                        myPreferences: {
                            ...state.entities.preferences.myPreferences,
                            [getPreferenceKey(Preferences.CATEGORY_THEME, currentTeamId)]: {
                                category: Preferences.CATEGORY_THEME, name: currentTeamId, value: JSON.stringify({sidebarBg: '#0000ff'}),
                            },
                        },
                    },
                },
            };

            assert.notEqual(before, Selectors.getTheme(state));
            assert.notDeepEqual(before, Selectors.getTheme(state));
        });

        it('custom theme with upper case colours', () => {
            const currentTeamId = '1234';
            const theme = {sidebarBg: '#FF0000'};

            assert.deepEqual(Selectors.getTheme({
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'default',
                        },
                    },
                    teams: {
                        currentTeamId,
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                                category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify(theme),
                            },
                        },
                    },
                },
            }).sidebarBg, theme.sidebarBg.toLowerCase());
        });

        it('custom theme with missing colours', () => {
            const currentTeamId = '1234';
            const theme = {sidebarBg: '#ff0000'};

            assert.equal(Selectors.getTheme({
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'default',
                        },
                    },
                    teams: {
                        currentTeamId,
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                                category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify(theme),
                            },
                        },
                    },
                },
            }).mentionHighlightLink, Preferences.THEMES.default.mentionHighlightLink);
        });

        it('system theme with missing colours', () => {
            const currentTeamId = '1234';
            const theme = {
                type: Preferences.THEMES.mattermostDark.type,
                sidebarBg: '#ff0000',
            };

            assert.equal(Selectors.getTheme({
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'default',
                        },
                    },
                    teams: {
                        currentTeamId,
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                                category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify(theme),
                            },
                        },
                    },
                },
            }).sidebarText, Preferences.THEMES.mattermostDark.sidebarText);
        });

        it('non-default system theme', () => {
            const currentTeamId = '1234';
            const theme = {
                type: Preferences.THEMES.windows10.type,
            };

            assert.equal(Selectors.getTheme({
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'default',
                        },
                    },
                    teams: {
                        currentTeamId,
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                                category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify(theme),
                            },
                        },
                    },
                },
            }).codeTheme, Preferences.THEMES.windows10.codeTheme);
        });

        it('should return the server-configured theme by default', () => {
            assert.equal(Selectors.getTheme({
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'mattermostDark',
                        },
                    },
                    teams: {
                        currentTeamId: null,
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: null,
                        },
                    },
                },
            }).codeTheme, Preferences.THEMES.mattermostDark.codeTheme);

            // Opposite case
            assert.notEqual(Selectors.getTheme({
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'windows10',
                        },
                    },
                    teams: {
                        currentTeamId: null,
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: null,
                        },
                    },
                },
            }).codeTheme, Preferences.THEMES.mattermostDark.codeTheme);
        });

        it('returns the "default" theme if the server-configured value is not present', () => {
            assert.equal(Selectors.getTheme({
                entities: {
                    general: {
                        config: {
                            DefaultTheme: 'fakedoesnotexist',
                        },
                    },
                    teams: {
                        currentTeamId: null,
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: null,
                        },
                    },
                },
            }).codeTheme, Preferences.THEMES.default.codeTheme);
        });
    });

    it('get theme from style', () => {
        const theme = {themeColor: '#ffffff'};
        const currentTeamId = '1234';

        const state = {
            entities: {
                general: {
                    config: {
                        DefaultTheme: 'default',
                    },
                },
                teams: {
                    currentTeamId,
                },
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                            category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify(theme),
                        },
                    },
                },
            },
        };

        function testStyleFunction(myTheme) {
            return {
                container: {
                    backgroundColor: myTheme.themeColor,
                    height: 100,
                },
            };
        }

        const expected = {
            container: {
                backgroundColor: theme.themeColor,
                height: 100,
            },
        };

        const getStyleFromTheme = Selectors.makeGetStyleFromTheme();

        assert.deepEqual(getStyleFromTheme(state, testStyleFunction), expected);
    });

    it('get favorites names', () => {
        assert.deepEqual(Selectors.getFavoritesPreferences(testState), [fav1]);
    });

    it('get visible teammates', () => {
        assert.deepEqual(Selectors.getVisibleTeammate(testState), [dm1]);
    });

    it('get visible groups', () => {
        assert.deepEqual(Selectors.getVisibleGroupIds(testState), [gp1]);
    });

    describe('get new sidebar preference', () => {
        it('setting disabled, no user setting', () => {
            assert.equal(
                Selectors.getNewSidebarPreference({
                    entities: {
                        general: {
                            config: {
                                ExperimentalChannelSidebarOrganization: General.DISABLED,
                            },
                        },
                        preferences: {
                            myPreferences: {},
                        },
                    },
                }),
                false,
            );
        });

        it('setting disabled, user set to on', () => {
            assert.equal(
                Selectors.getNewSidebarPreference({
                    entities: {
                        general: {
                            config: {
                                ExperimentalChannelSidebarOrganization: General.DISABLED,
                            },
                        },
                        preferences: {
                            myPreferences: {
                                [getPreferenceKey(Preferences.CATEGORY_SIDEBAR_SETTINGS, Preferences.CHANNEL_SIDEBAR_ORGANIZATION)]: {
                                    category: Preferences.CATEGORY_SIDEBAR_SETTINGS, name: Preferences.CHANNEL_SIDEBAR_ORGANIZATION, value: 'true',
                                },
                            },
                        },
                    },
                }),
                false,
            );
        });

        it('setting default_off, no user setting', () => {
            assert.equal(
                Selectors.getNewSidebarPreference({
                    entities: {
                        general: {
                            config: {
                                ExperimentalChannelSidebarOrganization: General.DEFAULT_OFF,
                            },
                        },
                        preferences: {
                            myPreferences: {},
                        },
                    },
                }),
                false,
            );
        });

        it('setting default_off, user set to off', () => {
            assert.equal(
                Selectors.getNewSidebarPreference({
                    entities: {
                        general: {
                            config: {
                                ExperimentalChannelSidebarOrganization: General.DEFAULT_OFF,
                            },
                        },
                        preferences: {
                            myPreferences: {
                                [getPreferenceKey(Preferences.CATEGORY_SIDEBAR_SETTINGS, Preferences.CHANNEL_SIDEBAR_ORGANIZATION)]: {
                                    category: Preferences.CATEGORY_SIDEBAR_SETTINGS, name: Preferences.CHANNEL_SIDEBAR_ORGANIZATION, value: 'false',
                                },
                            },
                        },
                    },
                }),
                false,
            );
        });

        it('setting default_off, user set to on', () => {
            assert.equal(
                Selectors.getNewSidebarPreference({
                    entities: {
                        general: {
                            config: {
                                ExperimentalChannelSidebarOrganization: General.DEFAULT_OFF,
                            },
                        },
                        preferences: {
                            myPreferences: {
                                [getPreferenceKey(Preferences.CATEGORY_SIDEBAR_SETTINGS, Preferences.CHANNEL_SIDEBAR_ORGANIZATION)]: {
                                    category: Preferences.CATEGORY_SIDEBAR_SETTINGS, name: Preferences.CHANNEL_SIDEBAR_ORGANIZATION, value: 'true',
                                },
                            },
                        },
                    },
                }),
                true,
            );
        });

        it('setting default_on, no user setting', () => {
            assert.equal(
                Selectors.getNewSidebarPreference({
                    entities: {
                        general: {
                            config: {
                                ExperimentalChannelSidebarOrganization: General.DEFAULT_ON,
                            },
                        },
                        preferences: {
                            myPreferences: {},
                        },
                    },
                }),
                true,
            );
        });

        it('setting default_on, user set to off', () => {
            assert.equal(
                Selectors.getNewSidebarPreference({
                    entities: {
                        general: {
                            config: {
                                ExperimentalChannelSidebarOrganization: General.DEFAULT_ON,
                            },
                        },
                        preferences: {
                            myPreferences: {
                                [getPreferenceKey(Preferences.CATEGORY_SIDEBAR_SETTINGS, Preferences.CHANNEL_SIDEBAR_ORGANIZATION)]: {
                                    category: Preferences.CATEGORY_SIDEBAR_SETTINGS, name: Preferences.CHANNEL_SIDEBAR_ORGANIZATION, value: 'false',
                                },
                            },
                        },
                    },
                }),
                false,
            );
        });

        it('setting default_on, user set to on', () => {
            assert.equal(
                Selectors.getNewSidebarPreference({
                    entities: {
                        general: {
                            config: {
                                ExperimentalChannelSidebarOrganization: General.DEFAULT_ON,
                            },
                        },
                        preferences: {
                            myPreferences: {
                                [getPreferenceKey(Preferences.CATEGORY_SIDEBAR_SETTINGS, Preferences.CHANNEL_SIDEBAR_ORGANIZATION)]: {
                                    category: Preferences.CATEGORY_SIDEBAR_SETTINGS, name: Preferences.CHANNEL_SIDEBAR_ORGANIZATION, value: 'true',
                                },
                            },
                        },
                    },
                }),
                true,
            );
        });
    });
});

describe('shouldAutocloseDMs', () => {
    test('should return false by default', () => {
        const state = {
            entities: {
                general: {
                    config: {
                        CloseUnusedDirectMessages: 'false',
                    },
                },
                preferences: {
                    myPreferences: {},
                },
            },
        };

        expect(Selectors.shouldAutocloseDMs(state)).toBe(false);
    });

    test('should return true when enabled by server but not set by user', () => {
        const state = {
            entities: {
                general: {
                    config: {
                        CloseUnusedDirectMessages: 'true',
                    },
                },
                preferences: {
                    myPreferences: {},
                },
            },
        };

        expect(Selectors.shouldAutocloseDMs(state)).toBe(true);
    });

    test('should return true when enabled by both server and user', () => {
        const state = {
            entities: {
                general: {
                    config: {
                        CloseUnusedDirectMessages: 'true',
                    },
                },
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_SIDEBAR_SETTINGS, Preferences.CHANNEL_SIDEBAR_AUTOCLOSE_DMS)]: {value: Preferences.AUTOCLOSE_DMS_ENABLED},
                    },
                },
            },
        };

        expect(Selectors.shouldAutocloseDMs(state)).toBe(true);
    });

    test('should return false when enabled by server but disabled by user', () => {
        const state = {
            entities: {
                general: {
                    config: {
                        CloseUnusedDirectMessages: 'true',
                    },
                },
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_SIDEBAR_SETTINGS, Preferences.CHANNEL_SIDEBAR_AUTOCLOSE_DMS)]: {value: ''},
                    },
                },
            },
        };

        expect(Selectors.shouldAutocloseDMs(state)).toBe(false);
    });

    test('should return false when enabled by user but disabled by server', () => {
        const state = {
            entities: {
                general: {
                    config: {
                        CloseUnusedDirectMessages: 'false',
                    },
                },
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_SIDEBAR_SETTINGS, Preferences.CHANNEL_SIDEBAR_AUTOCLOSE_DMS)]: {value: Preferences.AUTOCLOSE_DMS_ENABLED},
                    },
                },
            },
        };

        expect(Selectors.shouldAutocloseDMs(state)).toBe(false);
    });
});
