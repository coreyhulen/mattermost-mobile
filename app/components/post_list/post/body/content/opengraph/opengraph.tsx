// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {intlShape, injectIntl} from 'react-intl';
import {Alert, Text, View} from 'react-native';

import TouchableWithFeedback from '@components/touchable_with_feedback';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {tryOpenURL} from '@utils/url';

import OpengraphImage from './opengraph_image';

import type {Post} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';

type OpengraphProps = {
    intl: typeof intlShape;
    isReplyPost: boolean;
    openGraphData?: Record<string, unknown>;
    post: Post;
    showLinkPreviews: boolean;
    theme: Theme;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            borderColor: changeOpacity(theme.centerChannelColor, 0.2),
            borderRadius: 3,
            borderWidth: 1,
            flex: 1,
            marginTop: 10,
            padding: 10,
        },
        flex: {flex: 1},
        siteDescription: {
            color: changeOpacity(theme.centerChannelColor, 0.7),
            fontSize: 13,
            marginBottom: 10,
        },
        siteName: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 12,
            marginBottom: 10,
        },
        siteTitle: {
            color: theme.linkColor,
            fontSize: 14,
            marginBottom: 10,
        },
    };
});

const Opengraph = ({intl, isReplyPost, openGraphData, post, showLinkPreviews, theme}: OpengraphProps) => {
    if (!showLinkPreviews || !openGraphData) {
        return null;
    }

    const style = getStyleSheet(theme);
    const link = post.metadata?.embeds?.[0]?.url;
    const hasImage = Boolean(
        openGraphData?.images &&
        openGraphData.images instanceof Array &&
        openGraphData.images?.length &&
        post.metadata?.images);

    const goToLink = () => {
        const onError = () => {
            Alert.alert(
                intl.formatMessage({
                    id: 'mobile.link.error.title',
                    defaultMessage: 'Error',
                }),
                intl.formatMessage({
                    id: 'mobile.link.error.text',
                    defaultMessage: 'Unable to open the link.',
                }),
            );
        };

        tryOpenURL(link, onError);
    };

    let siteName;
    if (openGraphData.site_name) {
        siteName = (
            <View style={style.flex}>
                <Text
                    style={style.siteName}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                >
                    {openGraphData.site_name as string}
                </Text>
            </View>
        );
    }

    const title = openGraphData.title || openGraphData.url || link;
    let siteTitle;
    if (title) {
        siteTitle = (
            <View style={style.wrapper}>
                <TouchableWithFeedback
                    style={style.flex}
                    onPress={goToLink}
                    type={'opacity'}
                >
                    <Text
                        style={[style.siteTitle, {marginRight: isReplyPost ? 10 : 0}]}
                        numberOfLines={3}
                        ellipsizeMode='tail'
                    >
                        {title as string}
                    </Text>
                </TouchableWithFeedback>
            </View>
        );
    }

    let siteDescription;
    if (openGraphData.description) {
        siteDescription = (
            <View style={style.flex}>
                <Text
                    style={style.siteDescription}
                    numberOfLines={5}
                    ellipsizeMode='tail'
                >
                    {openGraphData.description as string}
                </Text>
            </View>
        );
    }

    return (
        <View style={style.container}>
            {siteName}
            {siteTitle}
            {siteDescription}
            {hasImage &&
            <OpengraphImage
                isReplyPost={isReplyPost}
                openGraphImages={openGraphData.images as never[]}
                post={post}
                theme={theme}
            />
            }
        </View>
    );
};

export default injectIntl(Opengraph);
