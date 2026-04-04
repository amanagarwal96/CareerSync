from fastapi.testclient import TestClient
from main import app
import json
import pytest

client = TestClient(app)

def test_resume_score_structure():
    """
    Test the /api/resume/score endpoint to ensure it returns the new 'Ethical' structure
    with the 'Actionable Impact', 'Context Clues', and 'Scope Verification' checks.
    """
    # Note: This test may fail if OpenAI/Gemini keys are missing, 
    # but the 'Heuristic' fallback should still return a valid structure.
    
    with open("test_resume.pdf", "wb") as f:
        f.write(b"%PDF-1.4\n1 0 obj <</Type /Page /Contents 2 0 R>> endobj 2 0 obj <</Length 15>> stream BT /F1 12 Tf (Sample Resume) Tj ET endstream endobj xref 0 3 0000000000 65535 f 0000000010 00000 n 0000000060 00000 n trailer <</Size 3 /Root 1 0 R>> startxref 120 %%EOF")

    with open("test_resume.pdf", "rb") as f:
        response = client.post(
            "/api/resume/score",
            files={"resume": ("test_resume.pdf", f, "application/pdf")},
            data={"jobDescription": "Software Engineer"}
        )
    
    print(f"DEBUG: Response Status: {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    
    # Core Structure Verification
    assert "ats_score" in data
    assert "score_breakdown" in data
    assert "detailed_checks" in data
    assert "rewritten_bullets" in data
    
    # Ethical Check Names Verification (Sync with UI/Backend)
    check_names = [c["name"] for c in data["detailed_checks"]]
    expected_ethical_checks = ["Actionable Impact", "Context Clues", "Scope Verification"]
    
    for check in expected_ethical_checks:
        assert any(check in name for name in check_names), f"Missing ethical check: {check}"
    
    # Anti-Hallucination Guardrail in fallback
    if "rewritten_bullets" in data:
        for bullet in data["rewritten_bullets"]:
            # Fallback typically doesn't invent deep metrics
            assert "30% improvement" not in bullet["improved"].lower(), "Hallucination detected in fallback!"

if __name__ == "__main__":
    test_resume_score_structure()
