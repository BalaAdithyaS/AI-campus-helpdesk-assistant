import pytest
from fastapi import HTTPException
from backend.app.api.evaluation import (
    get_evaluation_tests,
    run_single_evaluation_test,
    run_evaluation_suite,
    export_evaluation_csv
)

def test_get_evaluation_tests():
    tests = get_evaluation_tests()
    assert len(tests) >= 10
    first = tests[0]
    assert hasattr(first, "id")
    assert hasattr(first, "query")
    assert hasattr(first, "expected_status")

def test_run_single_evaluation_test():
    res = run_single_evaluation_test("eval_nav_001")
    assert res.test_id == "eval_nav_001"
    assert res.actual_status == "answered"
    assert res.passed is True

def test_run_single_evaluation_test_not_found():
    with pytest.raises(HTTPException) as exc_info:
        run_single_evaluation_test("nonexistent_eval_999")
    assert exc_info.value.status_code == 404

def test_run_complete_evaluation_suite():
    summary = run_evaluation_suite()
    assert summary.total_tests >= 30
    assert summary.tests_passed == summary.total_tests
    assert summary.pass_rate == 100.0
    assert summary.answerable_success_rate == 100.0
    assert summary.unsupported_rejection_rate == 100.0
    assert summary.citation_coverage == 100.0
    assert summary.paraphrase_consistency_rate == 100.0
    assert summary.top1_accuracy == 100.0

def test_export_evaluation_csv():
    response = export_evaluation_csv()
    assert response.status_code == 200
    assert response.media_type == "text/csv"
    content = response.body.decode("utf-8")
    assert "CampusIQ Hackathon Evaluation Summary Report" in content
    assert "eval_evt_001" in content
