// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    Dimensions,
    InteractionManager,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import {DeviceTypes, ViewTypes} from '@constants';
import mattermostManaged from '@mattermost-managed';

export default class Swiper extends PureComponent {
    static propTypes = {
        activeDotColor: PropTypes.string,
        children: PropTypes.node.isRequired,
        dotColor: PropTypes.string,
        paginationBackgroundColor: PropTypes.string,
        initialPage: PropTypes.number,
        keyboardShouldPersistTaps: PropTypes.string,
        onIndexChanged: PropTypes.func,
        scrollEnabled: PropTypes.bool,
        showsPagination: PropTypes.bool,
        style: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.number,
        ]),
        width: PropTypes.number,
        onScrollBegin: PropTypes.func,
        testID: PropTypes.string,
    };

    static defaultProps = {
        initialPage: 0,
        keyboardShouldPersistTaps: 'handled',
        onIndexChanged: () => null,
        scrollEnabled: true,
        showsPagination: true,
        onScrollBegin: () => true,
    };

    constructor(props) {
        super(props);

        this.runOnLayout = true;
        this.offset = props.width * props.initialPage;

        this.state = this.initialState(props);
    }

    static getDerivedStateFromProps(props, state) {
        const total = React.Children.count(props.children);
        if (total !== state.total) {
            return {total};
        }
        return null;
    }

    componentDidUpdate(prevProps, prevState) {
        // If the index has changed, we notify the parent via the onIndexChanged callback
        if (this.state.index !== prevState.index) {
            this.props.onIndexChanged(this.state.index);
        }

        if (this.props.width !== prevProps.width) {
            this.scrollByWidth(this.props.width);
        }
    }

    initialState = (props) => {
        const index = props.initialPage;
        return {
            index,
            total: React.Children.count(props.children),
        };
    };

    onLayout = (e) => {
        this.scrollByWidth(e.nativeEvent.layout.width);
    };

    onScrollBegin = () => {
        this.props.onScrollBegin();
    };

    onScrollEnd = (e) => {
        // making our events coming from android compatible to updateIndex logic
        if (!e.nativeEvent.contentOffset) {
            e.nativeEvent.contentOffset = {x: e.nativeEvent.position * this.props.width};
        }

        // get the index
        this.updateIndex(e.nativeEvent.contentOffset.x);
    };

    scrollByWidth = (width) => {
        this.offset = width * this.state.index;

        setTimeout(() => {
            if (this.scrollView) {
                this.scrollView.scrollTo({x: width * this.state.index, animated: false});
            }
        }, 0);
    };

    scrollToStart = () => {
        InteractionManager.runAfterInteractions(() => {
            this.scrollView.scrollTo({x: 0, animated: false});
        });
    };

    scrollToInitial = () => {
        setTimeout(() => {
            if (this.scrollView) {
                this.scrollView.scrollTo({x: this.props.width * this.props.initialPage, animated: false});
            }
        }, 0);
    };

    refScrollView = (view) => {
        this.scrollView = view;
    };

    renderScrollView = (pages) => {
        const {
            keyboardShouldPersistTaps,
            scrollEnabled,
        } = this.props;

        return (
            <ScrollView
                ref={this.refScrollView}
                bounces={false}
                horizontal={true}
                removeClippedSubviews={true}
                automaticallyAdjustContentInsets={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.wrapper, this.props.style]}
                onScrollBeginDrag={this.onScrollBegin}
                onMomentumScrollEnd={this.onScrollEnd}
                pagingEnabled={scrollEnabled}
                keyboardShouldPersistTaps={keyboardShouldPersistTaps}
                scrollEnabled={scrollEnabled}
            >
                {pages}
            </ScrollView>
        );
    };

    renderPagination = () => {
        if (this.state.total <= 1 || !this.props.showsPagination || Platform.OS === 'android') {
            return null;
        }

        const dots = [];
        const activeDot = (
            <View
                style={[
                    styles.dotStyle,
                    {backgroundColor: this.props.activeDotColor || '#007aff'},
                ]}
            />
        );
        const dot = (
            <View
                style={[
                    styles.dotStyle,
                    {backgroundColor: this.props.dotColor || 'rgba(0,0,0,.2)'},
                ]}
            />
        );
        for (let i = 0; i < this.state.total; i++) {
            if (i === this.state.index) {
                dots.push(React.cloneElement(activeDot, {key: i}));
            } else {
                dots.push(React.cloneElement(dot, {key: i}));
            }
        }

        const {width, height} = Dimensions.get('window');
        const bottom = this.paginationBottom(width, height);
        const drawerWidth = (width > height) ? width - ViewTypes.IOS_HORIZONTAL_LANDSCAPE : width;
        let style;
        if (DeviceTypes.IS_IPHONE_WITH_INSETS && (width < height)) {
            style = {
                bottom,
                width: drawerWidth,
            };
        } else {
            style = {
                bottom,
                flex: 1,
            };
        }

        return (
            <View
                pointerEvents='none'
                style={[styles.pagination, style]}
            >
                <View style={[styles.paginationWrapper, {backgroundColor: this.props.paginationBackgroundColor}]}>
                    {dots}
                </View>
            </View>
        );
    };

    scrollToIndex = (index, animated) => {
        if (this.state.total < 2) {
            return;
        }

        this.scrollView.scrollTo({x: (index * this.props.width), animated});
        this.updateIndex(this.props.width * index);
    };

    updateIndex = (offset) => {
        let index = this.state.index;
        const diff = offset - this.offset;
        if (!diff) {
            return;
        }

        index = parseInt(index + Math.round(diff / this.props.width), 10);
        this.offset = offset;
        this.setState({index});
    };

    paginationBottom = (width, height) => {
        if (DeviceTypes.IS_TABLET) {
            if (Platform.OS === 'ios' && mattermostManaged.hasSafeAreaInsets) {
                return 34;
            }

            return 24;
        }

        const landscape = width > height;
        if (DeviceTypes.IS_IPHONE_WITH_INSETS) {
            return landscape ? 14 : 34;
        }

        return 24;
    };

    render() {
        const {
            children,
            testID,
            width,
        } = this.props;

        const pages = React.Children.map(children, (page, i) => {
            const pageStyle = page ? {width} : {width: 0};
            return (
                <View
                    style={[styles.slide, pageStyle]}
                    key={i}
                >
                    {page}
                </View>
            );
        });

        return (
            <View
                style={[styles.container]}
                onLayout={this.onLayout}
                testID={testID}
            >
                {this.renderScrollView(pages)}
                {this.renderPagination()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        position: 'relative',
        flex: 1,
    },
    wrapper: {
        backgroundColor: 'transparent',
    },
    slide: {
        flex: 1,
        width: '100%',
    },
    pagination: {
        position: 'absolute',
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    paginationWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 24,
        borderRadius: 15,
        width: 44,
    },
    dotStyle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 4,
        marginRight: 4,
        marginTop: 3,
        marginBottom: 3,
    },
});
