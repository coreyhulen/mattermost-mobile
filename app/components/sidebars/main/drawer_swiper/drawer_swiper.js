// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {Component} from 'react';

import Swiper from '@components/swiper';
import {changeOpacity} from '@utils/theme';

export default class DrawerSwiper extends Component {
    static propTypes = {
        children: PropTypes.node.isRequired,
        drawerWidth: PropTypes.number.isRequired,
        onPageSelected: PropTypes.func,
        showTeams: PropTypes.bool.isRequired,
        testID: PropTypes.string,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        onPageSelected: () => true,
        openDrawerOffset: 0,
    };

    swiperRef = React.createRef();

    shouldComponentUpdate(nextProps) {
        const {drawerWidth, showTeams, theme} = this.props;
        return nextProps.drawerWidth !== drawerWidth ||
            nextProps.showTeams !== showTeams ||
            nextProps.theme !== theme;
    }

    runOnLayout = (shouldRun = true) => {
        if (this.swiperRef) {
            this.swiperRef.runOnLayout = shouldRun;
        }
    };

    resetPage = (animated = false) => {
        if (this.swiperRef?.current) {
            this.swiperRef.current.scrollToIndex(1, animated);
        }
    };

    scrollToStart = () => {
        if (this.swiperRef?.current) {
            this.swiperRef.current.scrollToStart();
        }
    };

    scrollToInitial = () => {
        if (this.swiperRef?.current) {
            this.swiperRef.current.scrollToInitial();
        }
    }

    swiperPageSelected = (index) => {
        this.props.onPageSelected(index);
    };

    showTeamsPage = () => {
        if (this.swiperRef?.current) {
            this.swiperRef.current.scrollToIndex(0, true);
        }
    };

    render() {
        const {
            children,
            drawerWidth,
            showTeams,
            testID,
            theme,
        } = this.props;

        const initialPage = React.Children.count(children) - 1;

        return (
            <Swiper
                ref={this.swiperRef}
                initialPage={initialPage}
                onIndexChanged={this.swiperPageSelected}
                width={drawerWidth}
                style={{backgroundColor: theme.sidebarBg}}
                paginationBackgroundColor={changeOpacity(theme.sidebarText, 0.1)}
                activeDotColor={theme.sidebarText}
                dotColor={changeOpacity(theme.sidebarText, 0.3)}
                scrollEnabled={showTeams}
                showsPagination={showTeams}
                keyboardShouldPersistTaps={'always'}
                testID={testID}
            >
                {children}
            </Swiper>
        );
    }
}
