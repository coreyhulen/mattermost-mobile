// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Node} from 'commonmark';

import {escapeRegex} from '@utils/markdown';

/* eslint-disable no-underscore-dangle */

const cjkPattern = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uac00-\ud7a3]/;

// Combines adjacent text nodes into a single text node to make further transformation easier
export function combineTextNodes(ast) {
    const walker = ast.walker();

    let e;
    while ((e = walker.next())) {
        if (!e.entering) {
            continue;
        }

        const node = e.node;

        if (node.type !== 'text') {
            continue;
        }

        while (node._next && node._next.type === 'text') {
            const next = node._next;

            node.literal += next.literal;

            node._next = next._next;
            if (node._next) {
                node._next._prev = node;
            }

            if (node._parent._lastChild === next) {
                node._parent._lastChild = node;
            }
        }

        // Resume parsing after the current node since otherwise the walker would continue to parse any old text nodes
        // that have been merged into this one
        walker.resumeAt(node, false);
    }

    return ast;
}

// Add indices to the items of every list
export function addListItemIndices(ast) {
    const walker = ast.walker();

    let e;
    while ((e = walker.next())) {
        if (e.entering) {
            const node = e.node;

            if (node.type === 'list') {
                let i = node.listStart == null ? 1 : node.listStart; // List indices match what would be displayed in the UI

                for (let child = node.firstChild; child; child = child.next) {
                    child.index = i;

                    i += 1;
                }
            }
        }
    }

    return ast;
}

// Take all images that aren't inside of tables and move them to be children of the root document node.
// When this happens, their parent nodes are split into two, if necessary, with the version that follows
// the image having its "continue" field set to true to indicate that things like bullet points don't
// need to be rendered.
export function pullOutImages(ast) {
    const walker = ast.walker();

    let e;
    while ((e = walker.next())) {
        if (!e.entering) {
            continue;
        }

        const node = e.node;

        // Skip tables because we'll render images inside of those as links
        if (node.type === 'table') {
            walker.resumeAt(node, false);
            continue;
        }

        if (node.type === 'image' && node.parent.type !== 'document') {
            pullOutImage(node);
        }
    }

    return ast;
}

function pullOutImage(image) {
    let parent = image.parent;
    let prev = image.prev;
    let next = image.next;

    // Remove image from its siblings
    if (prev) {
        prev._next = next;
    }
    if (next) {
        next._prev = prev;

        // Since the following text will be on a new line, a preceding space would cause the
        // alignment to be incorrect
        if (next.type === 'text' && next.literal.startsWith(' ')) {
            next.literal = next.literal.substring(1);
        }
    }

    // And from its parents
    if (parent._firstChild === image) {
        // image was the first child (ie prev is null), so the next sibling is now the first child
        parent._firstChild = next;
    }
    if (parent._lastChild === image) {
        // image was the last child (ie next is null), so the previous sibling is now the last child
        parent._lastChild = prev;
    }

    // Split the tree between the previous and next siblings, where the image would've been
    while (parent && parent.type !== 'document') {
        // We only need to split the parent if there's anything on the right of where we're splitting
        // in the current branch
        let parentCopy = null;

        // Split if we have children to the right of the split (next) or if we have any siblings to the
        // right of the parent (parent.next)
        if (next) {
            parentCopy = copyNodeWithoutNeighbors(parent);

            // Set an additional flag so we know not to re-render things like bullet points
            parentCopy.continue = true;

            // Re-assign the children to the right of the split to belong to the copy
            parentCopy._firstChild = next;
            parentCopy._lastChild = getLastSibling(next);

            if (parent._firstChild === next) {
                parent._firstChild = null;
                parent._lastChild = null;
            } else {
                parent._lastChild = prev;
            }

            // And re-assign the parent of all of those to be the copy
            for (let child = parentCopy.firstChild; child; child = child.next) {
                child._parent = parentCopy;
            }

            // Insert the copy as parent's next sibling
            if (parent.next) {
                parent.next._prev = parentCopy;
                parentCopy._next = parent.next;
                parent._next = parentCopy;
            } else /* if (parent.parent.lastChild === parent) */ {
                // Since parent has no next sibling, parent is the last child of its parent, so
                // we need to set the copy as the last child
                parent.parent.lastChild = parentCopy;
            }
        }

        // Change prev and next to no longer be siblings
        if (prev) {
            prev._next = null;
        }

        if (next) {
            next._prev = null;
        }

        // This image is part of a link so include the destination along with it
        if (parent.type === 'link') {
            image.linkDestination = parent.destination;
        }

        // Move up the tree
        next = parentCopy || parent.next;
        prev = parent;
        parent = parent.parent;
    }

    // Re-insert the image now that we have a tree split down to the root with the image's ancestors.
    // Note that parent is the root node, prev is the ancestor of image, and next is the ancestor of the copy

    // Add image to its parent
    image._parent = parent;
    if (next) {
        parent._lastChild = next;
    } else {
        // image is the last child of the root node now
        parent._lastChild = image;
    }

    // Add image to its siblings
    image._prev = prev;
    prev._next = image;

    image._next = next;
    if (next) {
        next._prev = image;
    }

    // The copy still needs its parent set to the root node
    if (next) {
        next._parent = parent;
    }
}

// Copies a Node without its parent, children, or siblings
function copyNodeWithoutNeighbors(node) {
    // commonmark uses classes so it takes a bit of work to copy them
    const copy = new Node();

    for (const key in node) {
        if (!node.hasOwnProperty(key)) {
            continue;
        }

        copy[key] = node[key];
    }

    copy._parent = null;
    copy._firstChild = null;
    copy._lastChild = null;
    copy._prev = null;
    copy._next = null;

    // Deep copy list data since it's an object
    copy._listData = {...node._listData};

    return copy;
}

// Gets the last sibling of a given node
function getLastSibling(node) {
    let sibling = node;

    while (sibling && sibling.next) {
        sibling = sibling.next;
    }

    return sibling;
}

export function highlightMentions(ast, mentionKeys) {
    const walker = ast.walker();

    let e;
    while ((e = walker.next())) {
        if (!e.entering) {
            continue;
        }

        const node = e.node;

        if (node.type === 'text') {
            const {index, mention} = getFirstMention(node.literal, mentionKeys);

            if (index === -1 || !mention) {
                continue;
            }

            const mentionNode = highlightTextNode(node, index, index + mention.key.length, 'mention_highlight');

            // Resume processing on the next node after the mention node which may include any remaining text
            // that was part of this one
            walker.resumeAt(mentionNode, false);
        } else if (node.type === 'at_mention') {
            const matches = mentionKeys.some((mention) => {
                const mentionName = '@' + node.mentionName;
                const flags = mention.caseSensitive ? '' : 'i';
                const pattern = new RegExp(`${escapeRegex(mention.key)}\\.?`, flags);

                return pattern.test(mentionName);
            });

            if (!matches) {
                continue;
            }

            const wrapper = new Node('mention_highlight');
            wrapNode(wrapper, node);

            // Skip processing the wrapper to prevent checking this node again as its child
            walker.resumeAt(wrapper, false);
        }
    }

    return ast;
}

// Given a string and an array of mention keys, returns the first mention that appears and its index.
export function getFirstMention(str, mentionKeys) {
    let firstMention = null;
    let firstMentionIndex = -1;

    for (const mention of mentionKeys) {
        if (mention.key.trim() === '') {
            continue;
        }

        const flags = mention.caseSensitive ? '' : 'i';
        let pattern;
        if (cjkPattern.test(mention.key)) {
            pattern = new RegExp(`${escapeRegex(mention.key)}`, flags);
        } else {
            pattern = new RegExp(`\\b${escapeRegex(mention.key)}_*\\b`, flags);
        }

        const match = pattern.exec(str);
        if (!match || match[0] === '') {
            continue;
        }

        if (firstMentionIndex === -1 || match.index < firstMentionIndex) {
            firstMentionIndex = match.index;
            firstMention = mention;
        }
    }

    return {
        index: firstMentionIndex,
        mention: firstMention,
    };
}

// Given a text node, start/end indices, and a highlight node type, splits it into up to three nodes:
// the text before the highlight (if any exists), the highlighted text, and the text after the highlight
// the end of the highlight (if any exists). Returns a node containing the highlighted text.
export function highlightTextNode(node, start, end, type) {
    const literal = node.literal;
    node.literal = literal.substring(start, end);

    // Start by wrapping the node and then re-insert any non-highlighted code around it
    const highlighted = new Node(type);
    wrapNode(highlighted, node);

    if (start !== 0) {
        const before = new Node('text');
        before.literal = literal.substring(0, start);

        highlighted.insertBefore(before);
    }

    if (end !== literal.length) {
        const after = new Node('text');
        after.literal = literal.substring(end);

        highlighted.insertAfter(after);
    }

    return highlighted;
}

// Wraps a given node in another node of the given type. The wrapper will take the place of
// the node in the AST relative to its parents and siblings, and it will have the node as
// its only child.
function wrapNode(wrapper, node) {
    // Set parent and update parent's children if necessary
    wrapper._parent = node._parent;
    if (node._parent._firstChild === node) {
        node._parent._firstChild = wrapper;
    }
    if (node._parent._lastChild === node) {
        node._parent._lastChild = wrapper;
    }

    // Set siblings and update those if necessary
    wrapper._prev = node._prev;
    node._prev = null;
    if (wrapper._prev) {
        wrapper._prev._next = wrapper;
    }

    wrapper._next = node._next;
    node._next = null;
    if (wrapper._next) {
        wrapper._next._prev = wrapper;
    }

    // Make node a child of wrapper
    wrapper._firstChild = node;
    wrapper._lastChild = node;
    node._parent = wrapper;
}
