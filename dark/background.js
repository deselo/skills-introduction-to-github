// 插件安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('知乎深色模式插件已安装');
  // 可以在这里添加初始化逻辑
});

// 监听浏览器主题变化
chrome.theme.onUpdated.addListener((theme) => {
  console.log('浏览器主题已更新:', theme);
  // 可以在这里添加主题变化的处理逻辑
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 当标签页加载完成且是知乎页面时
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('zhihu.com')) {
    // 注入脚本以应用深色主题
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(err => {
      console.error('注入脚本失败:', err);
    });
  }
});