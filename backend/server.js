require('dotenv').config();

const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Register CORS
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
});

// Declare a route
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

fastify.post('/api/llm/invoke', async (request, reply) => {
  const { prompt, response_json_schema } = request.body;

  if (!prompt) {
    reply.code(400).send({ error: 'Prompt is required' });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    reply.send(result);

  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ error: 'Failed to invoke LLM' });
  }
});

fastify.post('/api/references/filter', async (request, reply) => {
  const { filter } = request.body;

  try {
    const { data, error } = await supabase
      .from('references')
      .select('*')
      .match(filter);

    if (error) {
      throw error;
    }

    reply.send(data);
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ error: 'Failed to filter references' });
  }
});

fastify.post('/api/references/update', async (request, reply) => {
  const { id, update } = request.body;

  try {
    const { data, error } = await supabase
      .from('references')
      .update(update)
      .match({ id });

    if (error) {
      throw error;
    }

    reply.send(data);
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ error: 'Failed to update reference' });
  }
});


// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3001 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
