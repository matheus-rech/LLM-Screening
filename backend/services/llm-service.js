import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

class LLMService {
  constructor() {
    // Initialize providers based on available API keys
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    if (process.env.GOOGLE_AI_API_KEY) {
      this.google = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }

    this.defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'openai';
  }

  async invokeLLM({ prompt, response_json_schema, provider = null, model = null }) {
    const selectedProvider = provider || this.defaultProvider;

    try {
      switch (selectedProvider) {
        case 'openai':
          return await this.invokeOpenAI(prompt, response_json_schema, model);
        case 'anthropic':
          return await this.invokeAnthropic(prompt, response_json_schema, model);
        case 'google':
          return await this.invokeGoogle(prompt, response_json_schema, model);
        default:
          throw new Error(`Unsupported LLM provider: ${selectedProvider}`);
      }
    } catch (error) {
      console.error(`Error invoking ${selectedProvider}:`, error);
      throw error;
    }
  }

  async invokeOpenAI(prompt, responseSchema, model = 'gpt-4-turbo-preview') {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant that provides structured JSON responses.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    // Add JSON schema instruction if provided
    if (responseSchema) {
      messages[0].content += `\n\nPlease respond with valid JSON that matches this schema: ${JSON.stringify(responseSchema)}`;
    }

    const completion = await this.openai.chat.completions.create({
      model,
      messages,
      response_format: responseSchema ? { type: 'json_object' } : undefined,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content;
    
    try {
      return JSON.parse(responseText);
    } catch {
      return { response: responseText };
    }
  }

  async invokeAnthropic(prompt, responseSchema, model = 'claude-3-sonnet-20240229') {
    if (!this.anthropic) {
      throw new Error('Anthropic API key not configured');
    }

    let systemPrompt = 'You are a helpful assistant that provides structured JSON responses.';
    if (responseSchema) {
      systemPrompt += `\n\nPlease respond with valid JSON that matches this schema: ${JSON.stringify(responseSchema)}`;
    }

    const message = await this.anthropic.messages.create({
      model,
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].text;
    
    try {
      return JSON.parse(responseText);
    } catch {
      return { response: responseText };
    }
  }

  async invokeGoogle(prompt, responseSchema, modelName = 'gemini-pro') {
    if (!this.google) {
      throw new Error('Google AI API key not configured');
    }

    const model = this.google.getGenerativeModel({ model: modelName });

    let fullPrompt = prompt;
    if (responseSchema) {
      fullPrompt = `${prompt}\n\nPlease respond with valid JSON that matches this schema: ${JSON.stringify(responseSchema)}`;
    }

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const responseText = response.text();
    
    try {
      return JSON.parse(responseText);
    } catch {
      return { response: responseText };
    }
  }

  // Method to validate JSON schema response
  validateResponse(response, schema) {
    if (!schema) return true;
    
    const requiredFields = schema.properties ? Object.keys(schema.properties) : [];
    const responseKeys = Object.keys(response);
    
    // Check if all required fields are present
    if (schema.required) {
      for (const field of schema.required) {
        if (!responseKeys.includes(field)) {
          console.warn(`Missing required field: ${field}`);
          return false;
        }
      }
    }
    
    return true;
  }
}

export default LLMService;