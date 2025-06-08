// DOM元素
const categorySelect = document.getElementById('category-select');
const refreshBtn = document.getElementById('refresh-btn');
const loadingElement = document.getElementById('loading');
const novelsContainer = document.getElementById('novels-container');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const updateTimeElement = document.getElementById('update-time');
const optionsLink = document.getElementById('options-link');

// 状态变量
let currentCategory = 'all';
let isLoading = false;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 加载上次选择的分类
  chrome.storage.local.get(['lastCategory'], (result) => {
    if (result.lastCategory) {
      currentCategory = result.lastCategory;
      categorySelect.value = currentCategory;
    }
    
    // 加载小说数据
    loadNovels();
  });
  
  // 绑定事件
  categorySelect.addEventListener('change', handleCategoryChange);
  refreshBtn.addEventListener('click', handleRefresh);
  retryBtn.addEventListener('click', handleRetry);
  optionsLink.addEventListener('click', openOptions);
});

// 处理分类变更
function handleCategoryChange() {
  currentCategory = categorySelect.value;
  chrome.storage.local.set({ lastCategory: currentCategory });
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
      showError();
    }
  });
}

// 处理重试按钮
function handleRetry() {
  loadNovels();
}

// 打开选项页面
function openOptions() {
  chrome.runtime.openOptionsPage();
}

// 加载小说数据
function loadNovels() {
  showLoading();
  
  // 从存储中获取数据
  chrome.storage.local.get(['novelData', 'lastUpdate'], (result) => {
    const { novelData, lastUpdate } = result;
    
    // 如果没有数据或数据过期，请求更新
    if (!novelData || isDataExpired(lastUpdate)) {
      requestDataUpdate();
      return;
    }
    
    // 显示更新时间
    updateTimeElement.textContent = formatDate(lastUpdate);
    
    // 过滤并显示数据
    displayNovels(filterNovelsByCategory(novelData, currentCategory));
  });
}

// 请求数据更新
function requestDataUpdate() {
  chrome.runtime.sendMessage({ action: 'checkUpdate' }, (response) => {
    if (response && response.success) {
      // 数据已更新，重新加载
      loadNovels();
    } else {
      // 更新失败，显示错误
      showError();
    }
  });
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
  
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
}

// 数字补零
function padZero(num) {
  return num.toString().padStart(2, '0');
}

// 按分类过滤小说
function filterNovelsByCategory(novels, category) {
  if (!novels) return [];
  if (category === 'all') return novels;
  
  return novels.filter(novel => novel.category === category);
}

// 显示小说列表
function displayNovels(novels) {
  if (!novels || novels.length === 0) {
    novelsContainer.innerHTML = '<div class="no-data">暂无数据</div>';
  } else {
    // 清空容器
    novelsContainer.innerHTML = '';
    
    // 添加小说项
    novels.slice(0, 50).forEach((novel, index) => {
      const novelElement = createNovelElement(novel, index + 1);
      novelsContainer.appendChild(novelElement);
    });
  }
  
  hideLoading();
}

// 创建小说元素
function createNovelElement(novel, rank) {
  const novelElement = document.createElement('div');
  novelElement.className = 'novel-item';
  
  // 生成星星评分
  const stars = generateStars(novel.rating);
  
  novelElement.innerHTML = `
    <div class="novel-rank">${rank}</div>
    <div class="novel-info">
      <div class="novel-title">${novel.title}</div>
      <div class="novel-author">${novel.author}</div>
      <div class="novel-rating">
        <span class="rating-stars">${stars}</span>
        <span>${novel.rating.toFixed(1)}</span>
        <span class="novel-type">${getCategoryName(novel.category)}</span>
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
}

// 生成星星评分
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
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
  
  return categoryMap[category] || category;
}

// 显示加载中
function showLoading() {
  isLoading = true;
  loadingElement.classList.remove('hidden');
  novelsContainer.classList.add('hidden');
  errorMessage.classList.add('hidden');
}

// 隐藏加载中
function hideLoading() {
  isLoading = false;
  loadingElement.classList.add('hidden');
  novelsContainer.classList.remove('hidden');
}

// 显示错误信息
function showError() {
  isLoading = false;
  loadingElement.classList.add('hidden');
  novelsContainer.classList.add('hidden');
  errorMessage.classList.remove('hidden');
} 