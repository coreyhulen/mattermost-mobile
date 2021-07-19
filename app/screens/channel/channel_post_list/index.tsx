// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Q} from '@nozbe/watermelondb';
import {withDatabase} from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';

import React from 'react';
import {Animated, View} from 'react-native';

import {MM_TABLES, SYSTEM_IDENTIFIERS} from '@constants/database';
import {CHANNEL} from '@constants/screens';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import PostList from '@components/post_list';

import type Database from '@nozbe/watermelondb/Database';

import type ChannelModel from '@typings/database/models/servers/channel';
import type MyChannelModel from '@typings/database/models/servers/my_channel';
import type PostModel from '@typings/database/models/servers/post';
import type SystemModel from '@typings/database/models/servers/system';

const ConnectedChannelPostList = ({channelRecord, postsRecords, userIdRecord, myChannelRecords}: ChannelPostListProps) => {
    const bottomPadding: Animated.Value = new Animated.Value(0);
    const theme = useTheme();

    const style = getStyleSheet(theme);

    const myChannel = myChannelRecords[0];

    return (
        <Animated.View
            style={[style.container, {paddingBottom: bottomPadding}]}
        >
            <View style={style.separator}/>
            <PostList
                testID='channel.post_list'
                postIds={postIds} // todo: Pass in the posts objects in an array directly
                extraData={postsRecords.length !== 0}
                showMoreMessagesButton={true}
                location={CHANNEL}
                indicateNewMessages={true}
                currentUserId={userIdRecord.id}
                lastViewedAt={myChannel.lastViewedAt}
                channelId={channelRecord.id}
                scrollViewNativeID={channelRecord.id}

                // onLoadMoreUp={loadMorePostsTop}
                // onRefresh={actions.setChannelRefreshing}
                // renderFooter={renderFooter}
                // refreshing={refreshing}
                // loadMorePostsVisible={loadMorePostsVisible}
            />
        </Animated.View>
    );
};

const getStyleSheet = makeStyleSheetFromTheme((theme) => ({
    container: {
        flex: 1,
    },
    separator: {
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
        height: 1,
    },
}));

const enhanceWithSystem = withObservables([], ({database}: { database: Database }) => ({
    userIdRecord: database.collections.get(MM_TABLES.SERVER.SYSTEM).findAndObserve(SYSTEM_IDENTIFIERS.CURRENT_USER_ID),
    channelIdRecord: database.collections.get(MM_TABLES.SERVER.SYSTEM).findAndObserve(SYSTEM_IDENTIFIERS.CURRENT_USER_ID),
}));

const enhanceWithPosts = withObservables([], ({database, channelIdRecord}: { database: Database; channelIdRecord: SystemModel }) => ({

    // find all posts that belong to this channel id
    postsRecords: database.collections.get(MM_TABLES.SERVER.POST).query(Q.where('channel_id', channelIdRecord.id)).observe(),
    channelRecord: database.collections.get(MM_TABLES.SERVER.CHANNEL).findAndObserve(channelIdRecord.id),
    myChannelRecord: database.collections.get(MM_TABLES.SERVER.MY_CHANNEL).query(Q.where('channel_id', channelIdRecord.id)).observe(),
}));

type ChannelPostListProps = {
    channelIdRecord: SystemModel;
    channelRecord: ChannelModel;
    postsRecords: PostModel[];
    userIdRecord: SystemModel;
    myChannelRecords: MyChannelModel[];
}

const ChannelPostList: React.FunctionComponent = withDatabase(enhanceWithSystem(enhanceWithPosts(ConnectedChannelPostList)));

export default ChannelPostList;
