// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {RouteProp, useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';

import React, {useCallback, useLayoutEffect} from 'react';
import {BackHandler, FlatList, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';

import Loading from '@components/loading';
import {Preferences} from '@mm-redux/constants';
import {getMyTeams} from '@mm-redux/selectors/entities/teams';
import {sortTeamsWithLocale} from '@mm-redux/utils/team_utils';
import {getCurrentLocale} from '@selectors/i18n';
import TeamItem from '@share/components/team_item';
import {changeOpacity} from '@utils/theme';

import type {Team} from '@mm-redux/types/teams';

type TeamListParams = {
    Teams: {
        currentTeamId?: string;
        onSelectTeam: (team: Team) => void;
        title: string;
    };
}

type TeamListRoute = RouteProp<TeamListParams, 'Teams'>;

type ListItem = (info: {item: Team}) => React.ReactElement;

const theme = Preferences.THEMES.default;

const TeamList = () => {
    const navigation = useNavigation();
    const route = useRoute<TeamListRoute>();
    const {currentTeamId, onSelectTeam, title} = route.params;
    const locale: string = useSelector(getCurrentLocale);
    const teams = useSelector(getMyTeams);
    teams.sort(sortTeamsWithLocale(locale)).map((t) => t.display_name);

    const keyExtractor = (item: Team) => item?.id;
    const renderItemSeparator = () => (<View style={styles.separator}/>);
    const renderItem: ListItem = ({item}) => (
        <TeamItem
            selected={item.id === currentTeamId}
            onSelect={onSelectTeam}
            team={item}
        />
    );

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                navigation.goBack();
                return true;
            };

            BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, []),
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            title,
        });
    }, [navigation]);

    if (!teams.length) {
        return <Loading/>;
    }

    return (
        <FlatList
            testID='share_extension.team_list.screen'
            data={teams}
            ItemSeparatorComponent={renderItemSeparator}
            removeClippedSubviews={true}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps='always'
            keyboardDismissMode='on-drag'
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            scrollEventThrottle={100}
            windowSize={5}
        />
    );
};

const styles = StyleSheet.create({
    separator: {
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
        height: 1,
    },
});

export default TeamList;
