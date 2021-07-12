// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import FormattedText from '@components/formatted_text';
import {makeStyleSheetFromTheme, changeOpacity} from '@utils/theme';

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        borderTop: {
            borderTopWidth: 1,
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.2),
        },
        section: {
            justifyContent: 'center',
            position: 'relative',
            top: -1,
            flexDirection: 'row',
        },
        sectionText: {
            fontSize: 12,
            fontWeight: '600',
            textTransform: 'uppercase',
            color: changeOpacity(theme.centerChannelColor, 0.56),
            paddingTop: 16,
            paddingBottom: 8,
            paddingHorizontal: 16,
            flex: 1,
        },
        sectionWrapper: {
            backgroundColor: theme.centerChannelBg,
        },
    };
});

const AutocompleteSectionHeader = (props) => {
    const insets = useSafeAreaInsets();
    const {defaultMessage, id, loading, theme, isFirstSection} = props;

    const style = getStyleFromTheme(theme);
    const sectionStyles = [style.section, {marginLeft: insets.left, marginRight: insets.right}];

    if (!isFirstSection) {
        sectionStyles.push(style.borderTop);
    }

    return (
        <View style={style.sectionWrapper}>
            <View style={sectionStyles}>
                <FormattedText
                    id={id}
                    defaultMessage={defaultMessage}
                    style={style.sectionText}
                />
                {loading &&
                <ActivityIndicator
                    color={theme.centerChannelColor}
                    size='small'
                />
                }
            </View>
        </View>
    );
};

AutocompleteSectionHeader.propTypes = {
    defaultMessage: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    loading: PropTypes.bool,
    theme: PropTypes.object.isRequired,
    isFirstSection: PropTypes.bool,
};

export default AutocompleteSectionHeader;
