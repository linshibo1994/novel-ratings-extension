// DOM元素
const sourceGoodreads = document.getElementById('source-goodreads');
const sourceDouban = document.getElementById('source-douban');
const updateInterval = document.getElementById('update-interval');
const showRating = document.getElementById('show-rating');
const showAuthor = document.getElementById('show-author');
const showCategory = document.getElementById('show-category');
const defaultCategory = document.getElementById('default-category');
const clearDataBtn = document.getElementById('clear-data');
const forceUpdateBtn = document.getElementById('force-update');
const saveBtn = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 加载保存的设置
  loadSettings();
  
  // 绑定事件
  saveBtn.addEventListener('click', saveSettings);
  clearDataBtn.addEventListener('click', clearData);
  forceUpdateBtn.addEventListener('click', forceUpdate);
});

// 加载设置
function loadSettings() {
  chrome.storage.local.get([
    'dataSources',
    'updateInterval',
    'showRating',
    'showAuthor',
    'showCategory',
    'defaultCategory'
  ], (result) => {
    // 数据源设置
    const dataSources = result.dataSources || ['goodreads', 'douban'];
    sourceGoodreads.checked = dataSources.includes('goodreads');
    sourceDouban.checked = dataSources.includes('douban');
    
    // 更新频率
    updateInterval.value = result.updateInterval || '24';
    
    // 显示设置
    showRating.checked = result.showRating !== false;
    showAuthor.checked = result.showAuthor !== false;
    showCategory.checked = result.showCategory !== false;
    
    // 默认分类
    defaultCategory.value = result.defaultCategory || 'all';
  });
}

// 保存设置
function saveSettings() {
  // 获取数据源设置
  const dataSources = [];
  if (sourceGoodreads.checked) dataSources.push('goodreads');
  if (sourceDouban.checked) dataSources.push('douban');
  
  // 确保至少选择一个数据源
  if (dataSources.length === 0) {
    showStatus('请至少选择一个数据源', 'error');
    return;
  }
  
  // 保存设置
  chrome.storage.local.set({
    dataSources: dataSources,
    updateInterval: updateInterval.value,
    showRating: showRating.checked,
    showAuthor: showAuthor.checked,
    showCategory: showCategory.checked,
    defaultCategory: defaultCategory.value,
    lastCategory: defaultCategory.value
  }, () => {
    showStatus('设置已保存', 'success');
    
    // 更新定时器
    updateAlarm();
  });
}

// 更新定时器
function updateAlarm() {
  const hours = parseInt(updateInterval.value);
  const minutes = hours * 60;
  
  chrome.alarms.clear('updateNovelData', () => {
    chrome.alarms.create('updateNovelData', {
      periodInMinutes: minutes
    });
  });
}

// 清除数据
function clearData() {
  if (confirm('确定要清除所有缓存数据吗？')) {
    chrome.storage.local.remove(['novelData', 'lastUpdate'], () => {
      showStatus('缓存数据已清除', 'success');
    });
  }
}

// 强制更新数据
function forceUpdate() {
  showStatus('正在更新数据...', '');
  
  chrome.runtime.sendMessage({ action: 'forceUpdate' }, (response) => {
    if (response && response.success) {
      showStatus('数据更新成功', 'success');
    } else {
      showStatus('数据更新失败: ' + (response?.error || '未知错误'), 'error');
    }
  });
}

// 显示状态消息
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = type;
  
  // 3秒后自动清除成功消息
  if (type === 'success') {
    setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.className = '';
    }, 3000);
  }
} 