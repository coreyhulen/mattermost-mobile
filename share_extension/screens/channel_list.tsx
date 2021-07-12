// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {RouteProp, useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';

import React, {useCallback, useEffect, useLayoutEffect, useState} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {BackHandler, SectionList, SectionListData, SectionListRenderItemInfo, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';

import FormattedText from '@components/formatted_text';
import Loading from '@components/loading';
import SearchBar from '@components/search_bar';
import {Preferences} from '@mm-redux/constants';
import {GlobalState} from '@mm-redux/types/store';
import ChannelItem from '@share/components/channel_item';
import {getExtensionSortedDirectChannels, getExtensionSortedPrivateChannels, getExtensionSortedPublicChannels} from '@share/selectors';
import {throttle} from '@utils/general';
import {changeOpacity} from '@utils/theme';

import type {Channel} from '@mm-redux/types/channels';

interface ChannnelListProps {
    intl: typeof intlShape;
}

interface SectionData {
    defaultMessage: string;
    id: string;
    data: Channel[];
}

type ChannnelListParams = {
    Channels: {
        currentChannelId?: string;
        onSelectChannel: (channel: Channel) => void;
        teamId: string;
        title: string;
    };
}

type SectionDataHeader = (info: {section: SectionListData<Channel>}) => React.ReactElement | null;

export type ChannelListRoute = RouteProp<ChannnelListParams, 'Channels'>;

const theme = Preferences.THEMES.default;

const ChannelList = ({intl}: ChannnelListProps) => {
    const navigation = useNavigation();
    const route = useRoute<ChannelListRoute>();
    const {currentChannelId, onSelectChannel, teamId, title} = route.params;
    const directChannels = useSelector(getExtensionSortedDirectChannels);
    const privateChannels = useSelector((state: GlobalState) => getExtensionSortedPrivateChannels(state, teamId));
    const publicChannels = useSelector((state: GlobalState) => getExtensionSortedPublicChannels(state, teamId));
    const [sections, setSections] = useState<SectionData[]>();
    const [term, setTerm] = useState<string>();

    const handleSearch = useCallback((text) => {
        throttle(setTerm(text));
    }, []);

    const keyExtractor = (item: Channel) => item?.id;
    const renderItemSeparator = () => (<View style={styles.separator}/>);
    const renderSectionHeader: SectionDataHeader = ({section}) => (
        <View style={[styles.titleContainer, {backgroundColor: theme.centerChannelColor}]}>
            <View style={{backgroundColor: changeOpacity(theme.centerChannelBg, 0.6), justifyContent: 'center'}}>
                <FormattedText
                    defaultMessage={section.defaultMessage}
                    id={section.id}
                    style={styles.title}
                />
            </View>
        </View>
    );
    const renderItem = ({item}: SectionListRenderItemInfo<Channel>) => (
        <ChannelItem
            testID='share_extension.channel_list.channel_item'
            channel={item}
            onSelect={onSelectChannel}
            selected={item.id === currentChannelId}
        />
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            title,
        });
    }, [navigation]);

    useEffect(() => {
        const sectionsArray = [];
        let directFiltered;
        let privateFiletered;
        let publicFiltered;

        if (term) {
            directFiltered = directChannels.filter((c: Channel) => c.delete_at === 0 && c.display_name.toLowerCase().includes(term.toLowerCase()));
            privateFiletered = privateChannels.filter((c: Channel) => c.delete_at === 0 && c.display_name.toLowerCase().includes(term.toLowerCase()));
            publicFiltered = publicChannels.filter((c: Channel) => c.delete_at === 0 && c.display_name.toLowerCase().includes(term.toLowerCase()));
        } else {
            directFiltered = directChannels.filter((c: Channel) => c.delete_at === 0);
            privateFiletered = privateChannels.filter((c: Channel) => c.delete_at === 0);
            publicFiltered = publicChannels.filter((c: Channel) => c.delete_at === 0);
        }

        if (publicFiltered.length) {
            sectionsArray.push({
                id: 'sidebar.channels',
                defaultMessage: 'PUBLIC CHANNELS',
                data: publicFiltered,
            });
        }

        if (privateFiletered.length) {
            sectionsArray.push({
                id: 'sidebar.pg',
                defaultMessage: 'PRIVATE CHANNELS',
                data: privateFiletered,
            });
        }

        if (directFiltered.length) {
            sectionsArray.push({
                id: 'sidebar.direct',
                defaultMessage: 'DIRECT MESSAGES',
                data: directFiltered,
            });
        }

        setSections(sectionsArray);
    }, [term]);

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

    if (!sections) {
        return <Loading/>;
    }

    return (
        <View
            testID='share_extension.channel_list.screen'
            style={styles.flex}
        >
            <View style={styles.searchContainer}>
                <SearchBar
                    testID='share_extension.channel_list.search_bar'
                    placeholder={intl.formatMessage({id: 'search_bar.search', defaultMessage: 'Search'})}
                    cancelTitle={intl.formatMessage({id: 'mobile.post.cancel', defaultMessage: 'Cancel'})}
                    backgroundColor='transparent'
                    inputHeight={43}
                    inputStyle={styles.searchBarInput}
                    placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                    tintColorSearch={changeOpacity(theme.centerChannelColor, 0.5)}
                    tintColorDelete={changeOpacity(theme.centerChannelColor, 0.3)}
                    titleCancelColor={theme.centerChannelColor}
                    onChangeText={handleSearch}
                    autoCapitalize='none'
                    value={term}
                />
            </View>
            <SectionList
                style={styles.flex}
                sections={sections}
                ItemSeparatorComponent={renderItemSeparator}
                removeClippedSubviews={true}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={keyExtractor}
                keyboardShouldPersistTaps='always'
                keyboardDismissMode='on-drag'
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                stickySectionHeadersEnabled={true}
                scrollEventThrottle={100}
                windowSize={5}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    separator: {
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
        height: 1,
    },
    loadingContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    searchContainer: {
        paddingBottom: 2,
        height: 38,
    },
    searchBarInput: {
        backgroundColor: '#fff',
        color: theme.centerChannelColor,
        fontSize: 15,
    },
    titleContainer: {
        height: 30,
    },
    title: {
        color: theme.centerChannelColor,
        fontSize: 15,
        height: 30,
        textAlignVertical: 'center',
        paddingHorizontal: 15,
    },
    errorContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 15,
    },
    error: {
        color: theme.errorTextColor,
        fontSize: 14,
    },
});

export default injectIntl(ChannelList);
