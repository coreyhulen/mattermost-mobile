// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import React from 'react';

import {Preferences} from '@mm-redux/constants';

import Channels from './channel_list';
import Share from './share';
import Teams from './team_list';

const theme = Preferences.THEMES.default;

const Stack = createStackNavigator();
const defaultNavigationOptions = {
    headerStyle: {
        backgroundColor: theme.sidebarHeaderBg,
    },
    headerTitleStyle: {
        marginHorizontal: 0,
        left: 0,
        color: theme.sidebarHeaderTextColor,
    },
    headerBackTitleStyle: {
        color: theme.sidebarHeaderTextColor,
        margin: 0,
    },
    headerTintColor: theme.sidebarHeaderTextColor,
    headerTopInsetEnabled: false,
};

function RootStack() {
    return (
        <Stack.Navigator
            initialRouteName='Post'
            screenOptions={defaultNavigationOptions}
        >
            <Stack.Screen
                name='Post'
                component={Share}
            />
            <Stack.Screen
                name='Teams'
                component={Teams}
            />
            <Stack.Screen
                name='Channels'
                component={Channels}
            />
        </Stack.Navigator>
    );
}

export default function ExtensionNavigation() {
    return (
        <NavigationContainer>
            <RootStack/>
        </NavigationContainer>
    );
}
