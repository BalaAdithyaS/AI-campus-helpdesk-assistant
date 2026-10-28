import json
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict

from backend.app.config import EVAL_TESTS_FILE_PATH
from backend.app.models.schemas import (
    EvaluationTestCase,
    EvaluationResult,
    EvaluationSummary,
    ChatRequest,
    ChatContextTurn,
    RetrievalDiagnostics
)
from backend.app.services.retrieval import retrieval_engine
from backend.app.services.answer_generation import synthesize_answer

logger = logging.getLogger(__name__)

class EvaluationService:
    def __init__(self, tests_file_path: Path = EVAL_TESTS_FILE_PATH):
        self.tests_file_path = tests_file_path
        self._tests: List[EvaluationTestCase] = []
        self.load_tests()

    def load_tests(self) -> List[EvaluationTestCase]:
        if not self.tests_file_path.exists():
            logger.error(f"Evaluation tests file not found: {self.tests_file_path}")
            self._tests = []
            return []

        try:
            with open(self.tests_file_path, "r", encoding="utf-8") as f:
                raw_tests = json.load(f)
            self._tests = [EvaluationTestCase(**t) for t in raw_tests]
            logger.info(f"Loaded {len(self._tests)} evaluation test cases.")
            return self._tests
        except Exception as e:
            logger.error(f"Error loading evaluation tests: {e}")
            self._tests = []
            return []

    def get_all_tests(self) -> List[EvaluationTestCase]:
        if not self._tests:
            self.load_tests()
        return self._tests

    def get_test_by_id(self, test_id: str) -> Optional[EvaluationTestCase]:
        for t in self.get_all_tests():
            if t.id == test_id:
                return t
        return None

    def execute_query(
        self,
        query: str,
        context: Optional[List[ChatContextTurn]] = None
    ):
        """Runs the query through the actual hybrid retrieval + generation pipeline."""
        start_time = time.perf_counter()

        # 1. Adversarial check
        if retrieval_engine.check_adversarial(query):
            citations = []
            evidence_strength = "none"
            status = "out_of_scope"
            needs_clarification = False
            clarification_prompt = None
            answer = (
                "I cannot fulfill requests to bypass guidelines, invent confidential information, "
                "or fabricate personal contact numbers. As CampusIQ, I only answer questions using "
                "documented university information."
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            diag = RetrievalDiagnostics(
                normalized_query=query,
                retrieval_strategy="Safety Guardrail Pre-Filter",
                evidence_validation_result="Adversarial prompt injection pattern blocked",
                final_decision="out_of_scope"
            )
            return answer, status, citations, evidence_strength, needs_clarification, clarification_prompt, elapsed_ms, diag

        # 2. Out of scope check
        if retrieval_engine.check_out_of_scope(query):
            citations = []
            evidence_strength = "none"
            status = "out_of_scope"
            needs_clarification = False
            clarification_prompt = None
            answer = synthesize_answer(query, status, citations, evidence_strength)
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            diag = RetrievalDiagnostics(
                normalized_query=query,
                retrieval_strategy="Scope Pre-Filter",
                evidence_validation_result="Query identified as external/general domain outside campus helpdesk",
                final_decision="out_of_scope"
            )
            return answer, status, citations, evidence_strength, needs_clarification, clarification_prompt, elapsed_ms, diag

        # 3. Ambiguity check (with context resolution check)
        clarification_prompt = retrieval_engine.check_ambiguity(query, context)
        if clarification_prompt:
            citations = []
            evidence_strength = "none"
            status = "clarification_needed"
            needs_clarification = True
            answer = synthesize_answer(query, status, citations, evidence_strength, clarification_prompt)
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            diag = RetrievalDiagnostics(
                normalized_query=query,
                retrieval_strategy="Ambiguity Detection Engine",
                evidence_validation_result="Underspecified query detected with no resolving conversation history",
                final_decision="clarification_needed"
            )
            return answer, status, citations, evidence_strength, needs_clarification, clarification_prompt, elapsed_ms, diag

        # 4. Hybrid retrieval
        citations, evidence_strength, top_score, diagnostics = retrieval_engine.retrieve(query, context)

        if not citations or evidence_strength == "none":
            status = "insufficient_evidence"
            needs_clarification = False
            clarification_prompt = None
            answer = synthesize_answer(query, status, citations, evidence_strength, context=context, diagnostics=diagnostics)
        else:
            status = "answered"
            needs_clarification = False
            clarification_prompt = None
            answer = synthesize_answer(query, status, citations, evidence_strength, context=context, diagnostics=diagnostics)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return answer, status, citations, evidence_strength, needs_clarification, clarification_prompt, elapsed_ms, diagnostics

    def evaluate_test(self, test: EvaluationTestCase) -> EvaluationResult:
        answer, actual_status, citations, evidence_strength, needs_clarification, _, elapsed_ms, _ = (
            self.execute_query(test.query)
        )
        actual_source_ids = [c.id for c in citations]
        top1_correct = False
        passed = False
        failure_reason = None

        if test.expected_status == "answered":
            if actual_status != "answered":
                failure_reason = f"Expected status 'answered', got '{actual_status}'."
            elif test.expected_source_id and test.expected_source_id not in actual_source_ids:
                failure_reason = f"Expected source '{test.expected_source_id}' not found in retrieved sources: {actual_source_ids}."
            elif evidence_strength not in ["moderate", "strong"]:
                failure_reason = f"Evidence strength was '{evidence_strength}', expected 'moderate' or 'strong'."
            else:
                passed = True
                if actual_source_ids and test.expected_source_id:
                    top1_correct = (actual_source_ids[0] == test.expected_source_id)

        elif test.expected_status == "clarification_needed":
            if actual_status == "clarification_needed" and needs_clarification:
                passed = True
            else:
                failure_reason = f"Expected 'clarification_needed', got '{actual_status}' (needs_clarification={needs_clarification})."

        elif test.expected_status in ["out_of_scope", "insufficient_evidence"]:
            if actual_status in ["out_of_scope", "insufficient_evidence"]:
                passed = True
            else:
                failure_reason = f"Expected safe rejection ('{test.expected_status}'), but system answered with sources {actual_source_ids}."

        return EvaluationResult(
            test_id=test.id,
            query=test.query,
            category=test.category,
            expected_status=test.expected_status,
            actual_status=actual_status,
            expected_source_id=test.expected_source_id,
            actual_source_ids=actual_source_ids,
            paraphrase_group=test.paraphrase_group,
            passed=passed,
            top1_correct=top1_correct,
            answer=answer,
            evidence_strength=evidence_strength,
            sources=citations,
            failure_reason=failure_reason,
            execution_time_ms=elapsed_ms
        )

    def run_all(self) -> EvaluationSummary:
        tests = self.get_all_tests()
        results: List[EvaluationResult] = []

        for test in tests:
            res = self.evaluate_test(test)
            results.append(res)

        total_tests = len(results)
        tests_passed = sum(1 for r in results if r.passed)
        tests_failed = total_tests - tests_passed
        pass_rate = round((tests_passed / total_tests * 100), 1) if total_tests > 0 else 0.0

        # Sub-metrics
        answerable_results = [r for r in results if r.expected_status == "answered"]
        total_answerable = len(answerable_results)
        answerable_passed = sum(1 for r in answerable_results if r.passed)
        answerable_success_rate = (
            round((answerable_passed / total_answerable * 100), 1) if total_answerable > 0 else 0.0
        )

        unsupported_results = [
            r for r in results if r.expected_status in ["out_of_scope", "insufficient_evidence", "clarification_needed"]
        ]
        total_unsupported = len(unsupported_results)
        unsupported_passed = sum(1 for r in unsupported_results if r.passed)
        unsupported_rejection_rate = (
            round((unsupported_passed / total_unsupported * 100), 1) if total_unsupported > 0 else 0.0
        )

        # Citation coverage for answered items
        answered_items = [r for r in results if r.actual_status == "answered"]
        items_with_sources = [r for r in answered_items if len(r.sources) > 0]
        citation_coverage = (
            round((len(items_with_sources) / len(answered_items) * 100), 1) if answered_items else 100.0
        )

        # Top-1 Accuracy on answerable questions
        top1_correct_count = sum(1 for r in answerable_results if r.top1_correct)
        top1_accuracy = (
            round((top1_correct_count / total_answerable * 100), 1) if total_answerable > 0 else 0.0
        )

        # Paraphrase consistency rate across groups
        group_map: Dict[str, List[EvaluationResult]] = {}
        for r in results:
            if r.paraphrase_group and r.expected_status == "answered":
                group_map.setdefault(r.paraphrase_group, []).append(r)

        consistent_groups = 0
        total_groups = len(group_map)
        for grp, grp_results in group_map.items():
            first_expected = grp_results[0].expected_source_id
            all_match = all(r.passed and r.actual_source_ids and r.actual_source_ids[0] == first_expected for r in grp_results)
            if all_match:
                consistent_groups += 1

        paraphrase_consistency_rate = (
            round((consistent_groups / total_groups * 100), 1) if total_groups > 0 else 100.0
        )

        return EvaluationSummary(
            total_tests=total_tests,
            tests_passed=tests_passed,
            tests_failed=tests_failed,
            pass_rate=pass_rate,
            answerable_success_rate=answerable_success_rate,
            unsupported_rejection_rate=unsupported_rejection_rate,
            citation_coverage=citation_coverage,
            paraphrase_consistency_rate=paraphrase_consistency_rate,
            top1_accuracy=top1_accuracy,
            results=results,
            timestamp=datetime.now().isoformat()
        )

eval_service = EvaluationService()
