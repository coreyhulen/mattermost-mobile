// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Keyboard, Platform} from 'react-native';
import {Navigation} from 'react-native-navigation';
import merge from 'deepmerge';

import {Preferences} from '@mm-redux/constants';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import EventEmmiter from '@mm-redux/utils/event_emitter';

import CompassIcon from '@components/compass_icon';
import {DeviceTypes, NavigationTypes} from '@constants';
import {CHANNEL} from '@constants/screen';
import EphemeralStore from '@store/ephemeral_store';
import Store from '@store/store';

Navigation.setDefaultOptions({
    layout: {
        orientation: [DeviceTypes.IS_TABLET ? 'all' : 'portrait'],
    },
});

function getThemeFromState() {
    const state = Store.redux?.getState() || {};

    return getTheme(state);
}

export function resetToChannel(passProps = {}) {
    const theme = getThemeFromState();

    EphemeralStore.clearNavigationComponents();

    const stack = {
        children: [{
            component: {
                id: CHANNEL,
                name: CHANNEL,
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
                        background: {
                            color: theme.sidebarHeaderBg,
                        },
                        backButton: {
                            visible: false,
                            color: theme.sidebarHeaderTextColor,
                            enableMenu: false,
                        },
                    },
                },
            },
        }],
    };

    let platformStack = {stack};
    if (Platform.OS === 'android') {
        platformStack = {
            sideMenu: {
                left: {
                    component: {
                        id: 'MainSidebar',
                        name: 'MainSidebar',
                    },
                },
                center: {
                    stack,
                },
                right: {
                    component: {
                        id: 'SettingsSidebar',
                        name: 'SettingsSidebar',
                    },
                },
            },
        };
    }

    Navigation.setRoot({
        root: {
            ...platformStack,
        },
    });
}

export function resetToSelectServer(allowOtherServers) {
    const theme = Preferences.THEMES.default;

    EphemeralStore.clearNavigationComponents();

    Navigation.setRoot({
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
    });
}

export function resetToTeams(name, title, passProps = {}, options = {}) {
    const theme = getThemeFromState();
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

    EphemeralStore.clearNavigationComponents();

    Navigation.setRoot({
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
    });
}

export function goToScreen(name, title, passProps = {}, options = {}) {
    const theme = getThemeFromState();
    const componentId = EphemeralStore.getNavigationTopComponentId();
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

    Navigation.push(componentId, {
        component: {
            id: name,
            name,
            passProps,
            options: merge(defaultOptions, options),
        },
    });
}

export function popTopScreen(screenId) {
    if (screenId) {
        Navigation.pop(screenId);
    } else {
        const componentId = EphemeralStore.getNavigationTopComponentId();
        Navigation.pop(componentId);
    }
}

export async function popToRoot() {
    const componentId = EphemeralStore.getNavigationTopComponentId();

    try {
        await Navigation.popToRoot(componentId);
    } catch (error) {
        // RNN returns a promise rejection if there are no screens
        // atop the root screen to pop. We'll do nothing in this case.
    }
}

export async function dismissAllModalsAndPopToRoot() {
    await dismissAllModals();
    await popToRoot();

    EventEmmiter.emit(NavigationTypes.NAVIGATION_DISMISS_AND_POP_TO_ROOT);
}

export function showModal(name, title, passProps = {}, options = {}) {
    const theme = getThemeFromState();
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

    EphemeralStore.addNavigationModal(name);
    Navigation.showModal({
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
    });
}

export function showModalOverCurrentContext(name, passProps = {}, options = {}) {
    const title = '';

    let animations;
    switch (Platform.OS) {
    case 'android':
        animations = {
            showModal: {
                waitForRender: true,
                alpha: {
                    from: 0,
                    to: 1,
                    duration: 250,
                },
            },
            dismissModal: {
                alpha: {
                    from: 1,
                    to: 0,
                    duration: 250,
                },
            },
        };
        break;
    default:
        animations = {
            showModal: {
                enter: {
                    enabled: false,
                },
                exit: {
                    enabled: false,
                },
            },
            dismissModal: {
                enter: {
                    enabled: false,
                },
                exit: {
                    enabled: false,
                },
            },
        };
        break;
    }

    const defaultOptions = {
        modalPresentationStyle: 'overCurrentContext',
        layout: {
            backgroundColor: 'transparent',
            componentBackgroundColor: 'transparent',
        },
        topBar: {
            visible: false,
            height: 0,
        },
        animations,
    };
    const mergeOptions = merge(defaultOptions, options);

    showModal(name, title, passProps, mergeOptions);
}

export function showSearchModal(initialValue = '') {
    const name = 'Search';
    const title = '';
    const passProps = {initialValue};
    const options = {
        topBar: {
            visible: false,
            height: 0,
        },
        ...Platform.select({
            ios: {
                modalPresentationStyle: 'pageSheet',
            },
        }),
    };

    showModal(name, title, passProps, options);
}

export const showAppForm = async (form, call, theme) => {
    const closeButton = await CompassIcon.getImageSource('close', 24, theme.sidebarHeaderTextColor);

    let submitButtons;
    const customSubmitButtons = form.submit_buttons && form.fields.find((f) => f.name === form.submit_buttons)?.options;

    if (!customSubmitButtons?.length) {
        submitButtons = [{
            id: 'submit-form',
            showAsAction: 'always',
            text: 'Submit',
        }];
    }

    const options = {
        topBar: {
            leftButtons: [{
                id: 'close-dialog',
                icon: closeButton,
            }],
            rightButtons: submitButtons,
        },
    };

    const passProps = {form, call};
    showModal('AppForm', form.title, passProps, options);
};

export async function dismissModal(options = {}) {
    if (!EphemeralStore.hasModalsOpened()) {
        return;
    }

    const componentId = EphemeralStore.getNavigationTopComponentId();

    try {
        await Navigation.dismissModal(componentId, options);
        EphemeralStore.removeNavigationModal(componentId);
    } catch (error) {
        // RNN returns a promise rejection if there is no modal to
        // dismiss. We'll do nothing in this case.
    }
}

export async function dismissAllModals(options) {
    if (!EphemeralStore.hasModalsOpened()) {
        return;
    }

    if (Platform.OS === 'ios') {
        const modals = [...EphemeralStore.navigationModalStack];
        for await (const modal of modals) {
            await Navigation.dismissModal(modal, options);
            EphemeralStore.removeNavigationModal(modal);
        }
    } else {
        await Navigation.dismissAllModals(options);
        EphemeralStore.clearNavigationModals();
    }
}

export function setButtons(componentId, buttons = {leftButtons: [], rightButtons: []}) {
    const options = {
        topBar: {
            ...buttons,
        },
    };

    mergeNavigationOptions(componentId, options);
}

export function mergeNavigationOptions(componentId, options) {
    Navigation.mergeOptions(componentId, options);
}

export function showOverlay(name, passProps, options = {}) {
    const defaultOptions = {
        layout: {
            backgroundColor: 'transparent',
            componentBackgroundColor: 'transparent',
        },
        overlay: {
            interceptTouchOutside: false,
        },
    };

    Navigation.showOverlay({
        component: {
            name,
            passProps,
            options: merge(defaultOptions, options),
        },
    });
}

export async function dismissOverlay(componentId) {
    try {
        await Navigation.dismissOverlay(componentId);
    } catch (error) {
        // RNN returns a promise rejection if there is no modal with
        // this componentId to dismiss. We'll do nothing in this case.
    }
}

export function openMainSideMenu() {
    if (Platform.OS === 'ios') {
        return;
    }

    const componentId = EphemeralStore.getNavigationTopComponentId();

    Keyboard.dismiss();
    Navigation.mergeOptions(componentId, {
        sideMenu: {
            left: {visible: true},
        },
    });
}

export function closeMainSideMenu() {
    if (Platform.OS === 'ios') {
        return;
    }

    Keyboard.dismiss();
    Navigation.mergeOptions(CHANNEL, {
        sideMenu: {
            left: {visible: false},
        },
    });
}

export function enableMainSideMenu(enabled, visible = true) {
    if (Platform.OS === 'ios') {
        return;
    }

    Navigation.mergeOptions(CHANNEL, {
        sideMenu: {
            left: {enabled, visible},
        },
    });
}

export function openSettingsSideMenu() {
    if (Platform.OS === 'ios') {
        return;
    }

    Keyboard.dismiss();
    Navigation.mergeOptions(CHANNEL, {
        sideMenu: {
            right: {visible: true},
        },
    });
}

export function closeSettingsSideMenu() {
    if (Platform.OS === 'ios') {
        return;
    }

    Keyboard.dismiss();
    Navigation.mergeOptions(CHANNEL, {
        sideMenu: {
            right: {visible: false},
        },
    });
}
