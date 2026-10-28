"""
CampusIQ - Regression Test Suite for Campus Facilities & Amenities Inquiries
Satisfies Section 8 of the prompt:
1. Inspects knowledge base records.
2. Runs queries through actual hybrid retrieval engine.
3. Prints top 5 candidate records and their component scores.
4. Shows lexical, character n-gram, synonym/keyword, and variant scores.
5. Identifies whether any candidate was rejected during evidence validation.
6. Explains reasons for rejection or acceptance.
7. Verifies supported answer and valid citation.
8. Tests all 6 required variants.
"""

import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.services.knowledge_base import kb_service
from backend.app.services.retrieval import retrieval_engine
from backend.app.services.evaluation import eval_service

REGRESSION_QUERIES = [
    "How can I find information about campus facilities?",
    "Where can I learn about the facilities available on campus?",
    "What facilities does the university provide?",
    "Can you tell me what amenities are available at the university?",
    "I want to know about campus amenities.",
    "What services and facilities are available for students?"
]

def run_regression_audit(verbose: bool = True):
    print("=" * 80)
    print("CAMPUS FACILITIES REGRESSION TEST AUDIT")
    print("=" * 80)

    # 1. Inspect Knowledge Base for relevant records
    kb_service.load()
    retrieval_engine.rebuild_index()
    all_entries = kb_service.get_all()
    facility_records = [
        e for e in all_entries 
        if any(term in (e.title + " " + e.content + " " + " ".join(e.keywords)).lower() 
               for term in ["facilities", "amenities", "sports complex", "library", "dining", "shuttle"])
    ]
    print(f"\n[KB INSPECTION] Total records indexed: {len(all_entries)}")
    print(f"[KB INSPECTION] Facility-related records identified: {len(facility_records)}")
    for rec in facility_records:
        print(f"  • [{rec.id}] {rec.title} ({rec.category})")

    results = []
    
    # 2-8. Execute for all 6 variants
    for idx, query in enumerate(REGRESSION_QUERIES, 1):
        print("\n" + "-" * 80)
        print(f"TEST {idx}/6: \"{query}\"")
        print("-" * 80)

        answer, status, citations, evidence_strength, needs_clar, clar_prompt, elapsed_ms, diag = (
            eval_service.execute_query(query)
        )

        print(f"Execution Time: {elapsed_ms}ms")
        print(f"Status: {status} | Evidence Strength: {evidence_strength}")
        print(f"Detected Intent: {diag.detected_intent if diag else 'None'}")
        print(f"Evidence Validation: {diag.evidence_validation_result if diag else 'None'}")

        print("\nTOP 5 CANDIDATE BREAKDOWN:")
        print(f" {'ID':<12} {'Combined':<10} {'Variant':<9} {'Lexical':<9} {'CharNGram':<11} {'Keyword':<9} {'Title'}")
        print("-" * 80)
        
        candidates = diag.top_candidates if diag else []
        for cand in candidates[:5]:
            print(f" {cand.id:<12} {cand.combined_score:<10.3f} {cand.variant_score:<9.3f} {cand.lexical_score:<9.3f} {cand.char_ngram_score:<11.3f} {cand.keyword_score:<9.3f} {cand.title[:30]}")

        # Verification of results
        passed = (
            status == "answered" and
            evidence_strength in ["moderate", "strong"] and
            len(citations) > 0 and
            citations[0].id == "kb_fac_001" and
            "campus facilities" in answer.lower()
        )

        if passed:
            print(f"\n>> RESULT: [PASS] Grounded in '{citations[0].title}' (Score: {citations[0].relevance_score:.3f})")
            print(f">> ANSWER EXCERPT:\n{answer[:220]}...")
        else:
            print(f"\n>> RESULT: [FAIL] Did not retrieve expected kb_fac_001 with strong evidence.")

        results.append({
            "query": query,
            "passed": passed,
            "status": status,
            "top_source": citations[0].id if citations else None,
            "score": citations[0].relevance_score if citations else 0.0
        })

    print("\n" + "=" * 80)
    print("REGRESSION AUDIT SUMMARY")
    print("=" * 80)
    all_passed = all(r["passed"] for r in results)
    for r in results:
        status_flag = "PASS" if r["passed"] else "FAIL"
        print(f"[{status_flag}] Query: \"{r['query']}\" -> Source: {r['top_source']} (Score: {r['score']:.3f})")

    print(f"\nFinal Result: {'ALL 6 REGRESSION TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    return all_passed

def test_campus_facilities_primary_query():
    """Pytest test case for the primary failed query."""
    answer, status, citations, strength, _, _, _, diag = eval_service.execute_query(
        "How can I find information about campus facilities?"
    )
    assert status == "answered"
    assert strength in ["moderate", "strong"]
    assert len(citations) >= 1
    assert citations[0].id == "kb_fac_001"
    assert "comprehensive campus facilities" in answer

def test_campus_facilities_all_variants():
    """Pytest test case verifying all 5 additional variants."""
    for q in REGRESSION_QUERIES[1:]:
        _, status, citations, strength, _, _, _, _ = eval_service.execute_query(q)
        assert status == "answered", f"Query failed status: {q}"
        assert strength in ["moderate", "strong"], f"Query failed strength: {q}"
        assert citations and citations[0].id == "kb_fac_001", f"Query matched wrong source: {q}"

if __name__ == "__main__":
    success = run_regression_audit()
    sys.exit(0 if success else 1)
