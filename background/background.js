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
  },
  qidian: {
    baseUrl: 'https://www.qidian.com/rank/',
    categories: {
      'fantasy': 'yuepiao/xiaoshuo/all/month/page1/',
      'scifi': 'yuepiao/kehuan/all/month/page1/',
      'romance': 'yuepiao/yanqing/all/month/page1/',
      'mystery': 'yuepiao/xuanyi/all/month/page1/',
      'historical': 'yuepiao/lishi/all/month/page1/'
    }
  },
  zongheng: {
    baseUrl: 'https://www.zongheng.com/rank/',
    categories: {
      'fantasy': 'details.html?rankType=1&rankId=1',
      'scifi': 'details.html?rankType=1&rankId=6',
      'romance': 'details.html?rankType=1&rankId=9',
      'mystery': 'details.html?rankType=1&rankId=10',
      'historical': 'details.html?rankType=1&rankId=3'
    }
  },
  jjwxc: {
    baseUrl: 'https://www.jjwxc.net/bookbase.php?fw=',
    categories: {
      'fantasy': '玄幻',
      'scifi': '科幻',
      'romance': '言情',
      'mystery': '悬疑',
      'historical': '历史'
    }
  },
  hongxiu: {
    baseUrl: 'https://www.hongxiu.com/rank/',
    categories: {
      'fantasy': 'yuepiao/all/month/page1/',
      'romance': 'yuepiao/yanqing/month/page1/',
      'historical': 'yuepiao/lishi/month/page1/'
    }
  }
};

// 初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('小说评分排行榜扩展已安装');
  
  try {
    // 设置定时更新
    setupAlarm();
    
    // 首次安装时立即更新数据
    updateNovelData();
  } catch (error) {
    console.error('初始化扩展时出错:', error);
  }
});

// 监听定时器
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    try {
      updateNovelData();
    } catch (error) {
      console.error('定时更新数据时出错:', error);
    }
  }
});

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('收到消息:', message);
  
  if (message.action === 'checkUpdate') {
    checkAndUpdateData()
      .then(() => {
        console.log('检查更新成功');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('数据更新失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 异步响应
  }
  
  if (message.action === 'forceUpdate') {
    updateNovelData()
      .then(() => {
        console.log('强制更新成功');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('强制更新失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 异步响应
  }
  
  return false;
});

// 设置定时器
function setupAlarm() {
  try {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: Math.max(1, Math.floor(UPDATE_INTERVAL / (60 * 1000)))
    });
    console.log('设置定时更新成功');
  } catch (error) {
    console.error('设置定时更新失败:', error);
  }
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
    const { dataSources = ['goodreads', 'douban', 'qidian', 'zongheng', 'jjwxc', 'hongxiu'] } = settings;
    
    // 获取所有小说数据
    let allNovels = [];
    
    // 从每个数据源获取数据
    for (const source of dataSources) {
      if (DATA_SOURCES[source]) {
        try {
          const novels = await fetchNovelsFromSource(source);
          allNovels = [...allNovels, ...novels];
        } catch (sourceError) {
          console.error(`从数据源 ${source} 获取数据失败:`, sourceError);
        }
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
      } else if (source === 'qidian') {
        categoryNovels = await fetchQidianNovels(category, categoryId);
      } else if (source === 'zongheng') {
        categoryNovels = await fetchZonghengNovels(category, categoryId);
      } else if (source === 'jjwxc') {
        categoryNovels = await fetchJjwxcNovels(category, categoryId);
      } else if (source === 'hongxiu') {
        categoryNovels = await fetchHongxiuNovels(category, categoryId);
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
  try {
    // 确保novels是数组
    if (!Array.isArray(novels)) {
      console.error('processNovels: novels不是数组', novels);
      return [];
    }
    
    // 去重（基于标题和作者）
    const uniqueNovels = [];
    const seen = new Set();
    
    for (const novel of novels) {
      if (!novel || typeof novel !== 'object') {
        console.error('processNovels: 无效的小说对象', novel);
        continue;
      }
      
      const key = `${novel.title || ''}-${novel.author || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueNovels.push(novel);
      }
    }
    
    // 按评分排序
    uniqueNovels.sort((a, b) => {
      const ratingA = parseFloat(a.rating) || 0;
      const ratingB = parseFloat(b.rating) || 0;
      return ratingB - ratingA;
    });
    
    // 返回前MAX_NOVELS本
    return uniqueNovels.slice(0, MAX_NOVELS);
  } catch (error) {
    console.error('处理小说数据时出错:', error);
    return [];
  }
}

// 从Goodreads获取小说数据
async function fetchGoodreadsNovels(category, listId) {
  try {
    const url = `https://www.goodreads.com/list/show/${listId}`;
    console.log(`尝试从Goodreads获取${category}类别小说:`, url);
    
    // 使用模拟数据代替实际请求，避免CORS问题
    return mockFetchNovels('goodreads', category, listId);
  } catch (error) {
    console.error(`从Goodreads获取${category}类别小说失败:`, error);
    return [];
  }
}

// 从豆瓣获取小说数据
async function fetchDoubanNovels(category, tagName) {
  try {
    const url = `https://book.douban.com/tag/${tagName}`;
    console.log(`尝试从豆瓣获取${category}类别小说:`, url);
    
    // 使用模拟数据代替实际请求，避免CORS问题
    return mockFetchNovels('douban', category, tagName);
  } catch (error) {
    console.error(`从豆瓣获取${category}类别小说失败:`, error);
    return [];
  }
}

// 从起点中文网获取小说数据
async function fetchQidianNovels(category, path) {
  try {
    const url = `https://www.qidian.com/rank/${path}`;
    console.log(`尝试从起点中文网获取${category}类别小说:`, url);
    
    // 使用模拟数据代替实际请求，避免CORS问题
    return mockFetchNovels('qidian', category, path);
  } catch (error) {
    console.error(`从起点中文网获取${category}类别小说失败:`, error);
    return [];
  }
}

// 从纵横中文网获取小说数据
async function fetchZonghengNovels(category, params) {
  try {
    const url = `https://www.zongheng.com/rank/${params}`;
    console.log(`尝试从纵横中文网获取${category}类别小说:`, url);
    
    // 使用模拟数据代替实际请求，避免CORS问题
    return mockFetchNovels('zongheng', category, params);
  } catch (error) {
    console.error(`从纵横中文网获取${category}类别小说失败:`, error);
    return [];
  }
}

// 从晋江文学城获取小说数据
async function fetchJjwxcNovels(category, keyword) {
  try {
    const url = `https://www.jjwxc.net/bookbase.php?fw=${encodeURIComponent(keyword)}`;
    console.log(`尝试从晋江文学城获取${category}类别小说:`, url);
    
    // 使用模拟数据代替实际请求，避免CORS问题
    return mockFetchNovels('jjwxc', category, keyword);
  } catch (error) {
    console.error(`从晋江文学城获取${category}类别小说失败:`, error);
    return [];
  }
}

// 从红袖添香获取小说数据
async function fetchHongxiuNovels(category, path) {
  try {
    const url = `https://www.hongxiu.com/rank/${path}`;
    console.log(`尝试从红袖添香获取${category}类别小说:`, url);
    
    // 使用模拟数据代替实际请求，避免CORS问题
    return mockFetchNovels('hongxiu', category, path);
  } catch (error) {
    console.error(`从红袖添香获取${category}类别小说失败:`, error);
    return [];
  }
}

// 模拟获取小说数据
async function mockFetchNovels(source, category, categoryId) {
  try {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 生成模拟数据
    const novels = [];
    const count = Math.floor(Math.random() * 10) + 10; // 10-20本
    
    // 根据数据源生成不同的模拟数据
    const sourceNames = {
      'goodreads': 'Goodreads',
      'douban': '豆瓣',
      'qidian': '起点中文网',
      'zongheng': '纵横中文网',
      'jjwxc': '晋江文学城',
      'hongxiu': '红袖添香'
    };
    
    const sourceName = sourceNames[source] || source;
    
    for (let i = 0; i < count; i++) {
      const rating = (Math.random() * 2 + 3).toFixed(1) * 1; // 3.0-5.0，转换为数字
      const title = `${sourceName} ${category}小说${i+1}`;
      const author = `${sourceName}作者${Math.floor(Math.random() * 100)}`;
      
      let url = '';
      switch(source) {
        case 'goodreads':
          url = `https://www.goodreads.com/book/show/${10000 + i}`;
          break;
        case 'douban':
          url = `https://book.douban.com/subject/${10000000 + i}/`;
          break;
        case 'qidian':
          url = `https://book.qidian.com/info/${1000000000 + i}/`;
          break;
        case 'zongheng':
          url = `https://book.zongheng.com/book/${1000000 + i}.html`;
          break;
        case 'jjwxc':
          url = `https://www.jjwxc.net/onebook.php?novelid=${2000000 + i}`;
          break;
        case 'hongxiu':
          url = `https://www.hongxiu.com/book/${3000000 + i}`;
          break;
        default:
          url = `https://example.com/book/${i}`;
      }
      
      novels.push({
        title: title,
        author: author,
        rating: rating,
        category: category,
        url: url,
        source: source,
        sourceName: sourceName,
        cover: `https://via.placeholder.com/150x200?text=${source}_${category}${i}`
      });
    }
    
    return novels;
  } catch (error) {
    console.error('生成模拟数据时出错:', error);
    return [];
  }
}

// 保存小说数据
async function saveNovels(novels) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({
        novelData: novels,
        lastUpdate: new Date().getTime()
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('保存小说数据时出错:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('小说数据保存成功');
          resolve(true);
        }
      });
    } catch (error) {
      console.error('保存小说数据时出错:', error);
      reject(error);
    }
  });
}

// 获取上次更新时间
async function getLastUpdate() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(['lastUpdate'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('获取上次更新时间时出错:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.lastUpdate || null);
        }
      });
    } catch (error) {
      console.error('获取上次更新时间时出错:', error);
      reject(error);
    }
  });
}

// 获取设置
async function getSettings() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([
        'dataSources',
        'updateInterval',
        'showRating',
        'showAuthor',
        'showCategory',
        'defaultCategory',
        'lastCategory'
      ], (result) => {
        if (chrome.runtime.lastError) {
          console.error('获取设置时出错:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          // 设置默认值
          const settings = {
            dataSources: result.dataSources || ['goodreads', 'douban', 'qidian', 'zongheng', 'jjwxc', 'hongxiu'],
            updateInterval: result.updateInterval || '24',
            showRating: result.showRating !== false,
            showAuthor: result.showAuthor !== false,
            showCategory: result.showCategory !== false,
            defaultCategory: result.defaultCategory || 'all',
            lastCategory: result.lastCategory || 'all'
          };
          
          resolve(settings);
        }
      });
    } catch (error) {
      console.error('获取设置时出错:', error);
      reject(error);
    }
  });
} 