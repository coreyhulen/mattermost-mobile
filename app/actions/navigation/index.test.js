// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import merge from 'deepmerge';
import {Platform} from 'react-native';
import {Navigation} from 'react-native-navigation';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as NavigationActions from '@actions/navigation';
import {NavigationTypes} from '@constants';
import Preferences from '@mm-redux/constants/preferences';
import EventEmitter from '@mm-redux/utils/event_emitter';
import EphemeralStore from '@store/ephemeral_store';
import intitialState from '@store/initial_state';
import Store from '@store/store';

jest.unmock('@actions/navigation');
const mockStore = configureMockStore([thunk]);
const store = mockStore(intitialState);
Store.redux = store;

// Mock EphemeralStore add/remove modal
const add = EphemeralStore.addNavigationModal;
const remove = EphemeralStore.removeNavigationModal;
EphemeralStore.removeNavigationModal = (componentId) => {
    remove(componentId);
    EphemeralStore.removeNavigationComponentId(componentId);
};

EphemeralStore.addNavigationModal = (componentId) => {
    add(componentId);
    EphemeralStore.addNavigationComponentId(componentId);
};

describe('@actions/navigation', () => {
    const topComponentId = 'top-component-id';
    const name = 'name';
    const title = 'title';
    const theme = Preferences.THEMES.default;
    const passProps = {
        testProp: 'prop',
    };
    const options = {
        testOption: 'test',
    };

    beforeEach(() => {
        EphemeralStore.clearNavigationComponents();
        EphemeralStore.clearNavigationModals();

        // mock that we have a root screen
        EphemeralStore.addNavigationComponentId(topComponentId);
    });

    // EphemeralStore.getNavigationTopComponentId.mockReturnValue(topComponentId);

    test('resetToChannel should call Navigation.setRoot', () => {
        const setRoot = jest.spyOn(Navigation, 'setRoot');

        const expectedLayout = {
            root: {
                stack: {
                    children: [{
                        component: {
                            id: 'Channel',
                            name: 'Channel',
                            passProps,
                            options: {
                                layout: {
                                    componentBackgroundColor: theme.centerChannelBg,
                                },
                                statusBar: {
                                    visible: true,
                                },
                                topBar: {
                                    visible: false,
                                    height: 0,
                                    backButton: {
                                        visible: false,
                                        enableMenu: false,
                                        color: theme.sidebarHeaderTextColor,
                                    },
                                    background: {
                                        color: theme.sidebarHeaderBg,
                                    },
                                },
                            },
                        },
                    }],
                },
            },
        };

        NavigationActions.resetToChannel(passProps);
        expect(setRoot).toHaveBeenCalledWith(expectedLayout);
    });

    test('resetToSelectServer should call Navigation.setRoot', () => {
        const setRoot = jest.spyOn(Navigation, 'setRoot');

        const allowOtherServers = false;
        const expectedLayout = {
            root: {
                stack: {
                    children: [{
                        component: {
                            id: 'SelectServer',
                            name: 'SelectServer',
                            passProps: {
                                allowOtherServers,
                            },
                            options: {
                                layout: {
                                    backgroundColor: theme.centerChannelBg,
                                    componentBackgroundColor: theme.centerChannelBg,
                                },
                                statusBar: {
                                    visible: true,
                                },
                                topBar: {
                                    backButton: {
                                        color: theme.sidebarHeaderTextColor,
                                        enableMenu: false,
                                        title: '',
                                    },
                                    background: {
                                        color: theme.sidebarHeaderBg,
                                    },
                                    visible: false,
                                    height: 0,
                                },
                            },
                        },
                    }],
                },
            },
        };

        NavigationActions.resetToSelectServer(allowOtherServers);
        expect(setRoot).toHaveBeenCalledWith(expectedLayout);
    });

    test('resetToTeams should call Navigation.setRoot', () => {
        const setRoot = jest.spyOn(Navigation, 'setRoot');

        const defaultOptions = {
            layout: {
                componentBackgroundColor: theme.centerChannelBg,
            },
            statusBar: {
                visible: true,
            },
            topBar: {
                visible: true,
                title: {
                    color: theme.sidebarHeaderTextColor,
                    text: title,
                },
                backButton: {
                    color: theme.sidebarHeaderTextColor,
                    enableMenu: false,
                    title: '',
                },
                background: {
                    color: theme.sidebarHeaderBg,
                },
            },
        };

        const expectedLayout = {
            root: {
                stack: {
                    children: [{
                        component: {
                            id: name,
                            name,
                            passProps,
                            options: merge(defaultOptions, options),
                        },
                    }],
                },
            },
        };

        NavigationActions.resetToTeams(name, title, passProps, options);
        expect(setRoot).toHaveBeenCalledWith(expectedLayout);
    });

    test('goToScreen should call Navigation.push', () => {
        const push = jest.spyOn(Navigation, 'push');

        const defaultOptions = {
            layout: {
                componentBackgroundColor: theme.centerChannelBg,
            },
            popGesture: true,
            sideMenu: {
                left: {enabled: false},
                right: {enabled: false},
            },
            topBar: {
                animate: true,
                visible: true,
                backButton: {
                    color: theme.sidebarHeaderTextColor,
                    enableMenu: false,
                    title: '',
                    testID: 'screen.back.button',
                },
                background: {
                    color: theme.sidebarHeaderBg,
                },
                title: {
                    color: theme.sidebarHeaderTextColor,
                    text: title,
                },
            },
        };

        const expectedLayout = {
            component: {
                id: name,
                name,
                passProps,
                options: merge(defaultOptions, options),
            },
        };

        NavigationActions.goToScreen(name, title, passProps, options);
        expect(push).toHaveBeenCalledWith(topComponentId, expectedLayout);
    });

    test('popTopScreen should call Navigation.pop', () => {
        const pop = jest.spyOn(Navigation, 'pop');

        NavigationActions.popTopScreen();
        expect(pop).toHaveBeenCalledWith(topComponentId);

        const otherComponentId = `other-${topComponentId}`;
        NavigationActions.popTopScreen(otherComponentId);
        expect(pop).toHaveBeenCalledWith(otherComponentId);
    });

    test('popToRoot should call Navigation.popToRoot', async () => {
        const popToRoot = jest.spyOn(Navigation, 'popToRoot');

        await NavigationActions.popToRoot();
        expect(popToRoot).toHaveBeenCalledWith(topComponentId);
    });

    test('showModal should call Navigation.showModal', () => {
        const showModal = jest.spyOn(Navigation, 'showModal');

        const defaultOptions = {
            modalPresentationStyle: Platform.select({ios: 'pageSheet', android: 'none'}),
            layout: {
                componentBackgroundColor: theme.centerChannelBg,
            },
            statusBar: {
                visible: true,
            },
            topBar: {
                animate: true,
                visible: true,
                backButton: {
                    color: theme.sidebarHeaderTextColor,
                    enableMenu: false,
                    title: '',
                },
                background: {
                    color: theme.sidebarHeaderBg,
                },
                title: {
                    color: theme.sidebarHeaderTextColor,
                    text: title,
                },
                leftButtonColor: theme.sidebarHeaderTextColor,
                rightButtonColor: theme.sidebarHeaderTextColor,
            },
        };

        const expectedLayout = {
            stack: {
                children: [{
                    component: {
                        id: name,
                        name,
                        passProps,
                        options: merge(defaultOptions, options),
                    },
                }],
            },
        };

        NavigationActions.showModal(name, title, passProps, options);
        expect(showModal).toHaveBeenCalledWith(expectedLayout);
    });

    test('showModalOverCurrentContext should call Navigation.showModal', () => {
        const showModal = jest.spyOn(Navigation, 'showModal');

        const showModalOverCurrentContextTitle = '';
        const showModalOverCurrentContextOptions = {
            modalPresentationStyle: 'overCurrentContext',
            layout: {
                backgroundColor: 'transparent',
                componentBackgroundColor: 'transparent',
            },
            topBar: {
                visible: false,
                height: 0,
            },
            animations: {
                showModal: {
                    enabled: false,
                    enter: {},
                    exit: {},
                },
                dismissModal: {
                    enabled: false,
                    enter: {},
                    exit: {},
                },
            },
        };
        const showModalOptions = {
            modalPresentationStyle: Platform.select({ios: 'fullScreen', android: 'none'}),
            layout: {
                componentBackgroundColor: theme.centerChannelBg,
            },
            statusBar: {
                visible: true,
            },
            topBar: {
                animate: true,
                visible: true,
                backButton: {
                    color: theme.sidebarHeaderTextColor,
                    enableMenu: false,
                    title: '',
                },
                background: {
                    color: theme.sidebarHeaderBg,
                },
                title: {
                    color: theme.sidebarHeaderTextColor,
                    text: showModalOverCurrentContextTitle,
                },
                leftButtonColor: theme.sidebarHeaderTextColor,
                rightButtonColor: theme.sidebarHeaderTextColor,
            },
        };
        const defaultOptions = merge(showModalOverCurrentContextOptions, options);

        const expectedLayout = {
            stack: {
                children: [{
                    component: {
                        id: name,
                        name,
                        passProps,
                        options: merge(showModalOptions, defaultOptions),
                    },
                }],
            },
        };

        NavigationActions.showModalOverCurrentContext(name, passProps, options);
        expect(showModal).toHaveBeenCalledWith(expectedLayout);
    });

    test('showSearchModal should call Navigation.showModal', () => {
        const showModal = jest.spyOn(Navigation, 'showModal');

        const showSearchModalName = 'Search';
        const showSearchModalTitle = '';
        const initialValue = 'initial-value';
        const showSearchModalPassProps = {initialValue};
        const showSearchModalOptions = {
            topBar: {
                visible: false,
                height: 0,
            },
        };
        const defaultOptions = {
            modalPresentationStyle: Platform.select({ios: 'pageSheet', android: 'none'}),
            layout: {
                componentBackgroundColor: theme.centerChannelBg,
            },
            statusBar: {
                visible: true,
            },
            topBar: {
                animate: true,
                visible: true,
                backButton: {
                    color: theme.sidebarHeaderTextColor,
                    enableMenu: false,
                    title: '',
                },
                background: {
                    color: theme.sidebarHeaderBg,
                },
                title: {
                    color: theme.sidebarHeaderTextColor,
                    text: showSearchModalTitle,
                },
                leftButtonColor: theme.sidebarHeaderTextColor,
                rightButtonColor: theme.sidebarHeaderTextColor,
            },
        };

        const expectedLayout = {
            stack: {
                children: [{
                    component: {
                        id: showSearchModalName,
                        name: showSearchModalName,
                        passProps: showSearchModalPassProps,
                        options: merge(defaultOptions, showSearchModalOptions),
                    },
                }],
            },
        };

        NavigationActions.showSearchModal(initialValue);
        expect(showModal).toHaveBeenCalledWith(expectedLayout);
    });

    test('dismissModal should call Navigation.dismissModal', async () => {
        const dismissModal = jest.spyOn(Navigation, 'dismissModal');

        NavigationActions.showModal('First', 'First Modal', passProps, options);

        await NavigationActions.dismissModal(options);
        expect(dismissModal).toHaveBeenCalledWith('First', options);
    });

    test('dismissAllModals should call Navigation.dismissAllModals', async () => {
        const dismissModal = jest.spyOn(Navigation, 'dismissModal');

        NavigationActions.showModal('First', 'First Modal', passProps, options);
        NavigationActions.showModal('Second', 'Second Modal', passProps, options);

        await NavigationActions.dismissAllModals(options);
        expect(dismissModal).toHaveBeenCalledTimes(2);
    });

    test('mergeNavigationOptions should call Navigation.mergeOptions', () => {
        const mergeOptions = jest.spyOn(Navigation, 'mergeOptions');

        NavigationActions.mergeNavigationOptions(topComponentId, options);
        expect(mergeOptions).toHaveBeenCalledWith(topComponentId, options);
    });

    test('setButtons should call Navigation.mergeOptions', () => {
        const mergeOptions = jest.spyOn(Navigation, 'mergeOptions');

        const buttons = {
            leftButtons: ['left-button'],
            rightButtons: ['right-button'],
        };
        const setButtonsOptions = {
            topBar: {
                ...buttons,
            },
        };

        NavigationActions.setButtons(topComponentId, buttons);
        expect(mergeOptions).toHaveBeenCalledWith(topComponentId, setButtonsOptions);
    });

    test('showOverlay should call Navigation.showOverlay', () => {
        const showOverlay = jest.spyOn(Navigation, 'showOverlay');

        const defaultOptions = {
            layout: {
                backgroundColor: 'transparent',
                componentBackgroundColor: 'transparent',
            },
            overlay: {
                interceptTouchOutside: false,
            },
        };

        const expectedLayout = {
            component: {
                name,
                passProps,
                options: merge(defaultOptions, options),
            },
        };

        NavigationActions.showOverlay(name, passProps, options);
        expect(showOverlay).toHaveBeenCalledWith(expectedLayout);
    });

    test('dismissOverlay should call Navigation.dismissOverlay', async () => {
        const dismissOverlay = jest.spyOn(Navigation, 'dismissOverlay');

        await NavigationActions.dismissOverlay(topComponentId);
        expect(dismissOverlay).toHaveBeenCalledWith(topComponentId);
    });

    test('dismissAllModalsAndPopToRoot should call Navigation.dismissAllModals, Navigation.popToRoot, and emit event', async () => {
        const dismissModal = jest.spyOn(Navigation, 'dismissModal');
        const popToRoot = jest.spyOn(Navigation, 'popToRoot');
        EventEmitter.emit = jest.fn();

        NavigationActions.showModal('First', 'First Modal', passProps, options);
        NavigationActions.showModal('Second', 'Second Modal', passProps, options);

        await NavigationActions.dismissAllModalsAndPopToRoot();
        expect(dismissModal).toHaveBeenCalledTimes(2);
        expect(popToRoot).toHaveBeenCalledWith(topComponentId);
        expect(EventEmitter.emit).toHaveBeenCalledWith(NavigationTypes.NAVIGATION_DISMISS_AND_POP_TO_ROOT);
    });
});
