## **Technical Debt**

We'll use this document for now to track down all the implementations that need to be added to each component: 

### Channel Post List 
    
To add the following methods/logic  : 
- componentDidMount logic 
- componentDidUpdate logic 
- componentWillUnmount logic 
- bottomPaddingAnimation animation
- goToThread logic 
- loadMorePostsTop logic / api call 
- loadPostsRetry logic / api call 
- render <FailedNetworkAction/> if (postIds.length === 0 && channelRefreshingFailed)
- render  <RetryBarIndicator/>
- Testscript 


##  Post List Component 

To add the following methods/logic  :
- registerViewableItemsListener
- registerScrollEndIndexListener
- onPermalinkPress
- onRefresh 
- useEffect => scrollToBottom
- useEffect => deepLinkURL
- useLayoutEffect => deepLinkURL
- useLayoutEffect => PERF_MARKERS.CHANNEL_RENDER
- useLayoutEffect => scrollToIndex
- hook useResetNativeScrollView
