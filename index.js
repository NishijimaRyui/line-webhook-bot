const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// 🔒 自分のAPIキーをここに入れてください
const OPENAI_API_KEY = 'sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // ←ここを自分のものに！
const CHANNEL_ACCESS_TOKEN = '【あなたのLINEチャネルアクセストークン】';

// OpenAI ChatGPTに問い合わせる関数
async function getChatGPTResponse(userMessage) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMessage }],
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
    return '申し訳ありません、AIの応答でエラーが発生しました。';
  }
}

app.post('/callback', async (req, res) => {
  try {
    const events = req.body.events;
    if (!events || events.length === 0) return res.sendStatus(200);

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        // ChatGPTからの返答を取得
        const aiReply = await getChatGPTResponse(userMessage);

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
            }
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
