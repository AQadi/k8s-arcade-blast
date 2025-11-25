import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simulate some CPU-intensive work
function simulateServerLoad() {
  console.log('Starting server load simulation...');
  const startTime = Date.now();
  
  // Calculate some primes to simulate CPU load
  const primes: number[] = [];
  for (let num = 2; num < 1000; num++) {
    let isPrime = true;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(num);
  }
  
  // Do some string operations
  let result = '';
  for (let i = 0; i < 100; i++) {
    result += `Processing iteration ${i} with timestamp ${Date.now()}. `;
  }
  
  const duration = Date.now() - startTime;
  console.log(`Server load simulation completed in ${duration}ms. Found ${primes.length} primes.`);
  
  return {
    success: true,
    duration,
    primesFound: primes.length,
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
