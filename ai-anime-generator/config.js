/**
 * 火山方舟 · 豆包 Seedream 5.0 Lite 配置
 * 控制台：https://console.volcengine.com/ark
 */
const CONFIG = {
  // 火山方舟 API Key（在控制台「API Key 管理」复制完整密钥，通常为 UUID 格式）
  API_KEY: 'ark-2115a0ea-3d05-4cb9-99eb-411e96afe742-98d30',

  // 模型/接入点 ID（与方舟控制台「在线推理」页面一致）
  // 常见值：doubao-seedream-5-0-260128 或 Doubao-Seedream-5.0-lite
  MODEL_ID: 'doubao-seedream-5-0-260128',

  // 文生图接口（固定）
  API_URL: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',

  DAILY_FREE_LIMIT: 5,
  MAX_HISTORY_ITEMS: 50,
  EST_SECONDS_PER_IMAGE: 15
};
