// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useNavigation} from '@react-navigation/native';

import React from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {StyleSheet, Text, TouchableHighlight, View} from 'react-native';
import {useDispatch, useStore} from 'react-redux';

import FormattedText from '@components/formatted_text';
import {getMyTeams} from '@mm-redux/actions/teams';
import {Preferences} from '@mm-redux/constants';
import {DispatchFunc} from '@mm-redux/types/actions';
import {loadTeamChannels, getTeamDefaultChannel} from '@share/actions';
import {changeOpacity} from '@utils/theme';

import type {Channel} from '@mm-redux/types/channels';
import type {Team} from '@mm-redux/types/teams';

interface TeamButtonProps {
    intl: typeof intlShape;
    onSelect: (team: Team, channel?: Channel | null) => void;
    team?: Team | null;
}

const theme = Preferences.THEMES.default;

const TeamButton = ({intl, onSelect, team}: TeamButtonProps) => {
    const store = useStore();
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const onPress = () => {
        dispatch(getMyTeams());
        navigation.navigate('Teams', {
            title: intl.formatMessage({id: 'mobile.routes.selectTeam', defaultMessage: 'Select Team'}),
            currentTeamId: team?.id,
            onSelectTeam,
        });
    };

    const onSelectTeam = async (t: Team) => {
        const loadChannels = loadTeamChannels(t.id);
        const getChannel = getTeamDefaultChannel(t.id);
        await loadChannels(dispatch as DispatchFunc, store.getState);
        const defaultChannel = await getChannel(dispatch as DispatchFunc, store.getState);
        onSelect(t, defaultChannel);
        navigation.goBack();
    };

    return (
        <TouchableHighlight
            onPress={onPress}
            style={styles.buttonContainer}
            underlayColor={changeOpacity(theme.centerChannelColor, 0.2)}
        >
            <View style={styles.buttonWrapper}>
                <FormattedText
                    defaultMessage='Team'
                    id='mobile.share_extension.team'
                    style={styles.buttonLabel}
                />
                <Text style={styles.buttonValue}>
                    {team?.display_name}
                </Text>
            </View>
        </TouchableHighlight>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    buttonContainer: {
        borderTopColor: changeOpacity(theme.centerChannelColor, 0.2),
        borderTopWidth: 1,
        height: 70,
        paddingHorizontal: 15,
    },
    buttonWrapper: {
        alignItems: 'flex-start',
        flex: 1,
    },
    buttonLabel: {
        fontSize: 16,
        marginTop: 16,
        marginBottom: 3,
    },
    buttonValue: {
        color: changeOpacity(theme.centerChannelColor, 0.6),
        fontSize: 14,
    },
});

export default injectIntl(TeamButton);
