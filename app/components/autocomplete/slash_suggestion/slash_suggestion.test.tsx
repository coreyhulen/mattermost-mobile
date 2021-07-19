// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {shallow} from 'enzyme';

import Preferences from '@mm-redux/constants/preferences';
import {Command, AutocompleteSuggestion} from '@mm-redux/types/integrations';
import Store from '@store/store';
import {intl} from 'test/intl-test-helper';

import {
    thunk,
    configureStore,
    Client4,
    AppBinding,
} from './app_command_parser/tests/app_command_parser_test_dependencies';

import {
    reduxTestState,
    testBindings,
} from './app_command_parser/tests/app_command_parser_test_data';

const mockStore = configureStore([thunk]);

const makeStore = async (bindings: AppBinding[]) => {
    const initialState = {
        ...reduxTestState,
        entities: {
            ...reduxTestState.entities,
            apps: {bindings},
        },
    } as any;
    const testStore = await mockStore(initialState);

    return testStore;
};

import SlashSuggestion, {Props} from './slash_suggestion';

describe('components/autocomplete/slash_suggestion', () => {
    const sampleCommand = {
        trigger: 'jitsi',
        auto_complete: true,
        auto_complete_desc: 'The Jitsi Description',
        auto_complete_hint: 'The Jitsi Hint',
        display_name: 'The Jitsi Display Name',
        icon_url: 'Jitsi icon',
    } as Command;

    const baseProps: Props = {
        actions: {
            getAutocompleteCommands: jest.fn(),
            getCommandAutocompleteSuggestions: jest.fn(),
        },
        currentTeamId: '',
        commands: [sampleCommand],
        isSearch: false,
        maxListHeight: 50,
        theme: Preferences.THEMES.default,
        onChangeText: jest.fn(),
        onResultCountChange: jest.fn(),
        value: '',
        nestedScrollEnabled: false,
        suggestions: [],
        rootId: '',
        channelId: 'thechannel',
        appsEnabled: true,
        appsTakeOver: false,
    };

    const f = Client4.getServerVersion;

    beforeAll(async () => {
        Client4.getServerVersion = jest.fn().mockReturnValue('5.30.0');

        const store = await makeStore(testBindings);
        Store.redux = store;
    });

    afterAll(() => {
        Client4.getServerVersion = f;
    });

    test('should match snapshot', () => {
        const props: Props = {
            ...baseProps,
        };

        const wrapper = shallow(
            <SlashSuggestion {...props}/>,
            {context: {intl}},
        );

        const dataSource: AutocompleteSuggestion[] = [
            {
                Complete: 'thetrigger',
                Description: 'The Description',
                Hint: 'The Hint',
                IconData: 'iconurl.com',
                Suggestion: '/thetrigger',
            },
        ];
        wrapper.setState({active: true, dataSource, lastCommandRequest: 1234});

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should show commands from props.commands', async () => {
        const command = {
            trigger: 'thetrigger',
            auto_complete: true,
            auto_complete_desc: 'The Description',
            auto_complete_hint: 'The Hint',
            display_name: 'The Display Name',
            icon_url: 'iconurl.com',
        } as Command;

        const props: Props = {
            ...baseProps,
            commands: [command],
        };

        const wrapper = shallow<SlashSuggestion>(
            <SlashSuggestion {...props}/>,
            {context: {intl}},
        );
        wrapper.setProps({value: '/the'});

        expect(wrapper.state('dataSource')).toEqual([
            {
                Complete: 'thetrigger',
                Description: 'The Description',
                Hint: 'The Hint',
                IconData: 'iconurl.com',
                Suggestion: '/thetrigger',
            },
        ]);
    });

    test('should show commands from app base commands', async () => {
        const props: Props = {
            ...baseProps,
            commands: [],
        };

        const wrapper = shallow<SlashSuggestion>(
            <SlashSuggestion {...props}/>,
            {context: {intl}},
        );
        wrapper.setProps({value: '/ji'});

        expect(wrapper.state('dataSource')).toEqual([
            {
                Complete: 'jira',
                Description: 'Interact with your Jira instance',
                Hint: 'Jira hint',
                IconData: 'Jira icon',
                Suggestion: '/jira',
            },
        ]);
    });

    test('should show commands from app base commands and regular commands', async () => {
        const props: Props = {
            ...baseProps,
        };

        const wrapper = shallow<SlashSuggestion>(
            <SlashSuggestion {...props}/>,
            {context: {intl}},
        );

        wrapper.setProps({value: '/'});
        expect(wrapper.state('dataSource')).toEqual([
            {
                Complete: 'jira',
                Description: 'Interact with your Jira instance',
                Hint: 'Jira hint',
                IconData: 'Jira icon',
                Suggestion: '/jira',
            },
            {
                Complete: 'jitsi',
                Description: 'The Jitsi Description',
                Hint: 'The Jitsi Hint',
                IconData: 'Jitsi icon',
                Suggestion: '/jitsi',
            },
            {
                Complete: 'other',
                Description: 'Other description',
                Hint: 'Other hint',
                IconData: 'Other icon',
                Suggestion: '/other',
            },
        ]);

        wrapper.setProps({value: '/ji'});
        expect(wrapper.state('dataSource')).toEqual([
            {
                Complete: 'jira',
                Description: 'Interact with your Jira instance',
                Hint: 'Jira hint',
                IconData: 'Jira icon',
                Suggestion: '/jira',
            },
            {
                Complete: 'jitsi',
                Description: 'The Jitsi Description',
                Hint: 'The Jitsi Hint',
                IconData: 'Jitsi icon',
                Suggestion: '/jitsi',
            },
        ]);
    });

    test('should avoid using app commands when apps are disabled', async () => {
        const props: Props = {
            ...baseProps,
            appsEnabled: false,
        };

        const wrapper = shallow<SlashSuggestion>(
            <SlashSuggestion {...props}/>,
            {context: {intl}},
        );
        wrapper.setProps({value: '/', suggestions: []});

        expect(wrapper.state('dataSource')).toEqual([
            {
                Complete: 'jitsi',
                Description: 'The Jitsi Description',
                Hint: 'The Jitsi Hint',
                IconData: 'Jitsi icon',
                Suggestion: '/jitsi',
            },
        ]);

        wrapper.setProps({value: '/ji', suggestions: []});

        expect(wrapper.state('dataSource')).toEqual([
            {
                Complete: 'jitsi',
                Description: 'The Jitsi Description',
                Hint: 'The Jitsi Hint',
                IconData: 'Jitsi icon',
                Suggestion: '/jitsi',
            },
        ]);

        wrapper.setProps({value: '/jira i', suggestions: []});
        expect(wrapper.state('dataSource')).toEqual([]);
    });
});
