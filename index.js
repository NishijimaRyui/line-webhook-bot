const express = require('express');
const axios = require('axios');  // HTTPリクエスト用
const app = express();
app.use(express.json());

const CHANNEL_ACCESS_TOKEN = 'fbYGPBsXxfdnImlP3HGktrsp7WTn3hxjlC1AdvXsgACT2ob+HeRx5LBw88kUuE8P2khTX3nNE6lqL1aOiX0Q5hMSeWLoMVf33vQrJIjNqFNF2rvAENLV0tA0TbPBHlrd65cHAKfJQjyVxhy3Xn15wgdB04t89/1O/w1cDnyilFU=';

app.post('/callback', async (req, res) => {
  try {
    const events = req.body.events;
    if (!events) return res.sendStatus(200);

    // 1つずつイベントを処理
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        // ユーザーからのテキストメッセージを取得
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        // 返信メッセージの例
        const replyMessage = {
          type: 'text',
          text: `メッセージありがとうございます！あなたは「${userMessage}」と言いましたね。`
        };

        // LINEの返信APIを呼び出す
        await axios.post('https://api.line.me/v2/bot/message/reply', {
          replyToken: replyToken,
          messages: [replyMessage]
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
          }
        });
      }
    }

    res.sendStatus(200);

  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.sendStatus(500);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
