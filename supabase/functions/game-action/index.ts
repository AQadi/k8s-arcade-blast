import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simulate heavy CPU-intensive work
function simulateServerLoad() {
  console.log('Starting heavy server load simulation...');
  const startTime = Date.now();
  
  // Calculate primes up to 100,000 to create significant CPU load
  const primes: number[] = [];
  for (let num = 2; num < 100000; num++) {
    let isPrime = true;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(num);
  }
  
  // Do heavy string operations
  let result = '';
  for (let i = 0; i < 1000; i++) {
    result += `Processing heavy iteration ${i} with timestamp ${Date.now()} and prime count ${primes.length}. `;
    // Add some JSON operations
    const data = JSON.stringify({ iteration: i, primes: primes.slice(0, 10), time: Date.now() });
    JSON.parse(data);
  }
  
  // Do some array operations
  const doubled = primes.map(p => p * 2);
  const filtered = doubled.filter(p => p > 1000);
  const sum = filtered.reduce((acc, val) => acc + val, 0);
  
  const duration = Date.now() - startTime;
  console.log(`Heavy server load simulation completed in ${duration}ms. Found ${primes.length} primes, sum: ${sum}.`);
  
  return {
    success: true,
    duration,
    primesFound: primes.length,
    operationsSum: sum,
    timestamp: new Date().toISOString(),
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    console.log(`Received game action: ${action}`);
    
    const result = simulateServerLoad();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in game-action function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
