const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CHANNEL_ACCESS_TOKEN = 'fbYGPBsXxfdnImlP3HGktrsp7WTn3hxjlC1AdvXsgACT2ob+HeRx5LBw88kUuE8P2khTX3nNE6lqL1aOiX0Q5hMSeWLoMVf33vQrJIjNqFNF2rvAENLV0tA0TbPBHlrd65cHAKfJQjyVxhy3Xn15wgdB04t89/1O/w1cDnyilFU=';
const GOOGLE_AI_API_URL = 'https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0133795545/locations/us-central1/publishers/google/models/text-bison@001:predict?key=AIzaSyAkS9IhRonvUi7IV77UAyzrFm_amAxMZFk';

app.post('/callback', async (req, res) => {
  try {
    const events = req.body.events;
    if (!events) return res.sendStatus(200);

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        const requestBody = {
          instances: [
            {
              content: userMessage
            }
          ],
          parameters: {
            temperature: 0.5,
            maxOutputTokens: 256
          }
        };

        // Google AI Studio API呼び出し
        const aiResponse = await axios.post(GOOGLE_AI_API_URL, requestBody);

        // レスポンス全体をログに出す（デバッグ用）
        console.log('AI API response:', JSON.stringify(aiResponse.data, null, 2));

        // AIの返答テキストを柔軟に取得
        const aiText = aiResponse.data.predictions?.[0]?.content
          || aiResponse.data[0]?.content
          || 'すみません、うまく返答できませんでした。';

        console.log('ユーザーメッセージ:', userMessage);
        console.log('AI応答:', aiText);

        const replyMessage = {
          type: 'text',
          text: aiText
        };

        // LINE返信API呼び出し
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
    console.error('Error handling webhook event:', error.response ? error.response.data : error.message);
    res.sendStatus(500);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
