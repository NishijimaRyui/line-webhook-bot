// index.js

require('dotenv').config(); // ← .env を読み込む

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// 環境変数からキーを読み込む
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const CHANNEL_SECRET = process.env.CHANNEL_SECRET; // ※署名検証に使いたい場合

// OpenAI ChatGPT に問い合わせる関数
async function getChatGPTResponse(userMessage) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'あなたは優しいデートプラン提案AIです。相手の気分や状況に合わせて、ロマンチックまたは楽しいプランを提案してください。' },
          { role: 'user', content: userMessage },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    return '申し訳ありません、デートプランを生成中にエラーが発生しました。';
  }
}

// LINEのWebhookを受け取るエンドポイント
app.post('/callback', async (req, res) => {
  try {
    const events = req.body.events;
    if (!events || events.length === 0) return res.sendStatus(200);

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        console.log('ユーザーからのメッセージ:', userMessage);

        // ChatGPTからの応答を取得
        const aiReply = await getChatGPTResponse(userMessage);

        console.log('AIの応答:', aiReply);

        // LINEに返信
        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          {
            replyToken: replyToken,
            messages: [{ type: 'text', text: aiReply }],
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            },
          }
        );
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.sendStatus(500);
  }
});

// サーバー起動
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 サーバー起動中： http://localhost:${port}`);
});
