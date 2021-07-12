// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    ActivityIndicator,
    View,
    ViewPropTypes,
} from 'react-native';

import FormattedText from '@components/formatted_text';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {t} from '@utils/i18n';
import {makeStyleSheetFromTheme} from '@utils/theme';

export default class LoadMorePosts extends PureComponent {
    static propTypes = {
        channelId: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
        loading: PropTypes.bool.isRequired,
        loadMore: PropTypes.func,
        theme: PropTypes.object.isRequired,
        style: ViewPropTypes.style,
    };

    loadMore = () => {
        const {loading, loadMore} = this.props;
        if (!loading && typeof loadMore === 'function') {
            loadMore();
        }
    };

    renderText(style) {
        if (this.props.loading) {
            const i18nId = t('mobile.loading_posts');
            const defaultMessage = 'Loading messages...';

            return (
                <FormattedText
                    id={i18nId}
                    defaultMessage={defaultMessage}
                    style={style.text}
                />
            );
        }

        return (
            <View style={{flex: 1, alignItems: 'center'}}>
                <ActivityIndicator color={this.props.theme.centerChannelColor}/>
            </View>
        );
    }

    render() {
        const style = getStyleSheet(this.props.theme);
        return (
            <View style={[style.container, this.props.style]}>
                <TouchableWithFeedback
                    onPress={this.loadMore}
                    type={'opacity'}
                >
                    {this.renderText(style)}
                </TouchableWithFeedback>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 28,
            marginVertical: 10,
            overflow: 'hidden',
        },
        text: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.linkColor,
        },
    };
});
