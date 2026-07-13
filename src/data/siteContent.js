export const navigationItems = [
  ['Início', 'inicio'],
  ['A ALM', 'a-alm'],
  ['Serviços', 'servicos'],
  ['Conteúdos', 'conteudos'],
  ['Plataformas', 'plataformas'],
  ['Contato', 'contato'],
];

export const platforms = [
  {
    name: 'AnestConsulta',
    accent: 'Consulta',
    subtitle: 'consulta pré-anestésica online',
    text: 'Avaliação completa, de onde você estiver, com praticidade, segurança e orientação especializada.',
    href: 'https://anestconsulta.com.br',
    kind: 'consulta',
  },
  {
    name: 'AnestVale',
    accent: 'Vale',
    subtitle: 'avaliação pré-anestésica no Vale do Aço',
    text: 'Atendimento próximo e humanizado para pacientes e instituições da região do Vale do Aço.',
    href: 'https://anestvale.com.br',
    kind: 'vale',
  },
];

export const fallbackArticles = [
  {
    audience: 'Para pacientes',
    time: '10 min de leitura',
    title: 'Avaliação pré-anestésica: por que ela é tão importante?',
    excerpt: 'Entenda como a avaliação contribui para uma cirurgia mais segura e tranquila.',
    image: 'consult',
    href: '/blog',
  },
  {
    audience: 'Para profissionais',
    time: '8 min de leitura',
    title: 'Estratificação de risco: personalizando a anestesia com segurança',
    excerpt: 'A importância de avaliar cada paciente de forma individual para decisões mais assertivas.',
    image: 'records',
    href: '/blog',
  },
  {
    audience: 'Para pacientes',
    time: '6 min de leitura',
    title: 'Ansiedade antes da cirurgia: é normal e tem solução',
    excerpt: 'Dicas práticas para lidar com a ansiedade e se preparar melhor para o procedimento.',
    image: 'calm',
    href: '/blog',
  },
];
