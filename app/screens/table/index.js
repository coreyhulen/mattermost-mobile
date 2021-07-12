// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {Platform, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {makeStyleSheetFromTheme} from '@utils/theme';

export default class Table extends React.PureComponent {
    static propTypes = {
        renderRows: PropTypes.func.isRequired,
        tableWidth: PropTypes.number.isRequired,
        renderAsFlex: PropTypes.bool.isRequired,
    };

    render() {
        const style = getStyleSheet();
        const content = this.props.renderRows(true);
        const viewStyle = this.props.renderAsFlex ? style.displayFlex : {width: this.props.tableWidth};

        let container;
        if (Platform.OS === 'android') {
            container = (
                <ScrollView testID='table.screen'>
                    <ScrollView
                        contentContainerStyle={viewStyle}
                        horizontal={true}
                        testID='table.scroll_view'
                    >
                        {content}
                    </ScrollView>
                </ScrollView>
            );
        } else {
            container = (
                <SafeAreaView
                    style={style.container}
                    testID='table.screen'
                >
                    <ScrollView
                        style={style.fullHeight}
                        contentContainerStyle={viewStyle}
                        testID='table.scroll_view'
                    >
                        {content}
                    </ScrollView>
                </SafeAreaView>
            );
        }
        return container;
    }
}

const getStyleSheet = makeStyleSheetFromTheme(() => {
    return {
        container: {
            flex: 1,
        },
        fullHeight: {
            height: '100%',
        },
        displayFlex: {
            ...Platform.select({
                android: {
                    flex: 1,
                },
                ios: {
                    flex: 0,
                },
            }),
        },
    };
});
