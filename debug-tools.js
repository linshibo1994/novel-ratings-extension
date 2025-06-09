// 小说评分排行榜扩展调试工具
// 在Chrome控制台中运行此脚本以诊断问题

function debugExtension() {
  console.log('开始诊断小说评分排行榜扩展问题...');
  
  // 检查存储数据
  checkStorageData()
    .then(() => {
      // 检查DOM元素
      checkDOMElements();
      
      // 检查网络请求
      checkNetworkRequests();
      
      // 检查错误日志
      checkErrorLogs();
      
      console.log('诊断完成，请查看上方的结果');
    })
    .catch(error => {
      console.error('诊断过程中出错:', error);
    });
}

// 检查存储数据
async function checkStorageData() {
  console.log('正在检查存储数据...');
  
  try {
    // 获取小说数据
    const storageData = await new Promise(resolve => {
      chrome.storage.local.get(['novelData', 'lastUpdate', 'dataSources'], resolve);
    });
    
    const { novelData, lastUpdate, dataSources } = storageData;
    
    console.log('存储数据检查结果:');
    console.log('- 小说数据:', novelData ? `存在 (${novelData.length}条)` : '不存在');
    console.log('- 最后更新时间:', lastUpdate ? new Date(lastUpdate).toLocaleString() : '不存在');
    console.log('- 数据源配置:', dataSources || '使用默认配置');
    
    // 检查数据是否过期
    if (lastUpdate) {
      const now = new Date().getTime();
      const dayInMs = 24 * 60 * 60 * 1000;
      const isExpired = (now - lastUpdate) > dayInMs;
      
      console.log('- 数据状态:', isExpired ? '已过期' : '有效');
    }
    
    return storageData;
  } catch (error) {
    console.error('检查存储数据时出错:', error);
    throw error;
  }
}

// 检查DOM元素
function checkDOMElements() {
  console.log('正在检查DOM元素...');
  
  const criticalElements = [
    'category-select',
    'source-select',
    'refresh-btn',
    'loading',
    'novels-container',
    'error-message',
    'retry-btn',
    'update-time'
  ];
  
  let allElementsExist = true;
  
  criticalElements.forEach(id => {
    const element = document.getElementById(id);
    if (!element) {
      console.error(`- 缺少关键DOM元素: #${id}`);
      allElementsExist = false;
    }
  });
  
  if (allElementsExist) {
    console.log('- 所有关键DOM元素都存在');
  }
}

// 检查网络请求
function checkNetworkRequests() {
  console.log('正在检查网络请求能力...');
  
  // 测试发送消息到background
  try {
    chrome.runtime.sendMessage({ action: 'test' }, response => {
      if (chrome.runtime.lastError) {
        console.error('- 向background发送消息失败:', chrome.runtime.lastError);
      } else {
        console.log('- 向background发送消息成功');
      }
    });
  } catch (error) {
    console.error('- 测试消息发送失败:', error);
  }
  
  // 检查是否有CORS错误
  console.log('- 注意: 由于CORS限制，扩展使用模拟数据代替实际网络请求');
}

// 检查错误日志
function checkErrorLogs() {
  console.log('正在检查错误日志...');
  
  // 获取控制台错误
  if (typeof console.memory !== 'undefined') {
    console.log('- 内存使用情况:', console.memory);
  }
  
  console.log('- 请检查控制台是否有红色错误信息');
  console.log('- 如果有网络相关错误，很可能是CORS限制导致');
}

// 修复常见问题
function fixCommonIssues() {
  console.log('正在尝试修复常见问题...');
  
  // 重置存储数据
  try {
    chrome.storage.local.remove(['novelData', 'lastUpdate'], () => {
      if (chrome.runtime.lastError) {
        console.error('- 重置存储数据失败:', chrome.runtime.lastError);
      } else {
        console.log('- 已重置存储数据，请刷新扩展');
      }
    });
  } catch (error) {
    console.error('- 重置存储数据时出错:', error);
  }
  
  // 请求强制更新
  try {
    chrome.runtime.sendMessage({ action: 'forceUpdate' }, response => {
      if (chrome.runtime.lastError) {
        console.error('- 请求强制更新失败:', chrome.runtime.lastError);
      } else {
        console.log('- 已请求强制更新数据');
      }
    });
  } catch (error) {
    console.error('- 请求强制更新时出错:', error);
  }
}

// 运行诊断
console.log('小说评分排行榜扩展调试工具已加载');
console.log('请在popup页面的控制台中运行 debugExtension() 开始诊断');
console.log('如需修复常见问题，请运行 fixCommonIssues()');

// 导出函数到全局作用域
window.debugExtension = debugExtension;
window.fixCommonIssues = fixCommonIssues; 