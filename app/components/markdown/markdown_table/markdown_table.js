// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PropTypes} from 'prop-types';
import React from 'react';
import {intlShape} from 'react-intl';
import {
    ScrollView,
    View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';

import {CELL_WIDTH} from 'app/components/markdown/markdown_table_cell/markdown_table_cell';

import TouchableWithFeedback from 'app/components/touchable_with_feedback';
import {preventDoubleTap} from 'app/utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from 'app/utils/theme';
import {goToScreen} from 'app/actions/navigation';

const MAX_HEIGHT = 300;

export default class MarkdownTable extends React.PureComponent {
    static propTypes = {
        children: PropTypes.node.isRequired,
        numColumns: PropTypes.number.isRequired,
        theme: PropTypes.object.isRequired,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            containerWidth: 0,
            contentHeight: 0,
            contentWidth: 0,
        };
    }

    getTableWidth = () => {
        return this.props.numColumns * CELL_WIDTH;
    };

    handlePress = preventDoubleTap(() => {
        const {intl} = this.context;
        const screen = 'Table';
        const title = intl.formatMessage({
            id: 'mobile.routes.table',
            defaultMessage: 'Table',
        });
        const passProps = {
            renderRows: this.renderRows,
            tableWidth: this.getTableWidth(),
        };

        goToScreen(screen, title, passProps);
    });

    handleContainerLayout = (e) => {
        this.setState({
            containerWidth: e.nativeEvent.layout.width,
        });
    };

    handleContentSizeChange = (contentWidth, contentHeight) => {
        this.setState({
            contentHeight,
            contentWidth,
        });
    };

    renderRows = (drawExtraBorders = true) => {
        const style = getStyleSheet(this.props.theme);

        const tableStyle = [style.table];
        if (drawExtraBorders) {
            tableStyle.push(style.tableExtraBorders);
        }

        // Add an extra prop to the last row of the table so that it knows not to render a bottom border
        // since the container should be rendering that
        const rows = React.Children.toArray(this.props.children);
        rows[rows.length - 1] = React.cloneElement(rows[rows.length - 1], {
            isLastRow: true,
        });

        return (
            <View style={tableStyle}>
                {rows}
            </View>
        );
    }

    render() {
        const style = getStyleSheet(this.props.theme);

        let moreRight = null;
        if (this.state.containerWidth && this.state.contentWidth > this.state.containerWidth) {
            moreRight = (
                <LinearGradient
                    colors={[
                        changeOpacity(this.props.theme.centerChannelColor, 0.0),
                        changeOpacity(this.props.theme.centerChannelColor, 0.1),
                    ]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={[style.moreRight, {height: this.state.contentHeight}]}
                />
            );
        }

        let moreBelow = null;
        if (this.state.contentHeight > MAX_HEIGHT) {
            moreBelow = (
                <LinearGradient
                    colors={[
                        changeOpacity(this.props.theme.centerChannelColor, 0.0),
                        changeOpacity(this.props.theme.centerChannelColor, 0.1),
                    ]}
                    style={[style.moreBelow, {width: this.getTableWidth()}]}
                />
            );
        }

        const expandButton = (
            <TouchableOpacity
                onPress={this.handlePress}
                style={{...style.expandButton, left: this.state.containerWidth - 20}}
            >
                <Icon
                    name={'expand'}
                    style={style.icon}
                />
            </TouchableOpacity>
        );

        return (
            <TouchableWithFeedback
                style={{paddingRight: 10}}
                onPress={this.handlePress}
                type={'opacity'}
            >
                <ScrollView
                    contentContainerStyle={{width: this.getTableWidth()}}
                    onContentSizeChange={this.handleContentSizeChange}
                    onLayout={this.handleContainerLayout}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    style={[style.container, {maxWidth: this.getTableWidth()}]}
                >
                    {this.renderRows(false)}
                </ScrollView>
                {moreRight}
                {moreBelow}
                {expandButton}
            </TouchableWithFeedback>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            borderBottomWidth: 1,
            borderColor: changeOpacity(theme.centerChannelColor, 0.2),
            borderRightWidth: 1,
            maxHeight: MAX_HEIGHT,
        },
        expandButton: {
            height: 30,
            width: 30,
            borderWidth: 1,
            paddingTop: 6,
            paddingLeft: 7,
            borderColor: changeOpacity(theme.centerChannelColor, 0.2),
            borderRadius: 15,
            bottom: 20,
            backgroundColor: theme.centerChannelBg,
        },
        icon: {
            fontSize: 15,
            color: theme.linkColor,
        },
        table: {
            borderColor: changeOpacity(theme.centerChannelColor, 0.2),
            borderLeftWidth: 1,
            borderTopWidth: 1,
        },
        tableExtraBorders: {
            borderBottomWidth: 1,
            borderRightWidth: 1,
        },
        moreBelow: {
            bottom: 30,
            height: 20,
            position: 'absolute',
            left: 0,
            width: '100%',
        },
        moreRight: {
            maxHeight: MAX_HEIGHT,
            position: 'absolute',
            right: 10,
            top: 0,
            width: 20,
        },
    };
});
