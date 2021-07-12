// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

export default makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            alignItems: 'center',
            backgroundColor: theme.centerChannelBg,
            flexDirection: 'row',
            height: 45,
        },
        linkContainer: {
            marginHorizontal: 15,
            color: theme.linkColor,
        },
        iconContainer: {
            marginHorizontal: 15,
        },
        icon: {
            color: theme.centerChannelColor,
            fontSize: 24,
            marginTop: 2,
        },
        wrapper: {
            flex: 1,
        },
        centerLabel: {
            textAlign: 'center',
            textAlignVertical: 'center',
        },
        labelContainer: {
            flex: 1,
            flexDirection: 'row',
        },
        label: {
            color: theme.centerChannelColor,
            flex: 1,
            fontSize: 17,
            alignSelf: 'center',
        },
        arrowContainer: {
            justifyContent: 'center',
            paddingRight: 11,
        },
        arrow: {
            color: changeOpacity(theme.centerChannelColor, 0.32),
            fontSize: 24,
        },
        dividerContainer: {
            backgroundColor: theme.centerChannelBg,
            height: 1,
        },
        divider: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
            height: 1,
            marginHorizontal: 15,
        },
        destructor: {
            color: theme.errorTextColor,
        },
        safeAreaView: {
            backgroundColor: 'white',
        },
    };
});
