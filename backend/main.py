import os
import json
import io
import httpx
import asyncio
from typing import Annotated, Optional, List
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from pypdf import PdfReader
from openai import AsyncOpenAI
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit
from reportlab.lib import colors
import google.generativeai as genai

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

# Load environment variables explicitly from .env if available
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path, override=True)
else:
    load_dotenv()

app = FastAPI(title="CareerSync Pro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai_client = None
if os.getenv("OPENAI_API_KEY") and not os.getenv("OPENAI_API_KEY").startswith("your_"):
    try:
        openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        print("INFO: OpenAI engine initialized.")
    except Exception as e:
        print(f"ERROR: Failed to initialize OpenAI: {e}")

# Initialize Gemini client
gemini_model = None
if os.getenv("GEMINI_API_KEY"):
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        # Optimized model selection: Focus on Gemini 1.5/2.0 which support JSON Mode
        # Explicitly avoid legacy models like gemma-1b which don't support response_mime_type
        for m_short in ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp', 'gemini-pro']:
            for m_name in [m_short, f"models/{m_short}"]:
                try:
                    # Initialize
                    model = genai.GenerativeModel(m_name)
                    # Verify functional & JSON support
                    _ = model.generate_content("test", generation_config={"response_mime_type": "application/json"})
                    gemini_model = model
                    print(f"INFO: High-fidelity {m_name} engine active.")
                    break
                except Exception as e:
                    # Silently skip incompatible models
                    continue
            if gemini_model: break
        
        if not gemini_model:
            print("WARNING: All Gemini models failed validation. Entering Robust Mock Mode.")
    except Exception as e:
        print(f"ERROR: Gemini SDK Initialization failed: {e}")

# Add fallback mocks
def get_mock_resume_analysis():
    import random
    return {
        "ats_score": random.randint(65, 85),
        "keyword_gaps": ["React Server Components", "Redis", "System Design", "Cloud Infrastructure"],
        "enhancement_suggestions": [
            {
                "original": "Worked on backend tasks",
                "improved": "Architected distributed systems using Redis, reducing latency by 45%",
                "reason": "Adding metrics and specific technologies."
            }
        ],
        "message": "AI Backend Offline (Quota Exceeded or Key Invalid). Using fallback analysis.",
        "extracted_text": "Sample uploaded resume text... Worked on backend caching... I did a lot of things... Python and React..."
    }

def get_resume_highlights(text):
    import re
    text_l = text.lower()
    # Extract years
    years = "several"
    years_match = re.search(r'(\d+)\+?\s*year', text_l)
    if years_match:
        years = years_match.group(1)
    
    # Extract common tech
    tech_stack = []
    common_tech = ["python", "react", "next.js", "node", "typescript", "java", "aws", "docker", "kubernetes", "sql", "nosql", "fastapi", "django"]
    for t in common_tech:
        if t in text_l:
            tech_stack.append(t.title() if len(t) > 3 else t.upper())
    
    tech_str = ", ".join(tech_stack[:4]) if tech_stack else "modern tech stacks"
    return years, tech_str

def get_company_sector_mission(company):
    c = company.lower()
    if any(k in c for k in ["flipkart", "amazon", "ebay", "shop", "cart", "commerce", "market"]):
        return f"As a leader in the global e-commerce landscape, {company}'s focus on seamless logistics and hyper-scale marketplace dynamics is unparalleled. I am eager to contribute my technical vigor to your mission of redefining the digital consumer experience."
    if any(k in c for k in ["ai", "tech", "soft", "data", "intel", "neural", "logic"]):
        return f"Your commitment to pushing the boundaries of artificial intelligence and frontier software aligns perfectly with my own drive to architect the next generation of intelligent, self-evolving systems."
    if any(k in c for k in ["pay", "bank", "fin", "invest", "crypto", "wealth", "ledger"]):
        return f"I admire {company}'s approach to democratizing financial services and securing the future of global transactions. My experience in high-security, high-availability fintech systems makes me a natural strategic fit."
    if any(k in c for k in ["health", "med", "bio", "care", "cure", "life"]):
        return f"The way you are leveraging deep-tech to improve patient outcomes is truly inspiring. I want to apply my engineering expertise to solve the most critical challenges in the healthcare and life-sciences sector."
    
    return f"I have followed {company}'s exponential growth trajectory and am deeply impressed by your commitment to redefining industry standards and delivering elite-tier products to a global, high-demand audience."

def get_mock_cover_letter(role="Candidate", target="the role", resume_text=""):
    # Smarter Target/Company extraction
    target_clean = target
    company = "your company"
    
    if " at " in target:
        parts = target.split(" at ")
        target_clean = parts[0]
        company = parts[1]
    elif " @ " in target:
        parts = target.split(" @ ")
        target_clean = parts[0]
        company = parts[1]
    else:
        known_roles = ["engineer", "developer", "manager", "designer", "scientist", "tester", "qa"]
        if any(r in target.lower() for r in known_roles):
            target_clean = target
            company = "your company"
        else:
            company = target
            target_clean = "the open position"

    # Deep personalization from resume text
    years, tech = get_resume_highlights(resume_text)
    
    # High-Power Achievement Blocks
    role_lower = role.lower()
    mission_stmt = get_company_sector_mission(company)
    
    # Role-specific narratives
    if "qa" in role_lower or "tester" in role_lower or "sdet" in role_lower:
        role_narrative = {
            "intro": f"I am writing to express my strategic interest in the {target_clean} opening. As an elite QA Architect with over {years} years of expertise in {tech}, I specialize in making quality a non-negotiable standard.",
            "achievement": f"I have pioneered 'Shift-Left' zero-defect frameworks and advanced automation using {tech.split(',')[0] if ',' in tech else tech}, reducing regressions by 40% while maintaining 99.99% system uptime.",
            "value_prop": f"I am ready to transform {company}'s QA department into a source of engineering pride and a massive competitive advantage.",
            "signoff": "Quality and Excellence,"
        }
    elif "backend" in role_lower:
        role_narrative = {
            "intro": f"I am submitting my high-impact application for the {target_clean} role. With {years} years focused on {tech}, my career is defined by building the invisible, high-performance engines that power the world's most resilient platforms.",
            "achievement": f"I have orchestrated distributed architectures using {tech.split(',')[0] if ',' in tech else tech} handling billions of monthly requests, focusing on sub-millisecond latency and bulletproof data integrity.",
            "value_prop": f"I will bring a 'global-scale' mindset to {company}, ensuring your infrastructure is prepared for your next order of magnitude in growth.",
            "signoff": "In pursuit of the perfect architecture,"
        }
    elif "frontend" in role_lower or "ui" in role_lower or "ux" in role_lower:
        role_narrative = {
            "intro": f"I am thrilled to apply for the {target_clean} opportunity. With {years} years of elite expertise in {tech}, I bridge the gap between complex engineering and beautiful, high-retention user experiences.",
            "achievement": f"I have directed the creation of award-winning UIs using {tech.split(',')[0] if ',' in tech else tech} that scaled to millions of users, driving 30% increases in engagement.",
            "value_prop": f"I am eager to elevate {company}'s digital presence into a benchmark-setting experience that defines your industry's future.",
            "signoff": "Crafting the Future of the Web,"
        }
    else:
        role_narrative = {
            "intro": f"I am writing to express my interest in the {target_clean} position. With {years} years of experience across {tech}, I am a technical leader driven by measurable business outcomes.",
            "achievement": f"I have a track record of driving exponential technical growth and delivering robust solutions using {tech.split(',')[0] if ',' in tech else tech} to solve real-world problems at scale.",
            "value_prop": f"I am prepared to help {company} dominate its sector by applying my comprehensive technical leadership to your most ambitious goals.",
            "signoff": "Best regards,"
        }

    templates = [
        f"""
Dear Leadership at {company},

{role_narrative['intro']}

{mission_stmt} {role_narrative['achievement']}

{role_narrative['value_prop']} I look forward to the opportunity to discuss how I can contribute to {company}'s roadmap.

{role_narrative['signoff']}
[Your Name]
""",
        f"""
Subject: High-Impact Application: {target_clean} - [Your Name]

Dear {company} Team,

It is with significant enthusiasm that I apply for the {target_clean} position. Having monitored {company}'s trajectory, I am deeply impressed by your commitment to category-defining innovation.

{role_narrative['achievement']} {mission_stmt}

I specialize in high-stakes environments where performance is the only acceptable standard. {role_narrative['value_prop']}

Sincerely,
[Your Name]
""",
        f"""
Hello {company} Recruiters,

I'm reaching out regarding the {target_clean} opening. {role_narrative['intro']}

{role_narrative['achievement']}

{mission_stmt} {role_narrative['value_prop']} I'm eager to hear from you.

Thank you,
[Your Name]
"""
    ]
    
    import hashlib
    # More complex hash to ensure even more variety
    idx = int(hashlib.md5((role + target + str(len(role_narrative['intro']))).encode()).hexdigest(), 16) % len(templates)
    return templates[idx].strip()

def get_mock_skills(role, target):
    role_lower = role.lower()
    target_lower = target.lower()
    
    if "qa" in role_lower or "tester" in role_lower or "q&a" in role_lower:
        return [
            "Continuous Integration (CI/CD) for QA",
            "Performance & Load Testing (JMeter/K6)",
            "Security Testing & OWASP Standards",
            "Automated API Testing (Postman/RestAssured)",
            "Test Strategy & Risk Assessment"
        ]
    elif "backend" in role_lower:
        return [
            "Distributed Systems Architecture",
            "Advanced Microservices Design Patterns",
            "Database Scaling & Sharding",
            "Kubernetes & Container Orchestration",
            "High-Level System Design & Trade-offs"
        ]
    elif "frontend" in role_lower or "ui" in role_lower:
        return [
            "Advanced React Patterns & Performance",
            "Core Web Vitals Optimization",
            "Design Systems Architecture",
            "State Management at Scale (Zustand/Redux)",
            "Web Accessibility (A11y) Expert Level"
        ]
    elif "fullstack" in role_lower:
        return [
            "End-to-End System Ownership",
            "Cloud-Native Application Design",
            "Fullstack Performance Optimization",
            "DevOps for Fullstack Engineers",
            "Strategic Product Engineering"
        ]
    else:
        return [
            "Strategic Leadership & Mentorship",
            "Cross-functional Project Management",
            "Business Logic & Financial Modeling",
            "Advanced System Architecture",
            "Technical Strategy & OKR Planning"
        ]

def get_career_strategist_fallback(request):
    # Heuristic to find current role in text if possible
    inferred_role = "Software Engineer"
    text_lower = request.resume_text.lower()
    
    # Expanded role dictionary
    role_map = {
        "fullstack engineer": "Fullstack Engineer",
        "fullstackengineer": "Fullstack Engineer",
        "backend engineer": "Backend Engineer",
        "backendengineer": "Backend Engineer",
        "frontend engineer": "Frontend Engineer",
        "frontendengineer": "Frontend Engineer",
        "backend developer": "Backend Developer",
        "frontend developer": "Frontend Developer",
        "fullstack developer": "Fullstack Developer",
        "data scientist": "Data Scientist",
        "product manager": "Product Manager",
        "devops engineer": "DevOps Engineer",
        "software engineer": "Software Engineer",
        "mobile developer": "Mobile Developer",
        "ios developer": "iOS Developer",
        "android developer": "Android Developer",
        "qa engineer": "QA Engineer",
        "q&a": "QA Engineer",
        "qa": "QA Engineer",
        "quality assurance": "QA Engineer",
        "tester": "QA Engineer",
        "sdet": "SDET (Software Development Engineer in Test)"
    }
    
    for key, val in role_map.items():
        if key in text_lower:
            inferred_role = val
            break
            
    return {
        "cover_letter": "" if getattr(request, 'only_map', False) else get_mock_cover_letter(inferred_role, request.target_job, request.resume_text),
        "career_map": {
            "current": f"{inferred_role} (Inferred)",
            "next": request.target_job,
            "future": f"Lead {inferred_role.replace('Associate ', '')}" if "Director" not in request.target_job else f"VP of Engineering / CTO Path",
            "missing_skills": get_mock_skills(inferred_role, request.target_job)
        }
    }

class AnalyzeResumeResponse(BaseModel):
    ats_score: int
    keyword_gaps: list[str]
    enhancement_suggestions: list[dict]

class CoverLetterRequest(BaseModel):
    target_job: str
    resume_text: str
    only_map: bool = False

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
    target_job: str = Form(None),
    jd_file: UploadFile = File(None)
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

    # --- DOCUMENT VALIDATION ---
    text_lower = extracted_text.lower()
    # Resume-specific sections that are less common in plain JDs or other docs
    resume_sections = ["work experience", "professional experience", "education history", "academic background", "technical skills", "professional summary", "key achievements", "projects", "certifications", "volunteering"]
    
    # Check for presence of these sections
    section_matches = sum(1 for sec in resume_sections if sec in text_lower)
    
    # Also check for personal name/contact cues (basic heuristic)
    contact_cues = ["phone:", "email:", "linkedin.com/in/", "address:", "github.com/"]
    cue_matches = sum(1 for cue in contact_cues if cue in text_lower)

    # Reject if it doesn't look like a personal resume
    if section_matches < 2 and cue_matches < 1:
        raise HTTPException(
            status_code=422, 
            detail="Error: The uploaded document does not appear to be a valid resume. Please ensure your file includes standard sections like Experience, Education, or Skills."
        )

    # --- JD PDF PROCESSING ---
    jd_text = target_job if target_job else ""
    if jd_file:
        content = await jd_file.read()
        if jd_file.filename.lower().endswith('.pdf'):
            reader = PdfReader(io.BytesIO(content))
            for page in reader.pages:
                jd_text += page.extract_text() + "\n"
        else:
            jd_text += content.decode("utf-8")
    
    # Update target_job for prompt
    final_target_job = jd_text.strip()

    if not openai_client:
        # Fallback to mock if no API key
        await asyncio.sleep(1.5)
        mock_data = get_mock_resume_analysis()
        mock_data["extracted_text"] = extracted_text if extracted_text else mock_data["extracted_text"]
        return mock_data

    if final_target_job:
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
        user_prompt = f"Job Description:\n{final_target_job}\n\nResume Text:\n{extracted_text}"
    else:
        system_prompt = """
        You are an expert ATS (Applicant Tracking System) parser and senior technical recruiter. 
        Analyze the provided resume for high-level ATS best practices, independent of a specific job role.
        Focus on: readability, quantitative impact (metrics), structural integrity, and standard professional language.
        Output pure JSON exactly matching this structure:
        {
          "ats_score": <int 0-100>,
          "keyword_gaps": ["<industry standard skill 1>", "<industry standard skill 2>", "<industry standard skill 3>", "<industry standard skill 4>"],
          "enhancement_suggestions": [
            {
              "original": "<exact quote from resume>",
              "improved": "<highly ATS-optimized rewrite adding specific metrics, tools, or action verbs>",
              "reason": "<why this improves general ATS score and readability>"
            }
          ]
        }
        For 'keyword_gaps', suggest general industry-standard technical or soft skills that are missing or weakly represented in the resume to make it more competitive.
        Provide EXACTLY 4 distinct highly-impactful enhancement suggestions.
        """
        user_prompt = f"Evaluate this resume for general ATS effectiveness:\n\nResume Text:\n{extracted_text}"

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
        await asyncio.sleep(0.8)
        return get_career_strategist_fallback(request)

    if request.only_map:
        system_prompt = "You are an elite career strategist. Analyze the user's resume and their 'Target Role & Company'. Output strictly JSON formatting for a career path: {\"career_map\": {\"current\": \"<Extracted Current Role>\", \"next\": \"<Target Role>\", \"future\": \"<Logical Next Step After Target>\", \"missing_skills\": [\"<gap1>\", \"<gap2>\"]}}"
    else:
        system_prompt = """
        You are an elite executive career strategist. Write a highly tailored, compelling 3-paragraph cover letter that is COMPLETELY ATS-FRIENDLY.
        Guidelines:
        - Use standard headers and professional formatting.
        - Incorporate relevant keywords from the user's resume and inferred industry standards for the target role.
        - Research or infer the company's mission and weave it into the letter to demonstrate strong culture fit.
        - Ensure the tone is professional yet energetic.
        Output strictly JSON formatting: 
        {
          "cover_letter": "<the awesome ATS-optimized letter>", 
          "career_map": {
            "current": "<Extracted Current Role>", 
            "next": "<Target Role>", 
            "future": "<Logical Next Step After Target>", 
            "missing_skills": ["<gap1>", "<gap2>"]
          }
        }
        """
    
    user_prompt = f"Target Role & Company:\n{request.target_job}\n\nResume/Experience Text:\n{request.resume_text}"

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
        return get_career_strategist_fallback(request)

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
    resume_text: str = ""
    jd_text: str = ""
    company_name: str = ""
    web_context: str = ""

async def get_ai_completion(messages: list, response_format: str = "text"):
    """
    Robust completion helper with OpenAI -> Gemini fallback hierarchy.
    """
    # 1. Try OpenAI
    if openai_client:
        try:
            params = {
                "model": "gpt-4o",
                "messages": messages,
            }
            if response_format == "json_object":
                params["response_format"] = {"type": "json_object"}
            
            response = await openai_client.chat.completions.create(**params)
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI Failed (Falling back to Gemini): {e}")

    # 2. Try Gemini
    if gemini_model:
        try:
            # Reformat messages for Gemini
            prompt = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages])
            gen_config = {}
            if response_format == "json_object":
                gen_config["response_mime_type"] = "application/json"
            
            response = gemini_model.generate_content(prompt, generation_config=gen_config)
            return response.text
        except Exception as e:
            print(f"Gemini Failed: {e}")

    return None

@app.post("/api/interview/chat")
async def interview_chat(request: InterviewRequest):
    """
    Real-time AI Interview Bot with multi-model fallback and 'Repetition Guard'.
    """
    system_prompt = f"""
    You are an Elite AI Technical Interviewer at {request.company_name or 'a FAANG-level firm'}. 
    This is a structured **1-HOUR TECHNICAL INTERVIEW** for the {request.target_role} position.
    
    CONTEXT:
    - Candidate Resume: {request.resume_text[:3000]}
    - Job Description: {request.jd_text[:3000]}
    - Web Intelligence (GFG/Medium): {request.web_context}
    
    STRUCTURED PHASES (Calibrated for 60 Minutes):
    1. **Phase 1: Intro & Context (Minutes 0-10)**: Aligning background with the role.
    2. **Phase 2: Project Probing (Minutes 10-25)**: DEEP-DIVE into resume projects. Ask about implementation details, bottlenecks, and "Why X over Y?". Reject vague descriptions.
    3. **Phase 3: Deep Technical Skills (Minutes 25-45)**: Match candidate against JD requirements. Probe for depth in their claimed tech stack (e.g. Memory management in Python, React Server Component trade-offs).
    4. **Phase 4: DSA & Scalability (Minutes 45-55)**: Verbal algorithmic challenges or System Design (e.g., 'How would you scale this to 10M users?').
    5. **Phase 5: Closing (Minutes 55-60)**: Wrap up and final questions.

    CRITICAL INSTRUCTIONS:
    - EVALUATE BEFORE PROCEEDING: You MUST first judge if the candidate's last answer was professional, relevant, and technically sufficient. 
    - RELEVANCY GUARD: If the candidate is "blabbering" (nonsensical description), off-topic, or provides a technically incorrect explanation, YOU MUST CALL IT OUT. 
    - If they provide a "lazy" or "anonymous" answer that doesn't align with the question context: Penalize the `confidence_score` (down to 10-30%), set `hiring_signal` to 'No Hire' for this turn, and ask them to explain the specific technical concept again.
    - DO NOT REPEAT QUESTIONS. Review history carefully.
    - BE RUTHLESS. If an answer is shallow, explicitly call it out.
    - DYNAMIC FEEDBACK: Every turn's `analysis` must accurately reflect the quality of the LAST answer.
    
    Respond STRICTLY in JSON:
    {{
      "reply": "<Your spoken response/question>",
      "analysis": {{
        "filler_words": "<Low/Medium/High>",
        "speaking_pace": "<Fast/Optimal/Slow>",
        "confidence_score": <int 0-100>,
        "hiring_signal": "<Strong Hire/Hire/Leaning No Hire/No Hire>",
        "tip": "<Ruthless feedback. Explain if they were too brief or if they missed a technical nuance.>",
        "current_phase": "<Intro/Projects/Technical/DSA/Closing>"
      }}
    }}
    """

    messages = [{"role": "system", "content": system_prompt}]
    for msg in request.history[-10:]:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    
    messages.append({"role": "user", "content": request.message})

    content = await get_ai_completion(messages, response_format="json_object")
    
    if content:
        try:
            return json.loads(content)
        except Exception:
            pass

    ROLE_BANKS = {
        "fullstack": [
            "How do you optimize React performance for a dashboard with 10k+ live data points?",
            "Explain the trade-offs between Client-Side Rendering (CSR) and Server-Side Rendering (SSR) in Next.js 14.",
            "How would you design a scalable notification system that handles 1M pushes per minute?",
            "What is your approach to ensuring ACID properties in a distributed microservices environment?",
            "Can you walk me through your process for debugging a memory leak in a Node.js production server?"
        ],
        "default": [
            "Walk me through a complex architectural decision you made and its long-term impact.",
            "How do you handle technical debt while meeting tight product deadlines?",
            "Explain a time you had to optimize a slow database query in production. What was your methodology?",
            "Describe a situation where you had to lead a project with ambiguous requirements.",
            "How do you ensure data consistency across multiple independent services?"
        ]
    }
    
    role_key = "fullstack" if "fullstack" in request.target_role.lower() else "default"
    QUESTIONS = ROLE_BANKS.get(role_key, ROLE_BANKS["default"])
    
    # 1. Semantic Awareness (Cognitive Mocking V10)
    msg_lower = request.message.lower()
    is_lazy = len(request.message.strip()) < 15
    is_apologetic = any(x in msg_lower for x in ['sorry', 'don\'t know', 'i forget', 'no idea'])
    
    # 2. Blabbering Detection (Off-topic)
    tech_keywords = ['react', 'node', 'ssr', 'system', 'api', 'performance', 'database', 'sql', 'scaling', 'microservices', 'star', 'code', 'quality', 'bottleneck', 'optimization', 'frontend', 'backend', 'fullstack']
    has_tech_context = any(kw in msg_lower for kw in tech_keywords)
    is_blabbering = len(request.message.strip()) > 30 and not has_tech_context

    if is_lazy or is_apologetic or is_blabbering:
        signal = "No Hire" if is_blabbering else "Leaning No Hire"
        tip = "AI Strategic Guard: You are 'blabbering' or off-topic. In a real interview, this is a major red flag. Focus on the technical question asked." if is_blabbering else "AI Strategic Guard: You provided a very brief or apologetic answer. Try to elaborate even if you are unsure."
        return {
            "reply": "Wait, I notice you are going slightly off-topic. Let's refocus on the technical implementation. Can you provide a STAR-method explanation for the specific question I asked?",
            "analysis": {
                "filler_words": "High" if is_blabbering else "Low",
                "speaking_pace": "Sub-optimal" if is_blabbering else "Optimal",
                "confidence_score": 15 if is_blabbering else 40,
                "hiring_signal": signal,
                "tip": tip,
                "current_phase": "Technical Relevancy Warning"
            }
        }

    fallback_index = (len(request.history) // 2) % len(QUESTIONS)
    return {
        "reply": QUESTIONS[fallback_index],
        "analysis": {
            "filler_words": random.choice(["Low", "Medium"]),
            "speaking_pace": random.choice(["Optimal", "Good", "Balanced"]),
            "confidence_score": random.randint(70, 92),
            "hiring_signal": random.choice(["Hire", "Strong Hire", "Solid Candidate"]),
            "tip": f"AI Fallback Mode Active (v9). Please be specific about implementation details while your connection stabilizes.",
            "current_phase": "Technical Deep-Dive"
        }
    }

class FinalizeRequest(BaseModel):
    history: list[dict]
    resume_text: str = ""
    jd_text: str = ""
    target_role: str = ""
    company_name: str = ""
    web_context: str = ""

@app.post("/api/interview/analysis")
async def interview_analysis(request: FinalizeRequest):
    """
    Returns a JSON verdict and predicted questions without PDF generation.
    """
    data = {"verdict": {"decision": "Hire - Technical Assessment Pending", "justification": "AI was in fallback mode during this session. Based on your resume and JD, you showed strong potential, but deep technical probing was limited by API connectivity."}, "predictions": []}
    
    if openai_client or gemini_model:
        prediction_prompt = f"""
        Analyze the following interview transcript and candidate background.
        
        1. Provide a FINAL HIRING VERDICT: Strong Hire, Hire, Leaning No Hire, or No Hire.
        2. Provide a 3-4 sentence justification.
        3. Provide 15+ highly predicted technical and behavioral questions for {request.target_role}.
        
        RESUME: {request.resume_text[:2000]}
        TRANSCRIPT: {str(request.history)}
        
        Format as STRICT JSON:
        {{
          "verdict": {{ "decision": "...", "justification": "..." }},
          "predictions": [
            {{ "question": "...", "ideal_answer": "..." }}
          ]
        }}
        """
        try:
            raw_data = await get_ai_completion([{"role": "user", "content": prediction_prompt}], response_format="json_object")
            if raw_data:
                data = json.loads(raw_data)
        except Exception as e:
            print(f"Analysis AI Error: {e}")
            pass
    return data

@app.post("/api/interview/finalize")
async def interview_finalize(request: FinalizeRequest):
    """
    Generates the final PDF report.
    """
    # Use the analysis logic to get data for the PDF
    data = await interview_analysis(request)
    predictions = data.get("predictions", [])
    if not predictions:
        predictions = [{"question": "Can you elaborate on your most difficult project?", "ideal_answer": "STAR method answer..."}]

    try:
        # 2. Generate PDF using ReportLab
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Header
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(width/2, height - 50, "Interview Mastery: Performance Report")
        c.setFont("Helvetica", 10)
        c.drawCentredString(width/2, height - 70, f"Tailored for {request.target_role} | {request.company_name or 'Confidential'}")
        
        y = height - 100
        
        # Hiring Verdict
        verdict = data.get("verdict", {})
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(colors.black)
        c.drawString(50, y, "FINAL ASSESSMENT & HIRING VERDICT")
        y -= 25
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(colors.blue)
        c.drawString(50, y, f"Decision: {verdict.get('decision', 'N/A')}")
        y -= 15
        c.setFont("Helvetica", 10)
        c.setFillColor(colors.black)
        v_lines = simpleSplit(verdict.get("justification", ""), "Helvetica", 10, width - 100)
        for line in v_lines:
            c.drawString(60, y, line)
            y -= 12
        y -= 25

        # Predicted Q&A
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, y, "Master Question Bank & Ideal STAR Responses")
        y -= 30
        
        for i, item in enumerate(predictions):
            if y < 100:
                c.showPage()
                y = height - 50
            
            c.setFont("Helvetica-Bold", 11)
            c.drawString(50, y, f"Q{i+1}: {item.get('question', '...')}")
            y -= 15
            
            c.setFont("Helvetica", 10)
            ideal_answer = item.get('ideal_answer', '...')
            lines = simpleSplit(ideal_answer, "Helvetica", 10, width - 100)
            for line in lines:
                if y < 50:
                    c.showPage()
                    y = height - 50
                c.drawString(60, y, line)
                y -= 12
            y -= 15
            
        c.save()
        buffer.seek(0)
        
        headers = { 'Content-Disposition': f'attachment; filename="Interview_Guide_{request.company_name or "Pro"}.pdf"' }
        return StreamingResponse(buffer, media_type="application/pdf", headers=headers)

    except Exception as e:
        print(f"PDF Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interview/start")
async def start_interview(
    target_role: str = Form(...),
    company_name: str = Form(None),
    resume_pdf: UploadFile = File(...),
    jd_pdf: Optional[UploadFile] = File(None)
):
    """
    Initializes the interview by extracting PDF text and fetching real-world web context.
    """
    # 1. Extract Resume Text
    resume_content = await resume_pdf.read()
    resume_reader = PdfReader(io.BytesIO(resume_content))
    resume_text = "\n".join([page.extract_text() for page in resume_reader.pages if page.extract_text()])
    
    # 2. Extract JD Text (Optional)
    jd_text = ""
    if jd_pdf:
        jd_content = await jd_pdf.read()
        jd_reader = PdfReader(io.BytesIO(jd_content))
        jd_text = "\n".join([page.extract_text() for page in jd_reader.pages if page.extract_text()])
    
    # 3. Web Context Generation (Simulated Web Intelligence based on LLM knowledge + Search)
    web_context = ""
    research_prompt = f"""
    Provide a concise summary (3-4 sentences) of the most recently reported interview questions and technical focus areas for a {target_role} at {company_name or 'top tech companies'} based on GeeksforGeeks, Medium, and Glassdoor reports from 2024-2025.
    Focus on: Specific DS/Algo patterns, System Design focus, and frequently asked behavioral questions.
    """
    
    messages = [{"role": "system", "content": research_prompt}]
    web_context = await get_ai_completion(messages)
    
    if not web_context:
        web_context = f"Focus on core engineering principles and {target_role} specific technical challenges."

    return {
        "resume_text": resume_text,
        "jd_text": jd_text,
        "web_context": web_context,
        "role": target_role,
        "company": company_name
    }
