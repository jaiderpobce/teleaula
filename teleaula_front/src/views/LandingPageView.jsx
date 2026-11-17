import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPageView() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Estado para el formulario de contacto
  const [contactForm, setContactForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    asunto: '',
    mensaje: ''
  });
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.nombre || !contactForm.correo || !contactForm.mensaje) return;
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactForm({ nombre: '', correo: '', telefono: '', asunto: '', mensaje: '' });
    }, 4500);
  };

  const handleGoToSystem = () => {
    navigate(isAuthenticated ? '/aula' : '/login');
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      fontFamily: "'Roboto', sans-serif",
      color: '#202124',
      background: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* ========================================================
          1. HEADER / NAVBAR SUPERIOR INSTITUCIONAL
         ======================================================== */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e8eaed',
        boxShadow: '0 2px 10px rgba(60, 64, 67, 0.06)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* LOGO INSTITUCIONAL */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #1a73e8, #188038)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(26, 115, 232, 0.28)'
            }}>
              🎓
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '1.35rem',
                fontWeight: 900,
                letterSpacing: '-0.5px',
                color: '#1a73e8',
                margin: 0,
                lineHeight: 1.1
              }}>
                Teleaula
              </h1>
              <span style={{ fontSize: '0.74rem', color: '#5f6368', fontWeight: 600, letterSpacing: '0.2px' }}>
                Complejo Educativo Integral
              </span>
            </div>
          </div>

          {/* ENLACES DE NAVEGACIÓN */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => scrollToSection('quienes-somos')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#3c4043',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#1a73e8'}
              onMouseLeave={e => e.currentTarget.style.color = '#3c4043'}
            >
              Quiénes Somos
            </button>

            <button 
              onClick={() => scrollToSection('mision-vision')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#3c4043',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#1a73e8'}
              onMouseLeave={e => e.currentTarget.style.color = '#3c4043'}
            >
              Misión y Visión
            </button>

            <button 
              onClick={() => scrollToSection('eventos')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#3c4043',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#1a73e8'}
              onMouseLeave={e => e.currentTarget.style.color = '#3c4043'}
            >
              Eventos
            </button>

            <button 
              onClick={() => scrollToSection('contacto')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#3c4043',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#1a73e8'}
              onMouseLeave={e => e.currentTarget.style.color = '#3c4043'}
            >
              Contacto
            </button>

            {/* BOTÓN SISTEMA (REDIRECCIÓN A LOGIN) */}
            <button
              onClick={handleGoToSystem}
              id="btn-acceso-sistema"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #1a73e8 0%, #174ea6 100%)',
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '0.94rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(26, 115, 232, 0.35)',
                transition: 'all 0.2s ease',
                marginLeft: '8px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(26, 115, 232, 0.45)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(26, 115, 232, 0.35)';
              }}
            >
              <span>🔐</span> Sistema
            </button>
          </nav>
        </div>
      </header>

      {/* ========================================================
          2. SECCIÓN HERO (BIENVENIDA & VISIÓN GENERAL)
         ======================================================== */}
      <section style={{
        background: 'linear-gradient(180deg, #f8fafd 0%, #ffffff 100%)',
        padding: '70px 24px 80px 24px',
        borderBottom: '1px solid #f1f3f4'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: '#e8f0fe',
              color: '#1a73e8',
              fontSize: '0.84rem',
              fontWeight: 700,
              marginBottom: '18px'
            }}>
              <span>🌟</span> Año Escolar 2026 - 2027
            </div>

            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(2.1rem, 4vw, 3.2rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#202124',
              margin: '0 0 18px 0',
              letterSpacing: '-1px'
            }}>
              Educación de excelencia con <span style={{ color: '#1a73e8' }}>valores humanos</span> y tecnología.
            </h2>

            <p style={{
              fontSize: '1.08rem',
              lineHeight: 1.6,
              color: '#5f6368',
              margin: '0 0 32px 0',
              maxWidth: '560px'
            }}>
              En <strong>Teleaula</strong> impulsamos el desarrollo académico, científico, ético y creativo de nuestros estudiantes, preparándolos como líderes comprometidos con el progreso de la sociedad.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={handleGoToSystem}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #1a73e8 0%, #174ea6 100%)',
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(26, 115, 232, 0.35)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span>🚀</span> Ingresar al Sistema
              </button>

              <button
                onClick={() => scrollToSection('quienes-somos')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 26px',
                  borderRadius: '16px',
                  border: '1px solid #dadce0',
                  background: '#ffffff',
                  color: '#3c4043',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#bdc1c6';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#dadce0';
                }}
              >
                Conocer la Institución
              </button>
            </div>
          </div>

          {/* TARJETAS DE INDICADORES INSTITUCIONALES */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px'
          }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e8eaed',
              borderRadius: '22px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(60, 64, 67, 0.08)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏛️</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 900, color: '#1a73e8' }}>
                +25
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#202124' }}>Años de Trayectoria</div>
              <div style={{ fontSize: '0.78rem', color: '#5f6368', marginTop: '4px' }}>Formando generaciones con vocación y disciplina.</div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e8eaed',
              borderRadius: '22px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(60, 64, 67, 0.08)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👨‍🎓</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 900, color: '#188038' }}>
                100%
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#202124' }}>Ingreso Universitario</div>
              <div style={{ fontSize: '0.78rem', color: '#5f6368', marginTop: '4px' }}>Egresados con honores en educación superior.</div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e8eaed',
              borderRadius: '22px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(60, 64, 67, 0.08)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💻</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 900, color: '#ea8600' }}>
                Aula 2.0
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#202124' }}>Campus Virtual Propio</div>
              <div style={{ fontSize: '0.78rem', color: '#5f6368', marginTop: '4px' }}>Gestión digital de tareas, calificaciones y recursos.</div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e8eaed',
              borderRadius: '22px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(60, 64, 67, 0.08)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏅</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 900, color: '#9334e6' }}>
                Integral
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#202124' }}>Deportes y Artes</div>
              <div style={{ fontSize: '0.78rem', color: '#5f6368', marginTop: '4px' }}>Cultura, debate, música y olimpiadas académicas.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. SECCIÓN QUIÉNES SOMOS
         ======================================================== */}
      <section id="quienes-somos" style={{ padding: '90px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#1a73e8' }}>
              Identidad y Comunidad
            </span>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.4rem', fontWeight: 900, color: '#202124', margin: '8px 0 12px 0' }}>
              ¿Quiénes Somos?
            </h2>
            <p style={{ maxWidth: '680px', margin: '0 auto', color: '#5f6368', fontSize: '1.02rem', lineHeight: 1.6 }}>
              Somos una comunidad educativa de vanguardia dedicada a despertar la curiosidad intelectual, fomentar el pensamiento reflexivo y cultivar principios morales en cada uno de nuestros niños y jóvenes.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '28px'
          }}>
            <div style={{
              background: '#f8fafd',
              border: '1px solid #e1e8f5',
              borderRadius: '24px',
              padding: '32px 28px',
              transition: 'transform 0.2s'
            }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '14px' }}>📚</div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#1a73e8', margin: '0 0 10px 0' }}>
                Modelo Pedagógico Activo
              </h3>
              <p style={{ color: '#5f6368', fontSize: '0.94rem', lineHeight: 1.6, margin: 0 }}>
                Enfocamos el aprendizaje en la indagación, la resolución de problemas reales y el trabajo colaborativo, permitiendo a los estudiantes ser protagonistas de su propio conocimiento.
              </p>
            </div>

            <div style={{
              background: '#f6fbf7',
              border: '1px solid #dceed5',
              borderRadius: '24px',
              padding: '32px 28px',
              transition: 'transform 0.2s'
            }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '14px' }}>🌱</div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#188038', margin: '0 0 10px 0' }}>
                Formación en Valores y Convivencia
              </h3>
              <p style={{ color: '#5f6368', fontSize: '0.94rem', lineHeight: 1.6, margin: 0 }}>
                Fomentamos el respeto mutuo, la empatía, la honestidad y la conciencia ciudadana como pilares fundamentales para una convivencia escolar pacífica y transformadora.
              </p>
            </div>

            <div style={{
              background: '#fdf9f4',
              border: '1px solid #fae8d4',
              borderRadius: '24px',
              padding: '32px 28px',
              transition: 'transform 0.2s'
            }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '14px' }}>💻</div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#e37400', margin: '0 0 10px 0' }}>
                Ecosistema Digital Teleaula
              </h3>
              <p style={{ color: '#5f6368', fontSize: '0.94rem', lineHeight: 1.6, margin: 0 }}>
                Contamos con laboratorios de computación, aulas interactivas y nuestra plataforma digital que conecta a docentes, directores, estudiantes y familias en un solo lugar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. SECCIÓN MISIÓN Y VISIÓN
         ======================================================== */}
      <section id="mision-vision" style={{
        padding: '90px 24px',
        background: 'linear-gradient(135deg, #f8fafd 0%, #edf4fc 100%)',
        borderTop: '1px solid #e8eaed',
        borderBottom: '1px solid #e8eaed'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#1a73e8' }}>
              Nuestro Rumbo y Propósito
            </span>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.4rem', fontWeight: 900, color: '#202124', margin: '8px 0 12px 0' }}>
              Misión y Visión Institucional
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: '#5f6368', fontSize: '1.02rem', lineHeight: 1.6 }}>
              Los principios rectores que orientan nuestra práctica educativa diaria y nuestro compromiso con el futuro.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '32px'
          }}>
            {/* CARD MISIÓN */}
            <div style={{
              background: '#ffffff',
              borderRadius: '26px',
              padding: '40px 36px',
              boxShadow: '0 12px 36px rgba(60, 64, 67, 0.08)',
              border: '1px solid #d2e3fc',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, #1a73e8, #4285f4)'
              }} />
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '12px',
                background: '#e8f0fe',
                color: '#1a73e8',
                fontWeight: 800,
                fontSize: '0.82rem',
                marginBottom: '16px'
              }}>
                🎯 NUESTRA MISIÓN
              </div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#202124', margin: '0 0 16px 0' }}>
                Transformar vidas a través del saber
              </h3>
              <p style={{ color: '#444746', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
                Brindar una educación integral de la más alta calidad científica, humanística y tecnológica, en un entorno seguro e incluyente, formando ciudadanos libres, críticos, solidarios y éticos, capacitados para responder con éxito a los desafíos contemporáneos y contribuir al desarrollo sustentable de su entorno.
              </p>
            </div>

            {/* CARD VISIÓN */}
            <div style={{
              background: '#ffffff',
              borderRadius: '26px',
              padding: '40px 36px',
              boxShadow: '0 12px 36px rgba(60, 64, 67, 0.08)',
              border: '1px solid #ceead6',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, #188038, #34a853)'
              }} />
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '12px',
                background: '#e6f4ea',
                color: '#188038',
                fontWeight: 800,
                fontSize: '0.82rem',
                marginBottom: '16px'
              }}>
                🔭 NUESTRA VISIÓN
              </div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#202124', margin: '0 0 16px 0' }}>
                Referente educativo de vanguardia
              </h3>
              <p style={{ color: '#444746', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
                Consolidarnos como la institución educativa líder y referente de excelencia a nivel regional y nacional, reconocida por la solidez académica de sus egresados, la constante innovación pedagógica digital y un compromiso inquebrantable con la equidad, el humanismo y el progreso social.
              </p>
            </div>
          </div>

          {/* VALORES INSTITUCIONALES */}
          <div style={{
            marginTop: '40px',
            background: '#ffffff',
            borderRadius: '22px',
            padding: '24px 32px',
            border: '1px solid #e8eaed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '1.4rem' }}>⭐</span>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#202124', marginTop: '4px' }}>Excelencia</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '1.4rem' }}>🤝</span>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#202124', marginTop: '4px' }}>Integridad</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '1.4rem' }}>💡</span>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#202124', marginTop: '4px' }}>Innovación</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '1.4rem' }}>🌐</span>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#202124', marginTop: '4px' }}>Solidaridad</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '1.4rem' }}>⚖️</span>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#202124', marginTop: '4px' }}>Responsabilidad</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. SECCIÓN EVENTOS Y ACTIVIDADES ESCOLARES
         ======================================================== */}
      <section id="eventos" style={{ padding: '90px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#1a73e8' }}>
              Comunidad en Acción
            </span>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.4rem', fontWeight: 900, color: '#202124', margin: '8px 0 12px 0' }}>
              Eventos y Calendario Escolar
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: '#5f6368', fontSize: '1.02rem', lineHeight: 1.6 }}>
              Actividades académicas, culturales, científicas y deportivas programadas para el ciclo en curso.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* EVENTO 1 */}
            <div style={{
              border: '1px solid #e8eaed',
              borderRadius: '22px',
              padding: '28px',
              background: '#ffffff',
              boxShadow: '0 4px 16px rgba(60, 64, 67, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '8px', background: '#e8f0fe', color: '#1a73e8', fontWeight: 800, fontSize: '0.76rem' }}>
                    CIENCIAS & TECNOLOGÍA
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#5f6368', fontWeight: 700 }}>
                    📅 28 Nov 2026
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#202124', margin: '0 0 10px 0' }}>
                  Feria Anual de Ciencia e Innovación Tecnológica
                </h3>
                <p style={{ color: '#5f6368', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  Presentación de proyectos científicos, prototipos robóticos y soluciones sustentables desarrolladas por alumnos de todos los grados escolares.
                </p>
              </div>
              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f1f3f4', fontSize: '0.82rem', color: '#1a73e8', fontWeight: 700 }}>
                📍 Auditorio Principal y Patios Centrales
              </div>
            </div>

            {/* EVENTO 2 */}
            <div style={{
              border: '1px solid #e8eaed',
              borderRadius: '22px',
              padding: '28px',
              background: '#ffffff',
              boxShadow: '0 4px 16px rgba(60, 64, 67, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '8px', background: '#e6f4ea', color: '#188038', fontWeight: 800, fontSize: '0.76rem' }}>
                    DEPORTES Y SALUD
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#5f6368', fontWeight: 700 }}>
                    📅 12 Dic 2026
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#202124', margin: '0 0 10px 0' }}>
                  Juegos Intercolegiales y Jornada de Convivencia
                </h3>
                <p style={{ color: '#5f6368', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  Torneos de fútbol sala, voleibol, ajedrez y atletismo con la participación activa de docentes, estudiantes y familias.
                </p>
              </div>
              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f1f3f4', fontSize: '0.82rem', color: '#188038', fontWeight: 700 }}>
                📍 Complejo Deportivo Teleaula
              </div>
            </div>

            {/* EVENTO 3 */}
            <div style={{
              border: '1px solid #e8eaed',
              borderRadius: '22px',
              padding: '28px',
              background: '#ffffff',
              boxShadow: '0 4px 16px rgba(60, 64, 67, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '8px', background: '#fef7e0', color: '#b06000', fontWeight: 800, fontSize: '0.76rem' }}>
                    ADMISIONES 2027
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#5f6368', fontWeight: 700 }}>
                    📅 15 Ene 2027
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#202124', margin: '0 0 10px 0' }}>
                  Jornada de Puertas Abiertas para Nuevos Ingresos
                </h3>
                <p style={{ color: '#5f6368', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  Recorrido guiado por nuestras instalaciones, presentación del plan de estudios y demostración en vivo del aula virtual.
                </p>
              </div>
              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f1f3f4', fontSize: '0.82rem', color: '#b06000', fontWeight: 700 }}>
                📍 Recepción General y Aulas Virtuales
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. SECCIÓN CONTACTO E INFORMACIÓN INSTITUCIONAL
         ======================================================== */}
      <section id="contacto" style={{
        padding: '90px 24px',
        background: '#f8fafd',
        borderTop: '1px solid #e8eaed'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#1a73e8' }}>
              Atención a la Comunidad
            </span>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.4rem', fontWeight: 900, color: '#202124', margin: '8px 0 12px 0' }}>
              Contacto y Ubicación
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: '#5f6368', fontSize: '1.02rem', lineHeight: 1.6 }}>
              Estamos a tu disposición para brindarte asesoría en admisiones, trámites escolares o cualquier inquietud.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '36px',
            alignItems: 'start'
          }}>
            {/* DATOS DE CONTACTO */}
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '36px',
              border: '1px solid #e8eaed',
              boxShadow: '0 8px 24px rgba(60, 64, 67, 0.06)'
            }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.35rem', fontWeight: 800, color: '#202124', margin: '0 0 24px 0' }}>
                Canales de Atención
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#1a73e8', flexShrink: 0 }}>
                    📍
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#202124' }}>Dirección Sede Principal</div>
                    <div style={{ fontSize: '0.86rem', color: '#5f6368', marginTop: '2px', lineHeight: 1.5 }}>
                      Av. Principal de las Ciencias, Edificio Teleaula, Sector Educativo Central.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#188038', flexShrink: 0 }}>
                    📞
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#202124' }}>Teléfonos Directos</div>
                    <div style={{ fontSize: '0.86rem', color: '#5f6368', marginTop: '2px' }}>
                      (0212) 555-0199 / (0212) 555-0188
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef7e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#b06000', flexShrink: 0 }}>
                    ✉️
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#202124' }}>Correo Institucional</div>
                    <div style={{ fontSize: '0.86rem', color: '#5f6368', marginTop: '2px' }}>
                      contacto@teleaula.edu / admisiones@teleaula.edu
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f3e8fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#9334e6', flexShrink: 0 }}>
                    ⏰
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#202124' }}>Horario de Atención</div>
                    <div style={{ fontSize: '0.86rem', color: '#5f6368', marginTop: '2px' }}>
                      Lunes a Viernes de 7:30 AM a 3:30 PM (Jornada Continua)
                    </div>
                  </div>
                </div>
              </div>

              {/* ACCESO RÁPIDO AL SISTEMA EN CONTACTO */}
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f1f3f4', textAlign: 'center' }}>
                <p style={{ fontSize: '0.84rem', color: '#5f6368', margin: '0 0 12px 0' }}>
                  ¿Ya eres miembro de nuestra comunidad educativa?
                </p>
                <button
                  onClick={handleGoToSystem}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #1a73e8',
                    background: '#e8f0fe',
                    color: '#1a73e8',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Ir al Sistema Teleaula (Login)
                </button>
              </div>
            </div>

            {/* FORMULARIO DE MENSAJE */}
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '36px',
              border: '1px solid #e8eaed',
              boxShadow: '0 8px 24px rgba(60, 64, 67, 0.06)'
            }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.35rem', fontWeight: 800, color: '#202124', margin: '0 0 8px 0' }}>
                Envíanos un Mensaje
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#5f6368', margin: '0 0 20px 0' }}>
                Te responderemos a la mayor brevedad a través de correo electrónico.
              </p>

              {contactSent ? (
                <div style={{
                  padding: '28px 20px',
                  borderRadius: '16px',
                  background: '#e6f4ea',
                  color: '#137333',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '0.96rem'
                }}>
                  <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>✅</div>
                  ¡Mensaje enviado con éxito! Nos comunicaremos contigo pronto.
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#5f6368', marginBottom: '4px' }}>Nombre y Apellido *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Pérez"
                      value={contactForm.nombre}
                      onChange={e => setContactForm({ ...contactForm, nombre: e.target.value })}
                      style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #dadce0', padding: '0 12px', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#5f6368', marginBottom: '4px' }}>Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        placeholder="tu@correo.com"
                        value={contactForm.correo}
                        onChange={e => setContactForm({ ...contactForm, correo: e.target.value })}
                        style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #dadce0', padding: '0 12px', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#5f6368', marginBottom: '4px' }}>Teléfono</label>
                      <input
                        type="tel"
                        placeholder="0414-1234567"
                        value={contactForm.telefono}
                        onChange={e => setContactForm({ ...contactForm, telefono: e.target.value })}
                        style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #dadce0', padding: '0 12px', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#5f6368', marginBottom: '4px' }}>Asunto</label>
                    <input
                      type="text"
                      placeholder="Ej. Información sobre proceso de admisión"
                      value={contactForm.asunto}
                      onChange={e => setContactForm({ ...contactForm, asunto: e.target.value })}
                      style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #dadce0', padding: '0 12px', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#5f6368', marginBottom: '4px' }}>Mensaje *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Escribe tu consulta o requerimiento aquí..."
                      value={contactForm.mensaje}
                      onChange={e => setContactForm({ ...contactForm, mensaje: e.target.value })}
                      style={{ width: '100%', borderRadius: '10px', border: '1px solid #dadce0', padding: '10px 12px', fontSize: '0.88rem', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      marginTop: '6px',
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#1a73e8',
                      color: '#ffffff',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '0.94rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(26, 115, 232, 0.25)',
                      transition: 'all 0.2s'
                    }}
                  >
                    Enviar Mensaje
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. FOOTER INSTITUCIONAL
         ======================================================== */}
      <footer style={{
        background: '#202124',
        color: '#e8eaed',
        padding: '50px 24px 30px 24px',
        borderTop: '1px solid #3c4043'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#1a73e8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}>
              🎓
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>
                Complejo Educativo Teleaula
              </div>
              <div style={{ fontSize: '0.76rem', color: '#9aa0a6' }}>
                Portal Institucional, Aula Virtual y Gestión Escolar Integrada
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={handleGoToSystem}
              style={{
                padding: '8px 18px',
                borderRadius: '10px',
                border: '1px solid #5f6368',
                background: '#303134',
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🔐 Acceso Sistema
            </button>
          </div>
        </div>

        <div style={{
          maxWidth: '1280px',
          margin: '28px auto 0 auto',
          paddingTop: '20px',
          borderTop: '1px solid #303134',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: '#9aa0a6',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>© 2026 Teleaula. Todos los derechos reservados.</div>
          <div>Tecnología Educativa y Gestión Institucional</div>
        </div>
      </footer>
    </div>
  );
}
