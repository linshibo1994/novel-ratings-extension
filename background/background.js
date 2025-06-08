// 导入API模块
import { fetchGoodreadsNovels, fetchDoubanNovels } from '../utils/api.js';
import { saveNovels, getNovels, getLastUpdate, getSettings } from '../utils/storage.js';

// 常量定义
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24小时
const ALARM_NAME = 'updateNovelData';
const MAX_NOVELS = 50;

// 数据源配置
const DATA_SOURCES = {
  goodreads: {
    baseUrl: 'https://www.goodreads.com/list/show/',
    categories: {
      'fantasy': '1.Best_Fantasy',
      'scifi': '3.Best_Science_Fiction',
      'romance': '45.Best_Romance_Novels',
      'mystery': '11.Best_Crime_Mystery_Books',
      'historical': '15.Best_Historical_Fiction'
    }
  },
  douban: {
    baseUrl: 'https://book.douban.com/tag/',
    categories: {
      'fantasy': '奇幻',
      'scifi': '科幻',
      'romance': '言情',
      'mystery': '推理',
      'historical': '历史'
    }
  }
};

// 初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('小说评分排行榜扩展已安装');
  
  // 设置定时更新
  setupAlarm();
  
  // 首次安装时立即更新数据
  updateNovelData();
});

// 监听定时器
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    updateNovelData();
  }
});

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkUpdate') {
    checkAndUpdateData()
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('数据更新失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 异步响应
  }
  
  if (message.action === 'forceUpdate') {
    updateNovelData()
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('强制更新失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 异步响应
  }
});

// 设置定时器
function setupAlarm() {
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: UPDATE_INTERVAL / (60 * 1000)
  });
}

// 检查并更新数据
async function checkAndUpdateData() {
  try {
    const lastUpdate = await getLastUpdate();
    
    // 如果数据不存在或已过期，则更新
    if (!lastUpdate || isDataExpired(lastUpdate)) {
      await updateNovelData();
    }
    
    return true;
  } catch (error) {
    console.error('检查更新失败:', error);
    throw error;
  }
}

// 检查数据是否过期
function isDataExpired(timestamp) {
  if (!timestamp) return true;
  
  const now = new Date().getTime();
  return (now - timestamp) > UPDATE_INTERVAL;
}

// 更新小说数据
async function updateNovelData() {
  try {
    console.log('开始更新小说数据...');
    
    // 获取设置
    const settings = await getSettings();
    const { dataSources = ['goodreads', 'douban'] } = settings;
    
    // 获取所有小说数据
    let allNovels = [];
    
    // 从每个数据源获取数据
    for (const source of dataSources) {
      if (DATA_SOURCES[source]) {
        const novels = await fetchNovelsFromSource(source);
        allNovels = [...allNovels, ...novels];
      }
    }
    
    // 对小说进行排序和去重
    const processedNovels = processNovels(allNovels);
    
    // 保存数据
    await saveNovels(processedNovels);
    
    console.log('小说数据更新完成，共获取', processedNovels.length, '本小说');
    return true;
  } catch (error) {
    console.error('更新小说数据失败:', error);
    throw error;
  }
}

// 从数据源获取小说
async function fetchNovelsFromSource(source) {
  const sourceConfig = DATA_SOURCES[source];
  let novels = [];
  
  // 遍历每个分类
  for (const [category, categoryId] of Object.entries(sourceConfig.categories)) {
    try {
      let categoryNovels = [];
      
      // 根据数据源选择不同的获取方法
      if (source === 'goodreads') {
        categoryNovels = await fetchGoodreadsNovels(category, categoryId);
      } else if (source === 'douban') {
        categoryNovels = await fetchDoubanNovels(category, categoryId);
      } else {
        // 使用模拟数据作为后备
        categoryNovels = await mockFetchNovels(source, category, categoryId);
      }
      
      novels = [...novels, ...categoryNovels];
    } catch (error) {
      console.error(`从 ${source} 获取 ${category} 类别的小说失败:`, error);
    }
  }
  
  return novels;
}

// 处理小说数据（排序、去重）
function processNovels(novels) {
  // 去重（基于标题和作者）
  const uniqueNovels = [];
  const seen = new Set();
  
  for (const novel of novels) {
    const key = `${novel.title}-${novel.author}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueNovels.push(novel);
    }
  }
  
  // 按评分排序
  uniqueNovels.sort((a, b) => b.rating - a.rating);
  
  // 返回前MAX_NOVELS本
  return uniqueNovels.slice(0, MAX_NOVELS);
}

// 模拟获取小说数据（实际开发中应替换为真实的爬虫或API调用）
async function mockFetchNovels(source, category, categoryId) {
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 生成模拟数据
  const novels = [];
  const count = Math.floor(Math.random() * 10) + 10; // 10-20本
  
  for (let i = 0; i < count; i++) {
    novels.push({
      title: `${category}小说${i+1}`,
      author: `作者${Math.floor(Math.random() * 100)}`,
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
      category: category,
      url: `https://example.com/book/${i}`,
      source: source,
      cover: `https://via.placeholder.com/150x200?text=${category}${i}`
    });
  }
  
  return novels;
} 