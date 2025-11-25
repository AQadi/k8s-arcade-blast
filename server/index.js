const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Simulate server load function (converted from Edge Function)
function simulateServerLoad() {
  const startTime = Date.now();
  
  // Heavy CPU operations
  const primes = [];
  for (let i = 2; i <= 100000; i++) {
    let isPrime = true;
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(i);
  }
  
  // String operations
  let result = '';
  for (let i = 0; i < 1000; i++) {
    result += Math.random().toString(36).substring(7);
  }
  
  // JSON operations
  const testData = { data: Array(1000).fill(0).map((_, i) => ({ id: i, value: Math.random() })) };
  const serialized = JSON.stringify(testData);
  const deserialized = JSON.parse(serialized);
  
  // Array operations
  const mapped = deserialized.data.map(item => item.value * 2);
  const filtered = mapped.filter(val => val > 1);
  const reduced = filtered.reduce((acc, val) => acc + val, 0);
  
  const duration = Date.now() - startTime;
  
  return {
    success: true,
    duration,
    computations: {
      primesFound: primes.length,
      stringLength: result.length,
      arrayOperations: {
        mapped: mapped.length,
        filtered: filtered.length,
        reduced: reduced
      }
    }
  };
}

// Game action endpoint
app.post('/api/game-action', (req, res) => {
  try {
    const { action } = req.body;
    console.log(`[${new Date().toISOString()}] Game action received:`, action);
    
    const result = simulateServerLoad();
    console.log(`[${new Date().toISOString()}] Server load simulation completed in ${result.duration}ms`);
    
    res.json(result);
  } catch (error) {
    console.error('[ERROR] Error processing game action:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
