from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to CareerSync Pro API"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_analyze_resume():
    response = client.post(
        "/api/analyze-resume",
        data={"target_job": "Software Engineer", "resume_text": "Sample uploaded resume text... Worked on backend caching... I did a lot of things... Python and React..."}
    )
    assert response.status_code == 200
    data = response.json()
    assert "ats_score" in data
    assert "keyword_gaps" in data
    assert "enhancement_suggestions" in data

def test_github_verify():
    response = client.post(
        "/api/recruiter-verify",
        data={
            "github_handle": "testuser",
            "resume_text": "React Python Java"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["github_handle"] == "testuser"
    assert "verification_score" in data
    assert "skills_analysis" in data
    assert len(data["skills_analysis"]) > 0
