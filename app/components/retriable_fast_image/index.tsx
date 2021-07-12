// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import FastImage, {FastImageProps} from 'react-native-fast-image';

export const FAST_IMAGE_MAX_RETRIES = 3;

type RetriableFastImageProps = FastImageProps & {
    id: string;
}

type RetriableFastImageState = {
    retry: number;
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
        return (
            <FastImage
                {...this.props}
                key={`${this.props.id}-${this.state.retry}`}
                onError={this.onError}
            />
        );
    }
}
