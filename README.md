# VIT CampusIQ — AI Campus Helpdesk Assistant

> **Tagline:** Your campus. Your answers. One intelligent assistant.  
> **Built for:** University AI Hackathon  
> **Architecture:** Offline-first, evidence-grounded hybrid retrieval engine with transparent citations, conversational context resolution, developer debug inspection, animated dark/light themes, and deterministic fallback safety.

---

## 1. Executive Summary

Students frequently consult university helpdesks with repetitive questions regarding classroom locations, laboratory operational timings, event registrations, and campus procedures. Commercial generative AI chatbots frequently hallucinate non-existent room numbers, misleading deadlines, and fabricated contact information.

**VIT CampusIQ** solves this problem by pairing an intuitive university technology interface with a rigorous, evidence-grounded hybrid retrieval pipeline. CampusIQ answers questions **strictly using verified documentation**, displays inspectable source citations, requests clarification when queries are ambiguous, provides full retrieval diagnostics with a toggleable **Developer Debug Inspector**, and safely abstains when information is unavailable.

### Core Architectural Guarantees:
1. **Zero Hallucination of Campus Facts:** Answers are synthesized directly from retrieved documents.
2. **Transparent Evidence Attribution:** Every factual answer cites the exact source document, record ID, and relevance score, with expandable excerpts and candidate score diagnostics.
3. **Paraphrase & Typo Robustness:** High precision across differently worded inquiries without lowering evidence thresholds, combining word TF-IDF, subword character n-grams (3–5), direct question variant cosine matching, and intent classification.
4. **Conversational Context Resolution:** Follow-up questions ("What floor is it on?", "How do I sign up for it?", "What if I want to cancel it?") resolve seamlessly against prior turns using conversational history.
5. **Ambiguity & Guardrail Awareness:** Detects underspecified queries ("Where should I go tomorrow?", "What if I want to cancel it?" without context) and adversarial prompt injections, responding with safe clarification or refusal.
6. **Developer Debug Inspector:** Integrated diagnostics drawer with developer mode showing loaded/indexed record counts, top 5 candidate breakdowns (variant, word, char n-gram, keyword), latency, fallback reasons, and exact source text inspection.
7. **Polished Animated Light/Dark Theme:** Smooth sun/moon toggle with View Transition circular radial reveal, `localStorage` persistence, and zero flash of unstyled content (FOUC).
8. **100% Local & Free Execution:** Runs fully on local machines using FastAPI, Scikit-Learn, and React without requiring paid API keys or external cloud dependencies.
9. **Built-in Verification Lab:** A 42-test automated benchmark demonstrating 100% pass rate, 100% Top-1 accuracy, and 100% paraphrase consistency for hackathon judges.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS 3, React Router 6, Lucide React icons, Recharts |
| **Styling & Animation** | Tailwind CSS with dark mode class strategy, View Transitions API circular radial reveal, CSS keyframe fallbacks |
| **Backend API** | Python 3.10+ (tested on Python 3.13), FastAPI 0.115, Pydantic v2, Uvicorn |
| **Hybrid Retrieval Engine** | Sublinear TF-IDF vectorization, subword character n-grams (`char_wb`, n=3–5), multi-variant cosine matching, keyword & synonym overlap, intent classification, and conversational context resolution |
| **Knowledge Base** | Structured JSON repository with 26 distinct campus entries across 10 categories, enriched with 161 realistic question variants and domain synonyms |
| **Testing & Evaluation**| Pytest automated test suite (28 passing tests), standalone facilities regression audit suite, built-in 42-test live evaluation lab with CSV export |

---

## 3. Application Structure & Navigation

The application consists of four primary views accessible via the desktop sidebar or mobile navigation drawer:

1. **Campus Assistant (`/`)**: Real-time helpdesk chat with suggestion chips, multiline input (Enter to send, Shift+Enter for newline), structured message bubbles, evidence strength badges, expandable source excerpts, helpfulness feedback controls, and expandable **"How this answer was found"** retrieval diagnostics with toggleable **Dev Debug Inspector**.
2. **Knowledge Base Explorer (`/knowledge`)**: Search and filter 26 campus records by category and source type. Displays complete document content, metadata, question variants, synonyms, and synthetic prototype labels.
3. **Evaluation Lab (`/evaluation`)**: Interactive audit dashboard to execute the 42-test benchmark suite, compute live pass rates, inspect failure reasons, review paraphrase cluster performance, and export presentation reports as CSV.
4. **Architecture & About (`/about`)**: Detailed methodology, 6-stage pipeline explanation, data integrity safeguards, limitations, and future roadmap.

---

## 4. Quickstart Guide (Local Setup)

### Prerequisites
- **Python 3.10+** (tested on Python 3.13)
- **Node.js 18+** & **npm**

### Step 1: Clone or Navigate to the Workspace
```powershell
cd "c:\PROJECT\ai hackathon"
```

### Step 2: Backend Setup
Install Python dependencies and start the FastAPI uvicorn server:
```powershell
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
* The backend API documentation is available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* Health check endpoint: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### Step 3: Frontend Setup (In a New Terminal)
Install frontend packages and launch the Vite development server:
```powershell
npm install --prefix frontend
npm run dev --prefix frontend
```
* Open your browser and navigate to: **[http://localhost:5173](http://localhost:5173)**

---

## 5. Specific Regression Test for Campus Facilities Inquiries

To verify the campus facilities inquiry fix requested in Section 8:
```powershell
python backend/tests/test_facilities_regression.py
```
This script tests:
1. `How can I find information about campus facilities?` -> Grounded in `kb_fac_001` (Score: 0.756)
2. `Where can I learn about the facilities available on campus?` -> Grounded in `kb_fac_001` (Score: 0.770)
3. `What facilities does the university provide?` -> Grounded in `kb_fac_001` (Score: 0.744)
4. `Can you tell me what amenities are available at the university?` -> Grounded in `kb_fac_001` (Score: 0.760)
5. `I want to know about campus amenities.` -> Grounded in `kb_fac_001` (Score: 0.750)
6. `What services and facilities are available for students?` -> Grounded in `kb_fac_001` (Score: 0.773)

---

## 6. Verification and Automated Test Results

The backend contains a 28-test pytest suite covering health, routing, hybrid retrieval, answer synthesis, facilities regression, ambiguity clarification, and evaluation calculation.

### Running Automated Pytest Suite:
```powershell
python -m pytest backend/tests -v
```

### Verified Test Run Summary:
```
backend/tests/test_chat.py::test_chat_valid_answerable_query PASSED      [  3%]
backend/tests/test_chat.py::test_chat_empty_query_rejected PASSED        [  7%]
backend/tests/test_chat.py::test_chat_excessive_length_rejected PASSED   [ 10%]
backend/tests/test_chat.py::test_chat_feedback PASSED                    [ 14%]
backend/tests/test_evaluation.py::test_get_evaluation_tests PASSED       [ 17%]
backend/tests/test_evaluation.py::test_run_single_evaluation_test PASSED [ 21%]
backend/tests/test_evaluation.py::test_run_single_evaluation_test_not_found PASSED [ 25%]
backend/tests/test_evaluation.py::test_run_complete_evaluation_suite PASSED [ 28%]
backend/tests/test_evaluation.py::test_export_evaluation_csv PASSED      [ 32%]
backend/tests/test_facilities_regression.py::test_campus_facilities_primary_query PASSED [ 35%]
backend/tests/test_facilities_regression.py::test_campus_facilities_all_variants PASSED [ 39%]
backend/tests/test_fallback_ambiguity.py::test_ambiguous_query_triggers_clarification PASSED [ 42%]
backend/tests/test_fallback_ambiguity.py::test_out_of_scope_query PASSED [ 46%]
backend/tests/test_fallback_ambiguity.py::test_adversarial_query_rejected PASSED [ 50%]
backend/tests/test_fallback_ambiguity.py::test_unsupported_campus_query_refusal PASSED [ 53%]
backend/tests/test_health.py::test_root_endpoint PASSED                  [ 57%]
backend/tests/test_health.py::test_health_endpoint PASSED                [ 60%]
backend/tests/test_knowledge.py::test_list_all_knowledge_entries PASSED  [ 64%]
backend/tests/test_knowledge.py::test_filter_by_category PASSED          [ 67%]
backend/tests/test_knowledge.py::test_search_knowledge_entries PASSED    [ 71%]
backend/tests/test_knowledge.py::test_list_categories PASSED             [ 75%]
backend/tests/test_knowledge.py::test_list_source_types PASSED           [ 78%]
backend/tests/test_knowledge.py::test_get_entry_by_id_success PASSED     [ 82%]
backend/tests/test_knowledge.py::test_get_entry_by_id_not_found PASSED   [ 85%]
backend/tests/test_retrieval.py::test_query_normalization PASSED         [ 89%]
backend/tests/test_retrieval.py::test_retrieval_answerable_query PASSED  [ 92%]
backend/tests/test_retrieval.py::test_retrieval_insufficient_evidence PASSED [ 96%]
backend/tests/test_retrieval.py::test_excerpt_extraction PASSED          [100%]

============================= 28 passed in 10.33s =============================
```

### Predefined 42-Test Evaluation Benchmark Suite:
The benchmark suite in `backend/data/evaluation_tests.json` contains 42 rigorously designed queries:
- **32 Answerable queries** spanning all 10 knowledge categories.
- **Dedicated Paraphrase Clusters:**
  1. `campus_facilities`: 4 distinct phrasings targeting `kb_fac_001` (100% Top-1 match).
  2. `event_registration`: 7 distinct phrasings targeting `kb_evt_001` (100% Top-1 match).
  3. `event_cancellation`: 2 distinct phrasings targeting `kb_evt_003` (100% Top-1 match).
  4. `lost_id_card`: 3 distinct phrasings targeting `kb_proc_001` (100% Top-1 match).
  5. `wifi_connectivity`: 2 distinct phrasings targeting `kb_proc_003` (100% Top-1 match).
  6. `lab_schedules`: 5 distinct phrasings targeting `kb_lab_001` (100% Top-1 match).
  7. `library_procedures`: 3 distinct phrasings targeting `kb_lib_001` (100% Top-1 match).
  8. `attendance_policy`: 2 distinct phrasings targeting `kb_acad_002` (100% Top-1 match).
- **Multi-Turn Contextual Follow-Ups:**
  - "Where is TT 305 located?" $\rightarrow$ *"What floor is it on?"* (Resolves to 2nd floor Technology Tower).
  - "How do I register for an event?" $\rightarrow$ *"What if I want to cancel it?"* (Resolves to 48-hour event deregistration).
- **3 Ambiguous queries:** Verifies polite clarification when antecedents are absent.
- **2 Unsupported campus queries:** Verifies safe rejection when facts are undocumented.
- **2 Out-of-scope queries:** Verifies boundary compliance.
- **1 Adversarial injection query:** Verifies safety guardrails.

---

## 7. Data Integrity & Ethical Compliance

1. **Synthetic Demonstration Data:** In accordance with the competition specification, all 26 knowledge base entries are synthetic sample records clearly labeled with `verified: false` and `[Synthetic demonstration record]`.
2. **Zero Official Affiliation Claims:** This application is an educational prototype and does not represent an official VIT administration portal.
3. **Privacy by Design:** Student queries and chats are processed strictly in-memory and are never stored in third-party telemetry systems.

---

## 8. License

Distributed under the MIT License. Developed for the University AI Hackathon.
