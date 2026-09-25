// A small, dependency-free lookup so recognised technologies get a coloured
// identity dot on their pill. Unrecognised entries just render as plain text —
// this is decoration, never a filter, so it never hides anything the person typed.
const TECH_COLORS: Record<string, string> = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3776ab', java: '#e76f00',
  'c++': '#00599c', 'c#': '#9b4f96', c: '#5c6bc0', go: '#00add8', golang: '#00add8',
  rust: '#dea584', php: '#787cb5', ruby: '#cc342d', swift: '#f05138', kotlin: '#7f52ff',
  dart: '#0175c2', scala: '#dc322f', elixir: '#6e4a7e', haskell: '#5e5086',
  react: '#61dafb', 'react.js': '#61dafb', 'next.js': '#ffffff', nextjs: '#ffffff',
  vue: '#42b883', 'vue.js': '#42b883', angular: '#dd0031', svelte: '#ff3e00',
  'node.js': '#5fa04e', nodejs: '#5fa04e', express: '#9d9d9d', 'express.js': '#9d9d9d',
  django: '#0c4b33', flask: '#9d9d9d', 'spring boot': '#6db33f', spring: '#6db33f',
  laravel: '#ff2d20', 'ruby on rails': '#cc0000', fastapi: '#009485', nestjs: '#e0234e',
  graphql: '#e10098', rest: '#5b8def', grpc: '#5b8def',
  html: '#e34f26', html5: '#e34f26', css: '#1572b6', css3: '#1572b6', sass: '#cc6699',
  tailwind: '#38bdf8', 'tailwind css': '#38bdf8', bootstrap: '#7952b3',
  postgresql: '#4169e1', mysql: '#4479a1', mongodb: '#47a248', redis: '#dc382d',
  sqlite: '#003b57', firebase: '#ffca28', supabase: '#3ecf8e', prisma: '#5a67d8',
  docker: '#2496ed', kubernetes: '#326ce5', aws: '#ff9900', azure: '#0078d4',
  gcp: '#4285f4', 'google cloud': '#4285f4', vercel: '#ffffff', netlify: '#00c7b7',
  terraform: '#7b42bc', git: '#f05032', github: '#ffffff', gitlab: '#fc6d26',
  figma: '#f24e1e', webpack: '#8dd6f9', vite: '#646cff', jest: '#c21325',
  cypress: '#17202c', tensorflow: '#ff6f00', pytorch: '#ee4c2c', pandas: '#150458',
  numpy: '#013243', 'scikit-learn': '#f7931e', flutter: '#02569b', unity: '#ffffff',
  linux: '#fcc624', bash: '#4eaa25', redux: '#764abc', jquery: '#0769ad',
};

export function techColor(name: string): string | undefined {
  return TECH_COLORS[name.trim().toLowerCase()];
}
