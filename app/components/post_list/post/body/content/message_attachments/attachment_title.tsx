// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {intlShape, injectIntl} from 'react-intl';
import {Alert, Text, View} from 'react-native';

import Markdown from '@components/markdown';
import {Theme} from '@mm-redux/types/preferences';
import {makeStyleSheetFromTheme} from '@utils/theme';
import {tryOpenURL} from '@utils/url';

type Props = {
    intl: typeof intlShape;
    link?: string;
    theme: Theme;
    value?: string;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            flex: 1,
            flexDirection: 'row',
            marginTop: 3,
        },
        link: {color: theme.linkColor},
        title: {
            color: theme.centerChannelColor,
            fontSize: 14,
            fontWeight: '600',
            lineHeight: 20,
            marginBottom: 5,
        },
    };
});

const AttachmentTitle = ({intl, link, theme, value}: Props) => {
    const style = getStyleSheet(theme);

    const openLink = () => {
        if (link) {
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
        }
    };

    let title;
    if (link) {
        title = (
            <Text
                style={[style.title, Boolean(link) && style.link]}
                onPress={openLink}
            >
                {value}
            </Text>
        );
    } else {
        title = (
            <Markdown
                isEdited={false}
                isReplyPost={false}
                disableHashtags={true}
                disableAtMentions={true}
                disableChannelLink={true}
                disableGallery={true}
                autolinkedUrlSchemes={[]}
                mentionKeys={[]}
                theme={theme}
                value={value}
                baseTextStyle={style.title}
                textStyles={{link: style.link}}
            />
        );
    }

    return (
        <View style={style.container}>
            {title}
        </View>
    );
};

export default injectIntl(AttachmentTitle);
