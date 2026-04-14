// 检测浏览器是否为深色模式
function isDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// 应用专注阅读模式样式
function applyDarkTheme() {
  const style = document.createElement('style');
  style.id = 'zhihu-dark-theme';
  
  const darkThemeCSS = `
    /* 全局背景和基础设置 */
    * {
      background-color: #000000 !important;
      color: #e0e0e0 !important;
      border-color: #333 !important;
    }
    
    body, html {
      background-color: #000000 !important;
      color: #e0e0e0 !important;
      overflow-x: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* 移除导航栏 */
    .Topbar, #TopstoryMainHeader, .GlobalSideBar, .Sticky, .Header, .NavBar {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
    }
    
    /* 移除侧边栏 */
    .SideBar, .GlobalSideBar, .Sticky, .Recommendations, .RelatedQuestions, .ColumnPage-side, .QuestionPage-side {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
    }
    
    /* 移除广告和推荐 */
    .Pc-card, .Card--ad, .Banner, .Promotion, .HotList, .TopstoryItem--ad, .AdBlock, .ad-wrap, .Advertisement {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
    }
    
    /* 移除底部和页脚 */
    .Footer, .Copyright, .App-footer, .FooterLinks, .footer {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
    }
    
    /* 移除浮动元素 */
    .FloatingButton, .BackToTop, .ShareButton, .CommentButton, .WriteButton {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
    }
    
    /* 移除不必要的按钮和操作 */
    .VoteButton, .FollowButton, .ShareMenu, .MoreButton, .EditButton, .CommentButton, .LikeButton, .DislikeButton, .BookmarkButton, .ReportButton {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
    }
    
    /* 移除用户信息和互动元素 */
    .UserInfo, .AuthorInfo, .VoteBar, .CommentList, .CommentButton, .RelatedQuestions, .HotQuestions {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
    }
    
    /* 主内容区域样式 */
    .App-main, .Topstory-main, .QuestionPage, .SearchMain, .Question-main, .ColumnPage-main {
      background-color: #000000 !important;
      max-width: 800px !important;
      margin: 0 auto !important;
      padding: 20px !important;
      width: 100% !important;
    }
    
    /* 正文内容样式 */
    .RichText, .ContentItem-title, .QuestionHeader-title, .CommentItem-content, .AnswerItem-content, .PostContent {
      color: #e0e0e0 !important;
      font-size: 16px !important;
      line-height: 1.8 !important;
      background-color: #000000 !important;
    }
    
    /* 问题和答案卡片 */
    .QuestionHeader, .AnswerItem, .CommentItem, .ContentItem, .PostItem {
      background-color: #000000 !important;
      border: none !important;
      box-shadow: none !important;
      margin-bottom: 20px !important;
      padding: 15px !important;
    }
    
    /* 链接颜色 */
    a, .UserLink-link, .TopicLink {
      color: #64b5f6 !important;
      background-color: #000000 !important;
    }
    
    /* 滚动条样式 */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #000000;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #333;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #444;
    }
    
    /* 确保内容可见 */
    .QuestionHeader-content, .QuestionHeader-main, .AnswerItem-content, .RichContent-inner, .ContentItem-answer {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      background-color: #000000 !important;
    }
  `;
  
  style.textContent = darkThemeCSS;
  document.head.appendChild(style);
  
  // 额外处理：隐藏不必要的元素
  hideUnwantedElements();
  
  // 延迟执行，确保所有元素都已加载
  setTimeout(() => {
    hideUnwantedElements();
  }, 1000);
}

// 隐藏不必要的元素
function hideUnwantedElements() {
  const unwantedSelectors = [
    // 导航栏相关
    '.Topbar', '#TopstoryMainHeader', '.GlobalSideBar', '.Sticky', '.Header', '.NavBar',
    // 侧边栏相关
    '.SideBar', '.GlobalSideBar', '.Sticky', '.Recommendations', '.RelatedQuestions', '.ColumnPage-side', '.QuestionPage-side',
    // 广告和推荐
    '.Pc-card', '.Card--ad', '.Banner', '.Promotion', '.HotList', '.TopstoryItem--ad', '.AdBlock', '.ad-wrap', '.Advertisement',
    // 底部和页脚
    '.Footer', '.Copyright', '.App-footer', '.FooterLinks', '.footer',
    // 浮动元素
    '.FloatingButton', '.BackToTop', '.ShareButton', '.CommentButton', '.WriteButton',
    // 按钮和操作
    '.VoteButton', '.FollowButton', '.ShareMenu', '.MoreButton', '.EditButton', '.CommentButton', '.LikeButton', '.DislikeButton', '.BookmarkButton', '.ReportButton',
    // 用户信息和互动
    '.UserInfo', '.AuthorInfo', '.VoteBar', '.CommentList', '.CommentButton', '.RelatedQuestions', '.HotQuestions',
    // 其他多余元素
    '.TopstoryHeader', '.TopstoryTabs', '.TopstoryActionButton', '.TopstoryItem', '.ContentItem-actions', '.ContentItem-meta', '.ContentItem-status',
    // 具体元素（根据截图识别）
    '.Header-top', '.Header-nav', '.Header-menu', '.Header-search', '.Header-side',
    '.SideBar-inner', '.SideBar-module', '.SideBar-link',
    '.Footer-inner', '.Footer-logo', '.Footer-links', '.Footer-copyright',
    '.Post-index', '.Post-side', '.Post-actions', '.Post-meta',
    '.Answer-actions', '.Answer-meta', '.Answer-vote', '.Answer-comment',
    '.Question-actions', '.Question-meta', '.Question-follow',
    '.Collection-actions', '.Collection-meta',
    '.Column-actions', '.Column-meta',
    '.Article-actions', '.Article-meta',
    '.UserProfile-actions', '.UserProfile-meta',
    '.SearchSideBar', '.SearchResults-side',
    '.HomeSideBar', '.HomeRecommendations',
    '.Notification', '.Message', '.Avatar', '.Badge',
    '.Button', '.Input', '.Form', '.Modal', '.Popover',
    '.Tooltip', '.Dropdown', '.Menu', '.Tabs', '.Pagination',
    '.Loading', '.Error', '.Empty', '.Skeleton', '.Placeholder'
  ];
  
  unwantedSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el) {
        // 完全移除元素
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.height = '0';
        el.style.width = '0';
        el.style.overflow = 'hidden';
        el.style.position = 'absolute';
        el.style.top = '-9999px';
        el.style.left = '-9999px';
        
        // 尝试直接从DOM中移除
        try {
          el.remove();
        } catch (e) {
          // 忽略移除失败的情况
        }
      }
    });
  });
  
  // 额外处理：确保主内容区域占据整个页面
  const mainContentSelectors = ['.App-main', '.Topstory-main', '.QuestionPage', '.SearchMain', '.Question-main', '.ColumnPage-main'];
  mainContentSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el) {
        el.style.backgroundColor = '#000000';
        el.style.maxWidth = '100%';
        el.style.width = '100%';
        el.style.margin = '0';
        el.style.padding = '20px';
        el.style.boxSizing = 'border-box';
      }
    });
  });
  
  // 确保body和html是全黑的
  document.body.style.backgroundColor = '#000000';
  document.documentElement.style.backgroundColor = '#000000';
  document.body.style.color = '#e0e0e0';
  document.documentElement.style.color = '#e0e0e0';
  
  // 移除所有脚本和样式，只保留必要的内容
  const scripts = document.querySelectorAll('script');
  scripts.forEach(script => {
    // 保留content.js本身
    if (!script.src.includes('content.js')) {
      try {
        script.remove();
      } catch (e) {}
    }
  });
  
  // 移除所有iframe（可能包含广告）
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    try {
      iframe.remove();
    } catch (e) {}
  });
}

// 移除深色主题样式
function removeDarkTheme() {
  const style = document.getElementById('zhihu-dark-theme');
  if (style) {
    style.remove();
  }
}

// 监听浏览器主题变化
function setupThemeListener() {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (e.matches) {
      applyDarkTheme();
    } else {
      removeDarkTheme();
    }
  });
}

// 初始化
function init() {
  // 检查是否为深色模式
  if (isDarkMode()) {
    applyDarkTheme();
  }
  
  // 设置主题变化监听
  setupThemeListener();
}

// 执行初始化
init();