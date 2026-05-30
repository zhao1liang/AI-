/**
 * 火山方舟 · 豆包 Seedream 5.0 Lite 配置
 * 控制台：https://console.volcengine.com/ark
 */
const CONFIG = {
  API_KEY: 'ark-2115a0ea-3d05-4cb9-99eb-411e96afe742-98d30',
  MODEL_ID: 'doubao-seedream-5-0-260128',
  API_URL: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',

  DAILY_FREE_LIMIT: 5,
  MAX_HISTORY_ITEMS: 15,
  EST_SECONDS_PER_IMAGE: 15,

  PAYMENT: {
    PRICE_CNY: 68,
    PRICE_USD: 9.99,
    PRO_DURATION_DAYS: 30,

    /**
     * 收款码图片 — 替换方法：
     * 1. 把微信收款码保存为 assets/wechat-pay.png
     * 2. 把支付宝收款码保存为 assets/alipay.png
     * 3. 修改下方 QR_VERSION 数字（如 2→3）强制刷新缓存
     */
    WECHAT_QR: 'assets/wechat-pay.png',
    ALIPAY_QR: 'assets/alipay.png',
    WECHAT_QR_FALLBACK: 'assets/wechat-pay.svg',
    ALIPAY_QR_FALLBACK: 'assets/alipay.svg',
    QR_VERSION: '2',

    CONTACT_WECHAT: 'zhao87616917',
    CONTACT_EMAIL: '706533929@qq.com',
    PAYMENT_NOTE: 'Please add note: AnimeGen Pro + your WeChat ID',

    ACTIVATION_CODES: [
      'ANIME-VIP-2026',
      'ANIME-PRO-DEMO01'
    ]
  }
};
