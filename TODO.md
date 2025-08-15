# Migration Plan: From Base44 to a Custom Backend

This document outlines the steps required to migrate the application from the proprietary Base44 backend to a custom, more open backend architecture.

## Phase 1: Backend Setup and Configuration

- [ ] **Decision:** Finalize the tech stack for the new backend.
    - [ ] Backend API: (e.g., Node.js with Express/Fastify)
    - [ ] Database: (e.g., Supabase/PostgreSQL)
    - [ ] Authentication: (e.g., Supabase Auth, Lucia Auth, Clerk)
    - [ ] File Storage: (e.g., Supabase Storage, AWS S3)
    - [ ] LLM Provider: (e.g., OpenAI, Anthropic, Google AI)
- [ ] **Setup:** Create the new backend project.
    - [ ] Initialize the Node.js application.
    - [ ] Set up the database schema.
    - [ ] Configure the authentication provider.
    - [ ] Configure the file storage service.
- [ ] **API Keys:** Securely store all the API keys and secrets for the new services.

## Phase 2: Backend API and Initial Integration

- [ ] **Backend API:** Build the initial version of the backend API.
    - [ ] Create an endpoint for LLM invocation (to replace `InvokeLLM`).
    - [ ] Implement the logic to call the chosen LLM provider.
- [ ] **Frontend API Client:** Create a new API client in the React application.
    - [ ] This client will be responsible for making authenticated requests to the new backend API.
- [ ] **Replace `InvokeLLM`:**
    - [ ] In `src/components/ai/AdvancedScreening.jsx`, replace the call to `InvokeLLM` with a call to the new backend API.
    - [ ] In `src/components/ai/ModelAnalyzer.jsx`, replace the calls to `InvokeLLM`.
    - [ ] In `src/components/ai/OptimizedScreening.jsx`, replace the call to `InvokeLLM`.

## Phase 3: Full Migration of Backend Calls

- [ ] **Backend API:** Extend the backend API to handle database operations.
    - [ ] Create endpoints for querying references (to replace `Reference.filter`).
    - [ ] Create endpoints for updating references (to replace `Reference.update`).
- [ ] **Replace `Reference.filter`:**
    - [ ] In `src/components/ai/ProcessingQueue.jsx`, replace the call to `Reference.filter`.
    - [ ] In `src/pages/Screening.jsx`, replace the call to `Reference.filter`.
    - [ ] In `src/pages/DualReview.jsx`, replace the calls to `Reference.filter`.
- [ ] **Replace `Reference.update`:**
    - [ ] In `src/components/ai/DualAIScreener.jsx`, replace the calls to `Reference.update`.
    - [ ] In `src/pages/Screening.jsx`, replace the calls to `Reference.update`.
    - [ ] In `src/pages/DualReview.jsx`, replace the calls to `Reference.update`.

## Phase 4: Data Migration and Finalization

- [ ] **Data Migration Plan:**
    - [ ] Define the strategy for exporting data from Base44.
    - [ ] Define the strategy for importing data into the new database.
- [ ] **Data Migration Scripts:**
    - [ ] Write and test scripts to perform the data migration.
- [ ] **Execute Data Migration:**
    - [ ] Perform the final data migration.
- [ ] **Cleanup:**
    - [ ] Remove the `@base44/sdk` dependency from `package.json`.
    - [ ] Remove the `src/api/base44Client.js` file.
    - [ ] Update the `GEMINI.md` and `README.md` files to reflect the new architecture.

