export type ThemeId = 'midnight' | 'paper' | 'ocean' | 'forest' | 'sunset' | 'mono' | 'violet' | 'rose' | 'amber' | 'slate' | 'coral' | 'aurora';
export type TemplateId = 'modern' | 'minimal' | 'creative' | 'terminal' | 'academic' | 'bento' | 'editorial' | 'brutalist' | 'glass' | 'neon' | 'timeline';
export type Device = 'desktop' | 'tablet' | 'mobile';

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  image?: string;
  github?: string;
  live?: string;
}
export interface Experience { id:string; company:string; role:string; period:string; description:string; }
export interface Education { id:string; institution:string; degree:string; period:string; }
export interface PortfolioData {
  personal:{name:string; title:string; location:string; email:string; phone:string; avatar?:string; about:string};
  social:{github:string; linkedin:string; website:string};
  skills:string[]; experience:Experience[]; projects:Project[]; education:Education[];
  activities:string[]; softSkills:string[]; languages:string[];
}
export interface PortfolioConfig {
  version: 2;
  template: TemplateId;
  theme: ThemeId;
  visibleSections: string[];
  data: PortfolioData;
  meta:{updatedAt:string; source:'demo'|'cv'|'manual'; cvFileName?:string};
}
