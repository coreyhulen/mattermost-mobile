// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Posts} from '@mm-redux/constants';
import {makeGetPostsForIds} from '@mm-redux/selectors/entities/posts';
import {getCurrentUser} from '@mm-redux/selectors/entities/users';
import {createIdsSelector} from '@mm-redux/utils/helpers';
import {DATE_LINE} from '@mm-redux/utils/post_list';

export {DATE_LINE};
export const DATE_LINE_SUFFIX = '-index-';

export function makePreparePostIdsForSearchPosts() {
    const getMyPosts = makeGetPostsForIds();

    return createIdsSelector(
        (state, postIds) => getMyPosts(state, postIds),
        getCurrentUser,
        (posts, currentUser) => {
            if (posts.length === 0 || !currentUser) {
                return [];
            }

            const out = [];
            for (let i = 0; i < posts.length; i++) {
                const post = posts[i];

                // give chance for the post to be loaded
                if (!post) {
                    continue;
                }

                if (post.state === Posts.POST_DELETED && post.user_id === currentUser.id) {
                    continue;
                }

                // Render a date line for each post, even if displayed on the same date as the
                // previous post. Since we don't deduplicate here like in other views, we need to
                // ensure the resulting key is unique, even if the post timestamps (down to the
                // second) are identical. The screens know to parse out the index before trying
                // to consume the date value.
                out.push(DATE_LINE + post.create_at + DATE_LINE_SUFFIX + i);

                out.push(post.id);
            }

            return out;
        },
    );
}
