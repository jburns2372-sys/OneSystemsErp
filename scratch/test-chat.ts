import fetch from 'node-fetch';

async function test() {
  console.log('Sending request...');
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'What is the active project cost?' }] })
  });

  console.log('Response status:', res.status);
  
  if (!res.body) {
    console.log('No body');
    return;
  }
  
  res.body.on('data', (chunk) => {
    console.log('Chunk:', chunk.toString());
  });

  res.body.on('end', () => {
    console.log('Stream ended');
  });
}

test();
