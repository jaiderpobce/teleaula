import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import SubmoduleIcon from '../components/common/SubmoduleIcon';
import apiClient from '../services/apiClient';

export default function ClassroomView() {
  const { user, getSubmodules } = useAuth();
  const { showSuccess, showError } = useNotification();
  const dbSubmodules = getSubmodules('/aula');

  const classroomSubmodules = dbSubmodules.length > 0
    ? dbSubmodules.map(s => ({
        id: s.ruta.split('/').pop(),
        label: s.nombre,
        icono: s.icono,
        desc: s.descripcion
      }))
    : [
        { id: 'actividades', label: 'Actividades y Tareas', icono: 'task', desc: 'Creación y asignación de tareas con guías PDF' },
        { id: 'calificaciones', label: 'Calificaciones y Notas', icono: 'grade', desc: 'Registro y asentamiento de notas por sección' },
        { id: 'clases', label: 'Cargas y Asignaturas', icono: 'school', desc: 'Resumen de clases asignadas y materias' }
      ];

  const [activeTab, setActiveTab] = useState('actividades');

  // Estados de Clases y Actividades
  const [loads, setLoads] = useState([]);
  const [loadingLoads, setLoadingLoads] = useState(true);
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

  // Formulario Crear Actividad
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newScore, setNewScore] = useState(20);
  const [selectedFile, setSelectedFile] = useState(null);
  const [creating, setCreating] = useState(false);

  // Planilla de Calificaciones
  const [gradeSheet, setGradeSheet] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);

  // Cargar Cargas Académicas (RSP)
  const fetchLoads = async () => {
    setLoadingLoads(true);
    const res = await apiClient.get('/api/academic-loads');
    if (res.ok && Array.isArray(res.data)) {
      setLoads(res.data);
      if (res.data.length > 0 && !selectedLoadId) {
        setSelectedLoadId(res.data[0].id.toString());
      }
    } else {
      setLoads([]);
      if (!res.ok) {
        showError(res.message || 'No se pudieron cargar las cargas académicas');
      }
    }
    setLoadingLoads(false);
  };

  // Cargar Actividades
  const fetchActivities = async () => {
    setLoading(true);
    setSelectedActivity(null);
    setCurrentPage(1);
    const url = selectedLoadId ? `/api/activities?rspId=${selectedLoadId}` : '/api/activities';
    const res = await apiClient.get(url);
    setLoading(false);
    if (res.ok && Array.isArray(res.data)) {
      setActivities(res.data);
    } else {
      setActivities([]);
      if (!res.ok) {
        showError(res.message || 'No se pudieron cargar las actividades');
      }
    }
  };

  useEffect(() => {
    fetchLoads();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [selectedLoadId]);

  // Manejo de creación de actividad
  const handleCreateActivity = async (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    const score = Number(newScore);
    if (!selectedLoadId || !title || !newDate || !Number.isFinite(score) || score < 1 || score > 100) {
      showError('Todos los campos requeridos deben completarse');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        idRsp: selectedLoadId,
        nombreActividad: title,
        fechaEntrega: newDate,
        puntuacionMax: score
      };

      const res = await apiClient.post('/api/activities', payload);
      if (!res.ok) {
        showError(res.message || 'Error al crear la actividad');
        return;
      }

      let uploadError = '';
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('idActividad', res.data.id);
        formData.append('idTipoRecurso', '1');
        formData.append('nombreRecurso', `Guía: ${title}`);

        try {
          const uploadResponse = await fetch('/api/resources/upload', {
            method: 'POST',
            body: formData
          });
          if (!uploadResponse.ok) {
            const uploadResult = await uploadResponse.json().catch(() => null);
            throw new Error(uploadResult?.message || `Error HTTP ${uploadResponse.status}`);
          }
        } catch (uploadErr) {
          uploadError = uploadErr instanceof Error ? uploadErr.message : 'Error desconocido';
        }
      }

      if (uploadError) {
        showError(`La tarea se creó, pero no se pudo adjuntar el archivo: ${uploadError}`);
      } else {
        showSuccess(selectedFile ? 'Actividad y guía creadas correctamente' : 'Actividad creada correctamente');
      }
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDate('');
      setNewScore(20);
      setSelectedFile(null);
      fetchActivities();
    } finally {
      setCreating(false);
    }
  };

  // Eliminar actividad
  const handleDeleteActivity = async () => {
    if (!selectedActivity) return;
    if (!window.confirm(`¿Seguro que desea eliminar la actividad "${selectedActivity.nombreActividad}"?`)) return;

    const res = await apiClient.delete(`/api/activities/${selectedActivity.id}`);
    if (res.ok) {
      showSuccess('Actividad eliminada con éxito');
      setSelectedActivity(null);
      fetchActivities();
    } else {
      showError(res.message);
    }
  };

  // Abrir planilla de calificaciones
  const handleOpenGradeSheet = async (activity) => {
    const act = activity || selectedActivity;
    if (!act) return;
    setSelectedActivity(act);
    setGradeSheet([]);
    setIsGradeModalOpen(true);
    setLoadingGrades(true);
    try {
      const res = await apiClient.get(`/api/grades/activity/${act.id}`);
      if (res.ok && Array.isArray(res.data)) {
        setGradeSheet(res.data.map(item => ({
          ...item,
          tempCalificacion: item.calificacion !== null ? item.calificacion : '',
          tempComentario: item.comentario || ''
        })));
      } else {
        showError(res.message || 'No se pudo cargar la lista de estudiantes');
      }
    } finally {
      setLoadingGrades(false);
    }
  };

  // Guardar calificaciones
  const handleSaveGrades = async () => {
    if (!selectedActivity) return;

    const gradesToSave = gradeSheet
      .filter(item => item.tempCalificacion !== '' && item.tempCalificacion !== null)
      .map(item => ({ ...item, score: Number(item.tempCalificacion) }));
    const invalidGrade = gradesToSave.some(item =>
      !Number.isFinite(item.score) ||
      item.score < 0 ||
      item.score > Number(selectedActivity.puntuacionMax) ||
      !Number.isInteger(item.score * 2)
    );

    if (gradesToSave.length === 0) {
      showError('Ingresa al menos una calificación antes de guardar');
      return;
    }
    if (invalidGrade) {
      showError(`Las calificaciones deben estar entre 0 y ${selectedActivity.puntuacionMax}, en incrementos de 0.5`);
      return;
    }

    setSavingGrades(true);
    const payload = {
      idActividad: selectedActivity.id,
      grades: gradesToSave.map(item => ({
        idAlumno: item.idAlumno,
        calificacion: item.score,
        comentario: item.tempComentario
      }))
    };

    try {
      const res = await apiClient.post('/api/grades/batch', payload);
      if (res.ok) {
        showSuccess('Calificaciones asentadas correctamente');
        setIsGradeModalOpen(false);
        fetchActivities();
      } else {
        showError(res.message || 'Error al guardar notas');
      }
    } finally {
      setSavingGrades(false);
    }
  };

  const filteredActivities = activities.filter(a =>
    a.nombreActividad?.toLowerCase().includes(search.toLowerCase()) ||
    a.nombreMateria?.toLowerCase().includes(search.toLowerCase()) ||
    a.numeroSeccion?.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = filteredActivities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage);

  const currentTabObj = classroomSubmodules.find(s => s.id === activeTab) || classroomSubmodules[0];

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      minHeight: 'calc(100vh - 65px)',
      background: 'var(--bg-dark)',
      padding: '20px 24px',
      gap: '24px',
      maxWidth: '1500px',
      margin: '0 auto',
      width: '100%'
    }}>
      
      {/* ========================================================
          SIDEBAR LATERAL A LA IZQUIERDA (SUBMÓDULOS DE AULA)
         ======================================================== */}
      <aside style={{
        width: '300px',
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '20px',
        padding: '24px 16px',
        boxShadow: 'var(--shadow-main)',
        display: 'flex',
        flexDirection: 'column',
        height: 'fit-content'
      }}>
        {/* ENCABEZADO DEL SIDEBAR */}
        <div style={{ padding: '0 10px 18px 10px', borderBottom: '1px solid var(--panel-border)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.4rem' }}>🏫</span>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.2rem' }}>
              Aula Virtual
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Panel docente y gestión de tareas escolares
          </p>
        </div>

        {/* LISTA DINÁMICA DE SUBMÓDULOS */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {classroomSubmodules.map((sub) => {
            const isActive = activeTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveTab(sub.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: isActive ? '1px solid #c2e7ff' : '1px solid transparent',
                  background: isActive ? '#e8f0fe' : 'transparent',
                  color: isActive ? 'var(--google-blue)' : 'var(--text-main)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
                  <SubmoduleIcon name={sub.icono} size={19} />
                </span>
                <div style={{ flex: 1 }}>
                  <div>{sub.label}</div>
                  <div style={{ fontSize: '0.7rem', color: isActive ? 'var(--google-blue-dark)' : 'var(--text-dim)', fontWeight: 400 }}>
                    {sub.desc}
                  </div>
                </div>
                {isActive && (
                  <span style={{ color: 'var(--google-blue)', fontSize: '0.9rem', fontWeight: 900 }}>›</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* FILTRO DE ASIGNATURA EN EL SIDEBAR */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--panel-border)' }}>
          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Filtrar Asignatura / Clase:
          </label>
          <select
            value={selectedLoadId}
            onChange={(e) => setSelectedLoadId(e.target.value)}
            className="pos-input"
            style={{
              width: '100%',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--panel-border)',
              padding: '0 8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: '#ffffff'
            }}
          >
            <option value="">Todas las Clases</option>
            {loads.map(load => (
              <option key={load.id} value={load.id}>
                {load.numeroSeccion} — {load.nombreMateria}
              </option>
            ))}
          </select>
        </div>

        {/* PIE DEL SIDEBAR */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--panel-border)', paddingLeft: '8px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Base de Datos Conectada:</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#137333', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#137333', display: 'inline-block' }}></span>
            teleaula_db (MariaDB 10.11)
          </div>
        </div>
      </aside>

      {/* ========================================================
          PANEL PRINCIPAL CONTENEDOR SEGÚN EL SUBMÓDULO ACTIVO
         ======================================================== */}
      <main style={{
        flex: 1,
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '20px',
        padding: '28px 32px',
        boxShadow: 'var(--shadow-main)',
        minHeight: '600px'
      }}>
        {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SubmoduleIcon name={currentTabObj.icono} size={24} /> {currentTabObj.label}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
              {currentTabObj.desc}
            </p>
          </div>

          {/* BOTONERA DINÁMICA UNIFORME */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--google-blue)',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(26, 115, 232, 0.25)'
              }}
            >
              <span>＋</span> Nueva Tarea / Guía
            </button>

            <button
              onClick={() => handleOpenGradeSheet(selectedActivity)}
              disabled={!selectedActivity}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedActivity ? 'var(--google-blue)' : 'var(--panel-border)'),
                background: selectedActivity ? '#e8f0fe' : '#f1f3f4',
                color: selectedActivity ? 'var(--google-blue)' : '#9aa0a6',
                cursor: selectedActivity ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
            >
              <span>📊</span> Calificar Alumnos
            </button>

            <button
              onClick={handleDeleteActivity}
              disabled={!selectedActivity}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedActivity ? '#ea4335' : 'var(--panel-border)'),
                background: selectedActivity ? '#fce8e6' : '#f1f3f4',
                color: selectedActivity ? '#c5221f' : '#9aa0a6',
                cursor: selectedActivity ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
            >
              <span>🗑️</span> Eliminar
            </button>
          </div>
        </div>

        {/* BARRA INFORMATIVA DE SELECCIÓN */}
        {selectedActivity && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#e8f0fe',
            border: '1px solid #c2e7ff',
            padding: '8px 16px',
            borderRadius: '12px',
            marginBottom: '14px',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: 'var(--google-blue)' }}>Seleccionado:</span>
              <span className="code-col" style={{ fontWeight: 700 }}>#{selectedActivity.id}</span>
              <span style={{ fontWeight: 700 }}>{selectedActivity.nombreActividad}</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>{selectedActivity.nombreMateria} ({selectedActivity.numeroSeccion})</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Puntaje: <strong style={{ color: 'var(--google-green)' }}>{selectedActivity.puntuacionMax} pts</strong></span>
            </div>
            <button 
              onClick={() => setSelectedActivity(null)} 
              style={{ background: 'none', border: 'none', color: 'var(--google-blue)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
            >
              ✕ Deseleccionar
            </button>
          </div>
        )}

        {/* BUSCADOR */}
        <div style={{ position: 'relative', width: '100%', marginBottom: '14px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-dim)' }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por título de tarea, materia o sección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pos-input"
            style={{ width: '100%', height: '42px', paddingLeft: '40px', borderRadius: '12px', border: '1px solid var(--panel-border)', fontSize: '0.88rem' }}
          />
        </div>

        {/* TABLA PRINCIPAL DE ACTIVIDADES */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              ⏳ Cargando actividades y tareas escolares...
            </div>
          ) : paginatedActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              No se encontraron actividades registradas. Haz clic en "＋ Nueva Tarea / Guía" para programar una.
            </div>
          ) : (
            <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ width: '50px', textAlign: 'center' }}>ID</th>
                  <th>Actividad / Tarea</th>
                  <th>Materia / Asignatura</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Sección</th>
                  <th>Docente</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Entrega</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Escala Máx</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Calificados</th>
                </tr>
              </thead>
              <tbody>
                {paginatedActivities.map((act) => {
                  const isSelected = selectedActivity?.id === act.id;
                  return (
                    <tr
                      key={act.id}
                      onClick={() => setSelectedActivity(isSelected ? null : act)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? '#e8f0fe' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ textAlign: 'center' }} className="code-col">#{act.id}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {act.nombreActividad}
                        </div>
                        {act.totalRecursos > 0 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--google-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            📎 Guía PDF adjunta
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--google-blue)' }}>{act.nombreMateria}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#e8f0fe', color: 'var(--google-blue)', fontWeight: 800, fontSize: '0.74rem' }}>
                          {act.numeroSeccion}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.84rem' }}>{act.nombreProfesor}</td>
                      <td style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 600 }}>
                        📅 {act.fechaEntrega}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--google-green)' }}>
                        {act.puntuacionMax} pts
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: act.alumnosCalificados > 0 ? '#e6f4ea' : '#f1f3f4', color: act.alumnosCalificados > 0 ? '#137333' : '#5f6368', fontWeight: 700, fontSize: '0.74rem' }}>
                          {act.alumnosCalificados} alumnos
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINACIÓN */}
        {!loading && totalItems > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', padding: '8px 4px', fontSize: '0.84rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>
              Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + itemsPerPage, totalItems)}</strong> de <strong>{totalItems}</strong> tareas
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Anterior</button>
              <span style={{ padding: '4px 8px', fontWeight: 700 }}>{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Siguiente</button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL CREAR NUEVA ACTIVIDAD CON PDF */}
      {isCreateModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsCreateModalOpen(false)} style={{ zIndex: 1100 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                <span>📝</span> Publicar Actividad / Tarea
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateActivity} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!loadingLoads && loads.length === 0 && (
                <div role="alert" style={{ padding: '12px 14px', borderRadius: '10px', background: '#fef7e0', color: '#5f4700', fontSize: '0.84rem' }}>
                  Para publicar una tarea primero registra docentes, materias, secciones y una carga académica en{' '}
                  <Link to="/escolar" style={{ color: 'var(--google-blue)', fontWeight: 700 }}>
                    Gestión Escolar
                  </Link>
                  .
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Asignatura / Sección *
                </label>
                <select
                  value={selectedLoadId}
                  onChange={e => setSelectedLoadId(e.target.value)}
                  required
                  disabled={loadingLoads || loads.length === 0}
                  className="pos-input"
                  style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid var(--panel-border)', padding: '0 10px', fontSize: '0.86rem' }}
                >
                  <option value="">
                    {loadingLoads ? 'Cargando asignaturas...' : loads.length === 0 ? 'No hay cargas académicas disponibles' : 'Seleccione Asignatura...'}
                  </option>
                  {loads.map(load => (
                    <option key={load.id} value={load.id}>
                      {load.numeroSeccion} — {load.nombreMateria} ({load.nombreProfesor})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Título de la Actividad / Tarea *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej. Tarea #1: Ensayo sobre Historia Universal"
                  required
                  className="pos-input"
                  style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid var(--panel-border)', padding: '0 12px', fontSize: '0.86rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Fecha Límite de Entrega *
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    required
                    className="pos-input"
                    style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid var(--panel-border)', padding: '0 10px', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Puntuación Máxima
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={newScore}
                    onChange={e => setNewScore(e.target.value)}
                    required
                    className="pos-input"
                    style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid var(--panel-border)', padding: '0 10px', fontSize: '0.86rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  📎 Adjuntar Guía de Estudio / Material en PDF (Opcional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={e => setSelectedFile(e.target.files[0])}
                  style={{ width: '100%', fontSize: '0.82rem' }}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={creating || loadingLoads || loads.length === 0} className="btn-primary">
                  {creating ? 'Guardando...' : 'Publicar Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PLANILLA DE CALIFICACIONES Y NOTAS */}
      {isGradeModalOpen && selectedActivity && (
        <div className="modal-overlay active" onClick={() => setIsGradeModalOpen(false)} style={{ zIndex: 1100 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📊</span> Asentamiento de Calificaciones
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {selectedActivity.nombreActividad} — Escala Máxima: {selectedActivity.puntuacionMax} pts ({selectedActivity.numeroSeccion})
                </span>
              </div>
              <button onClick={() => setIsGradeModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '16px 24px', overflowY: 'auto', maxHeight: '60vh' }}>
              <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                    <th style={{ width: '110px' }}>Cédula</th>
                    <th>Nombre Completo del Estudiante</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Nota ({selectedActivity.puntuacionMax} max)</th>
                    <th>Observación / Retroalimentación</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeSheet.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        {loadingGrades ? 'Cargando estudiantes...' : (
                          <>
                            No hay alumnos inscritos en esta sección. Registra estudiantes e inscríbelos desde{' '}
                            <Link to="/escolar" style={{ color: 'var(--google-blue)', fontWeight: 700 }}>
                              Gestión Escolar
                            </Link>
                            {' '}→ Matrícula e Inscripciones.
                          </>
                        )}
                      </td>
                    </tr>
                  ) : (
                    gradeSheet.map((item, index) => (
                      <tr key={item.idAlumno}>
                        <td style={{ textAlign: 'center', color: 'var(--text-dim)' }}>{index + 1}</td>
                        <td style={{ fontWeight: 600 }}>{item.cedula}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.nombreAlumno}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            max={selectedActivity.puntuacionMax}
                            step="0.5"
                            value={item.tempCalificacion}
                            onChange={(e) => {
                              const val = e.target.value;
                              setGradeSheet(prev => prev.map(s => s.idAlumno === item.idAlumno ? { ...s, tempCalificacion: val } : s));
                            }}
                            className="pos-input"
                            style={{
                              width: '90px',
                              height: '34px',
                              textAlign: 'center',
                              fontWeight: 800,
                              borderRadius: '8px',
                              border: '1px solid var(--panel-border)',
                              fontSize: '0.9rem',
                              color: item.tempCalificacion >= 10 ? 'var(--google-green)' : 'var(--google-red)'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Comentario pedagógico..."
                            value={item.tempComentario}
                            onChange={(e) => {
                              const val = e.target.value;
                              setGradeSheet(prev => prev.map(s => s.idAlumno === item.idAlumno ? { ...s, tempComentario: val } : s));
                            }}
                            className="pos-input"
                            style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px', fontSize: '0.84rem' }}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid var(--panel-border)' }}>
              <button onClick={() => setIsGradeModalOpen(false)} className="btn-secondary">
                Cerrar
              </button>
              <button onClick={handleSaveGrades} disabled={savingGrades || loadingGrades || gradeSheet.length === 0} className="btn-primary">
                {savingGrades ? 'Guardando Notas...' : '💾 Guardar Calificaciones'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
