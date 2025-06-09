// DOM元素
const categorySelect = document.getElementById('category-select');
const sourceSelect = document.getElementById('source-select');
const refreshBtn = document.getElementById('refresh-btn');
const loadingElement = document.getElementById('loading');
const novelsContainer = document.getElementById('novels-container');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const updateTimeElement = document.getElementById('update-time');
const optionsLink = document.getElementById('options-link');
const container = document.querySelector('.container');
const resizeHandle = document.querySelector('.resize-handle');

// 状态变量
let currentCategory = 'all';
let currentSource = 'all';
let isLoading = false;

// 拖动相关变量
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

// 调整大小相关变量
let isResizing = false;
let originalWidth = 0;
let originalHeight = 0;
let originalX = 0;
let originalY = 0;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 确保所有DOM元素都存在
  if (!categorySelect) console.error('找不到category-select元素');
  if (!sourceSelect) console.error('找不到source-select元素');
  if (!refreshBtn) console.error('找不到refresh-btn元素');
  if (!loadingElement) console.error('找不到loading元素');
  if (!novelsContainer) console.error('找不到novels-container元素');
  if (!errorMessage) console.error('找不到error-message元素');
  if (!retryBtn) console.error('找不到retry-btn元素');
  if (!updateTimeElement) console.error('找不到update-time元素');
  if (!optionsLink) console.error('找不到options-link元素');
  if (!resizeHandle) console.error('找不到resize-handle元素');
  
  // 加载上次选择的分类和数据源
  chrome.storage.local.get(['lastCategory', 'lastSource'], (result) => {
    if (result.lastCategory && categorySelect) {
      currentCategory = result.lastCategory;
      categorySelect.value = currentCategory;
    }
    
    if (result.lastSource && sourceSelect) {
      currentSource = result.lastSource;
      sourceSelect.value = currentSource;
    }
    
    // 加载小说数据
    loadNovels();
  });
  
  // 绑定事件
  if (categorySelect) {
    categorySelect.addEventListener('change', handleCategoryChange);
  }
  
  if (sourceSelect) {
    sourceSelect.addEventListener('change', handleSourceChange);
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleRefresh);
  }
  
  if (retryBtn) {
    retryBtn.addEventListener('click', handleRetry);
  }
  
  if (optionsLink) {
    optionsLink.addEventListener('click', openOptions);
  }

  // 添加拖动功能
  setupDraggable();
  
  // 添加调整大小功能
  setupResizable();
  
  // 加载保存的大小
  loadSavedSize();
});

// 加载保存的大小
function loadSavedSize() {
  chrome.storage.local.get(['popupWidth', 'popupHeight'], (result) => {
    if (result.popupWidth && result.popupHeight && container) {
      container.style.width = `${result.popupWidth}px`;
      container.style.height = `${result.popupHeight}px`;
    }
  });
}

// 设置拖动功能
function setupDraggable() {
  // 创建拖动手柄
  const dragHandle = document.createElement('div');
  dragHandle.className = 'drag-handle';
  
  if (container) {
    // 插入拖动手柄
    container.insertBefore(dragHandle, container.firstChild);
    
    // 监听鼠标事件
    dragHandle.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);
    
    // 从存储中恢复位置
    chrome.storage.local.get(['popupPositionX', 'popupPositionY'], (result) => {
      if (result.popupPositionX !== undefined && result.popupPositionY !== undefined) {
        container.style.position = 'fixed';
        container.style.left = `${result.popupPositionX}px`;
        container.style.top = `${result.popupPositionY}px`;
      }
    });
  }
}

// 设置调整大小功能
function setupResizable() {
  if (resizeHandle && container) {
    resizeHandle.addEventListener('mousedown', startResizing);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);
  }
}

// 开始调整大小
function startResizing(e) {
  e.preventDefault();
  e.stopPropagation();
  isResizing = true;
  
  // 记录初始大小和位置
  originalWidth = container.offsetWidth;
  originalHeight = container.offsetHeight;
  originalX = e.clientX;
  originalY = e.clientY;
  
  // 添加调整中的样式
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'nwse-resize';
}

// 调整大小
function resize(e) {
  if (!isResizing) return;
  
  // 计算新的宽度和高度
  const newWidth = originalWidth + (e.clientX - originalX);
  const newHeight = originalHeight + (e.clientY - originalY);
  
  // 设置最小大小
  const minWidth = 350;
  const minHeight = 400;
  
  // 应用新的大小
  if (newWidth > minWidth) {
    container.style.width = `${newWidth}px`;
  }
  
  if (newHeight > minHeight) {
    container.style.height = `${newHeight}px`;
  }
}

// 停止调整大小
function stopResizing() {
  if (!isResizing) return;
  isResizing = false;
  
  // 移除调整中的样式
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
  
  // 保存大小到存储
  chrome.storage.local.set({
    popupWidth: container.offsetWidth,
    popupHeight: container.offsetHeight
  });
}

// 开始拖动
function startDragging(e) {
  e.preventDefault();
  isDragging = true;
  
  // 计算鼠标在元素内的偏移量
  const rect = container.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  
  // 设置容器样式
  container.style.position = 'fixed';
  container.style.zIndex = '1000';
  document.body.style.cursor = 'move';
}

// 拖动中
function drag(e) {
  if (!isDragging) return;
  
  // 计算新位置
  const x = e.clientX - offsetX;
  const y = e.clientY - offsetY;
  
  // 更新位置
  container.style.left = `${x}px`;
  container.style.top = `${y}px`;
}

// 停止拖动
function stopDragging() {
  if (!isDragging) return;
  isDragging = false;
  document.body.style.cursor = '';
  
  // 保存位置到存储
  const rect = container.getBoundingClientRect();
  chrome.storage.local.set({
    popupPositionX: rect.left,
    popupPositionY: rect.top
  });
}

// 处理分类变更
function handleCategoryChange() {
  if (!categorySelect) return;
  currentCategory = categorySelect.value;
  chrome.storage.local.set({ lastCategory: currentCategory });
  loadNovels();
}

// 处理数据源变更
function handleSourceChange() {
  if (!sourceSelect) return;
  currentSource = sourceSelect.value;
  chrome.storage.local.set({ lastSource: currentSource });
  loadNovels();
}

// 处理刷新按钮
function handleRefresh() {
  if (isLoading) return;
  
  // 发送消息给后台脚本，请求更新数据
  chrome.runtime.sendMessage({ action: 'forceUpdate' }, (response) => {
    if (response && response.success) {
      loadNovels();
    } else {
      showError('数据更新失败，请检查网络连接');
    }
  });
}

// 处理重试按钮
function handleRetry() {
  loadNovels();
}

// 打开选项页面
function openOptions() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    // 兼容性处理
    window.open(chrome.runtime.getURL('options/options.html'));
  }
}

// 加载小说数据
function loadNovels() {
  showLoading();
  
  try {
    // 从存储中获取数据
    chrome.storage.local.get(['novelData', 'lastUpdate'], (result) => {
      const { novelData, lastUpdate } = result;
      
      // 如果没有数据或数据过期，请求更新
      if (!novelData || isDataExpired(lastUpdate)) {
        requestDataUpdate();
        return;
      }
      
      // 显示更新时间
      if (updateTimeElement) {
        updateTimeElement.textContent = formatDate(lastUpdate);
      }
      
      // 过滤并显示数据
      let filteredNovels = novelData || [];
      
      // 按分类过滤
      if (currentCategory !== 'all') {
        filteredNovels = filteredNovels.filter(novel => novel.category === currentCategory);
      }
      
      // 按数据源过滤
      if (currentSource !== 'all') {
        filteredNovels = filteredNovels.filter(novel => novel.source === currentSource);
      }
      
      displayNovels(filteredNovels);
    });
  } catch (error) {
    console.error('加载小说数据时出错:', error);
    showError('加载数据时出错: ' + error.message);
  }
}

// 请求数据更新
function requestDataUpdate() {
  try {
    chrome.runtime.sendMessage({ action: 'checkUpdate' }, (response) => {
      if (response && response.success) {
        // 数据已更新，重新加载
        loadNovels();
      } else {
        // 更新失败，显示错误
        showError('数据更新失败，请检查网络连接');
      }
    });
  } catch (error) {
    console.error('请求数据更新时出错:', error);
    showError('请求数据更新时出错: ' + error.message);
  }
}

// 检查数据是否过期（24小时）
function isDataExpired(timestamp) {
  if (!timestamp) return true;
  
  const now = new Date().getTime();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  return (now - timestamp) > dayInMs;
}

// 格式化日期
function formatDate(timestamp) {
  if (!timestamp) return '--';
  
  try {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
  } catch (error) {
    console.error('格式化日期时出错:', error);
    return '--';
  }
}

// 数字补零
function padZero(num) {
  return num.toString().padStart(2, '0');
}

// 显示小说列表
function displayNovels(novels) {
  if (!novelsContainer) return;
  
  try {
    if (!novels || novels.length === 0) {
      novelsContainer.innerHTML = '<div class="no-data">暂无数据</div>';
    } else {
      // 清空容器
      novelsContainer.innerHTML = '';
      
      // 添加小说项
      novels.slice(0, 50).forEach((novel, index) => {
        try {
          const novelElement = createNovelElement(novel, index + 1);
          novelsContainer.appendChild(novelElement);
        } catch (error) {
          console.error('创建小说元素时出错:', error, novel);
        }
      });
    }
  } catch (error) {
    console.error('显示小说列表时出错:', error);
    novelsContainer.innerHTML = '<div class="error">显示数据时出错</div>';
  }
  
  hideLoading();
}

// 创建小说元素
function createNovelElement(novel, rank) {
  if (!novel) return document.createElement('div');
  
  try {
    const novelElement = document.createElement('div');
    novelElement.className = 'novel-item';
    
    // 生成星星评分
    const stars = generateStars(novel.rating);
    
    // 显示数据源名称
    const sourceName = novel.sourceName || getSourceName(novel.source);
    
    novelElement.innerHTML = `
      <div class="novel-rank">${rank}</div>
      <div class="novel-info">
        <div class="novel-title">${novel.title || '无标题'}</div>
        <div class="novel-author">${novel.author || '未知作者'}</div>
        <div class="novel-rating">
          <span class="rating-stars">${stars}</span>
          <span>${novel.rating ? novel.rating.toFixed(1) : '0.0'}</span>
          <span class="novel-type">${getCategoryName(novel.category)}</span>
          <span class="novel-source">${sourceName}</span>
        </div>
      </div>
    `;
    
    // 添加点击事件，打开小说详情
    novelElement.addEventListener('click', () => {
      if (novel.url) {
        chrome.tabs.create({ url: novel.url });
      }
    });
    
    return novelElement;
  } catch (error) {
    console.error('创建小说元素时出错:', error);
    const errorElement = document.createElement('div');
    errorElement.className = 'novel-item error';
    errorElement.textContent = '加载失败';
    return errorElement;
  }
}

// 获取数据源名称
function getSourceName(source) {
  const sourceMap = {
    'goodreads': 'Goodreads',
    'douban': '豆瓣',
    'qidian': '起点中文网',
    'zongheng': '纵横中文网',
    'jjwxc': '晋江文学城',
    'hongxiu': '红袖添香'
  };
  
  return sourceMap[source] || source || '未知来源';
}

// 生成星星评分
function generateStars(rating) {
  try {
    const ratingNum = parseFloat(rating) || 0;
    const fullStars = Math.floor(ratingNum);
    const halfStar = ratingNum - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    // 全星
    for (let i = 0; i < fullStars; i++) {
      stars += '★';
    }
    
    // 半星
    if (halfStar) {
      stars += '☆';
    }
    
    // 空星
    for (let i = 0; i < emptyStars; i++) {
      stars += '☆';
    }
    
    return stars;
  } catch (error) {
    console.error('生成星星评分时出错:', error);
    return '☆☆☆☆☆';
  }
}

// 获取分类名称
function getCategoryName(category) {
  const categoryMap = {
    'fantasy': '奇幻',
    'scifi': '科幻',
    'romance': '言情',
    'mystery': '悬疑',
    'historical': '历史',
    'all': '全部'
  };
  
  return categoryMap[category] || category || '未知分类';
}

// 显示加载中
function showLoading() {
  isLoading = true;
  if (loadingElement) loadingElement.classList.remove('hidden');
  if (novelsContainer) novelsContainer.classList.add('hidden');
  if (errorMessage) errorMessage.classList.add('hidden');
}

// 隐藏加载中
function hideLoading() {
  isLoading = false;
  if (loadingElement) loadingElement.classList.add('hidden');
  if (novelsContainer) novelsContainer.classList.remove('hidden');
}

// 显示错误信息
function showError(message) {
  isLoading = false;
  if (loadingElement) loadingElement.classList.add('hidden');
  if (novelsContainer) novelsContainer.classList.add('hidden');
  if (errorMessage) {
    errorMessage.classList.remove('hidden');
    
    // 更新错误信息
    const errorText = errorMessage.querySelector('p');
    if (errorText && message) {
      errorText.textContent = message;
    }
  }
} 