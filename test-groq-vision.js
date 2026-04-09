const fs = require('fs');
async function test() {
  const apiKey = process.env.GROQ_API_KEY;
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.2-90b-vision-preview',
      messages: [{ role: 'user', content: 'test' }]
    })
  });
  const data = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', data);
}
test();
