import { useState } from 'react';
import { ArrowRight, ClipboardCheck, HeartPulse, Menu, MessageCircle, X } from 'lucide-react';
import Logo from './components/Logo';
import { fallbackArticles, navigationItems, platforms } from './data/siteContent';
import { usePost } from './hooks/usePost';
import { usePosts } from './hooks/usePosts';

function ArrowLink({ children, href = '#', className = '' }) {
  return (
    <a className={`arrow-link ${className}`} href={href}>
      {children}
      <ArrowRight size={17} aria-hidden="true" />
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const homePrefix = window.location.pathname === '/' ? '#' : '/#';

  return (
    <header className="header">
      <div className="container header__inner">
        <Logo />
        <button
          className="nav-toggle"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'nav nav--open' : 'nav'} aria-label="Navegação principal">
          {navigationItems.map(([label, id]) => (
            <a key={id} href={`${homePrefix}${id}`} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <a className="button button--nav" href={`${homePrefix}plataformas`} onClick={() => setOpen(false)}>
            Acessar plataformas <ArrowRight size={16} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}

function PulseLine() {
  return (
    <svg className="pulse-line" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 34 C80 34 52 72 130 72 S176 38 234 52 S366 60 430 58 S502 10 560 40 S704 64 780 60 S840 16 902 36 S1015 64 1200 34" />
      <circle cx="430" cy="58" r="4" />
    </svg>
  );
}

function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero__copy">
        <h1>Segurança e cuidado em cada etapa da anestesia.</h1>
        <p>Anestesiologia, avaliação pré-anestésica e soluções digitais que aproximam pacientes, médicos e instituições.</p>
        <div className="actions">
          <a className="button" href="#a-alm">
            Conheça a ALM <ArrowRight size={17} aria-hidden="true" />
          </a>
          <a className="button button--outline" href="#plataformas">
            Fazer avaliação pré-anestésica <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="hero__image" role="img" aria-label="Anestesiologista em ambiente cirúrgico" />
      <PulseLine />
    </section>
  );
}

function ServicesSection() {
  return (
    <section className="section services" id="servicos">
      <div className="container">
        <h2>Cuidado que começa antes da cirurgia</h2>
        <div className="service-list">
          <article>
            <ClipboardCheck />
            <h3>Avaliação<br />pré-anestésica</h3>
            <p>Analisamos seu histórico de saúde para planejar a anestesia com segurança e personalização.</p>
          </article>
          <article>
            <HeartPulse />
            <h3>Anestesiologia</h3>
            <p>Atuação especializada em diferentes contextos cirúrgicos, com foco em segurança e cuidado contínuo.</p>
          </article>
          <article>
            <MessageCircle />
            <h3>Orientação<br />ao paciente</h3>
            <p>Informação clara e acolhedora para que você se sinta preparado e tranquilo em cada etapa.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

function PlatformsSection() {
  return (
    <section className="section platforms" id="plataformas">
      <div className="container">
        <h2>Tecnologia a serviço do cuidado</h2>
        <div className="platform-grid">
          {platforms.map((platform) => (
            <article className={`platform platform--${platform.kind}`} key={platform.name}>
              <div className="platform__content">
                <div className="product-logo">
                  <span className="product-logo__mark">A</span>
                  <strong>
                    {platform.name.replace(platform.accent, '')}
                    <em>{platform.accent}</em>
                  </strong>
                </div>
                <div className="platform__subtitle">{platform.subtitle}</div>
                <p>{platform.text}</p>
                <ArrowLink href={platform.href}>Acessar {platform.name}</ArrowLink>
              </div>
              <div className="platform__visual" aria-hidden="true">
                <span>{platform.kind === 'consulta' ? 'Atendimento online' : 'Vale do Aço'}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="about" id="a-alm">
      <div className="about__copy">
        <h2>Experiência médica<br />com visão de futuro</h2>
        <p>A ALM Anestesia é uma empresa brasileira de anestesiologia que atua com excelência clínica e inovação.</p>
        <p>Somos a empresa-mãe das plataformas <strong>AnestConsulta</strong> e <strong>AnestVale</strong>, desenvolvidas para ampliar o acesso à avaliação pré-anestésica qualificada e integrar pessoas, médicos e instituições em torno de um cuidado seguro e eficiente.</p>
        <p>Unimos experiência médica, tecnologia e compromisso humano para transformar a jornada do paciente.</p>
      </div>
      <div className="about__visual">
        <Logo variant="stacked" />
        <span>ANESTESIA • TECNOLOGIA • CUIDADO</span>
      </div>
      <PulseLine />
    </section>
  );
}

function ArticleCard({ article }) {
  const imageStyle = article.imageUrl ? { backgroundImage: `url(${article.imageUrl})` } : undefined;
  const imageClassName = article.imageUrl
    ? 'article__image article__image--custom'
    : `article__image article__image--${article.image}`;

  return (
    <article className="article">
      <div className={imageClassName} style={imageStyle} />
      <div className="article__meta">
        <span>{article.audience}</span>
        <span>•</span>
        <span>{article.time}</span>
      </div>
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
      <ArrowLink href={article.href}>Ler artigo</ArrowLink>
    </article>
  );
}

function ContentSection() {
  const { articles } = usePosts(fallbackArticles, 6);

  return (
    <section className="section content" id="conteudos">
      <div className="container">
        <div className="section-heading">
          <h2>Informação segura para<br />pacientes e profissionais</h2>
          <ArrowLink href="/blog">Ver todos os conteúdos</ArrowLink>
        </div>
        <div className="article-grid">
          {articles.map((article) => (
            <ArticleCard article={article} key={article.id || article.title} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogIndexPage() {
  const { articles, status } = usePosts(fallbackArticles);

  return (
    <main className="blog-page">
      <section className="blog-hero">
        <div className="container">
          <ArrowLink href="/#conteudos">Voltar ao início</ArrowLink>
          <h1>Conteúdos ALM</h1>
          <p>Informação sobre anestesiologia, avaliação pré-anestésica e segurança cirúrgica para pacientes e profissionais.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {status === 'loading' ? <p className="blog-status">Carregando conteúdos...</p> : null}
          <div className="article-grid article-grid--blog">
            {articles.map((article) => (
              <ArticleCard article={article} key={article.id || article.title} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function BlogPostPage({ slug }) {
  const { post, status } = usePost(slug);

  return (
    <main className="post-page">
      <article className="container post">
        <ArrowLink href="/blog">Todos os conteúdos</ArrowLink>
        {status === 'loading' ? <p className="blog-status">Carregando artigo...</p> : null}
        {status === 'error' ? (
          <div className="post__empty">
            <h1>Conteúdo não encontrado</h1>
            <p>O artigo solicitado não está disponível ou foi removido.</p>
            <ArrowLink href="/blog">Ver conteúdos</ArrowLink>
          </div>
        ) : null}
        {post ? (
          <>
            <header className="post__header">
              <div className="article__meta">
                <span>{post.audience}</span>
                <span>•</span>
                <span>{post.time}</span>
              </div>
              <h1>{post.title}</h1>
              {post.excerpt ? <p>{post.excerpt}</p> : null}
            </header>
            {post.imageUrl ? <img className="post__image" src={post.imageUrl} alt="" /> : null}
            <div className="post__content" dangerouslySetInnerHTML={{ __html: post.content }} />
          </>
        ) : null}
      </article>
    </main>
  );
}

function FinalCta() {
  return (
    <section className="final-cta">
      <PulseLine />
      <h2>Sua segurança começa com uma boa avaliação.</h2>
      <div className="actions">
        <a className="button button--light" href="#plataformas">
          Fazer avaliação pré-anestésica <ArrowRight size={17} aria-hidden="true" />
        </a>
        <a className="button button--ghost" href="#a-alm">
          Conheça a ALM <ArrowRight size={17} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contato">
      <div className="container footer__grid">
        <div>
          <Logo light />
          <p>Anestesiologia, avaliação pré-anestésica e soluções digitais que aproximam pessoas e instituições.</p>
        </div>
        <div>
          <h3>Navegação</h3>
          <a href="#inicio">Início</a>
          <a href="#a-alm">A ALM</a>
          <a href="#servicos">Serviços</a>
          <a href="#conteudos">Conteúdos</a>
        </div>
        <div>
          <h3>Contato</h3>
          <a href="mailto:contato@alm.med.br">contato@alm.med.br</a>
          <span>Vale do Aço, MG — Brasil</span>
        </div>
        <div>
          <h3>Políticas</h3>
          <a href="/politica-de-privacidade">Política de Privacidade</a>
          <a href="/termos">Termos de Uso</a>
        </div>
      </div>
      <div className="container disclaimer">
        Este site tem caráter informativo e não substitui uma avaliação médica. Em caso de dúvidas sobre sua saúde, consulte um médico.
      </div>
    </footer>
  );
}

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const blogMatch = pathname.match(/^\/blog\/([^/]+)$/);
  const isBlogIndex = pathname === '/blog';

  return (
    <>
      <Header />
      {blogMatch ? (
        <BlogPostPage slug={decodeURIComponent(blogMatch[1])} />
      ) : isBlogIndex ? (
        <BlogIndexPage />
      ) : (
        <main>
          <Hero />
          <ServicesSection />
          <PlatformsSection />
          <AboutSection />
          <ContentSection />
          <FinalCta />
        </main>
      )}
      <Footer />
    </>
  );
}
