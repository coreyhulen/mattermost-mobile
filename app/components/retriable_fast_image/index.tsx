// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ErrorBoundary} from '@sentry/react-native';
import {isSVGLink} from '@utils/url';
import React, {PureComponent} from 'react';
import FastImage, {FastImageProps} from 'react-native-fast-image';
import {SvgUri} from 'react-native-svg';

export const FAST_IMAGE_MAX_RETRIES = 3;

type RetriableFastImageProps = FastImageProps & {
    id: string
}

type RetriableFastImageState = {
    retry: number
}

export default class RetriableFastImage extends PureComponent<RetriableFastImageProps, RetriableFastImageState> {
    state = {
        retry: 0,
    }

    onError = () => {
        const retry = this.state.retry + 1;
        if (retry > FAST_IMAGE_MAX_RETRIES && this.props.onError) {
            this.props.onError();
            return;
        }

        this.setState({retry});
    }

    render() {
        let image = (
            <FastImage
                {...this.props}
                key={`${this.props.id}-${this.state.retry}`}
                onError={this.onError}
            />
        );
        const {source} = this.props;
        if (typeof (source) === 'object' && source.uri && isSVGLink(source.uri)) {
            image = (
                <SvgUri
                    uri={source.uri}
                    width={'100%'}
                    height={'100%'}
                />
            );
        }
        return (
            <ErrorBoundary>
                {image}
            </ErrorBoundary>
        );
    }
}
