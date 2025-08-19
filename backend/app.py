from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
from openai import OpenAI
from supabase import create_client, Client

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=[os.getenv('FRONTEND_URL', 'http://localhost:5173')])

# Initialize LLM clients
use_gemini = bool(os.getenv('GEMINI_API_KEY'))
genai_client = None
openai_client = None

if use_gemini:
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    genai_client = genai.GenerativeModel('gemini-pro')
else:
    openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Initialize Supabase
supabase: Client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({'hello': 'world'})

@app.route('/api/llm/invoke', methods=['POST'])
def invoke_llm():
    data = request.get_json()
    prompt = data.get('prompt')
    response_schema = data.get('response_json_schema')
    provider = data.get('provider', 'google' if use_gemini else 'openai')
    model = data.get('model')

    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400

    try:
        if provider == 'google' and genai_client:
            # Use Gemini
            full_prompt = prompt
            if response_schema:
                full_prompt = f"{prompt}\n\nPlease respond with valid JSON that matches this schema: {json.dumps(response_schema)}"
            
            response = genai_client.generate_content(full_prompt)
            text = response.text
            
            try:
                result = json.loads(text)
            except json.JSONDecodeError:
                result = {'response': text}
                
        elif provider == 'openai' and openai_client:
            # Use OpenAI
            messages = [{'role': 'user', 'content': prompt}]
            
            completion = openai_client.chat.completions.create(
                model=model or 'gpt-4o',
                messages=messages,
                response_format={'type': 'json_object'} if response_schema else None,
                temperature=0.7,
                max_tokens=2000
            )
            
            result = json.loads(completion.choices[0].message.content)
            
        else:
            return jsonify({'error': f'Provider {provider} not available'}), 400

        return jsonify(result)

    except Exception as error:
        app.logger.error(f'LLM invocation error: {error}')
        return jsonify({'error': 'Failed to invoke LLM'}), 500

@app.route('/api/references/filter', methods=['POST'])
def filter_references():
    data = request.get_json()
    filters = data.get('filter', {})

    try:
        query = supabase.table('references').select('*')
        
        # Apply filters
        for key, value in filters.items():
            if value is not None:
                query = query.eq(key, value)
        
        response = query.execute()
        
        if response.error:
            raise Exception(response.error.message)
            
        return jsonify(response.data)

    except Exception as error:
        app.logger.error(f'Filter references error: {error}')
        return jsonify({'error': 'Failed to filter references'}), 500

@app.route('/api/references/update', methods=['POST'])
def update_reference():
    data = request.get_json()
    ref_id = data.get('id')
    updates = data.get('update')

    if not ref_id or not updates:
        return jsonify({'error': 'ID and update data required'}), 400

    try:
        response = supabase.table('references').update(updates).eq('id', ref_id).execute()
        
        if response.error:
            raise Exception(response.error.message)
            
        return jsonify(response.data[0] if response.data else {})

    except Exception as error:
        app.logger.error(f'Update reference error: {error}')
        return jsonify({'error': 'Failed to update reference'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
