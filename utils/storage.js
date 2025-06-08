/**
 * 存储工具函数
 */

// 保存小说数据
async function saveNovels(novels) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({
        novelData: novels,
        lastUpdate: new Date().getTime()
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(true);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// 获取小说数据
async function getNovels() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(['novelData'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.novelData || []);
        }
      });
    } catch (error) {
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
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.lastUpdate || null);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// 清除小说数据
async function clearNovels() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(['novelData', 'lastUpdate'], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(true);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// 保存设置
async function saveSettings(settings) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(settings, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(true);
        }
      });
    } catch (error) {
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
          reject(chrome.runtime.lastError);
        } else {
          // 设置默认值
          const settings = {
            dataSources: result.dataSources || ['goodreads', 'douban'],
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
      reject(error);
    }
  });
}

// 导出函数
export {
  saveNovels,
  getNovels,
  getLastUpdate,
  clearNovels,
  saveSettings,
  getSettings
}; 