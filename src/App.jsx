import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HeartPulse,
  LogIn,
  LogOut,
  ListChecks,
  Menu,
  MessageCircle,
  Pill,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import Logo from './components/Logo';
import { regionalPages } from './data/regionalContent';
import { fallbackArticles, navigationItems, platforms } from './data/siteContent';
import { usePost } from './hooks/usePost';
import { usePosts } from './hooks/usePosts';

const GA_ID = 'G-5JMPMQH679';
const COOKIE_CONSENT_KEY = 'alm_cookie_consent_v1';
const emptyPreAssessmentForm = {
  patientName: '',
  cpf: '',
  birthDate: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  surgeryDate: '',
  surgeonName: '',
  hospital: '',
  procedureName: '',
  anesthesiaType: '',
  allergies: '',
  previousSurgeries: '',
  currentMedications: '',
  knownConditions: '',
  smoking: '',
  alcoholUse: '',
  functionalCapacity: '',
  cardiovascularSymptoms: '',
  respiratorySymptoms: '',
  dentalStatus: '',
  exams: '',
  anesthesiaProblems: '',
  observations: '',
  website: '',
  consent: false,
};
const emptyMedicationGuidanceForm = {
  accessCode: '',
  medications: '',
  procedureName: '',
  surgeryDate: '',
  anesthesiaType: '',
  conditions: '',
  observations: '',
  professionalConsent: false,
};

function loadAnalytics() {
  if (typeof window === 'undefined' || window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

function getStoredCookieConsent() {
  if (typeof window === 'undefined') return null;

  try {
    return JSON.parse(window.localStorage.getItem(COOKIE_CONSENT_KEY));
  } catch {
    return null;
  }
}

function saveCookieConsent(consent) {
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
    ...consent,
    updatedAt: new Date().toISOString(),
  }));
}

function trackEvent(eventName, parameters = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, parameters);
  }
}

function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title;
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute('content', description);
    }
  }, [title, description]);
}

function ArrowLink({ children, href = '#', className = '', onClick }) {
  return (
    <a className={`arrow-link ${className}`} href={href} onClick={onClick}>
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
          <a href="/blog" onClick={() => setOpen(false)}>Blog</a>
          <a href="/agendar" onClick={() => setOpen(false)}>Agendar</a>
          <a href="/pre-avaliacao" onClick={() => setOpen(false)}>Enviar dados</a>
          <a href="/medicamentos" onClick={() => setOpen(false)}>Medicamentos</a>
          <a className="button button--nav" href="/agendar" onClick={() => setOpen(false)}>
            Agendar avaliação <ArrowRight size={16} aria-hidden="true" />
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
          <a className="button" href="/agendar">
            Agendar avaliação <ArrowRight size={17} aria-hidden="true" />
          </a>
          <a
            className="button button--outline"
            href="https://wa.me/5533987128010"
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent('hero_whatsapp', { location: 'hero' })}
          >
            Falar pelo WhatsApp <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="hero__image" role="img" aria-label="Anestesiologista em ambiente cirúrgico" />
      <PulseLine />
    </section>
  );
}

function PatientStartSection() {
  return (
    <section className="section patient-start">
      <div className="container">
        <h2>Vai passar por cirurgia?</h2>
        <div className="schedule-grid">
          <article>
            <h3>Agendar avaliação</h3>
            <p>Escolha entre AnestVale, AnestConsulta ou WhatsApp conforme sua cidade e necessidade.</p>
            <ArrowLink href="/agendar">Começar agendamento</ArrowLink>
          </article>
          <article>
            <h3>Enviar dados da cirurgia</h3>
            <p>Informe procedimento, cirurgião, data prevista e histórico de saúde para orientar o primeiro contato.</p>
            <ArrowLink href="/pre-avaliacao">Preencher pré-avaliação</ArrowLink>
          </article>
          <article>
            <h3>Dúvida rápida</h3>
            <p>Use o WhatsApp para confirmar o melhor caminho antes de preencher informações clínicas.</p>
            <ArrowLink
              href="https://wa.me/5533987128010"
              onClick={() => trackEvent('patient_start_whatsapp', { location: 'patient_start' })}
            >
              Falar pelo WhatsApp
            </ArrowLink>
          </article>
        </div>
      </div>
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
                <ArrowLink
                  href={platform.href}
                  onClick={() => trackEvent('select_platform', {
                    platform_name: platform.name,
                    platform_kind: platform.kind,
                  })}
                >
                  Acessar {platform.name}
                </ArrowLink>
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
      <h3>
        <a href={article.href}>{article.title}</a>
      </h3>
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
  const [searchTerm, setSearchTerm] = useState('');
  const { articles, hasMore, loadMore, status } = usePosts(fallbackArticles, 12, searchTerm);
  const isSearching = searchTerm.trim().length > 0;

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
          <form className="blog-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <Search size={20} aria-hidden="true" />
            <label htmlFor="blog-search-input">Buscar conteúdos</label>
            <input
              id="blog-search-input"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por anestesia, jejum, risco cirúrgico..."
            />
            {isSearching ? (
              <button type="button" onClick={() => setSearchTerm('')} aria-label="Limpar busca">
                <X size={18} aria-hidden="true" />
              </button>
            ) : null}
          </form>
          {status === 'loading' ? <p className="blog-status">Carregando conteúdos...</p> : null}
          {status !== 'loading' && articles.length === 0 ? (
            <div className="blog-empty">
              <h2>Nenhum conteúdo encontrado</h2>
              <p>Tente buscar por outro termo ou veja todos os conteúdos do blog.</p>
            </div>
          ) : null}
          <div className="article-grid article-grid--blog">
            {articles.map((article) => (
              <ArticleCard article={article} key={article.id || article.title} />
            ))}
          </div>
          {hasMore ? (
            <div className="blog-page__more">
              <button className="button" type="button" onClick={loadMore} disabled={status === 'loading-more'}>
                {status === 'loading-more' ? 'Carregando...' : 'Carregar mais conteúdos'}
              </button>
            </div>
          ) : null}
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

function RegionalPage({ page }) {
  usePageMeta(`${page.title} | ALM Anestesia`, page.description);

  return (
    <main className="regional-page">
      <section className="regional-hero">
        <div className="container">
          <ArrowLink href="/agendar">Escolher atendimento</ArrowLink>
          <span className="regional-hero__eyebrow">{page.eyebrow}</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <div className="actions">
            <a
              className="button"
              href={page.primaryHref}
              onClick={() => trackEvent('regional_cta', {
                region_page: page.title,
                destination: page.primaryService,
              })}
            >
              {page.primaryLabel} <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a
              className="button button--outline"
              href={page.secondaryHref}
              onClick={() => trackEvent('regional_secondary_cta', {
                region_page: page.title,
                destination: page.secondaryLabel,
              })}
            >
              {page.secondaryLabel} <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container regional-sections">
          {page.sections.map((section) => (
            <section className="regional-block" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
              {section.cities ? (
                <div className="city-grid">
                  {section.cities.map((city) => (
                    <span key={city}>{city}</span>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function SchedulingPage() {
  usePageMeta(
    'Agendar avaliação pré-anestésica | ALM Anestesia',
    'Escolha entre atendimento regional pelo AnestVale, avaliação pré-anestésica online pelo AnestConsulta ou contato direto pelo WhatsApp.',
  );

  return (
    <main className="schedule-page">
      <section className="regional-hero schedule-hero">
        <div className="container">
          <ArrowLink href="/#inicio">Voltar ao início</ArrowLink>
          <span className="regional-hero__eyebrow">Agendamento e orientação</span>
          <h1>Como você quer fazer sua avaliação?</h1>
          <p>Escolha o caminho mais adequado para sua cirurgia, cidade e necessidade de contato com o médico anestesista.</p>
        </div>
      </section>
      <section className="section">
        <div className="container schedule-grid">
          <article>
            <h2>Estou no Vale do Aço</h2>
            <p>Para pacientes de Ipatinga, Coronel Fabriciano, Timóteo, Santana do Paraíso e região, com fluxo regional de avaliação pré-anestésica.</p>
            <ArrowLink
              href="https://anestvale.com.br"
              onClick={() => trackEvent('schedule_choice', { choice: 'AnestVale' })}
            >
              Agendar pelo AnestVale
            </ArrowLink>
          </article>
          <article>
            <h2>Quero avaliação online</h2>
            <p>Para pacientes do Vale do Rio Doce, outras cidades de Minas Gerais ou quem precisa organizar a avaliação antes de deslocamentos.</p>
            <ArrowLink
              href="https://anestconsulta.com.br"
              onClick={() => trackEvent('schedule_choice', { choice: 'AnestConsulta' })}
            >
              Agendar pelo AnestConsulta
            </ArrowLink>
          </article>
          <article>
            <h2>Tenho dúvida antes de agendar</h2>
            <p>Use o WhatsApp para orientação inicial sobre avaliação pré-anestésica, documentos, exames e encaminhamento.</p>
            <ArrowLink
              href="https://wa.me/5533987128010"
              onClick={() => trackEvent('schedule_choice', { choice: 'WhatsApp' })}
            >
              Falar pelo WhatsApp
            </ArrowLink>
          </article>
          <article>
            <h2>Já tenho os dados da cirurgia</h2>
            <p>Preencha as informações iniciais do paciente e do procedimento para facilitar a orientação pré-anestésica.</p>
            <ArrowLink
              href="/pre-avaliacao"
              onClick={() => trackEvent('schedule_choice', { choice: 'PreAssessment' })}
            >
              Enviar dados da cirurgia
            </ArrowLink>
          </article>
        </div>
      </section>
    </main>
  );
}

function PreAssessmentPage() {
  const [form, setForm] = useState(emptyPreAssessmentForm);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  usePageMeta(
    'Enviar dados para avaliação pré-anestésica | ALM Anestesia',
    'Formulário inicial para pacientes enviarem dados da cirurgia, medicamentos, alergias e histórico antes da orientação pré-anestésica.',
  );

  function updateField(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/pre-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível enviar os dados.');
      }

      setStatus('success');
      setMessage('Dados enviados. O relatório preliminar foi encaminhado para avaliação médica final.');
      setForm(emptyPreAssessmentForm);
      trackEvent('pre_assessment_submit', { status: 'success' });
      window.location.href = payload.data?.reviewPath || '/apa-aguardando-avaliacao-medico-final';
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
      trackEvent('pre_assessment_submit', { status: 'error' });
    }
  }

  return (
    <main className="pre-assessment-page">
      <section className="regional-hero">
        <div className="container">
          <ArrowLink href="/agendar">Voltar para agendamento</ArrowLink>
          <span className="regional-hero__eyebrow">Pré-avaliação</span>
          <h1>Envie os dados iniciais da cirurgia</h1>
          <p>Essas informações ajudam a organizar o primeiro contato. O envio não substitui consulta médica, avaliação individualizada ou atendimento de urgência.</p>
        </div>
      </section>
      <section className="section">
        <div className="container form-layout">
          <form className="patient-form" onSubmit={submitForm}>
            <label className="honeypot-field" aria-hidden="true">
              Website
              <input name="website" value={form.website} onChange={updateField} tabIndex="-1" autoComplete="off" />
            </label>
            <fieldset>
              <legend>Dados do paciente</legend>
              <label>Nome completo do paciente<input name="patientName" value={form.patientName} onChange={updateField} required /></label>
              <label>CPF<input name="cpf" value={form.cpf} onChange={updateField} required inputMode="numeric" /></label>
              <label>Data de nascimento<input name="birthDate" type="date" value={form.birthDate} onChange={updateField} required /></label>
              <label>WhatsApp<input name="whatsapp" value={form.whatsapp} onChange={updateField} required /></label>
              <label>E-mail<input name="email" type="email" value={form.email} onChange={updateField} required /></label>
              <label>Cidade<input name="city" value={form.city} onChange={updateField} /></label>
              <label>Endereço completo<textarea name="address" value={form.address} onChange={updateField} required /></label>
            </fieldset>
            <fieldset>
              <legend>Dados da cirurgia</legend>
              <label>Procedimento a ser realizado<input name="procedureName" value={form.procedureName} onChange={updateField} required /></label>
              <label>Data prevista da cirurgia<input name="surgeryDate" type="date" value={form.surgeryDate} onChange={updateField} /></label>
              <label>Nome do cirurgião<input name="surgeonName" value={form.surgeonName} onChange={updateField} /></label>
              <label>Hospital ou clínica<input name="hospital" value={form.hospital} onChange={updateField} /></label>
              <label>Tipo de anestesia previsto<input name="anesthesiaType" value={form.anesthesiaType} onChange={updateField} placeholder="Se já foi informado" /></label>
            </fieldset>
            <fieldset>
              <legend>Anamnese e histórico</legend>
              <label>Alergias<textarea name="allergies" value={form.allergies} onChange={updateField} /></label>
              <label>Cirurgias anteriores<textarea name="previousSurgeries" value={form.previousSurgeries} onChange={updateField} /></label>
              <label>Medicamentos em uso<textarea name="currentMedications" value={form.currentMedications} onChange={updateField} /></label>
              <label>Doenças conhecidas<textarea name="knownConditions" value={form.knownConditions} onChange={updateField} /></label>
              <label>Tabagismo<textarea name="smoking" value={form.smoking} onChange={updateField} placeholder="Nunca fumou, ex-tabagista, fuma atualmente..." /></label>
              <label>Etilismo<textarea name="alcoholUse" value={form.alcoholUse} onChange={updateField} placeholder="Não bebe, social, diário..." /></label>
              <label>Capacidade funcional<textarea name="functionalCapacity" value={form.functionalCapacity} onChange={updateField} placeholder="Ex.: sobe escadas, caminha, sente falta de ar aos esforços..." /></label>
              <label>Sintomas cardiovasculares<textarea name="cardiovascularSymptoms" value={form.cardiovascularSymptoms} onChange={updateField} placeholder="Dor no peito, palpitações, falta de ar, desmaio, pressão alta..." /></label>
              <label>Sintomas respiratórios<textarea name="respiratorySymptoms" value={form.respiratorySymptoms} onChange={updateField} placeholder="Asma, bronquite, tosse, chiado, falta de ar, uso de oxigênio..." /></label>
              <label>Dentes, próteses ou aparelho<textarea name="dentalStatus" value={form.dentalStatus} onChange={updateField} placeholder="Dente solto, prótese dentária, aparelho, dentes quebrados..." /></label>
              <label>Exames apresentados<textarea name="exams" value={form.exams} onChange={updateField} placeholder="Cole resultados relevantes com data, se tiver." /></label>
              <label>Já teve problema com anestesia?<textarea name="anesthesiaProblems" value={form.anesthesiaProblems} onChange={updateField} /></label>
              <label>Observações<textarea name="observations" value={form.observations} onChange={updateField} /></label>
            </fieldset>
            <label className="form-consent">
              <input name="consent" type="checkbox" checked={form.consent} onChange={updateField} required />
              <span>Declaro que li e aceito a <a href="/politica-de-privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a> e os <a href="/termos" target="_blank" rel="noreferrer">Termos de Uso</a>, autorizando o uso dessas informações para orientação pré-anestésica.</span>
            </label>
            {message ? <p className={`form-message form-message--${status}`}>{message}</p> : null}
            <button className="button" type="submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Enviando...' : 'Enviar dados'} <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>
          <aside className="form-note">
            <h2>Como esses dados serão usados?</h2>
            <p>As informações serão salvas para contato e usadas para gerar uma minuta de relatório pré-anestésico para revisão médica.</p>
            <p>O paciente só deve seguir orientações após avaliação final da equipe médica.</p>
            <p>Não envie dados de emergência por este formulário. Em caso de urgência, procure atendimento médico imediato.</p>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ApaWaitingPage() {
  usePageMeta(
    'APA aguardando avaliação médica final | ALM Anestesia',
    'Confirmação de envio dos dados de avaliação pré-anestésica para revisão médica final.',
  );

  return (
    <main className="schedule-page">
      <section className="regional-hero">
        <div className="container">
          <ArrowLink href="/#inicio">Voltar ao início</ArrowLink>
          <span className="regional-hero__eyebrow">Pré-avaliação enviada</span>
          <h1>APA aguardando avaliação médica final</h1>
          <p>Recebemos os dados e a minuta do relatório foi encaminhada para revisão da equipe médica. A orientação final será enviada pelo contato informado no formulário.</p>
          <div className="actions">
            <a className="button" href="https://wa.me/5533987128010" target="_blank" rel="noreferrer">
              Falar pelo WhatsApp <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a className="button button--outline" href="/pre-avaliacao">
              Enviar nova pré-avaliação <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container schedule-grid">
          <article>
            <h2>O que acontece agora?</h2>
            <p>A equipe médica revisa os dados, exames e pendências antes de orientar o paciente.</p>
          </article>
          <article>
            <h2>Como será o contato?</h2>
            <p>A ALM usa o e-mail e o WhatsApp informados no cadastro para orientar os próximos passos.</p>
          </article>
          <article>
            <h2>Em caso de urgência</h2>
            <p>Este envio não substitui atendimento de urgência. Procure assistência médica imediata se houver piora clínica.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

function MedicationGuidancePage() {
  const [form, setForm] = useState(emptyMedicationGuidanceForm);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [guidance, setGuidance] = useState(null);

  usePageMeta(
    'Conferência de medicamentos pré-operatórios | ALM Anestesia',
    'Ferramenta de apoio para conferir pausa, manutenção ou necessidade de contexto clínico antes da avaliação pré-anestésica.',
  );

  function updateField(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');
    setGuidance(null);

    try {
      const response = await fetch('/api/medication-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível conferir os medicamentos.');
      }

      setStatus('success');
      setGuidance(payload.data);
      setMessage('Conferência gerada. Revise com o anestesiologista antes de orientar o paciente.');
      trackEvent('medication_guidance_submit', { status: 'success' });
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
      trackEvent('medication_guidance_submit', { status: 'error' });
    }
  }

  return (
    <main className="medication-page">
      <section className="regional-hero medication-hero">
        <div className="container">
          <ArrowLink href="/agendar">Voltar para agendamento</ArrowLink>
          <span className="regional-hero__eyebrow">Apoio à equipe</span>
          <h1>Conferência de medicamentos antes da cirurgia</h1>
          <p>Use para retornar uma orientação objetiva: suspender por alguns dias, não suspender ou completar indicação clínica quando a conduta depende da doença de base.</p>
        </div>
      </section>
      <section className="section">
        <div className="container medication-layout">
          <form className="patient-form medication-form" onSubmit={submitForm}>
            <fieldset>
              <legend>Dados para conferência</legend>
              <label>Código da equipe, se configurado<input name="accessCode" type="password" value={form.accessCode} onChange={updateField} autoComplete="off" /></label>
              <label>Procedimento<input name="procedureName" value={form.procedureName} onChange={updateField} placeholder="Ex.: colecistectomia, endoscopia..." /></label>
              <label>Data prevista<input name="surgeryDate" type="date" value={form.surgeryDate} onChange={updateField} /></label>
              <label>Tipo de anestesia previsto<input name="anesthesiaType" value={form.anesthesiaType} onChange={updateField} placeholder="Se souber" /></label>
              <label>Medicamentos em uso<textarea name="medications" value={form.medications} onChange={updateField} required placeholder="Um por linha. Ex.: AAS infantil, rivaroxabana, losartana..." /></label>
              <label>Condições relevantes<textarea name="conditions" value={form.conditions} onChange={updateField} placeholder="Ex.: stent, infarto, AVC, prevenção primária, FA, DRC, diabetes..." /></label>
              <label>Observações<textarea name="observations" value={form.observations} onChange={updateField} placeholder="Dúvida específica, orientação já recebida, exames ou contexto institucional." /></label>
            </fieldset>
            <label className="form-consent">
              <input name="professionalConsent" type="checkbox" checked={form.professionalConsent} onChange={updateField} required />
              <span>Confirmo que não inseri CPF, número de prontuário ou identificadores desnecessários, e que a resposta será revisada por profissional habilitado antes de qualquer orientação ao paciente.</span>
            </label>
            {message ? <p className={`form-message form-message--${status}`}>{message}</p> : null}
            <button className="button" type="submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Conferindo...' : 'Conferir medicamentos'} <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>

          <aside className="medication-result" aria-live="polite">
            {!guidance ? (
              <div className="medication-empty">
                <Pill size={38} aria-hidden="true" />
                <h2>Resultado da conferência</h2>
                <p>O retorno prioriza uma conduta curta por medicamento. Medicamentos sem regra local só usam IA como fallback.</p>
              </div>
            ) : (
              <>
                <div className={`medication-summary medication-summary--${guidance.riskLevel}`}>
                  <ShieldCheck size={28} aria-hidden="true" />
                  <div>
                    <span>{guidance.riskLabel}</span>
                    <h2>{guidance.summary}</h2>
                    <p>{guidance.notMedicalOrder}</p>
                  </div>
                </div>

                <div className="medication-result__section">
                  <h3><ListChecks size={18} aria-hidden="true" /> Medicamentos avaliados</h3>
                  <div className="medication-items">
                    {guidance.medications?.map((item) => (
                      <article className="medication-item" key={`${item.name}-${item.actionText || item.preliminaryAction}`}>
                        <div>
                          <strong>{item.name}</strong>
                          <span>{item.actionText || item.preliminaryAction}</span>
                        </div>
                        <p className="medication-item__timing">{item.timingText || item.timing}</p>
                        <p>{item.reason}</p>
                        <dl>
                          <div>
                            <dt>Categoria</dt>
                            <dd>{item.category || 'Medicamento'}</dd>
                          </div>
                          <div>
                            <dt>Fonte</dt>
                            <dd>
                              {item.sourceUrl ? (
                                <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceLabel}</a>
                              ) : item.sourceLabel || item.confirmWith}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                </div>

                {guidance.redFlags?.length ? (
                  <div className="medication-result__section medication-alerts">
                    <h3><AlertTriangle size={18} aria-hidden="true" /> Alertas</h3>
                    <ul>
                      {guidance.redFlags.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                ) : null}

                {guidance.nextSteps?.length ? (
                  <div className="medication-result__section">
                    <h3><CheckCircle2 size={18} aria-hidden="true" /> Próximos passos</h3>
                    <ul>
                      {guidance.nextSteps.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function getWhatsAppHref(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return 'https://wa.me/5533987128010';
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`;
}

function PatientAccessPage() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [accessData, setAccessData] = useState(null);

  usePageMeta(
    'Status da pré-avaliação | ALM Anestesia',
    'Acompanhamento seguro do status da pré-avaliação anestésica.',
  );

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    if (!token) {
      setStatus('error');
      setMessage('Link inválido ou expirado.');
      return;
    }

    fetch(`/api/patient/status?token=${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Não foi possível consultar o status.');
        setAccessData(payload.data);
        setStatus('success');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.message);
      });
  }, []);

  return (
    <main className="patient-access-page">
      <section className="patient-access">
        <div className="patient-access__panel">
          <Logo />
          <ShieldCheck size={38} aria-hidden="true" />
          <h1>Status da pré-avaliação</h1>
          {status === 'loading' ? <p>Consultando link temporário...</p> : null}
          {status === 'error' ? (
            <>
              <p>{message}</p>
              <a className="button button--outline" href="https://wa.me/5533987128010" target="_blank" rel="noreferrer">
                Falar com a ALM <MessageCircle size={17} aria-hidden="true" />
              </a>
            </>
          ) : null}
          {status === 'success' && accessData ? (
            <>
              <span>APA #{accessData.assessmentId}</span>
              <h2>{accessData.statusLabel}</h2>
              <p>Este link mostra apenas o andamento do atendimento. Orientações clínicas e laudos não são enviados automaticamente por aqui.</p>
              <a className="button" href={accessData.contactWhatsApp} target="_blank" rel="noreferrer">
                Falar com a equipe <MessageCircle size={17} aria-hidden="true" />
              </a>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function AdminPage() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    name: 'Fernando',
    email: 'fernando.xavierferreira@gmail.com',
    password: '',
    setupCode: '',
  });
  const [authStatus, setAuthStatus] = useState('idle');
  const [authMessage, setAuthMessage] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('idle');
  const [reviewMessage, setReviewMessage] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [newUserForm, setNewUserForm] = useState({
    name: 'Secretaria',
    email: 'secretaria@alm.med.br',
    role: 'secretaria',
    password: '',
  });
  const [userFormStatus, setUserFormStatus] = useState('idle');
  const [userFormMessage, setUserFormMessage] = useState('');

  usePageMeta(
    'Administração APA | ALM Anestesia',
    'Área administrativa para equipe médica revisar pacientes e avaliações pré-anestésicas.',
  );

  useEffect(() => {
    fetch('/api/admin/session', { headers: { Accept: 'application/json' } })
      .then((response) => response.json())
      .then((payload) => setUser(payload.data?.user || null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user) {
      loadAssessments();
      if (user.role === 'admin') {
        loadAdminUsers();
      }
    }
  }, [user]);

  function updateAuthField(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

  function updateNewUserField(event) {
    const { name, value } = event.target;
    setNewUserForm((current) => ({ ...current, [name]: value }));
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthStatus('submitting');
    setAuthMessage('');

    try {
      const endpoint = mode === 'setup' ? '/api/admin/setup' : '/api/admin/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(authForm),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error || 'Não foi possível autenticar.');

      if (mode === 'setup') {
        setMode('login');
        setAuthMessage('Administrador criado. Entre com e-mail e senha.');
      } else {
        setUser(payload.data);
      }
      setAuthStatus('success');
    } catch (error) {
      setAuthStatus('error');
      setAuthMessage(error.message);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST', headers: { Accept: 'application/json' } });
    setUser(null);
    setAssessments([]);
    setSelectedAssessment(null);
    setAdminUsers([]);
  }

  async function loadAdminUsers() {
    const response = await fetch('/api/admin/users', { headers: { Accept: 'application/json' } });
    const payload = await response.json();
    if (response.ok) setAdminUsers(payload.data || []);
  }

  async function submitNewUser(event) {
    event.preventDefault();
    setUserFormStatus('submitting');
    setUserFormMessage('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Não foi possível criar o usuário.');

      setUserFormStatus('success');
      setUserFormMessage('Usuário criado com sucesso.');
      setNewUserForm((current) => ({ ...current, password: '' }));
      loadAdminUsers();
    } catch (error) {
      setUserFormStatus('error');
      setUserFormMessage(error.message);
    }
  }

  async function loadAssessments() {
    setLoadingAssessments(true);
    try {
      const response = await fetch('/api/admin/pre-assessments', { headers: { Accept: 'application/json' } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Falha ao carregar avaliações.');
      setAssessments(payload.data || []);
      if (!selectedAssessment && payload.data?.[0]) {
        loadAssessment(payload.data[0].id);
      }
    } catch (error) {
      setAuthMessage(error.message);
    } finally {
      setLoadingAssessments(false);
    }
  }

  async function loadAssessment(id) {
    const response = await fetch(`/api/admin/pre-assessments/${id}`, { headers: { Accept: 'application/json' } });
    const payload = await response.json();
    if (response.ok) setSelectedAssessment(payload.data);
  }

  async function markReviewedAndNotify() {
    if (!selectedAssessment?.id) return;
    setReviewStatus('submitting');
    setReviewMessage('');

    try {
      const response = await fetch(`/api/admin/pre-assessments/${selectedAssessment.id}/mark-reviewed`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Não foi possível avisar o paciente.');

      setReviewStatus('success');
      setReviewMessage(payload.data?.whatsappSent ? 'Paciente avisado por WhatsApp.' : 'Avaliação marcada como revisada. WhatsApp não enviado ou UAZAPI desativada.');
      loadAssessment(selectedAssessment.id);
      loadAssessments();
    } catch (error) {
      setReviewStatus('error');
      setReviewMessage(error.message);
    }
  }

  if (!user) {
    return (
      <main className="admin-page">
        <section className="admin-login">
          <div className="admin-login__panel">
            <Logo />
            <h1>Administração APA</h1>
            <p>Acesso restrito para equipe ALM revisar pacientes, avaliações e minutas geradas.</p>
            <div className="admin-login__tabs">
              <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
                <LogIn size={16} aria-hidden="true" /> Entrar
              </button>
              <button type="button" className={mode === 'setup' ? 'active' : ''} onClick={() => setMode('setup')}>
                <UserPlus size={16} aria-hidden="true" /> Primeiro admin
              </button>
            </div>
            <form className="admin-form" onSubmit={submitAuth}>
              {mode === 'setup' ? (
                <>
                  <label>Nome<input name="name" value={authForm.name} onChange={updateAuthField} required /></label>
                  <label>Código de setup<input name="setupCode" type="password" value={authForm.setupCode} onChange={updateAuthField} required /></label>
                </>
              ) : null}
              <label>E-mail<input name="email" type="email" value={authForm.email} onChange={updateAuthField} required /></label>
              <label>Senha<input name="password" type="password" value={authForm.password} onChange={updateAuthField} required minLength={10} /></label>
              {authMessage ? <p className={`form-message form-message--${authStatus}`}>{authMessage}</p> : null}
              <button className="button" type="submit" disabled={authStatus === 'submitting'}>
                {mode === 'setup' ? 'Criar admin' : 'Entrar'} <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <header className="admin-topbar">
          <div>
            <h1>Pré-avaliações</h1>
            <p>{user.name} • {user.email} • {user.role === 'admin' ? 'admin' : 'secretaria'}</p>
          </div>
          <div className="admin-topbar__actions">
            <button className="admin-icon-button" type="button" onClick={loadAssessments} aria-label="Atualizar avaliações">
              <RefreshCw size={18} aria-hidden="true" />
            </button>
            <button className="admin-icon-button" type="button" onClick={logout} aria-label="Sair">
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="admin-workspace">
          <div className="admin-sidebar">
            <section className="admin-list" aria-label="Lista de avaliações">
              <div className="admin-list__header">
                <strong>{assessments.length} avaliações</strong>
                <span>{loadingAssessments ? 'Atualizando...' : 'Últimos envios'}</span>
              </div>
              {assessments.length === 0 ? (
                <p className="admin-empty">Nenhuma pré-avaliação recebida ainda.</p>
              ) : assessments.map((assessment) => (
                <button
                  className={selectedAssessment?.id === assessment.id ? 'admin-row admin-row--active' : 'admin-row'}
                  type="button"
                  key={assessment.id}
                  onClick={() => loadAssessment(assessment.id)}
                >
                  <span>{assessment.patient_name}</span>
                  <small>{assessment.procedure_name}</small>
                  <em>{assessment.report_status}</em>
                </button>
              ))}
            </section>
            {user.role === 'admin' ? (
              <section className="admin-users" aria-label="Usuários da equipe">
                <div className="admin-list__header">
                  <strong>Usuários</strong>
                  <span>{adminUsers.length} acessos</span>
                </div>
                <div className="admin-users__list">
                  {adminUsers.map((adminUser) => (
                    <div className="admin-user-row" key={adminUser.id}>
                      <strong>{adminUser.name}</strong>
                      <span>{adminUser.email}</span>
                      <em>{adminUser.role}</em>
                    </div>
                  ))}
                </div>
                <form className="admin-form admin-user-form" onSubmit={submitNewUser}>
                  <label>Nome<input name="name" value={newUserForm.name} onChange={updateNewUserField} required /></label>
                  <label>E-mail<input name="email" type="email" value={newUserForm.email} onChange={updateNewUserField} required /></label>
                  <label>Perfil
                    <select name="role" value={newUserForm.role} onChange={updateNewUserField}>
                      <option value="secretaria">Secretaria</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label>Senha provisória<input name="password" type="password" value={newUserForm.password} onChange={updateNewUserField} required minLength={10} /></label>
                  {userFormMessage ? <p className={`form-message form-message--${userFormStatus}`}>{userFormMessage}</p> : null}
                  <button className="button" type="submit" disabled={userFormStatus === 'submitting'}>
                    Criar usuário <UserPlus size={17} aria-hidden="true" />
                  </button>
                </form>
              </section>
            ) : null}
          </div>
          <section className="admin-detail" aria-label="Detalhe da avaliação">
            {!selectedAssessment ? (
              <div className="admin-empty admin-empty--detail">
                <FileText size={34} aria-hidden="true" />
                <p>Selecione uma avaliação para revisar os dados e a minuta.</p>
              </div>
            ) : (
              <>
                <div className="admin-detail__header">
                  <div>
                    <span>Avaliação #{selectedAssessment.id}</span>
                    <h2>{selectedAssessment.patient_name}</h2>
                    <p>{selectedAssessment.procedure_name}</p>
                  </div>
                  <div className="admin-detail__actions">
                    <button className="button" type="button" onClick={markReviewedAndNotify} disabled={reviewStatus === 'submitting'}>
                      <CheckCircle2 size={16} aria-hidden="true" /> Revisado e avisar
                    </button>
                    <a className="button button--outline" href={getWhatsAppHref(selectedAssessment.whatsapp)} target="_blank" rel="noreferrer">
                      WhatsApp <ArrowRight size={16} aria-hidden="true" />
                    </a>
                  </div>
                </div>
                {reviewMessage ? <p className={`form-message form-message--${reviewStatus}`}>{reviewMessage}</p> : null}
                <dl className="admin-fields">
                  <div><dt>CPF</dt><dd>{selectedAssessment.cpf}</dd></div>
                  <div><dt>Nascimento</dt><dd>{selectedAssessment.birth_date || 'Não informado'}</dd></div>
                  <div><dt>E-mail</dt><dd>{selectedAssessment.email}</dd></div>
                  <div><dt>Cidade</dt><dd>{selectedAssessment.city || 'Não informada'}</dd></div>
                  <div><dt>Hospital</dt><dd>{selectedAssessment.hospital || 'Não informado'}</dd></div>
                  <div><dt>Data cirurgia</dt><dd>{selectedAssessment.surgery_date || 'Não informada'}</dd></div>
                </dl>
                <div className="admin-clinical">
                  <h3>Dados clínicos relatados</h3>
                  <p><strong>Medicamentos:</strong> {selectedAssessment.current_medications || 'Não informado'}</p>
                  <p><strong>Comorbidades:</strong> {selectedAssessment.known_conditions || 'Não informado'}</p>
                  <p><strong>Alergias:</strong> {selectedAssessment.allergies || 'Não informado'}</p>
                  <p><strong>Exames:</strong> {selectedAssessment.exams || 'Não apresentado'}</p>
                </div>
                <div className="admin-report">
                  <h3>Minuta para revisão médica final</h3>
                  <pre>{selectedAssessment.ai_report || 'Relatório ainda não gerado.'}</pre>
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function CookieConsent() {
  const [consent, setConsent] = useState(() => getStoredCookieConsent());

  useEffect(() => {
    if (consent?.analytics) {
      loadAnalytics();
    }
  }, [consent]);

  useEffect(() => {
    window.openCookiePreferences = () => setConsent(null);
    return () => {
      delete window.openCookiePreferences;
    };
  }, []);

  function choose(nextConsent) {
    saveCookieConsent(nextConsent);
    setConsent(nextConsent);
  }

  if (consent) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Preferências de privacidade e cookies">
      <div>
        <h2>Privacidade e cookies</h2>
        <p>Usamos cookies essenciais para o funcionamento do site. Com sua permissão, usamos Analytics para entender cliques e melhorar o agendamento.</p>
        <a href="/politica-de-privacidade">Política de Privacidade</a>
        <a href="/termos">Termos de Uso</a>
      </div>
      <div className="cookie-banner__actions">
        <button type="button" className="button button--outline" onClick={() => choose({ necessary: true, analytics: false })}>Recusar Analytics</button>
        <button type="button" className="button" onClick={() => choose({ necessary: true, analytics: true })}>Aceitar cookies</button>
      </div>
    </div>
  );
}

function FloatingWhatsApp() {
  return (
    <a
      className="whatsapp-float"
      href="https://wa.me/5533987128010"
      target="_blank"
      rel="noreferrer"
      aria-label="Conversar com a ALM Anestesia pelo WhatsApp"
      onClick={() => trackEvent('floating_whatsapp', {
        contact_method: 'whatsapp',
        phone_area_code: '33',
      })}
    >
      <MessageCircle size={22} aria-hidden="true" />
      <span>WhatsApp</span>
    </a>
  );
}

const legalPages = {
  '/politica-de-privacidade': {
    title: 'Política de Privacidade',
    updatedAt: 'Atualizada em 13/07/2026',
    intro: 'Esta política descreve como a ALM Anestesia trata informações relacionadas ao uso deste site institucional e dos canais de contato vinculados a ele.',
    sections: [
      {
        title: '1. Informações que podemos coletar',
        paragraphs: [
          'Podemos receber dados fornecidos voluntariamente pelo usuário, como nome, e-mail, telefone e mensagens enviadas por formulários, e-mail ou outros canais de atendimento.',
          'Também podem ser coletadas informações técnicas básicas de navegação, como endereço IP, tipo de dispositivo, navegador, páginas acessadas e registros de segurança, quando necessários para funcionamento, proteção e melhoria do site.',
        ],
      },
      {
        title: '2. Finalidades de uso',
        paragraphs: [
          'Os dados podem ser utilizados para responder solicitações, orientar o usuário sobre serviços, manter registros administrativos, melhorar a experiência de navegação, proteger o site contra uso indevido e cumprir obrigações legais ou regulatórias.',
          'O conteúdo deste site é informativo e não substitui consulta, avaliação ou orientação médica individualizada.',
        ],
      },
      {
        title: '3. Compartilhamento',
        paragraphs: [
          'A ALM Anestesia não vende dados pessoais. Informações podem ser compartilhadas com prestadores de tecnologia, hospedagem, segurança, atendimento ou autoridades competentes quando houver base legal ou obrigação aplicável.',
        ],
      },
      {
        title: '4. Segurança e armazenamento',
        paragraphs: [
          'Adotamos medidas razoáveis de segurança para proteger as informações tratadas no site. Ainda assim, nenhum ambiente digital é totalmente imune a incidentes, e o usuário também deve manter seus próprios dispositivos e credenciais protegidos.',
          'Os dados são mantidos pelo período necessário ao atendimento das finalidades descritas, observadas obrigações legais, regulatórias e eventuais necessidades de defesa de direitos.',
        ],
      },
      {
        title: '5. Direitos do titular',
        paragraphs: [
          'Nos termos da legislação aplicável, o titular pode solicitar confirmação de tratamento, acesso, correção, atualização, eliminação, portabilidade ou informações sobre compartilhamento de seus dados pessoais.',
          'Solicitações podem ser enviadas pelo e-mail contato@alm-anestesia.com.',
        ],
      },
      {
        title: '6. Alterações desta política',
        paragraphs: [
          'Esta política pode ser atualizada para refletir mudanças no site, nos serviços, em requisitos legais ou em práticas internas. A versão vigente será publicada nesta página.',
        ],
      },
    ],
  },
};

const termsPage = {
  title: 'Termos de Uso',
  updatedAt: 'Atualizados em 13/07/2026',
  intro: 'Estes termos regulam o acesso e uso do site institucional da ALM Anestesia.',
  sections: [
    {
      title: '1. Natureza informativa',
      paragraphs: [
        'As informações publicadas neste site têm caráter educativo e institucional. Elas não substituem consulta médica, avaliação pré-anestésica, diagnóstico, prescrição ou orientação profissional individualizada.',
        'Em caso de dúvidas sobre saúde, cirurgia, anestesia, medicamentos ou sintomas, procure atendimento médico adequado.',
      ],
    },
    {
      title: '2. Uso do site',
      paragraphs: [
        'O usuário se compromete a utilizar o site de forma lícita, ética e compatível com sua finalidade informativa, sem praticar atos que possam comprometer sua segurança, disponibilidade, integridade ou funcionamento.',
      ],
    },
    {
      title: '3. Conteúdos e propriedade intelectual',
      paragraphs: [
        'Textos, marcas, elementos visuais, identidade, layout e demais conteúdos do site pertencem à ALM Anestesia ou são utilizados mediante autorização, licença ou base legítima.',
        'A reprodução, distribuição, modificação ou uso comercial de conteúdos do site depende de autorização prévia, salvo quando permitido pela legislação aplicável.',
      ],
    },
    {
      title: '4. Plataformas e links externos',
      paragraphs: [
        'O site pode conter links para plataformas, sistemas ou páginas externas, como AnestConsulta e AnestVale. Cada ambiente pode possuir termos, políticas e regras próprias.',
        'A ALM Anestesia não se responsabiliza por conteúdos, indisponibilidades ou práticas de terceiros fora dos ambientes sob seu controle direto.',
      ],
    },
    {
      title: '5. Limitação de responsabilidade',
      paragraphs: [
        'Embora busquemos manter as informações atualizadas e adequadas, não garantimos ausência de erros, interrupções, indisponibilidades ou inadequações pontuais.',
        'Decisões clínicas devem sempre ser tomadas por profissionais habilitados, considerando o contexto específico de cada paciente.',
      ],
    },
    {
      title: '6. Contato',
      paragraphs: [
        'Dúvidas sobre estes termos podem ser enviadas para contato@alm-anestesia.com.',
      ],
    },
  ],
};

legalPages['/termos'] = termsPage;
legalPages['/termo-de-uso'] = termsPage;
legalPages['/termos-de-uso'] = termsPage;

function LegalPage({ page }) {
  return (
    <main className="legal-page">
      <section className="blog-hero">
        <div className="container">
          <ArrowLink href="/#inicio">Voltar ao início</ArrowLink>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
          <span className="legal-page__date">{page.updatedAt}</span>
        </div>
      </section>
      <section className="section">
        <div className="container legal-page__content">
          {page.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function EmailDomainPage() {
  usePageMeta(
    'ALM Anestesia | Canal de e-mail',
    'Canal de e-mail da ALM Anestesia para contato institucional e comunicação com pacientes.',
  );

  return (
    <main className="email-domain-page">
      <section className="email-domain-hero">
        <div className="container email-domain-hero__inner">
          <Logo />
          <div>
            <h1>ALM Anestesia</h1>
            <p>Este domínio será usado como canal de e-mail institucional da ALM Anestesia.</p>
          </div>
          <div className="email-domain-contact">
            <span>E-mail principal</span>
            <a href="mailto:contato@alm-anestesia.com">contato@alm-anestesia.com</a>
          </div>
          <div className="actions">
            <a className="button" href="https://alm.med.br">
              Acessar site principal <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a className="button button--outline" href="https://wa.me/5533987128010" target="_blank" rel="noreferrer">
              Falar pelo WhatsApp <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
      <section className="section email-domain-section">
        <div className="container schedule-grid">
          <article>
            <h2>Uso do domínio</h2>
            <p>O domínio alm-anestesia.com pode apontar para esta página enquanto o e-mail é usado para atendimento e notificações.</p>
          </article>
          <article>
            <h2>Configuração de e-mail</h2>
            <p>Para o endereço funcionar, a Hostinger precisa estar com caixa de e-mail criada e registros MX, SPF, DKIM e DMARC configurados no DNS.</p>
          </article>
          <article>
            <h2>Site principal</h2>
            <p>Informações sobre avaliação pré-anestésica, agendamento e contato continuam em alm.med.br.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

function FinalCta() {
  return (
    <section className="final-cta">
      <PulseLine />
      <h2>Sua segurança começa com uma boa avaliação.</h2>
      <div className="actions">
        <a className="button button--light" href="/agendar">
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
          <p>Anestesiologia e avaliação pré-anestésica.</p>
        </div>
        <div>
          <h3>Navegação</h3>
          <a href="/#inicio">Início</a>
          <a href="/#a-alm">ALM</a>
          <a href="/#servicos">Serviços</a>
          <a href="/#conteudos">Conteúdos</a>
          <a href="/blog">Blog</a>
          <a href="/agendar">Agendar</a>
          <a href="/pre-avaliacao">Enviar dados</a>
          <a href="/medicamentos">Conferir medicamentos</a>
        </div>
        <div>
          <h3>Contato</h3>
          <a href="mailto:contato@alm.med.br">contato@alm.med.br</a>
          <a href="mailto:contato@alm-anestesia.com">contato@alm-anestesia.com</a>
          <a
            href="https://wa.me/5533987128010"
            target="_blank"
            rel="noreferrer"
            aria-label="Conversar com a ALM Anestesia pelo WhatsApp"
            onClick={() => trackEvent('contact_whatsapp', {
              contact_method: 'whatsapp',
              phone_area_code: '33',
            })}
          >
            WhatsApp: (33) 98712-8010
          </a>
          <span>Vale do Aço, MG — Brasil</span>
        </div>
        <div>
          <h3>Políticas</h3>
          <a href="/anestesista-vale-do-aco">Vale do Aço</a>
          <a href="/anestesista-vale-do-rio-doce">Vale do Rio Doce</a>
          <a href="/politica-de-privacidade">Política de Privacidade</a>
          <a href="/termos">Termos de Uso</a>
          <button className="footer-link-button" type="button" onClick={() => window.openCookiePreferences?.()}>
            Preferências de cookies
          </button>
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
  const hostname = window.location.hostname.replace(/^www\./, '');
  const isEmailDomain = hostname === 'alm-anestesia.com';
  const blogMatch = pathname.match(/^\/blog\/([^/]+)$/);
  const isBlogIndex = pathname === '/blog';
  const legalPage = legalPages[pathname];
  const regionalPage = regionalPages[pathname];
  const isSchedulingPage = pathname === '/agendar';
  const isPreAssessmentPage = pathname === '/pre-avaliacao';
  const isApaWaitingPage = pathname === '/apa-aguardando-avaliacao-medico-final';
  const isMedicationPage = pathname === '/medicamentos';
  const isAdminPage = pathname === '/admin';
  const isPatientAccessPage = pathname === '/paciente/acesso';
  const isEmailDomainPage = isEmailDomain || pathname === '/email-alm-anestesia';

  return (
    <>
      <Header />
      {isEmailDomainPage ? (
        <EmailDomainPage />
      ) : blogMatch ? (
        <BlogPostPage slug={decodeURIComponent(blogMatch[1])} />
      ) : isBlogIndex ? (
        <BlogIndexPage />
      ) : isSchedulingPage ? (
        <SchedulingPage />
      ) : isPreAssessmentPage ? (
        <PreAssessmentPage />
      ) : isApaWaitingPage ? (
        <ApaWaitingPage />
      ) : isMedicationPage ? (
        <MedicationGuidancePage />
      ) : isAdminPage ? (
        <AdminPage />
      ) : isPatientAccessPage ? (
        <PatientAccessPage />
      ) : regionalPage ? (
        <RegionalPage page={regionalPage} />
      ) : legalPage ? (
        <LegalPage page={legalPage} />
      ) : (
        <main>
          <Hero />
          <PatientStartSection />
          <ServicesSection />
          <PlatformsSection />
          <AboutSection />
          <ContentSection />
          <FinalCta />
        </main>
      )}
      <Footer />
      <CookieConsent />
      <FloatingWhatsApp />
    </>
  );
}
