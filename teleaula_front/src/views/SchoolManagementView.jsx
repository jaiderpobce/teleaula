import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import SubmoduleIcon from '../components/common/SubmoduleIcon';
import apiClient from '../services/apiClient';

export default function SchoolManagementView() {
  const { user, getSubmodules } = useAuth();
  const { showSuccess, showError } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const dbSubmodules = getSubmodules('/escolar');

  // Submódulos dinámicos leídos de teleaula_rbac.vistas
  const schoolSubmodules = dbSubmodules.length > 0
    ? dbSubmodules.map(s => ({
        id: s.ruta.split('/').pop().replace('carga-academica', 'cargas'),
        label: s.nombre,
        icono: s.icono,
        desc: s.descripcion
      }))
    : [
        { id: 'alumnos', label: 'Padrón de Estudiantes', icono: 'people', desc: 'Directorio de alumnos matriculados y datos' },
        { id: 'profesores', label: 'Directorio Docente', icono: 'badge', desc: 'Gestión de profesores y especialidades' },
        { id: 'materias', label: 'Materias y Asignaturas', icono: 'menu_book', desc: 'Planes de estudio, códigos y créditos' },
        { id: 'secciones', label: 'Aulas y Secciones', icono: 'meeting_room', desc: 'Grupos escolares y capacidades' },
        { id: 'cargas', label: 'Carga Docente (RSP)', icono: 'co_present', desc: 'Asignación de profesores a secciones' },
        { id: 'inscripciones', label: 'Matrícula e Inscripción', icono: 'how_to_reg', desc: 'Control formal de matrícula por lapso' }
      ];

  const getInitialTab = () => {
    const path = window.location.pathname;
    if (path.includes('/profesores') || path.includes('/docentes')) return 'profesores';
    if (path.includes('/materias')) return 'materias';
    if (path.includes('/secciones')) return 'secciones';
    if (path.includes('/carga')) return 'cargas';
    if (path.includes('/inscripciones')) return 'inscripciones';
    return 'alumnos';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/profesores') || path.includes('/docentes')) setActiveTab('profesores');
    else if (path.includes('/materias')) setActiveTab('materias');
    else if (path.includes('/secciones')) setActiveTab('secciones');
    else if (path.includes('/carga')) setActiveTab('cargas');
    else if (path.includes('/inscripciones')) setActiveTab('inscripciones');
    else if (path.endsWith('/escolar') || path.endsWith('/escolar/alumnos')) setActiveTab('alumnos');
  }, [location.pathname]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    const routeSuffix = tabId === 'cargas' ? 'carga-academica' : tabId;
    navigate(`/escolar/${routeSuffix}`, { replace: true });
  };

  // Datos
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Auxiliares para creación
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);

  // Modales y Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const fetchTabContent = async () => {
    setLoading(true);
    setSelectedItem(null);
    setCurrentPage(1);

    let endpoint = '/api/students';
    if (activeTab === 'profesores') endpoint = '/api/teachers';
    else if (activeTab === 'materias') endpoint = '/api/subjects';
    else if (activeTab === 'secciones') endpoint = '/api/sections';
    else if (activeTab === 'cargas') endpoint = '/api/academic-loads';
    else if (activeTab === 'inscripciones') endpoint = '/api/enrollments';

    const res = await apiClient.get(endpoint);
    setLoading(false);
    if (res.ok && Array.isArray(res.data)) {
      setDataList(res.data);
    } else {
      setDataList([]);
    }
  };

  useEffect(() => {
    fetchTabContent();
  }, [activeTab]);

  const loadDependencies = async () => {
    const [s, t, m, sec] = await Promise.all([
      apiClient.get('/api/students'),
      apiClient.get('/api/teachers'),
      apiClient.get('/api/subjects'),
      apiClient.get('/api/sections')
    ]);
    if (s.ok) setStudents(s.data);
    if (t.ok) setTeachers(t.data);
    if (m.ok) setSubjects(m.data);
    if (sec.ok) setSections(sec.data);
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setFormData({});
    loadDependencies();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedItem) return;
    setIsEditing(true);
    setFormData({ ...selectedItem });
    loadDependencies();
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    let endpoint = '/api/students';
    if (activeTab === 'profesores') endpoint = '/api/teachers';
    else if (activeTab === 'materias') endpoint = '/api/subjects';
    else if (activeTab === 'secciones') endpoint = '/api/sections';
    else if (activeTab === 'cargas') endpoint = '/api/academic-loads';
    else if (activeTab === 'inscripciones') endpoint = '/api/enrollments';

    let res;
    if (isEditing && selectedItem) {
      res = await apiClient.put(`${endpoint}/${selectedItem.id}`, formData);
    } else {
      res = await apiClient.post(endpoint, formData);
    }

    if (res.ok) {
      showSuccess(res.message || (isEditing ? 'Actualización exitosa' : 'Registro exitoso'));
      setIsModalOpen(false);
      fetchTabContent();
    } else {
      showError(res.message || 'Error al guardar');
    }
  };

  const getActionLabel = () => {
    switch (activeTab) {
      case 'profesores': return 'Crear Docente';
      case 'alumnos': return 'Crear Estudiante';
      case 'materias': return 'Crear Materia';
      case 'secciones': return 'Crear Sección';
      case 'cargas': return 'Asignar Carga';
      case 'inscripciones': return 'Nueva Matrícula';
      default: return 'Nuevo Registro';
    }
  };

  const getModalTitle = () => {
    if (isEditing) {
      switch (activeTab) {
        case 'profesores': return `✏️ Editar Docente (#${selectedItem?.id})`;
        case 'alumnos': return `✏️ Editar Estudiante (#${selectedItem?.id})`;
        case 'materias': return `✏️ Editar Materia (#${selectedItem?.id})`;
        case 'secciones': return `✏️ Editar Sección (#${selectedItem?.id})`;
        default: return `✏️ Editar Registro: ${currentTabObj.label}`;
      }
    }
    switch (activeTab) {
      case 'profesores': return '＋ Crear Nuevo Docente';
      case 'alumnos': return '＋ Registrar Estudiante';
      case 'materias': return '＋ Registrar Materia';
      case 'secciones': return '＋ Registrar Sección';
      case 'cargas': return '＋ Asignar Carga Académica';
      case 'inscripciones': return '＋ Formalizar Matrícula';
      default: return `＋ Nuevo Registro: ${currentTabObj.label}`;
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    const name = selectedItem.nombreCompleto || selectedItem.nombreMateria || selectedItem.numeroSeccion || selectedItem.nombreAlumno || 'el elemento seleccionado';
    if (!window.confirm(`¿Seguro que desea eliminar "${name}"?`)) return;

    let endpoint = '/api/students';
    if (activeTab === 'profesores') endpoint = '/api/teachers';
    else if (activeTab === 'materias') endpoint = '/api/subjects';
    else if (activeTab === 'secciones') endpoint = '/api/sections';
    else if (activeTab === 'cargas') endpoint = '/api/academic-loads';
    else if (activeTab === 'inscripciones') endpoint = '/api/enrollments';

    const res = await apiClient.delete(`${endpoint}/${selectedItem.id}`);
    if (res.ok) {
      showSuccess(res.message || 'Eliminado correctamente');
      setSelectedItem(null);
      fetchTabContent();
    } else {
      showError(res.message);
    }
  };

  // Filtrado
  const filteredData = dataList.filter(item => {
    const q = search.toLowerCase();
    if (activeTab === 'alumnos') {
      return item.nombreCompleto?.toLowerCase().includes(q) || item.cedula?.includes(q) || item.correoElectronico?.toLowerCase().includes(q);
    } else if (activeTab === 'profesores') {
      return item.nombreCompleto?.toLowerCase().includes(q) || item.cedula?.includes(q) || item.especialidad?.toLowerCase().includes(q);
    } else if (activeTab === 'materias') {
      return item.nombreMateria?.toLowerCase().includes(q) || item.codigoMateria?.toLowerCase().includes(q);
    } else if (activeTab === 'secciones') {
      return item.numeroSeccion?.toLowerCase().includes(q);
    } else if (activeTab === 'cargas') {
      return item.nombreMateria?.toLowerCase().includes(q) || item.nombreProfesor?.toLowerCase().includes(q) || item.numeroSeccion?.toLowerCase().includes(q);
    } else if (activeTab === 'inscripciones') {
      return item.nombreAlumno?.toLowerCase().includes(q) || item.cedulaAlumno?.includes(q) || item.numeroSeccion?.toLowerCase().includes(q);
    }
    return true;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const currentTabObj = schoolSubmodules.find(s => s.id === activeTab) || schoolSubmodules[0];

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
          SIDEBAR LATERAL A LA IZQUIERDA (SUBMÓDULOS ESCOLARES)
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
            <span style={{ fontSize: '1.4rem' }}>📋</span>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.2rem' }}>
              Gestión Escolar
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Control de matrícula y administración docente
          </p>
        </div>

        {/* LISTA DINÁMICA DE SUBMÓDULOS */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {schoolSubmodules.map((sub) => {
            const isActive = activeTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => handleTabClick(sub.id)}
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

        {/* PIE DEL SIDEBAR */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--panel-border)', paddingLeft: '8px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Base de Datos Conectada:</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#137333', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#137333', display: 'inline-block' }}></span>
            teleaula_db (MariaDB 10.11)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Año Escolar: <strong>2026-2027</strong>
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
              id={activeTab === 'profesores' ? 'btn-crear-docente' : undefined}
              data-testid={activeTab === 'profesores' ? 'btn-crear-docente' : 'btn-nuevo-registro'}
              onClick={handleOpenCreateModal}
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
              <span>＋</span> {getActionLabel()}
            </button>

            {['profesores', 'alumnos', 'materias', 'secciones'].includes(activeTab) && (
              <button
                onClick={handleOpenEditModal}
                disabled={!selectedItem}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  border: '1px solid ' + (selectedItem ? 'var(--google-blue)' : 'var(--panel-border)'),
                  background: selectedItem ? '#e8f0fe' : '#f1f3f4',
                  color: selectedItem ? 'var(--google-blue)' : '#9aa0a6',
                  cursor: selectedItem ? 'pointer' : 'not-allowed',
                  transition: 'var(--transition)'
                }}
              >
                <span>✏️</span> Editar
              </button>
            )}

            <button
              onClick={handleDeleteItem}
              disabled={!selectedItem}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedItem ? '#ea4335' : 'var(--panel-border)'),
                background: selectedItem ? '#fce8e6' : '#f1f3f4',
                color: selectedItem ? '#c5221f' : '#9aa0a6',
                cursor: selectedItem ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
            >
              <span>🗑️</span> Eliminar
            </button>
          </div>
        </div>

        {/* BARRA INFORMATIVA DE SELECCIÓN */}
        {selectedItem && (
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
              <span className="code-col" style={{ fontWeight: 700 }}>#{selectedItem.id}</span>
              <span style={{ fontWeight: 700 }}>
                {selectedItem.nombreCompleto || selectedItem.nombreMateria || selectedItem.numeroSeccion || selectedItem.nombreAlumno}
              </span>
            </div>
            <button 
              onClick={() => setSelectedItem(null)} 
              style={{ background: 'none', border: 'none', color: 'var(--google-blue)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
            >
              ✕ Deseleccionar
            </button>
          </div>
        )}

        {/* BUSCADOR EN TIEMPO REAL */}
        <div style={{ position: 'relative', width: '100%', marginBottom: '14px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-dim)' }}>🔍</span>
          <input
            type="text"
            placeholder={`Buscar en ${currentTabObj.label}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pos-input"
            style={{ width: '100%', height: '42px', paddingLeft: '40px', borderRadius: '12px', border: '1px solid var(--panel-border)', fontSize: '0.88rem' }}
          />
        </div>

        {/* TABLA PRINCIPAL DE DATOS */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              ⏳ Cargando datos desde teleaula_db...
            </div>
          ) : paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              No se encontraron registros. Haz clic en "＋ {getActionLabel()}" para agregar el primero.
            </div>
          ) : (
            <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ width: '50px', textAlign: 'center' }}>ID</th>
                  {activeTab === 'alumnos' && (
                    <>
                      <th style={{ width: '120px' }}>Cédula</th>
                      <th>Nombre Completo</th>
                      <th>Correo Electrónico</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Sección</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Estado</th>
                    </>
                  )}
                  {activeTab === 'profesores' && (
                    <>
                      <th style={{ width: '120px' }}>Cédula</th>
                      <th>Nombre Completo</th>
                      <th>Especialidad / Área</th>
                      <th style={{ width: '150px', textAlign: 'center' }}>Clases Asignadas</th>
                    </>
                  )}
                  {activeTab === 'materias' && (
                    <>
                      <th style={{ width: '140px' }}>Código</th>
                      <th>Nombre de la Materia</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Créditos</th>
                      <th style={{ width: '140px', textAlign: 'center' }}>Secciones Activas</th>
                    </>
                  )}
                  {activeTab === 'secciones' && (
                    <>
                      <th>Identificador de Sección</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Capacidad</th>
                      <th style={{ width: '160px', textAlign: 'center' }}>Alumnos Inscritos</th>
                    </>
                  )}
                  {activeTab === 'cargas' && (
                    <>
                      <th style={{ width: '100px', textAlign: 'center' }}>Sección</th>
                      <th>Materia / Código</th>
                      <th>Docente Responsable</th>
                      <th style={{ width: '110px', textAlign: 'center' }}>Semestre</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Tareas Creadas</th>
                    </>
                  )}
                  {activeTab === 'inscripciones' && (
                    <>
                      <th>Estudiante</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Sección</th>
                      <th>Período Escolar</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Fecha Alta</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Estado</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(isSelected ? null : item)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? '#e8f0fe' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ textAlign: 'center' }} className="code-col">#{item.id}</td>

                      {activeTab === 'alumnos' && (
                        <>
                          <td style={{ fontWeight: 700 }}>{item.cedula}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.nombreCompleto}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{item.correoElectronico}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#e8f0fe', color: 'var(--google-blue)', fontWeight: 800, fontSize: '0.74rem' }}>
                              {item.seccionActual}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#e6f4ea', color: '#137333', fontWeight: 700, fontSize: '0.74rem' }}>
                              {item.estadoInscripcion}
                            </span>
                          </td>
                        </>
                      )}

                      {activeTab === 'profesores' && (
                        <>
                          <td style={{ fontWeight: 700 }}>{item.cedula}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.nombreCompleto}</td>
                          <td>{item.especialidad}</td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--google-blue)' }}>{item.materiasAsignadas} clases</td>
                        </>
                      )}

                      {activeTab === 'materias' && (
                        <>
                          <td style={{ fontWeight: 800, color: 'var(--google-blue)' }}>{item.codigoMateria}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.nombreMateria}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.creditos}</td>
                          <td style={{ textAlign: 'center' }}>{item.totalSecciones} secciones</td>
                        </>
                      )}

                      {activeTab === 'secciones' && (
                        <>
                          <td style={{ fontWeight: 800, color: 'var(--google-blue)' }}>Sección {item.numeroSeccion}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.capacidad} alumnos</td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: item.alumnosInscritos >= item.capacidad ? 'var(--google-red)' : 'var(--google-green)' }}>
                            {item.alumnosInscritos} / {item.capacidad}
                          </td>
                        </>
                      )}

                      {activeTab === 'cargas' && (
                        <>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--google-blue)' }}>{item.numeroSeccion}</td>
                          <td style={{ fontWeight: 700 }}>{item.nombreMateria} ({item.codigoMateria})</td>
                          <td>{item.nombreProfesor}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.semestre}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--google-green)' }}>{item.totalActividades} tareas</td>
                        </>
                      )}

                      {activeTab === 'inscripciones' && (
                        <>
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{item.nombreAlumno}</div>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>C.I: {item.cedulaAlumno}</span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--google-blue)' }}>{item.numeroSeccion}</td>
                          <td>{item.nombrePeriodo}</td>
                          <td style={{ textAlign: 'center', fontSize: '0.84rem' }}>{item.fechaInscripcion}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#e6f4ea', color: '#137333', fontWeight: 700, fontSize: '0.74rem' }}>
                              {item.estadoInscripcion}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* BARRA DE PAGINACIÓN */}
        {!loading && totalItems > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', padding: '8px 4px', fontSize: '0.84rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>
              Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + itemsPerPage, totalItems)}</strong> de <strong>{totalItems}</strong> registros
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Anterior</button>
              <span style={{ padding: '4px 8px', fontWeight: 700 }}>{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Siguiente</button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL CREACIÓN DINÁMICA */}
      {isModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsModalOpen(false)} style={{ zIndex: 1100 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }} data-testid={activeTab === 'profesores' ? 'modal-docente' : 'modal-gestion'}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                {getModalTitle()}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activeTab === 'alumnos' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Nombre Completo *</label>
                    <input type="text" required placeholder="Ej. Juan Pérez" value={formData.nombreCompleto || ''} onChange={e => setFormData({ ...formData, nombreCompleto: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Cédula / Documento *</label>
                    <input type="text" required placeholder="V-12345678" value={formData.cedula || ''} onChange={e => setFormData({ ...formData, cedula: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Correo Electrónico *</label>
                    <input type="email" required placeholder="juan.perez@teleaula.edu" value={formData.correoElectronico || ''} onChange={e => setFormData({ ...formData, correoElectronico: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                </>
              )}

              {activeTab === 'profesores' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Nombre Completo *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej. Prof. Carlos Mendoza" 
                      value={formData.nombreCompleto || ''} 
                      onChange={e => setFormData({ ...formData, nombreCompleto: e.target.value })} 
                      className="pos-input" 
                      style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Cédula / Identificación *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej. V-12345678" 
                      value={formData.cedula || ''} 
                      onChange={e => setFormData({ ...formData, cedula: e.target.value })} 
                      className="pos-input" 
                      style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Especialidad / Área Académica</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Biología, Matemáticas, Ciencias Sociales" 
                      value={formData.especialidad || ''} 
                      onChange={e => setFormData({ ...formData, especialidad: e.target.value })} 
                      className="pos-input" 
                      style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} 
                    />
                  </div>
                </>
              )}

              {activeTab === 'materias' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Nombre Materia *</label>
                    <input type="text" required value={formData.nombreMateria || ''} onChange={e => setFormData({ ...formData, nombreMateria: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Código *</label>
                      <input type="text" required placeholder="BIO-201" value={formData.codigoMateria || ''} onChange={e => setFormData({ ...formData, codigoMateria: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Créditos</label>
                      <input type="number" min="1" max="10" value={formData.creditos || 3} onChange={e => setFormData({ ...formData, creditos: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'secciones' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Número de Sección *</label>
                    <input type="text" required placeholder="Ej. 1-A" value={formData.numeroSeccion || ''} onChange={e => setFormData({ ...formData, numeroSeccion: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Capacidad</label>
                    <input type="number" min="5" max="80" value={formData.capacidad || 35} onChange={e => setFormData({ ...formData, capacidad: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }} />
                  </div>
                </>
              )}

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
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Profesor *</label>
                    <select required value={formData.idProfesor || ''} onChange={e => setFormData({ ...formData, idProfesor: e.target.value })} className="pos-input" style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px' }}>
                      <option value="">Seleccione Profesor...</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.nombreCompleto} ({t.especialidad})</option>)}
                    </select>
                  </div>
                </>
              )}

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
                <button type="submit" className="btn-primary" data-testid="btn-modal-submit">
                  {isEditing 
                    ? (activeTab === 'profesores' ? 'Actualizar Docente' : 'Actualizar') 
                    : (activeTab === 'profesores' ? 'Guardar Docente' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
