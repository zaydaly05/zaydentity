import type { PortfolioConfig, PortfolioData, TemplateId, ThemeId } from '@/types/portfolio';

// Extended tech keyword dictionary for auto-detection across 80+ technologies
const KNOWN_TECH_KEYWORDS = [
  'React', 'React.js', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Express', 'Vue', 'Vue.js',
  'Angular', 'Svelte', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'Kotlin',
  'C++', 'C#', 'Go', 'Golang', 'Rust', 'PHP', 'Laravel', 'Ruby', 'Ruby on Rails', 'Swift', 'Flutter',
  'Dart', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Firebase', 'Supabase', 'Prisma',
  'GraphQL', 'REST', 'gRPC', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Google Cloud', 'Vercel',
  'Netlify', 'Terraform', 'Git', 'GitHub', 'GitLab', 'Figma', 'Webpack', 'Vite', 'Jest', 'Cypress',
  'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'Tailwind', 'Tailwind CSS', 'Bootstrap',
  'HTML', 'HTML5', 'CSS', 'CSS3', 'Sass', 'Linux', 'Bash', 'Redux', 'jQuery', 'OpenAI', 'LangChain',
  'LlamaIndex', 'n8n', 'Elasticsearch', 'Kafka', 'RabbitMQ', 'Microservices', 'CI/CD'
];

export interface AuditBreakdown {
  score: number;
  identityScore: number;
  experienceScore: number;
  projectsScore: number;
  skillsScore: number;
  seoScore: number;
  issues: string[];
  suggestions: string[];
  isReady: boolean;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchKeyword(text: string, kw: string): boolean {
  const escaped = escapeRegExp(kw);
  const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, 'i');
  return regex.test(text);
}

/**
 * Removes raw binary PDF metadata, tags, and object streams from extracted text.
 */
export function cleanPDFNoise(text: string): string {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => {
      if (!line) return false;
      if (/^%PDF-/i.test(line)) return false;
      if (/<<|>>|\/Type|\/Font|\/Filter|\/FlateDecode|\/Linearized|\/XRef|\/DecodeParms|\/Pages|\/Catalog|\/Length|\/Predictor|\/Columns|\/OpenAction|\/Outlines/i.test(line)) return false;
      if (/^\d+\s+\d+\s+obj/i.test(line) || /^endobj/i.test(line) || /^stream/i.test(line) || /^endstream/i.test(line)) return false;
      if (/^[<\[]\s*[a-f0-9\s]{16,}\s*[>\]]/i.test(line)) return false;
      return true;
    })
    .join('\n');
}

/**
 * Parses raw text or structured text into a PortfolioData object using intelligent rule-based auto-detection.
 */
export function parseCVText(rawText: string): PortfolioData {
  const text = cleanPDFNoise(rawText);
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // 1. Auto-detect Contact Info & Socials
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/);
  const githubMatch = text.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
  const linkedinMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  const websiteMatch = text.match(/https?:\/\/(?!github|linkedin)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*/i);

  const email = emailMatch ? emailMatch[0] : '';
  const phone = phoneMatch && phoneMatch[0].length >= 7 ? phoneMatch[0] : '';
  const github = githubMatch ? `https://${githubMatch[0]}` : '';
  const linkedin = linkedinMatch ? `https://${linkedinMatch[0]}` : '';
  const website = websiteMatch ? websiteMatch[0] : '';

  // 2. Auto-detect Name & Professional Title
  let name = '';
  let title = 'Software Engineer';
  let location = '';

  for (const line of lines) {
    const candidate = line.replace(/[^a-zA-Z\s.'-]/g, '').trim();
    if (candidate && candidate.length > 2 && candidate.length < 35 && !candidate.toLowerCase().includes('pdf') && !candidate.toLowerCase().includes('resume') && !candidate.toLowerCase().includes('curriculum')) {
      name = candidate;
      break;
    }
  }

  const titleKeywords = [
    'Developer', 'Engineer', 'Architect', 'Designer', 'Manager', 'Analyst', 'Consultant',
    'Specialist', 'Lead', 'Scientist', 'Full Stack', 'Frontend', 'Backend', 'DevOps', 'Data Scientist'
  ];
  for (let i = 0; i < Math.min(12, lines.length); i++) {
    const line = lines[i];
    if (titleKeywords.some(kw => line.toLowerCase().includes(kw.toLowerCase())) && line.length < 60) {
      if (!name || line.toLowerCase() !== name.toLowerCase()) {
        title = line;
        break;
      }
    }
  }

  const locationMatch = text.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*(?:[A-Z][a-z]+|[A-Z]{2}))\b/);
  if (locationMatch) {
    location = locationMatch[1];
  }

  // 3. Auto-detect Technical Skills
  const detectedSkills = new Set<string>();
  for (const kw of KNOWN_TECH_KEYWORDS) {
    if (matchKeyword(text, kw)) {
      detectedSkills.add(kw);
    }
  }

  // 4. Auto-detect Sections (Experience, Education, Projects)
  const experience: PortfolioData['experience'] = [];
  const education: PortfolioData['education'] = [];
  const projects: PortfolioData['projects'] = [];
  const activities: string[] = [];
  const softSkills: string[] = [];
  const languages: string[] = [];

  let currentSection = 'summary';
  let aboutText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    if (/^(experience|work experience|employment|career)/i.test(lower)) {
      currentSection = 'experience';
      continue;
    } else if (/^(education|academic|qualification)/i.test(lower)) {
      currentSection = 'education';
      continue;
    } else if (/^(projects|selected projects|personal projects)/i.test(lower)) {
      currentSection = 'projects';
      continue;
    } else if (/^(skills|technical skills|technologies)/i.test(lower)) {
      currentSection = 'skills';
      continue;
    } else if (/^(activities|achievements|certifications|awards)/i.test(lower)) {
      currentSection = 'activities';
      continue;
    } else if (/^(soft skills|competencies)/i.test(lower)) {
      currentSection = 'softSkills';
      continue;
    } else if (/^(languages|language proficiency)/i.test(lower)) {
      currentSection = 'languages';
      continue;
    } else if (/^(about|summary|profile|objective)/i.test(lower)) {
      currentSection = 'summary';
      continue;
    }

    if (currentSection === 'summary' && line.length > 20 && !line.includes('@')) {
      aboutText += (aboutText ? ' ' : '') + line;
    } else if (currentSection === 'experience') {
      if (line.includes('—') || line.includes('|') || line.includes(' at ') || /\b(20\d\d|19\d\d)\b/.test(line)) {
        const parts = line.split(/—|\|| at /i).map(s => s.trim());
        const role = parts[0] || 'Software Engineer';
        const company = parts[1] || 'Technology Company';
        const dateMatch = line.match(/\b(20\d\d|19\d\d)\b.*?\b(20\d\d|Present|Current)?\b/i);
        const period = dateMatch ? dateMatch[0] : '2023 — Present';
        
        let desc = '';
        while (i + 1 < lines.length && !/^(experience|education|projects|skills|about)/i.test(lines[i + 1]) && lines[i + 1].length > 10) {
          i++;
          desc += (desc ? ' ' : '') + lines[i];
        }

        experience.push({
          id: `exp-${Math.random().toString(36).substring(2, 9)}`,
          company,
          role,
          period,
          description: desc || 'Architected and implemented high-performance software systems.'
        });
      }
    } else if (currentSection === 'education') {
      if (line.length > 5) {
        const dateMatch = line.match(/\b(20\d\d|19\d\d)\b/g);
        const period = dateMatch ? dateMatch.join(' — ') : '2020 — 2024';
        education.push({
          id: `edu-${Math.random().toString(36).substring(2, 9)}`,
          institution: line.includes('University') || line.includes('College') || line.includes('Institute') ? line : 'University',
          degree: line.includes('Degree') || line.includes('BSc') || line.includes('Master') || line.includes('Bachelor') ? line : 'Bachelor of Science in Computer Science',
          period
        });
      }
    } else if (currentSection === 'projects') {
      if (line.length > 5 && !line.startsWith('http')) {
        const title = line.replace(/^[-•*]\s*/, '').trim();
        let desc = '';
        const projTech: string[] = [];

        while (i + 1 < lines.length && !lines[i + 1].includes('http') && lines[i + 1].length > 10 && !/^(experience|education|projects|skills)/i.test(lines[i + 1])) {
          i++;
          desc += (desc ? ' ' : '') + lines[i];
        }

        for (const kw of KNOWN_TECH_KEYWORDS) {
          if (matchKeyword(title + ' ' + desc, kw)) {
            projTech.push(kw);
          }
        }

        projects.push({
          id: `proj-${Math.random().toString(36).substring(2, 9)}`,
          title,
          description: desc || 'Built full-stack application with interactive UI and scalable architecture.',
          technologies: projTech.length ? projTech.slice(0, 5) : ['React', 'TypeScript', 'Node.js'],
          image: '',
          github: github || '',
          live: ''
        });
      }
    } else if (currentSection === 'activities' && line.length > 5) {
      activities.push(line.replace(/^[-•*]\s*/, ''));
    } else if (currentSection === 'softSkills' && line.length > 3) {
      softSkills.push(line.replace(/^[-•*]\s*/, ''));
    } else if (currentSection === 'languages' && line.length > 3) {
      languages.push(line.replace(/^[-•*]\s*/, ''));
    }
  }

  if (!name) name = 'Professional Developer';
  if (!aboutText) {
    aboutText = `Passionate ${title} with experience in building scalable digital products, modern web applications, and reliable backend services.`;
  }

  const skillsList = Array.from(detectedSkills);
  if (skillsList.length === 0) {
    skillsList.push('TypeScript', 'React', 'Next.js', 'Node.js', 'SQL', 'Git');
  }

  if (softSkills.length === 0) {
    softSkills.push('Problem Solving', 'Technical Communication', 'Team Leadership', 'Agile Architecture');
  }

  if (languages.length === 0) {
    languages.push('English — Professional');
  }

  return {
    personal: {
      name,
      title,
      location: location || 'Remote / Worldwide',
      email,
      phone,
      about: aboutText.slice(0, 500),
      avatar: ''
    },
    social: {
      github,
      linkedin,
      website
    },
    skills: skillsList.slice(0, 16),
    experience: experience.length ? experience.slice(0, 5) : [{
      id: 'e1',
      company: 'Tech Solutions Inc.',
      role: title,
      period: '2024 — Present',
      description: 'Delivered high-quality software solutions, collaborated with cross-functional teams, and optimized performance.'
    }],
    projects: projects.length ? projects.slice(0, 6) : [{
      id: 'p1',
      title: 'Full-Stack Web Application',
      description: 'Built a responsive web application featuring real-time data sync and modern UI.',
      technologies: skillsList.slice(0, 4),
      image: '',
      github: github || '',
      live: ''
    }],
    education: education.length ? education.slice(0, 3) : [{
      id: 'ed1',
      institution: 'State University',
      degree: 'B.S. in Computer Science',
      period: '2020 — 2024'
    }],
    activities: activities.slice(0, 4),
    softSkills: softSkills.slice(0, 6),
    languages: languages.slice(0, 4)
  };
}

/**
 * Auto-detects tech skills in projects and experience that are not yet listed in the portfolio skills array.
 */
export function detectMissingTechSkills(data: PortfolioData): string[] {
  const existingLower = new Set(data.skills.map(s => s.toLowerCase()));
  const missing = new Set<string>();

  const fullText = [
    ...data.experience.map(e => `${e.role} ${e.company} ${e.description}`),
    ...data.projects.map(p => `${p.title} ${p.description} ${p.technologies.join(' ')}`)
  ].join(' ');

  for (const kw of KNOWN_TECH_KEYWORDS) {
    if (!existingLower.has(kw.toLowerCase())) {
      if (matchKeyword(fullText, kw)) {
        missing.add(kw);
      }
    }
  }

  return Array.from(missing);
}

/**
 * Recommends the best Template & Theme pairing based on title and skills.
 */
export function recommendDesign(data: PortfolioData): { template: TemplateId; theme: ThemeId; reason: string } {
  const titleLower = data.personal.title.toLowerCase();
  const skillsLower = data.skills.map(s => s.toLowerCase());

  if (titleLower.includes('academic') || titleLower.includes('research') || titleLower.includes('phd') || titleLower.includes('student')) {
    return { template: 'academic', theme: 'paper', reason: 'Structured for research papers, credentials, and formal background.' };
  }
  if (titleLower.includes('design') || titleLower.includes('creative') || titleLower.includes('art') || titleLower.includes('ux') || titleLower.includes('ui')) {
    return { template: 'creative', theme: 'sunset', reason: 'Large typography and project-focused storytelling ideal for visual portfolios.' };
  }
  if (titleLower.includes('devops') || titleLower.includes('terminal') || titleLower.includes('linux') || skillsLower.includes('bash') || skillsLower.includes('docker')) {
    return { template: 'terminal', theme: 'midnight', reason: 'Monospace CLI aesthetic matching systems, backend, and DevOps engineering.' };
  }
  if (titleLower.includes('product') || titleLower.includes('bento') || titleLower.includes('full stack') || skillsLower.length > 8) {
    return { template: 'bento', theme: 'ocean', reason: 'Modern dashboard-inspired grid perfect for displaying diverse projects and skill sets.' };
  }
  if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('executive') || titleLower.includes('architect')) {
    return { template: 'editorial', theme: 'paper', reason: 'Refined magazine typography and high-contrast elegance suited for leadership.' };
  }

  return { template: 'modern', theme: 'midnight', reason: 'Bold developer hierarchy with dark canvas and vibrant accent points.' };
}

/**
 * Calculates a dynamic 0-100 completion score and audit breakdown for the portfolio.
 */
export function auditPortfolio(config: PortfolioConfig): AuditBreakdown {
  const d = config.data;
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  let identityScore = 0;
  let experienceScore = 0;
  let projectsScore = 0;
  let skillsScore = 0;
  let seoScore = 0;

  // Identity (max 20)
  if (d.personal.name && d.personal.name !== 'Your Name') identityScore += 5;
  else issues.push('Add your full name.');

  if (d.personal.title && d.personal.title !== 'Software Developer') identityScore += 5;
  else issues.push('Specify a clear professional title.');

  if (d.personal.email && d.personal.email !== 'you@example.com') identityScore += 5;
  else issues.push('Add a valid contact email address.');

  if (d.personal.about && d.personal.about.length > 40) identityScore += 5;
  else issues.push('Write a detailed About / Bio summary.');

  // Experience (max 20)
  if (d.experience.length >= 2) experienceScore += 20;
  else if (d.experience.length === 1) experienceScore += 12;
  else issues.push('Add at least 1 work experience entry.');

  if (d.education.length > 0) experienceScore = Math.min(20, experienceScore + 5);

  // Projects (max 20)
  if (d.projects.length >= 2) projectsScore += 12;
  else if (d.projects.length === 1) projectsScore += 6;
  else issues.push('Add at least 2 featured projects.');

  const hasProjectImages = d.projects.some(p => !!p.image);
  if (hasProjectImages) projectsScore += 5;
  else suggestions.push('Upload project preview screenshots for visual engagement.');

  if (d.personal.avatar) projectsScore += 3;
  else suggestions.push('Upload a profile photo / avatar.');

  // Skills (max 20)
  if (d.skills.length >= 6) skillsScore += 20;
  else if (d.skills.length >= 3) skillsScore += 12;
  else issues.push('Add at least 5 technical skills.');

  // SEO & Socials (max 20)
  if (d.social.github) seoScore += 7;
  if (d.social.linkedin) seoScore += 7;
  if (d.social.website) seoScore += 6;
  if (!d.social.github && !d.social.linkedin) {
    issues.push('Add GitHub and LinkedIn social profile links.');
  }

  const totalScore = identityScore + experienceScore + projectsScore + skillsScore + seoScore;

  return {
    score: Math.min(100, totalScore),
    identityScore,
    experienceScore,
    projectsScore,
    skillsScore,
    seoScore,
    issues,
    suggestions,
    isReady: totalScore >= 75
  };
}

/**
 * Tailors portfolio content for a target career role preset.
 */
export function tailorPortfolioForRole(roleTarget: string, portfolio: PortfolioConfig): { portfolio: PortfolioConfig; message: string } {
  const next = JSON.parse(JSON.stringify(portfolio)) as PortfolioConfig;
  const d = next.data;
  let message = `Tailored portfolio for ${roleTarget}.`;

  switch (roleTarget) {
    case 'fullstack':
      d.personal.title = 'Full-Stack Software Engineer';
      d.personal.about = 'Full-Stack Software Engineer with expertise in building scalable React/Next.js web applications, robust Node.js microservices, and high-throughput SQL databases.';
      d.skills = Array.from(new Set(['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'REST', 'GraphQL', ...d.skills]));
      next.template = 'bento';
      next.theme = 'ocean';
      break;
    case 'ai-ml':
      d.personal.title = 'AI & Machine Learning Engineer';
      d.personal.about = 'AI & Machine Learning Engineer specializing in deep learning models, LLM orchestration, PyTorch, and deploying production AI inference APIs.';
      d.skills = Array.from(new Set(['Python', 'PyTorch', 'TensorFlow', 'OpenAI', 'LangChain', 'FastAPI', 'Docker', 'SQL', ...d.skills]));
      next.template = 'modern';
      next.theme = 'aurora';
      break;
    case 'devops':
      d.personal.title = 'DevOps & Site Reliability Engineer';
      d.personal.about = 'DevOps Engineer dedicated to cloud architecture, Kubernetes container orchestration, CI/CD pipeline automation, and zero-downtime infrastructure.';
      d.skills = Array.from(new Set(['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Linux', 'Bash', 'CI/CD', 'Python', ...d.skills]));
      next.template = 'terminal';
      next.theme = 'midnight';
      break;
    case 'ui-ux':
      d.personal.title = 'UI/UX Product Designer & Developer';
      d.personal.about = 'Product Designer and Creative Technologist crafting modern design systems, glassmorphism UIs, interactive micro-animations, and accessible web experiences.';
      d.skills = Array.from(new Set(['Figma', 'React', 'Tailwind CSS', 'TypeScript', 'HTML5', 'CSS3', 'Design Systems', ...d.skills]));
      next.template = 'creative';
      next.theme = 'sunset';
      break;
    default:
      d.personal.about += ' Focused on engineering excellence, robust architecture, and user-centric design.';
      break;
  }

  next.meta.updatedAt = new Date().toISOString();
  return { portfolio: next, message };
}

/**
 * Executes built-in AI assistant actions on a PortfolioConfig.
 */
export function runLocalAIAction(action: string, prompt: string, portfolio: PortfolioConfig): { portfolio: PortfolioConfig; message: string } {
  const next = JSON.parse(JSON.stringify(portfolio)) as PortfolioConfig;
  const d = next.data;
  let message = 'AI optimization applied.';

  const promptLower = (prompt || action).toLowerCase();

  if (promptLower.includes('about') || promptLower.includes('bio') || promptLower.includes('concise')) {
    if (d.personal.about) {
      d.personal.about = `${d.personal.title} specializing in building scalable software systems, high-performance web applications, and intuitive user experiences. Focused on clean architecture and delivering measurable product impact.`;
    }
    message = 'Polished About section with crisp professional framing.';
  } else if (promptLower.includes('template') || promptLower.includes('design') || promptLower.includes('suggest')) {
    const rec = recommendDesign(d);
    next.template = rec.template;
    next.theme = rec.theme;
    message = `Applied recommended layout (${rec.template.toUpperCase()}) and theme (${rec.theme.toUpperCase()}). ${rec.reason}`;
  } else if (promptLower.includes('project') || promptLower.includes('description') || promptLower.includes('improve')) {
    d.projects.forEach(p => {
      if (!p.description.includes('Key features include')) {
        p.description = `${p.description} Engineered with a modular component architecture, robust API integration, and performance optimizations.`;
      }
    });
    message = 'Enhanced project descriptions with metric-oriented technical depth.';
  } else if (promptLower.includes('skill') || promptLower.includes('detect') || promptLower.includes('missing')) {
    const missing = detectMissingTechSkills(d);
    if (missing.length > 0) {
      d.skills = Array.from(new Set([...d.skills, ...missing]));
      message = `Auto-detected and added ${missing.length} tech skills: ${missing.join(', ')}.`;
    } else {
      message = 'Your technical skills list is already fully up to date with your project descriptions!';
    }
  } else {
    if (d.personal.about && !d.personal.about.includes('Focused on')) {
      d.personal.about += ' Focused on engineering excellence, robust architecture, and user-centric design.';
    }
    message = 'Reviewed portfolio content and optimized phrasing for maximum professional impact.';
  }

  next.meta.updatedAt = new Date().toISOString();
  return { portfolio: next, message };
}
