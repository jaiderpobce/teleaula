import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import apiClient from '../services/apiClient';

export default function SchoolManagementView() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState('alumnos');

  // Estados de datos
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [loads, setLoads] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({});

  const fetchTabContent = async () => {
    setLoading(true);
    setSearch('');
    if (activeTab === 'alumnos') {
      const res = await apiClient.get('/api/students');
      if (res.ok) setStudents(res.data);
    } else if (activeTab === 'profesores') {
      const res = await apiClient.get('/api/teachers');
      if (res.ok) setTeachers(res.data);
    } else if (activeTab === 'materias') {
      const res = await apiClient.get('/api/subjects');
      if (res.ok) setSubjects(res.data);
    } else if (activeTab === 'secciones') {
      const res = await apiClient.get('/api/sections');
      if (res.ok) setSections(res.data);
    } else if (activeTab === 'cargas') {
      const res = await apiClient.get('/api/academic-loads');
      if (res.ok) setLoads(res.data);
    } else if (activeTab === 'inscripciones') {
      const res = await apiClient.get('/api/enrollments');
      if (res.ok) setEnrollments(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTabContent();
  }, [activeTab]);

  // Cargar dependencias para modales de asignación
  const loadDependencies = async () => {
    const s = await apiClient.get('/api/students');
    if (s.ok) setStudents(s.data);
    const t = await apiClient.get('/api/teachers');
    if (t.ok) setTeachers(t.data);
    const m = await apiClient.get('/api/subjects');
    if (m.ok) setSubjects(m.data);
    const sec = await apiClient.get('/api/sections');
    if (sec.ok) setSections(sec.data);
  };

  const handleOpenCreateModal = () => {
    setFormData({});
    loadDependencies();
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    let res;
    if (activeTab === 'alumnos') {
      res = await apiClient.post('/api/students', formData);
    } else if (activeTab === 'profesores') {
      res = await apiClient.post('/api/teachers', formData);
    } else if (activeTab === 'materias') {
      res = await apiClient.post('/api/subjects', formData);
    } else if (activeTab === 'secciones') {
      res = await apiClient.post('/api/sections', formData);
    } else if (activeTab === 'cargas') {
      res = await apiClient.post('/api/academic-loads', formData);
    } else if (activeTab === 'inscripciones') {
      res = await apiClient.post('/api/enrollments', formData);
    }

    if (res && res.ok) {
      showSuccess(res.message || 'Registro exitoso');
      setIsModalOpen(false);
      fetchTabContent();
    } else {
      showError(res ? res.message : 'Error al procesar la solicitud');
    }
  };

  const handleDeleteItem = async (endpoint, id, name) => {
    if (!window.confirm(`¿Seguro que desea eliminar "${name}"?`)) return;
    const res = await apiClient.delete(`${endpoint}/${id}`);
    if (res.ok) {
      showSuccess(res.message || 'Eliminado correctamente');
      fetchTabContent();
    } else {
      showError(res.message);
    }
  };

  const tabs = [
    { id: 'alumnos', label: 'Estudiantes', icon: '👥' },
    { id: 'profesores', label: 'Docentes', icon: '👨‍🏫' },
    { id: 'materias', label: 'Materias', icon: '📖' },
    { id: 'secciones', label: 'Secciones', icon: '🚪' },
    { id: 'cargas', label: 'Carga Docente (RSP)', icon: '📋' },
    { id: 'inscripciones', label: 'Matrícula', icon: '✍️' }
  ];

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '24px 20px',
      minHeight: 'calc(100vh - 65px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* HEADER DE GESTIÓN ESCOLAR */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '18px',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-main)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>📋</span>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>
              Gestión Escolar & Control de Matrícula
            </h2>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Padrón de estudiantes, profesores, asignaturas, secciones y formalización de inscripciones.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--google-blue)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(26, 115, 232, 0.3)'
          }}
        >
          <span>＋</span> Nuevo Registro
        </button>
      </div>

      {/* TABS DE SUBMÓDULOS ESCOLARES */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid ' + (isActive ? 'var(--google-blue)' : 'var(--panel-border)'),
                background: isActive ? '#e8f0fe' : '#ffffff',
                color: isActive ? 'var(--google-blue)' : 'var(--text-main)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          );
        })}
      </div>

      {/* BUSCADOR */}
      <div style={{ position: 'relative', width: '100%' }}>
        <span style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-dim)' }}>🔍</span>
        <input
          type="text"
          placeholder={`Buscar en ${tabs.find(t => t.id === activeTab)?.label}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pos-input"
          style={{
            width: '100%',
            height: '42px',
            paddingLeft: '40px',
            paddingRight: '14px',
            borderRadius: '12px',
            border: '1px solid var(--panel-border)',
            fontSize: '0.88rem'
          }}
        />
      </div>

      {/* CONTENIDO DE TABLAS SEGÚN TAB ACTIVA */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '18px',
        padding: '16px',
        boxShadow: 'var(--shadow-main)',
        overflowX: 'auto'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
            ⏳ Cargando registros...
          </div>
        ) : (
          <>
            {/* 1. TAB ESTUDIANTES */}
            {activeTab === 'alumnos' && (
              <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                    <th style={{ width: '130px' }}>Cédula</th>
                    <th>Nombre Completo</th>
                    <th>Correo Electrónico</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Sección</th>
                    <th style={{ width: '140px', textAlign: 'center' }}>Estado</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.nombreCompleto?.toLowerCase().includes(search.toLowerCase()) || s.cedula?.includes(search)).map(s => (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center' }} className="code-col">#{s.id}</td>
                      <td style={{ fontWeight: 700 }}>{s.cedula}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.nombreCompleto}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{s.correoElectronico}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#e8f0fe', color: 'var(--google-blue)', fontWeight: 800, fontSize: '0.74rem' }}>
                          {s.seccionActual}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#e6f4ea', color: '#137333', fontWeight: 700, fontSize: '0.74rem' }}>
                          {s.estadoInscripcion}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleDeleteItem('/api/students', s.id, s.nombreCompleto)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Eliminar estudiante">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. TAB DOCENTES */}
            {activeTab === 'profesores' && (
              <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                    <th style={{ width: '130px' }}>Cédula</th>
                    <th>Nombre y Apellido</th>
                    <th>Especialidad / Área</th>
                    <th style={{ width: '150px', textAlign: 'center' }}>Clases Asignadas</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.filter(t => t.nombreCompleto?.toLowerCase().includes(search.toLowerCase()) || t.especialidad?.toLowerCase().includes(search.toLowerCase())).map(t => (
                    <tr key={t.id}>
                      <td style={{ textAlign: 'center' }} className="code-col">#{t.id}</td>
                      <td style={{ fontWeight: 700 }}>{t.cedula}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.nombreCompleto}</td>
                      <td>{t.especialidad}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--google-blue)' }}>{t.materiasAsignadas} asignadas</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleDeleteItem('/api/teachers', t.id, t.nombreCompleto)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Eliminar profesor">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. TAB MATERIAS */}
            {activeTab === 'materias' && (
              <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                    <th style={{ width: '140px' }}>Código Asignatura</th>
                    <th>Nombre de la Materia</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Créditos</th>
                    <th style={{ width: '140px', textAlign: 'center' }}>Secciones Activas</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.filter(m => m.nombreMateria?.toLowerCase().includes(search.toLowerCase()) || m.codigoMateria?.toLowerCase().includes(search.toLowerCase())).map(m => (
                    <tr key={m.id}>
                      <td style={{ textAlign: 'center' }} className="code-col">#{m.id}</td>
                      <td style={{ fontWeight: 800, color: 'var(--google-blue)' }}>{m.codigoMateria}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{m.nombreMateria}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{m.creditos}</td>
                      <td style={{ textAlign: 'center' }}>{m.totalSecciones} secciones</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleDeleteItem('/api/subjects', m.id, m.nombreMateria)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Eliminar materia">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. TAB SECCIONES */}
            {activeTab === 'secciones' && (
              <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                    <th>Identificador / Número de Sección</th>
                    <th style={{ width: '140px', textAlign: 'center' }}>Capacidad</th>
                    <th style={{ width: '160px', textAlign: 'center' }}>Alumnos Inscritos</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.filter(sec => sec.numeroSeccion?.toLowerCase().includes(search.toLowerCase())).map(sec => (
                    <tr key={sec.id}>
                      <td style={{ textAlign: 'center' }} className="code-col">#{sec.id}</td>
                      <td style={{ fontWeight: 800, color: 'var(--google-blue)' }}>Sección {sec.numeroSeccion}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{sec.capacidad} estudiantes</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: sec.alumnosInscritos >= sec.capacidad ? 'var(--google-red)' : 'var(--google-green)' }}>
                        {sec.alumnosInscritos} / {sec.capacidad}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleDeleteItem('/api/sections', sec.id, sec.numeroSeccion)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Eliminar sección">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 5. TAB CARGA DOCENTE (RSP) */}
            {activeTab === 'cargas' && (
              <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Sección</th>
                    <th>Materia / Código</th>
                    <th>Docente Responsable</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Semestre</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Tareas Creadas</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {loads.filter(l => l.nombreMateria?.toLowerCase().includes(search.toLowerCase()) || l.nombreProfesor?.toLowerCase().includes(search.toLowerCase())).map(l => (
                    <tr key={l.id}>
                      <td style={{ textAlign: 'center' }} className="code-col">#{l.id}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--google-blue)' }}>{l.numeroSeccion}</td>
                      <td style={{ fontWeight: 700 }}>{l.nombreMateria} ({l.codigoMateria})</td>
                      <td>{l.nombreProfesor}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{l.semestre}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--google-green)' }}>{l.totalActividades} tareas</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleDeleteItem('/api/academic-loads', l.id, `${l.nombreMateria} - ${l.numeroSeccion}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Eliminar carga académica">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 6. TAB MATRÍCULA E INSCRIPCIONES */}
            {activeTab === 'inscripciones' && (
              <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                    <th>Estudiante</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Sección</th>
                    <th>Período Escolar</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Fecha Inscripción</th>
                    <th style={{ width: '140px', textAlign: 'center' }}>Estado</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.filter(e => e.nombreAlumno?.toLowerCase().includes(search.toLowerCase()) || e.cedulaAlumno?.includes(search)).map(e => (
                    <tr key={e.id}>
                      <td style={{ textAlign: 'center' }} className="code-col">#{e.id}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{e.nombreAlumno}</div>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>C.I: {e.cedulaAlumno}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--google-blue)' }}>{e.numeroSeccion}</td>
                      <td>{e.nombrePeriodo}</td>
                      <td style={{ textAlign: 'center', fontSize: '0.84rem' }}>{e.fechaInscripcion}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#e6f4ea', color: '#137333', fontWeight: 700, fontSize: '0.74rem' }}>
                          {e.estadoInscripcion}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleDeleteItem('/api/enrollments', e.id, `Inscripción ${e.nombreAlumno}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Cancelar matrícula">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* MODAL CREACIÓN DINÁMICA SEGÚN TAB */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                ＋ Nuevo Registro: {tabs.find(t => t.id === activeTab)?.label}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Formulario Estudiante */}
              {activeTab === 'alumnos' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Nombre Completo *</label>
                    <input type="text" required value={formData.nombreCompleto || ''} onChange={e => setFormData({ ...formData, nombreCompleto: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Cédula / Documento de Identidad *</label>
                    <input type="text" required placeholder="V-12345678" value={formData.cedula || ''} onChange={e => setFormData({ ...formData, cedula: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Correo Electrónico *</label>
                    <input type="email" required value={formData.correoElectronico || ''} onChange={e => setFormData({ ...formData, correoElectronico: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                </>
              )}

              {/* Formulario Docente */}
              {activeTab === 'profesores' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Nombre y Apellido *</label>
                    <input type="text" required value={formData.nombreCompleto || ''} onChange={e => setFormData({ ...formData, nombreCompleto: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Cédula *</label>
                    <input type="text" required placeholder="V-12345678" value={formData.cedula || ''} onChange={e => setFormData({ ...formData, cedula: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Especialidad / Departamento</label>
                    <input type="text" placeholder="Ej. Matemáticas, Ciencias, Lenguaje" value={formData.especialidad || ''} onChange={e => setFormData({ ...formData, especialidad: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                </>
              )}

              {/* Formulario Materia */}
              {activeTab === 'materias' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Nombre de la Materia *</label>
                    <input type="text" required value={formData.nombreMateria || ''} onChange={e => setFormData({ ...formData, nombreMateria: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Código *</label>
                      <input type="text" required placeholder="MAT-101" value={formData.codigoMateria || ''} onChange={e => setFormData({ ...formData, codigoMateria: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Créditos</label>
                      <input type="number" min="1" max="10" value={formData.creditos || 3} onChange={e => setFormData({ ...formData, creditos: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                    </div>
                  </div>
                </>
              )}

              {/* Formulario Sección */}
              {activeTab === 'secciones' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Identificador de Sección *</label>
                    <input type="text" required placeholder="Ej. 1-A, 2-B, 5-U" value={formData.numeroSeccion || ''} onChange={e => setFormData({ ...formData, numeroSeccion: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Capacidad de Alumnos</label>
                    <input type="number" min="5" max="80" value={formData.capacidad || 35} onChange={e => setFormData({ ...formData, capacidad: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                </>
              )}

              {/* Formulario Carga Académica RSP */}
              {activeTab === 'cargas' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Sección *</label>
                    <select required value={formData.idSeccion || ''} onChange={e => setFormData({ ...formData, idSeccion: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }}>
                      <option value="">Seleccione Sección...</option>
                      {sections.map(s => <option key={s.id} value={s.id}>Sección {s.numeroSeccion}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Materia *</label>
                    <select required value={formData.idMateria || ''} onChange={e => setFormData({ ...formData, idMateria: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }}>
                      <option value="">Seleccione Materia...</option>
                      {subjects.map(m => <option key={m.id} value={m.id}>{m.nombreMateria} ({m.codigoMateria})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Docente Responsable *</label>
                    <select required value={formData.idProfesor || ''} onChange={e => setFormData({ ...formData, idProfesor: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }}>
                      <option value="">Seleccione Profesor...</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.nombreCompleto} ({t.especialidad})</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* Formulario Matrícula */}
              {activeTab === 'inscripciones' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Estudiante *</label>
                    <select required value={formData.idAlumno || ''} onChange={e => setFormData({ ...formData, idAlumno: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }}>
                      <option value="">Seleccione Estudiante...</option>
                      {students.map(st => <option key={st.id} value={st.id}>{st.nombreCompleto} ({st.cedula})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Sección Asignada *</label>
                    <select required value={formData.idSeccion || ''} onChange={e => setFormData({ ...formData, idSeccion: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }}>
                      <option value="">Seleccione Sección...</option>
                      {sections.map(s => <option key={s.id} value={s.id}>Sección {s.numeroSeccion}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
