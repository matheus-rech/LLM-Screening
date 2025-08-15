# GEMINI.md

## Project Overview

This is a Vite+React application that serves as a front-end for the Base44 API. It allows users to import, screen, and analyze data, as well as manage screening criteria and export results. The application is structured with a clear separation of concerns, with components, pages, and API clients organized into their own directories.

The project uses a modern front-end stack, including:

*   **Vite:** For fast development and builds.
*   **React:** For building the user interface.
*   **React Router:** For client-side routing.
*   **Tailwind CSS:** For styling.
*   **Radix UI:** For accessible and unstyled UI components.
*   **Base44 SDK:** For interacting with the Base44 API.

## Building and Running

### Prerequisites

*   Node.js and npm

### Installation

```bash
npm install
```

### Running the development server

```bash
npm run dev
```

This will start a development server, typically at `http://localhost:5173`.

### Building for production

```bash
npm run build
```

This will create a `dist` directory with the production-ready assets.

### Linting

```bash
npm run lint
```

This will check the code for any linting errors.

## Development Conventions

*   **Component-Based Architecture:** The application is built using a component-based architecture, with components organized by feature in the `src/components` directory.
*   **Styling:** The project uses Tailwind CSS for styling, with custom styles defined in `src/App.css` and `src/index.css`.
*   **Routing:** Client-side routing is handled by `react-router-dom`, with routes defined in `src/pages/index.jsx`.
*   **API Interaction:** All communication with the Base44 API is handled by the `@base44/sdk`, with the client initialized in `src/api/base44Client.js`.
*   **Path Aliases:** The project uses the `@` alias for the `src` directory, which is configured in `vite.config.js`.
*   **UI Components:** The application uses a combination of custom UI components and components from Radix UI, which can be found in the `src/components/ui` directory.

## Dual AI Screening Process

The application uses a sophisticated screening process that leverages two independent AI reviewers to improve accuracy and reduce bias. Here's how it works:

1.  **Independent Reviews:** When a reference is screened, it is sent to two different AI reviewers. Each reviewer is given a slightly different context to encourage diverse perspectives.
2.  **Comparison:** The recommendations from the two reviewers are then compared.
3.  **Agreement:** If the reviewers agree on the recommendation (e.g., both say "include" or "exclude"), the reference is automatically updated with that status.
4.  **Conflict:** If the reviewers disagree, the reference is marked with a "conflict" status.
5.  **Conflict Resolution:** A human user or a third LLM evaluator can then review the conflicting recommendations and make a final decision. This is handled in the "Dual Review" section of the application.

This process is designed to be more robust than a single-AI screening process, and it provides a clear workflow for handling disagreements and ensuring data quality.

## AI and Prompt Engineering

The application leverages sophisticated prompt engineering techniques to elicit detailed, structured reasoning from Large Language Models (LLMs).

### Model Agnosticism

The application does not hardcode specific model names (e.g., "GPT-4"). Instead, it uses a generic `InvokeLLM` function provided by the `@base44/sdk`. This makes the application model-agnostic, allowing the underlying Base44 platform to handle the specifics of which LLM is used.

### Dynamic Prompt Engineering

The prompts sent to the LLMs are dynamically generated for each reference. They include:

*   **A Persona:** The LLM is assigned the persona of an expert systematic reviewer.
    > You are an expert systematic reviewer with 15+ years of experience in evidence-based medicine and meta-analysis.
*   **The PICO Framework:** The prompt includes the Population, Intervention, Comparator, and Outcome (PICO) criteria for the screening.
*   **The Reference Data:** The prompt includes the title, abstract, authors, and other metadata of the reference being screened.

### Structured JSON Output

To ensure that the LLM's response is consistent and machine-readable, the application requires the LLM to return a structured JSON object. This object includes the `recommendation`, `confidence`, and a detailed `reasoning` for the decision. This is how the application captures the rationale behind each screening decision.
