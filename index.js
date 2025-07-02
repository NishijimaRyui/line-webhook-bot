const express = require('express');
const axios = require('axios');  // HTTPリクエスト用
const app = express();
app.use(express.json());

const GOOGLE_AI_API_URL = 'https://us-central1-aiplatform.googleapis.com/v1/projects/Gemini API/locations/us-central1/publishers/google/models/text-bison@001:predict?key=AIzaSyAkS9IhRonvUi7IV77UAyzrFm_amAxMZFk';


// Google AI StudioのエンドポイントURL（PROJECT_ID, LOCATIONは自分の環境に書き換える）
const GOOGLE_AI_API_URL = '';

app.post('/callback', async (req, res) => {
  try {
    const events = req.body.events;
    if (!events) return res.sendStatus(200);

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        // Google AI Studioに送るリクエストボディ（例）
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

        // AIの返答テキストを取得（APIのレスポンス形式によるので要調整）
        const aiText = aiResponse.data.predictions && aiResponse.data.predictions[0].content
          ? aiResponse.data.predictions[0].content
          : 'すみません、うまく返答できませんでした。';

        // LINEの返信メッセージを作成
        const replyMessage = {
          type: 'text',
          text: aiText
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
    console.error('Error handling webhook event:', error.response ? error.response.data : error.message);
    res.sendStatus(500);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
