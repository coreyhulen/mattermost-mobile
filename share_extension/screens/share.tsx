// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useFocusEffect, useNavigation} from '@react-navigation/native';

import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {Alert, BackHandler, NativeModules, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';

import {Client4} from '@client/rest';
import {MAX_FILE_COUNT, MAX_MESSAGE_LENGTH_FALLBACK} from '@constants/post_draft';
import {Preferences} from '@mm-redux/constants';
import {getCurrentChannel} from '@mm-redux/selectors/entities/channels';
import {getConfig, canUploadFilesOnMobile} from '@mm-redux/selectors/entities/general';
import {getCurrentTeam} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {Channel} from '@mm-redux/types/channels';
import EventEmitter from '@mm-redux/utils/event_emitter';
import Body from '@share/components/body';
import ChannelButton from '@share/components/channel_button';
import CloseHeaderButton from '@share/components/close_header_button';
import PostHeaderButton, {SHARE_EXTENSION_POST_EVENT} from '@share/components/post_header_button';
import TeamButton from '@share/components/team_button';
import {isAuthorized, getErrorElement, getSharedItems, permissionEnabled} from '@share/utils';
import {getAllowedServerMaxFileSize} from '@utils/file';
import {changeOpacity} from '@utils/theme';

import type {Team} from '@mm-redux/types/teams';

interface ShareProps {
    intl: typeof intlShape;
}

const ShareExtension = NativeModules.MattermostShare;
const theme = Preferences.THEMES.default;

const initialState: ShareState = {
    loading: true,
    files: [],
};

const leftButton = () => (
    <CloseHeaderButton
        onPress={() => ShareExtension.close(null)}
    />
);

const rightButton = () => (<PostHeaderButton/>);

const Share = ({intl}: ShareProps) => {
    const navigation = useNavigation();
    const canUploadFiles = useSelector(canUploadFilesOnMobile);
    const config = useSelector(getConfig);
    const currentTeam = useSelector(getCurrentTeam);
    const currentChannel = useSelector(getCurrentChannel);
    const currentUserId = useSelector(getCurrentUserId);
    const shareBodyRef = useRef<BodyRef>(null);
    const [state, setState] = useState<ShareState>(initialState);
    const [team, setTeam] = useState<Team|undefined|null>(currentTeam);
    const [channel, setChannel] = useState<Channel|undefined|null>(currentChannel);
    const maxFileSize = getAllowedServerMaxFileSize(config);

    const showPostButton = (error?: string, text?: string, extensionFiles?: Array<ShareFileInfo>, calculatedSize?: number) => {
        const files = extensionFiles || state.files;
        const totalSize = calculatedSize || state.totalSize;
        const filesOK = files.length ? files.length <= MAX_FILE_COUNT : false;
        const sizeOK = totalSize ? totalSize <= maxFileSize : false;

        if ((!error && ((filesOK && sizeOK) || text?.length)) && team?.id && channel?.id) {
            navigation.setOptions({headerRight: rightButton});
        } else {
            navigation.setOptions({headerRight: null});
        }
    };

    const loadData = async (authorized: boolean, hasPermission: boolean) => {
        const newState: ShareState = {
            authorized,
            hasPermission,
            loading: false,
            files: [],
        };

        if (authorized && hasPermission) {
            const data: Array<ShareItem> = await ShareExtension.data();
            const {error, files, value, totalSize} = await getSharedItems(data, intl);
            newState.error = error;
            newState.files = files;
            newState.totalSize = totalSize;
            newState.value = value;
        }

        showPostButton(newState.error, newState.value, newState.files, newState.totalSize);
        setState(newState);
    };

    const postMessage = () => {
        const {files} = state;
        const value = shareBodyRef.current?.getValue();
        const {formatMessage} = intl;
        const messageLength = value?.length || 0;

        if (messageLength > MAX_MESSAGE_LENGTH_FALLBACK) {
            Alert.alert(
                formatMessage({
                    id: 'mobile.share_extension.too_long_title',
                    defaultMessage: 'Message is too long',
                }),
                formatMessage({
                    id: 'mobile.share_extension.too_long_message',
                    defaultMessage: 'Character count: {count}/{max}',
                }, {
                    count: messageLength,
                    max: MAX_MESSAGE_LENGTH_FALLBACK,
                }),
            );
        } else {
            const data = {
                channelId: channel?.id,
                currentUserId,
                files,
                token: Client4.getToken(),
                url: Client4.getUrl(),
                value,
            };

            ShareExtension.close(data);
        }
    };

    const selectChannel = (c: Channel) => {
        setChannel(c);
    };

    const selectTeam = (t: Team, c?: Channel | null) => {
        setTeam(t);
        setChannel(c);
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: leftButton,
            title: intl.formatMessage({
                id: 'mobile.extension.title',
                defaultMessage: 'Share in Mattermost',
            }),
        });
    }, [navigation]);

    useEffect(() => {
        isAuthorized(intl).then(async (authorized) => {
            const hasPermission = await permissionEnabled();
            loadData(authorized, hasPermission);
        });
    }, []);

    useEffect(() => {
        EventEmitter.on(SHARE_EXTENSION_POST_EVENT, postMessage);

        return () => EventEmitter.off(SHARE_EXTENSION_POST_EVENT, postMessage);
    }, [channel, state, team]);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                ShareExtension.close(null);
                return true;
            };

            BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, []),
    );

    const errorElement = getErrorElement(state, canUploadFiles, maxFileSize, team, intl);

    if (errorElement) {
        return errorElement;
    }

    const placeholder = intl.formatMessage({
        id: 'create_post.write',
        defaultMessage: 'Write to {channelDisplayName}',
    },
    {
        channelDisplayName: channel?.display_name,
    });

    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <Body
                    canPost={showPostButton}
                    files={state.files}
                    initialValue={state.value}
                    placeholder={placeholder}
                    ref={shareBodyRef}
                />
                <View style={styles.flex}>
                    <TeamButton
                        onSelect={selectTeam}
                        team={team}
                    />
                    <ChannelButton
                        channel={channel}
                        onSelect={selectChannel}
                        teamId={team?.id}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: theme.centerChannelBg,
    },
    wrapper: {
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.05),
        flex: 1,
    },
});

export default injectIntl(Share);
