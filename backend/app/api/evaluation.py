import io
import csv
from typing import List
from fastapi import APIRouter, HTTPException, Response, status
from backend.app.models.schemas import (
    EvaluationTestCase,
    EvaluationResult,
    EvaluationSummary
)
from backend.app.services.evaluation import eval_service

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation Lab"])

@router.get("/tests", response_model=List[EvaluationTestCase])
def get_evaluation_tests():
    """Returns the predefined competition evaluation test cases."""
    return eval_service.get_all_tests()

@router.post("/run", response_model=EvaluationSummary)
def run_evaluation_suite():
    """Executes the complete test suite against the live retrieval & generation engine."""
    return eval_service.run_all()

@router.post("/run/{test_id}", response_model=EvaluationResult)
def run_single_evaluation_test(test_id: str):
    """Executes an individual test case against the live pipeline."""
    test = eval_service.get_test_by_id(test_id)
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evaluation test case '{test_id}' not found."
        )
    return eval_service.evaluate_test(test)

@router.get("/export-csv")
def export_evaluation_csv():
    """Executes the evaluation suite and exports the results as a presentation CSV report."""
    summary = eval_service.run_all()
    
    output = io.StringIO()
    writer = csv.writer(output)

    # Write summary metrics header
    writer.writerow(["=== CampusIQ Hackathon Evaluation Summary Report ==="])
    writer.writerow(["Timestamp", summary.timestamp])
    writer.writerow(["Total Tests", summary.total_tests])
    writer.writerow(["Passed", summary.tests_passed])
    writer.writerow(["Failed", summary.tests_failed])
    writer.writerow(["Overall Pass Rate (%)", f"{summary.pass_rate}%"])
    writer.writerow(["Answerable Query Success Rate (%)", f"{summary.answerable_success_rate}%"])
    writer.writerow(["Unsupported Query Rejection Rate (%)", f"{summary.unsupported_rejection_rate}%"])
    writer.writerow(["Citation Coverage (%)", f"{summary.citation_coverage}%"])
    writer.writerow(["Paraphrase Consistency Rate (%)", f"{summary.paraphrase_consistency_rate}%"])
    writer.writerow(["Top-1 Source Accuracy (%)", f"{summary.top1_accuracy}%"])
    writer.writerow([])

    # Write table header
    writer.writerow([
        "Test ID",
        "Category",
        "Paraphrase Group",
        "Query",
        "Expected Status",
        "Actual Status",
        "Passed",
        "Top-1 Correct",
        "Evidence Strength",
        "Actual Sources",
        "Execution Time (ms)",
        "Failure Reason"
    ])

    for r in summary.results:
        writer.writerow([
            r.test_id,
            r.category,
            r.paraphrase_group or "None",
            r.query,
            r.expected_status,
            r.actual_status,
            "PASS" if r.passed else "FAIL",
            "YES" if r.top1_correct else "N/A",
            r.evidence_strength,
            "; ".join(r.actual_source_ids),
            r.execution_time_ms,
            r.failure_reason or ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=campusiq_evaluation_report.csv"}
    )
