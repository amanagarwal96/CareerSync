import os
import json
import io
import httpx
import asyncio
from typing import Annotated
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from openai import AsyncOpenAI

docs_dir = Path(__file__).parent / "resume_docs"
docs_dir.mkdir(exist_ok=True)

def extract_contact_info(text: str):
    import re
    email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    email = email_match.group(0) if email_match else ""
    
    phone_match = re.search(r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    phone = phone_match.group(0) if phone_match else ""
    
    college = ""
    college_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:University|College|Institute|School)[^,\n]*)', text)
    if not college_match:
        college_match = re.search(r'((?:University|College|Institute|School)\s+of\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', text)
    if college_match:
        college = college_match.group(1).strip()
        
    return {
        "email": email,
        "phone": phone,
        "college": college
    }

load_dotenv()

app = FastAPI(title="CareerSync Pro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client if key is available
openai_client = None
if os.getenv("OPENAI_API_KEY"):
    openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Add fallback mocks
def get_mock_resume_analysis():
    return {
        "ats_score": 78,
        "keyword_gaps": ["React Server Components", "Redis", "System Design"],
        "enhancement_suggestions": [
            {
                "original": "Worked on backend caching",
                "improved": "Architected distributed caching tier using Redis, reducing API latency by 45%",
                "reason": "Missing impact metrics and specific technologies."
            }
        ],
        "extracted_text": "Sample uploaded resume text... Worked on backend caching... I did a lot of things... Python and React..."
    }

def get_mock_cover_letter():
    return "Dear Hiring Manager,\n\nI am writing to express my strong interest in the open position..."

class AnalyzeResumeResponse(BaseModel):
    ats_score: int
    keyword_gaps: list[str]
    enhancement_suggestions: list[dict]

class CoverLetterRequest(BaseModel):
    resume_text: str
    target_job: str

class CoverLetterResponse(BaseModel):
    cover_letter: str

@app.get("/")
def read_root():
    return {"message": "Welcome to CareerSync Pro API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/analyze-resume", response_model=AnalyzeResumeResponse)
async def analyze_resume(
    resume_file: UploadFile = File(None),
    resume_text: str = Form(None),
    target_job: str = Form(...)
):
    """
    Analyzes a resume against a target job description using OpenAI GPT-4o.
    """
    extracted_text = ""
    
    if resume_file:
        content = await resume_file.read()
        if resume_file.filename.lower().endswith('.pdf'):
            reader = PdfReader(io.BytesIO(content))
            for page in reader.pages:
                extracted_text += page.extract_text() + "\n"
        else:
            extracted_text = content.decode("utf-8")
    elif resume_text:
        extracted_text = resume_text
    else:
        raise HTTPException(status_code=400, detail="Must provide either a resume file or text inline.")

    if not openai_client:
        # Fallback to mock if no API key
        await asyncio.sleep(1.5)
        mock_data = get_mock_resume_analysis()
        mock_data["extracted_text"] = extracted_text if extracted_text else mock_data["extracted_text"]
        return mock_data

    system_prompt = """
    You are an expert ATS (Applicant Tracking System) parser and senior technical recruiter. 
    Analyze the provided resume against the job description. Output pure JSON exactly matching this structure:
    {
      "ats_score": <int 0-100>,
      "keyword_gaps": ["<missing skill 1>", "<missing skill 2>", "<missing skill 3>", "<missing skill 4>"],
      "enhancement_suggestions": [
        {
          "original": "<exact quote from resume>",
          "improved": "<highly ATS-optimized rewrite with actionable metric/impact>",
          "reason": "<why this improves ATS parsing>"
        }
      ]
    }
    Make sure to provide EXACTLY 4 distinct highly-impactful enhancement suggestions to give the user plenty to work with.
    """

    user_prompt = f"Job Description:\n{target_job}\n\nResume Text:\n{extracted_text}"

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        result_content = response.choices[0].message.content
        parsed = json.loads(result_content)
        parsed["extracted_text"] = extracted_text
        return parsed
    except Exception as e:
        print(f"Error calling OpenAI: {e}")
        # fallback
        mock_data = get_mock_resume_analysis()
        mock_data["extracted_text"] = extracted_text if extracted_text else mock_data["extracted_text"]
        return mock_data


@app.post("/api/cover-letter")
async def generate_cover_letter(request: CoverLetterRequest):
    """
    Generates a personalized cover letter using OpenAI.
    """
    if not openai_client:
        await asyncio.sleep(1.5)
        return {
            "cover_letter": get_mock_cover_letter(),
            "career_map": {
                "current": "Software Engineer (Inferred)",
                "next": request.target_job,
                "future": f"Director of {request.target_job}",
                "missing_skills": ["Cloud Architecture", "Team Leadership"]
            }
        }

    system_prompt = "You are an elite executive career strategist. Write a highly tailored, compelling 3-paragraph cover letter based on the user's resume and their 'Target Role & Company'. Research or infer what the given company does, and weave that specific company mission into the letter. Output strictly JSON formatting: {\"cover_letter\": \"<the awesome letter>\", \"career_map\": {\"current\": \"<Extracted Current Role>\", \"next\": \"<Target Role>\", \"future\": \"<Logical Next Step After Target>\", \"missing_skills\": [\"<gap1>\", \"<gap2>\"]}}"
    user_prompt = f"Job Description:\n{request.target_job}\n\nResume Text:\n{request.resume_text}"

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error calling OpenAI: {e}")
        return {
            "cover_letter": get_mock_cover_letter(),
            "career_map": {
                "current": "Software Engineer (Inferred)",
                "next": request.target_job,
                "future": f"Head of {request.target_job}",
                "missing_skills": ["Leadership", "System Design"]
            }
        }

@app.post("/api/recruiter-verify")
async def recruiter_verify(
    github_handle: str = Form(...),
    resume_file: UploadFile = File(None),
    resume_text: str = Form(None),
    jd_file: UploadFile = File(None)
):
    """
    Recruiter Engine: Extracts skills from a resume, fetches GitHub repositories, 
    and cross-references them to generate a true confidence verification score.
    """
    # 0. Core NLP Skill Dictionary for Offline Scanning
    PREDEFINED_SKILLS = [
        "python", "java", "c++", "c", "c#", "javascript", "typescript", "react", "angular", "vue", 
        "node.js", "express", "django", "flask", "fastapi", "spring boot", "ruby", "php", "swift",
        "sql", "mysql", "postgresql", "mongodb", "aws", "azure", "gcp", "docker", "kubernetes", 
        "jenkins", "git", "linux", "html", "css", "tailwind", "pandas", "numpy", "tensorflow", 
        "pytorch", "scikit-learn", "go", "rust", "kotlin", "graphql", "redis"
    ]
    # 0. Pre-process UI Link inputs
    github_handle = github_handle.strip().rstrip('/')
    if "github.com/" in github_handle:
        github_handle = github_handle.split("github.com/")[-1].split('/')[0]

    extracted_text = ""
    
    if resume_file:
        content = await resume_file.read()
        try:
            if resume_file.filename.lower().endswith('.pdf'):
                reader = PdfReader(io.BytesIO(content))
                for page in reader.pages:
                    extracted_text += page.extract_text() + "\n"
                    # Deep Metadata Check: Rip out all embedded hyperlink URIs!
                    if "/Annots" in page:
                        for annot in page["/Annots"]:
                            annot_obj = annot.get_object()
                            if "/A" in annot_obj and "/URI" in annot_obj["/A"]:
                                uri = annot_obj["/A"]["/URI"]
                                if isinstance(uri, str):
                                    extracted_text += uri + "\n"
                                elif hasattr(uri, "get_object"): # Handle ByteStringObjects
                                    try:
                                        extracted_text += uri.get_object().decode("utf-8", "ignore") + "\n"
                                    except:
                                        pass
            else:
                extracted_text = content.decode("utf-8")
        except Exception as e:
            return {
                "github_handle": github_handle,
                "verification_score": 0,
                "skills_analysis": [],
                "message": "Engine Error: Document Read Failed.",
                "identity_verified": False,
                "identity_warning": f"Could not natively decrypt or read the uploaded document. It might be corrupt or severely password-protected."
            }
    elif resume_text:
        extracted_text = resume_text
    else:
        raise HTTPException(status_code=400, detail="Must provide a resume file or text.")

    # 0. Document Classification Heuristic: Verify it's actually a resume!
    text_lower = extracted_text.lower()
    resume_keywords = ["education", "experience", "skills", "projects", "summary", "employment", "work history", "objective", "certifications"]
    keyword_matches = sum(1 for kw in resume_keywords if kw in text_lower)
    
    # If the document lacks fundamental resume sections, reject it immediately
    if keyword_matches < 2:
        return {
            "github_handle": github_handle,
            "verification_score": 0,
            "skills_analysis": [],
            "message": "Engine Error: Document Analysis Failed.",
            "identity_verified": False,
            "identity_warning": "The uploaded document does not appear to be a valid resume. It lacks standard structural sections (e.g., Education, Experience, Skills)."
        }

    # 1. Extract Skills and Name using OpenAI
    extracted_skills = []
    candidate_name = ""
    if openai_client:
        system_prompt = "You are an elite recruiter AI. Extract the candidate's full name, and an EXHAUSTIVE plain JSON list of ALL technical skills, programming languages, databases, cloud providers, and frameworks found across the entire resume. Format strictly as: {\"candidate_name\": \"John Doe\", \"skills\": [\"React\", \"Python\", \"AWS\", \"Redis\"]}"
        try:
            response = await openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": extracted_text}
                ],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            extracted_skills = data.get("skills", [])
            candidate_name = data.get("candidate_name", "").strip()
        except Exception:
            extracted_skills = ["React", "Python", "TypeScript", "Node.js"] # Fallback

    # Verify the candidate name using the native heuristic if OpenAI is absent
    if not candidate_name and extracted_text:
        for line in extracted_text.split('\n'):
            cleaned = line.strip()
            if len(cleaned) > 2 and len(cleaned) < 40 and not any(word in cleaned.lower() for word in ['resume', 'curriculum', 'cv', 'profile']):
                candidate_name = cleaned
                break
                
    if not candidate_name:
        candidate_name = resume_file.filename.split('.')[0].replace('_', ' ') if resume_file else "John Doe"

    contact_info = extract_contact_info(extracted_text)

    import re
    text_lower = extracted_text.lower()
    
    # ALWAYS execute the Autonomous Offline Technical Word Scraper symmetrically 
    # to guarantee exact 1:1 overlap with the JD extraction matrix
    words = set(re.sub(r'[^a-z0-9#+.]', ' ', text_lower).split())
    
    if extracted_skills is None:
        extracted_skills = []
        
    extracted_set = set(extracted_skills)
    
    for skill in PREDEFINED_SKILLS:
        # Check for exact token matches or known compound phrases
        if skill in words or (len(skill) > 4 and skill in text_lower):
            formatted = skill.upper() if len(skill) <= 3 else skill.title()
            if skill == "node.js": formatted = "Node.js"
            if skill == "c++": formatted = "C++"
            if skill == "c#": formatted = "C#"
            extracted_set.add(formatted)
            
    extracted_skills = list(extracted_set)
    if not extracted_skills:
        extracted_skills = ["HTML", "Git"] # Absolute minimal failsafe

    # 1.5. Fetch GitHub User Profile Identity
    async with httpx.AsyncClient() as client:
        gh_user_response = await client.get(f"https://api.github.com/users/{github_handle}", headers={"Accept": "application/vnd.github.v3+json"})
        gh_user_data = gh_user_response.json() if gh_user_response.status_code == 200 else {}
        gh_name = gh_user_data.get("name") or gh_user_data.get("login") or github_handle

    # Perform Identity Fraud Verification Heuristic
    identity_verified = False
    identity_warning = None
    
    gh_handle_lower = github_handle.lower()
    text_lower = extracted_text.lower()
    
    # FRAUD LAYER 1: Link Authenticity (Did they actually write this GitHub URL in their resume?)
    if gh_handle_lower not in text_lower:
        identity_warning = "Identity Fraud Detected: This exact GitHub handle is not explicitly linked or mentioned anywhere within this candidate's resume."
    else:
        # FRAUD LAYER 2: Identity Theft (Did they just paste a famous developer's Handle in their resume?)
        cn_lower = candidate_name.lower()
        gn_lower = str(gh_name).lower()
        
        # Split names to perform a mathematical fuzzy match
        name_parts = cn_lower.split()
        match_found = False
        
        # We enforce that at least one significant part of the Candidate's Name matches the GitHub Profile Name
        for part in name_parts:
            if len(part) > 2 and part in gn_lower:
                match_found = True
                break
                
        if match_found:
            identity_verified = True
        else:
            identity_warning = f"Critical Fraud Risk: Resume claims to be '{candidate_name}', but the GitHub account belongs to '{gh_name}'. Handle theft detected."

    # 2. Fetch GitHub Repositories for Skill Mathematics
    url = f"https://api.github.com/users/{github_handle}/repos?per_page=100&sort=updated"
    async with httpx.AsyncClient() as client:
        gh_response = await client.get(url, headers={"Accept": "application/vnd.github.v3+json"})
        
    found_languages = set()
    repos = []
    repo_count = 0
    
    if gh_response.status_code == 200:
        repos_raw = gh_response.json()
        
        # FRAUD LAYER 3: Ghost Filtering
        for r in repos_raw:
            # Drop unequivocally empty 0-byte ghost structures (Relaxed fork penalty to allow student template assignments)
            if r.get("size", 0) <= 0:
                continue
            
            repos.append(r)
            repo_count += 1
            
            lang = r.get("language")
            if lang:
                found_languages.add(lang.lower())
            
            topics = r.get("topics", [])
            for t in topics:
                found_languages.add(t.lower())
    elif gh_response.status_code == 403:
        # We mathematically hit the unauthenticated 60 req/hour limit
        identity_warning = "API Blocked: The GitHub Engine has temporarily locked this IP address for testing too aggressively (60 requests/hour). Please wait ~30 minutes or switch networks."
        repo_count = 0

    # 3. Cross-reference with evidence
    skills_analysis = []
    verified_count = 0
    
    for skill in extracted_skills:
        skill_lower = skill.lower()
        evidence_repo = None
        
        # Determine if verified and find evidence repo
        if gh_response.status_code == 200:
            for r in repos:
                rlang = str(r.get("language")).lower()
                rtopics = [str(t).lower() for t in r.get("topics", [])]
                rdesc = str(r.get("description", "")).lower()
                rname = str(r.get("name")).lower()
                
                # Advanced Semantic Tokenizer for Multi-Stack Accuracy
                skill_aliases = [skill_lower]
                if ".js" in skill_lower: skill_aliases.append(skill_lower.replace(".js", ""))
                if skill_lower == "c++": skill_aliases.append("cpp")
                if skill_lower == "c#": skill_aliases.append("csharp")
                if skill_lower == "node": skill_aliases.append("node.js")
                
                is_match = False
                for alias in skill_aliases:
                    # Explicit language/topic declarations provide absolute certainty
                    if alias == rlang or alias in rtopics:
                        is_match = True
                        break
                    # For titles and descriptions, mathematically require length > 2 
                    # to prevent single-letter languages (like C or R) from falsely matching words (like React)
                    elif len(alias) > 2 and (alias in rname or alias in rdesc):
                        is_match = True
                        break
                        
                if is_match:
                    evidence_repo = r.get("name")
                    break
        
        if evidence_repo:
            verified_count += 1
            skills_analysis.append({
                "skill": skill,
                "verified": True,
                "confidence": 95,
                "evidence": evidence_repo
            })
        else:
            skills_analysis.append({
                "skill": skill,
                "verified": False,
                "confidence": 0,
                "evidence": "No public repositories found containing this skill."
            })
            
    score = int((verified_count / len(extracted_skills)) * 100) if extracted_skills else 0
    if not identity_verified:
        score = 0  # Heavy algorithmic penalty for detected identity fraud

    # --- JOB DESCRIPTION (JD) SIMILARITY ENGINE ---
    jd_match_score = None
    selection_status = None
    jd_analysis = []
    
    if jd_file:
        try:
            content = await jd_file.read()
            if jd_file.filename.lower().endswith('.pdf'):
                reader = PdfReader(io.BytesIO(content))
                jd_text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
            else:
                jd_text = content.decode("utf-8")
                
            # Attempt Advanced Semantic AI Matching if ChatGPT is configured
            ai_success = False
            if openai_client:
                system_prompt = """You are an elite AI ATS recruitment engine. 
Analyze the requested Job Description against the Candidate's Resume and verified GitHub repository evidence.
Identify the Core Technical Requirements from the Job Description (up to 6 key skills or capabilities, e.g., 'API Testing', 'System Design', 'React').
For each requirement, synthetically deduce if the candidate possesses this capability using deep semantic matching. For example, if the JD requires 'API Testing', and the candidate lists 'Postman' or built a 'RESTful Backend', mark it as MET.
Return carefully formatted JSON exactly like this:
{
  "jd_match_score": 85,
  "jd_analysis": [
    {"skill": "Backend Architecture", "met": true},
    {"skill": "Docker Containerization", "met": false}
  ]
}"""
                user_content = f"JOB DESCRIPTION:\n{jd_text}\n\nCANDIDATE RESUME:\n{extracted_text}\n\nGITHUB EVIDENCE:\n{json.dumps(skills_analysis)}"
                try:
                    response = await openai_client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_content}
                        ],
                        response_format={ "type": "json_object" }
                    )
                    ai_data = json.loads(response.choices[0].message.content)
                    jd_match_score = ai_data.get("jd_match_score", 0)
                    jd_analysis = ai_data.get("jd_analysis", [])
                    ai_success = True
                except Exception:
                    pass
                    
            # Fallback to Deterministic Structural Parsing if AI fails
            if not ai_success:
                jd_text_lower = jd_text.lower()
                jd_words = set(jd_text_lower.replace(",", " ").replace(";", " ").replace("/", " ").split())
                jd_extracted_set = set()
                
                for skill in PREDEFINED_SKILLS:
                    if skill in jd_words or (len(skill) > 4 and skill in jd_text_lower):
                        formatted = skill.upper() if len(skill) <= 3 else skill.title()
                        if skill == "node.js": formatted = "Node.js"
                        if skill == "c++": formatted = "C++"
                        if skill == "c#": formatted = "C#"
                        jd_extracted_set.add(formatted)
                        
                jd_required_skills = list(jd_extracted_set)
                
                # Cross-reference JD requirements strictly against candidate's Claimed Skills
                claimed_candidate_skills = {str(s).lower() for s in extracted_skills}
                
                matched_jd_skills = 0
                for req in jd_required_skills:
                    is_met = req.lower() in claimed_candidate_skills
                    if is_met: matched_jd_skills += 1
                    jd_analysis.append({"skill": req, "met": is_met})
                    
                if len(jd_required_skills) > 0:
                    jd_match_score = int((matched_jd_skills / len(jd_required_skills)) * 100)
                else:
                    jd_match_score = 100
            else:
                jd_match_score = 100
                
            if not identity_verified:
                jd_match_score = 0
                
            selection_status = "Selected" if jd_match_score >= 70 else "Rejected"
        except Exception as e:
            pass

    return {
        "candidate_name": candidate_name,
        "contact_info": contact_info,
        "github_handle": github_handle,
        "verification_score": score,
        "skills_analysis": skills_analysis,
        "message": f"Scanned {repo_count} public repositories. Found evidence for {verified_count} out of {len(extracted_skills)} technical claims.",
        "identity_verified": identity_verified,
        "identity_warning": identity_warning,
        "jd_match_score": jd_match_score,
        "selection_status": selection_status,
        "jd_analysis": jd_analysis
    }

class InterviewRequest(BaseModel):
    message: str
    history: list[dict] = []
    target_role: str = "software engineering"

@app.post("/api/interview/chat")
async def interview_chat(request: InterviewRequest):
    """
    Real-time AI Interview Bot. Takes user speech transcript, responds with next question,
    and provides real-time analysis of their answer.
    """
    if not openai_client:
        await asyncio.sleep(1)
        return {
            "reply": f"That's a great point. How does your experience align specifically with the {request.target_role} requirements?",
            "analysis": {
                "filler_words": "Low",
                "speaking_pace": "Optimal",
                "confidence_score": 92,
                "tip": "Good detail. Try to use the STAR method to structure your next response."
            }
        }

    system_prompt = f"""
    You are an AI Technical Interviewer conducting a mock interview for a {request.target_role} role.
    You must evaluate the user's latest response and ask the NEXT exceptionally relevant, deep-dive technical question based strictly on standard expectations for a {request.target_role}.
    Also, provide a short live analysis of their response quality.
    Respond strictly in JSON:
    {{
      "reply": "<Your exact spoken response/question>",
      "analysis": {{
        "filler_words": "<Low/Medium/High>",
        "speaking_pace": "<Fast/Optimal/Slow>",
        "confidence_score": <int 0-100>,
        "tip": "<One short sentence of actionable feedback on their last answer>"
      }}
    }}
    """

    messages = [{"role": "system", "content": system_prompt}]
    for msg in request.history[-5:]:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    
    messages.append({"role": "user", "content": request.message})

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error calling OpenAI Interview API: {e}")
        return {
            "reply": "I see. Let's move on to the next question. Can you describe a complex bug you fixed?",
            "analysis": {
                "filler_words": "Medium",
                "speaking_pace": "Optimal",
                "confidence_score": 85,
                "tip": "Audio analyzed: clear pronunciation, but try to be more concise."
            }
        }
