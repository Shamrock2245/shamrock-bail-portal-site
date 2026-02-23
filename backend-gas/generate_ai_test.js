const fs = require('fs');
const { execSync } = require('child_process');

// A quick GAS script to deploy and test the keys
const gasCode = `
function testAIConnections() {
  const props = PropertiesService.getScriptProperties();
  const openAiKey = props.getProperty('OPENAI_API_KEY');
  const grokKey = props.getProperty('GROK_API_KEY');
  
  let results = {
    openAiKeyExists: !!openAiKey,
    grokKeyExists: !!grokKey,
    openAiTest: 'Not Tested',
    grokTest: 'Not Tested'
  };

  // Test OpenAI
  if (openAiKey) {
    try {
      const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + openAiKey },
        contentType: 'application/json',
        payload: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{role: 'user', content: 'Say OK'}],
          max_tokens: 10
        }),
        muteHttpExceptions: true
      });
      const code = response.getResponseCode();
      results.openAiTest = code === 200 ? 'SUCCESS' : ('FAILED: ' + response.getContentText());
    } catch(e) {
      results.openAiTest = 'FAILED: ' + e.message;
    }
  }

  // Test Grok
  if (grokKey) {
    try {
      const response = UrlFetchApp.fetch('https://api.x.ai/v1/chat/completions', {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + grokKey },
        contentType: 'application/json',
        payload: JSON.stringify({
          model: 'grok-2-latest',
          messages: [{role: 'user', content: 'Say OK'}],
          max_tokens: 10
        }),
        muteHttpExceptions: true
      });
      const code = response.getResponseCode();
      results.grokTest = code === 200 ? 'SUCCESS' : ('FAILED: ' + response.getContentText());
    } catch(e) {
      results.grokTest = 'FAILED: ' + e.message;
    }
  }

  return results;
}
`;

fs.writeFileSync('AITest.js', gasCode);
console.log('Created AITest.js');
