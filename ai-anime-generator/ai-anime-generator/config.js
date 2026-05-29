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
  MAX_HISTORY_ITEMS: 15,
  EST_SECONDS_PER_IMAGE: 15,

  /**
   * 付费 / Pro 升级配置
   * 将微信、支付宝收款码图片放到 assets/ 文件夹后，修改下方路径即可
   */
  PAYMENT: {
    // 价格展示
    PRICE_CNY: 68,
    PRICE_USD: 9.99,
    PRO_DURATION_DAYS: 30,

    // 微信暂无 PNG 时使用 SVG 占位，上传后改为 assets/wechat-pay.png
    WECHAT_QR: 'assets/wechat-pay.svg',
    ALIPAY_QR: 'assets/alipay.png',
    WECHAT_QR_FALLBACK: 'assets/wechat-pay.svg',
    ALIPAY_QR_FALLBACK: 'assets/alipay.svg',

    // 付款后联系方式（显示在支付页）
    CONTACT_WECHAT: 'zhao87616917',
    CONTACT_EMAIL: '706533929@qq.com',
    PAYMENT_NOTE: 'Please add note: AnimeGen Pro + your WeChat ID',

    /**
     * 激活码列表（付款后手动发给用户）
     * 格式建议：ANIME-XXXX-XXXX，可配置多个
     * 注意：纯前端可被查看，请定期更换未使用的码
     */
    ACTIVATION_CODES: [
      'ANIME-VIP-2026',
      'ANIME-PRO-DEMO01'
    ]
  }
};
