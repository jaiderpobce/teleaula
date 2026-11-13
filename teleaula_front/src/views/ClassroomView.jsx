import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import apiClient from '../services/apiClient';

export default function ClassroomView() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [loads, setLoads] = useState([]);
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Formulario Crear Actividad
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newScore, setNewScore] = useState(20);
  const [selectedFile, setSelectedFile] = useState(null);
  const [creating, setCreating] = useState(false);

  // Lista de Estudiantes para Calificar
  const [gradeSheet, setGradeSheet] = useState([]);
  const [savingGrades, setSavingGrades] = useState(false);

  // Cargar Cargas Académicas (RSP)
  const fetchLoads = async () => {
    const res = await apiClient.get('/api/academic-loads');
    if (res.ok && Array.isArray(res.data)) {
      setLoads(res.data);
      if (res.data.length > 0 && !selectedLoadId) {
        setSelectedLoadId(res.data[0].id.toString());
      }
    }
  };

  // Cargar Actividades
  const fetchActivities = async () => {
    setLoading(true);
    const url = selectedLoadId ? `/api/activities?rspId=${selectedLoadId}` : '/api/activities';
    const res = await apiClient.get(url);
    setLoading(false);
    if (res.ok && Array.isArray(res.data)) {
      setActivities(res.data);
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
    if (!selectedLoadId || !newTitle || !newDate) {
      showError('Todos los campos requeridos deben completarse');
      return;
    }

    setCreating(true);
    const payload = {
      idRsp: selectedLoadId,
      nombreActividad: newTitle,
      fechaEntrega: newDate,
      puntuacionMax: newScore
    };

    const res = await apiClient.post('/api/activities', payload);
    if (res.ok) {
      const actId = res.data.id;
      // Si seleccionó archivo PDF o guía, subirlo
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('idActividad', actId);
        formData.append('idTipoRecurso', '1'); // Guía PDF
        formData.append('nombreRecurso', `Guía: ${newTitle}`);

        try {
          await fetch('/api/resources/upload', {
            method: 'POST',
            body: formData
          });
        } catch (uploadErr) {
          console.warn('Error al subir PDF:', uploadErr);
        }
      }

      showSuccess('Actividad y tarea publicadas con éxito');
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDate('');
      setSelectedFile(null);
      fetchActivities();
    } else {
      showError(res.message || 'Error al crear la actividad');
    }
    setCreating(false);
  };

  // Abrir planilla de calificaciones
  const handleOpenGradeSheet = async (activity) => {
    setSelectedActivity(activity);
    setIsGradeModalOpen(true);
    const res = await apiClient.get(`/api/grades/activity/${activity.id}`);
    if (res.ok && Array.isArray(res.data)) {
      setGradeSheet(res.data.map(item => ({
        ...item,
        tempCalificacion: item.calificacion !== null ? item.calificacion : '',
        tempComentario: item.comentario || ''
      })));
    }
  };

  // Guardar calificaciones
  const handleSaveGrades = async () => {
    if (!selectedActivity) return;
    setSavingGrades(true);

    const payload = {
      idActividad: selectedActivity.id,
      grades: gradeSheet.map(item => ({
        idAlumno: item.idAlumno,
        calificacion: item.tempCalificacion,
        comentario: item.tempComentario
      }))
    };

    const res = await apiClient.post('/api/grades/batch', payload);
    setSavingGrades(false);
    if (res.ok) {
      showSuccess('Calificaciones asentadas y guardadas correctamente');
      setIsGradeModalOpen(false);
      fetchActivities();
    } else {
      showError(res.message || 'Error al guardar notas');
    }
  };

  const filteredActivities = activities.filter(a =>
    a.nombreActividad?.toLowerCase().includes(search.toLowerCase()) ||
    a.nombreMateria?.toLowerCase().includes(search.toLowerCase()) ||
    a.numeroSeccion?.toLowerCase().includes(search.toLowerCase())
  );

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
      {/* HEADER DEL MÓDULO */}
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
            <span style={{ fontSize: '1.6rem' }}>🏫</span>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>
              Aula Virtual & Actividades Escolares
            </h2>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Publicación de tareas con guías PDF, recepción de trabajos y asentamiento de notas.
          </p>
        </div>

        {/* SELECTOR DE CLASE / CARGA DOCENTE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Filtrar Asignatura:
          </label>
          <select
            value={selectedLoadId}
            onChange={(e) => setSelectedLoadId(e.target.value)}
            className="pos-input"
            style={{
              height: '40px',
              borderRadius: '10px',
              border: '1px solid var(--panel-border)',
              padding: '0 12px',
              fontSize: '0.86rem',
              fontWeight: 600,
              background: '#ffffff',
              minWidth: '260px'
            }}
          >
            <option value="">Todas las Clases / Asignaturas</option>
            {loads.map(load => (
              <option key={load.id} value={load.id}>
                {load.numeroSeccion} — {load.nombreMateria} ({load.nombreProfesor})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsCreateModalOpen(true)}
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
            <span>＋</span> Nueva Tarea / Guía
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div style={{ position: 'relative', width: '100%' }}>
        <span style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-dim)' }}>🔍</span>
        <input
          type="text"
          placeholder="Buscar por título de tarea, materia o sección..."
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

      {/* GRILLA UNIFORME DE ACTIVIDADES */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '18px',
        padding: '16px',
        boxShadow: 'var(--shadow-main)',
        overflowX: 'auto'
      }}>
        <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
              <th>Actividad / Tarea</th>
              <th>Materia / Asignatura</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Sección</th>
              <th>Docente</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Entrega</th>
              <th style={{ width: '110px', textAlign: 'center' }}>Puntaje Máx</th>
              <th style={{ width: '110px', textAlign: 'center' }}>Calificados</th>
              <th style={{ width: '170px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  ⏳ Cargando actividades y tareas escolares...
                </td>
              </tr>
            ) : filteredActivities.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No se encontraron actividades registradas. Haz clic en "＋ Nueva Tarea / Guía" para programar una.
                </td>
              </tr>
            ) : (
              filteredActivities.map(act => (
                <tr key={act.id}>
                  <td style={{ textAlign: 'center' }} className="code-col">#{act.id}</td>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {act.nombreActividad}
                    </div>
                    {act.totalRecursos > 0 && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--google-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        📎 Guía / Documento PDF adjunto
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--google-blue)' }}>{act.nombreMateria}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#e8f0fe', color: 'var(--google-blue)', fontWeight: 800, fontSize: '0.75rem' }}>
                      {act.numeroSeccion}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.84rem' }}>{act.nombreProfesor}</td>
                  <td style={{ textAlign: 'center', fontSize: '0.84rem', fontWeight: 600 }}>
                    📅 {act.fechaEntrega}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--google-green)' }}>
                    {act.puntuacionMax} pts
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', background: act.alumnosCalificados > 0 ? '#e6f4ea' : '#f1f3f4', color: act.alumnosCalificados > 0 ? '#137333' : '#5f6368', fontWeight: 700, fontSize: '0.75rem' }}>
                      {act.alumnosCalificados} alumnos
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleOpenGradeSheet(act)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--google-blue)',
                        background: '#e8f0fe',
                        color: 'var(--google-blue)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      📊 Calificar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR NUEVA ACTIVIDAD / TAREA CON PDF */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📝</span> Publicar Actividad / Tarea
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateActivity} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Asignatura / Sección *
                </label>
                <select
                  value={selectedLoadId}
                  onChange={e => setSelectedLoadId(e.target.value)}
                  required
                  className="pos-input"
                  style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid var(--panel-border)', padding: '0 10px', fontSize: '0.86rem' }}
                >
                  <option value="">Seleccione Asignatura...</option>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Formatos soportados: PDF, Word, PowerPoint (Máx 50MB)
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? 'Guardando...' : 'Publicar Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PLANILLA DE CALIFICACIONES Y NOTAS */}
      {isGradeModalOpen && selectedActivity && (
        <div className="modal-overlay" onClick={() => setIsGradeModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', maxHeight: '90vh' }}>
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
                        No hay alumnos inscritos en esta sección.
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
                            placeholder="0.00"
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
              <button onClick={handleSaveGrades} disabled={savingGrades || gradeSheet.length === 0} className="btn-primary">
                {savingGrades ? 'Guardando Notas...' : '💾 Guardar Calificaciones'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
