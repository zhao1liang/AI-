收款码更新步骤
============

方式一（推荐，Vercel 100% 显示）：
1. 替换 assets/wechat-pay.png 和 assets/alipay.png
2. 在项目文件夹运行: node build-payment-qr.js
3. 提交 payment-qr.js 到 GitHub 并 Redeploy

方式二（仅本地）：
直接替换 assets/*.png 即可

重要：Vercel 从 GitHub 拉代码，必须提交 payment-qr.js 文件！
