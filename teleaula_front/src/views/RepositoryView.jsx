import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import SubmoduleIcon from '../components/common/SubmoduleIcon';
import apiClient from '../services/apiClient';

export default function RepositoryView() {
  const { user, getSubmodules } = useAuth();
  const { showSuccess, showError } = useNotification();
  const dbSubmodules = getSubmodules('/repositorio');

  // Submódulos dinámicos leídos de teleaula_rbac.vistas (con fallback completo)
  const repoSubmodules = dbSubmodules.length > 0
    ? dbSubmodules.map(s => ({
        id: s.ruta.split('/').pop().replace('repositorio', 'todos'),
        label: s.nombre,
        icono: s.icono,
        desc: s.descripcion
      }))
    : [
        { id: 'todos', label: 'Todos los Recursos', icono: 'folder_open', desc: 'Colección completa de archivos y materiales' },
        { id: 'guias', label: 'Guías y Tareas en PDF', icono: 'picture_as_pdf', desc: 'Guías de estudio y material en PDF' },
        { id: 'lecturas', label: 'Lecturas y Libros', icono: 'menu_book', desc: 'Libros de texto y lecturas recomendadas' },
        { id: 'formatos', label: 'Formatos Institucionales', icono: 'description', desc: 'Formatos administrativos y actas de secretaría' }
      ];

  const [activeTab, setActiveTab] = useState('todos');

  // Estados de recursos
  const [resources, setResources] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal subir archivo
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [resourceName, setResourceName] = useState('');
  const [resourceTypeId, setResourceTypeId] = useState('1');
  const [uploading, setUploading] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    setSelectedResource(null);
    const res = await apiClient.get('/api/resources');
    setLoading(false);
    if (res.ok && Array.isArray(res.data)) {
      setResources(res.data);
    }
  };

  const fetchTypes = async () => {
    const res = await apiClient.get('/api/resources/types');
    if (res.ok && Array.isArray(res.data)) {
      setTypes(res.data);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchTypes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedResource(null);
  }, [activeTab, search, selectedType]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!fileToUpload) {
      showError('Por favor seleccione un archivo para subir');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('idTipoRecurso', resourceTypeId);
    if (resourceName) formData.append('nombreRecurso', resourceName);

    try {
      const response = await fetch('/api/resources/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setUploading(false);

      if (response.ok) {
        showSuccess('Recurso digital cargado exitosamente');
        setIsUploadModalOpen(false);
        setFileToUpload(null);
        setResourceName('');
        fetchResources();
      } else {
        showError(data.message || 'Error al subir el archivo');
      }
    } catch (err) {
      setUploading(false);
      showError('Error de red al intentar subir el archivo');
    }
  };

  const handleDeleteResource = async (id, name) => {
    if (!window.confirm(`¿Seguro que desea eliminar el archivo "${name}"?`)) return;
    const res = await apiClient.delete(`/api/resources/${id}`);
    if (res.ok) {
      showSuccess('Archivo eliminado del repositorio');
      if (selectedResource && selectedResource.id === id) {
        setSelectedResource(null);
      }
      fetchResources();
    } else {
      showError(res.message);
    }
  };

  // Filtrado según subpestaña y búsqueda
  const filteredResources = resources.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch =
      (r.nombreArchivo && r.nombreArchivo.toLowerCase().includes(q)) ||
      (r.tipoRecurso && r.tipoRecurso.toLowerCase().includes(q)) ||
      (r.nombreMateria && r.nombreMateria.toLowerCase().includes(q)) ||
      (r.nombreActividad && r.nombreActividad.toLowerCase().includes(q));

    let matchesTab = true;
    const tipo = (r.tipoRecurso || '').toLowerCase();
    if (activeTab === 'guias') {
      matchesTab = tipo.includes('guía') || tipo.includes('pdf') || tipo.includes('guia') || (r.nombreArchivo || '').endsWith('.pdf');
    } else if (activeTab === 'lecturas') {
      matchesTab = tipo.includes('lectura') || tipo.includes('libro') || tipo.includes('presentación') || tipo.includes('slides');
    } else if (activeTab === 'formatos') {
      matchesTab = tipo.includes('formato') || tipo.includes('administrativo') || tipo.includes('acta') || tipo.includes('doc');
    }

    const matchesType = !selectedType || r.idTipoRecurso?.toString() === selectedType;

    return matchesSearch && matchesTab && matchesType;
  });

  const totalItems = filteredResources.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResources = filteredResources.slice(startIndex, startIndex + itemsPerPage);

  const getSubmoduleTitle = () => {
    const item = repoSubmodules.find(s => s.id === activeTab);
    return item ? item.label : 'Repositorio Digital';
  };

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
          SIDEBAR LATERAL A LA IZQUIERDA (SUBMÓDULOS DEL REPOSITORIO)
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
            <span style={{ fontSize: '1.4rem' }}>📂</span>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.2rem' }}>
              Repositorio Digital
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Biblioteca institucional de guías PDF y recursos didácticos
          </p>
        </div>

        {/* LISTA DINÁMICA DE SUBMÓDULOS */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {repoSubmodules.map((sub) => {
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

        {/* PIE DEL SIDEBAR */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--panel-border)', paddingLeft: '8px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Base de Datos Conectada:</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#137333', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#137333', display: 'inline-block' }}></span>
            teleaula_db (MariaDB 10.11)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Total en Repositorio: <strong>{resources.length} recursos</strong>
          </div>
        </div>
      </aside>

      {/* ========================================================
          PANEL PRINCIPAL CONTENEDOR DE RECURSOS
         ======================================================== */}
      <main style={{
        flex: 1,
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: 'var(--shadow-main)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        minWidth: 0
      }}>

        {/* HEADER Y ACCIONES SUPERIORES */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid var(--panel-border)',
          paddingBottom: '18px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>📚</span>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', margin: 0, fontSize: '1.35rem', color: 'var(--text-main)' }}>
                {getSubmoduleTitle()}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              Descarga, consulta y administra el material de apoyo educativo y guías de clase
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsUploadModalOpen(true)}
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
              <span>⬆️</span> Subir Documento / PDF
            </button>

            {selectedResource && (
              <>
                <a
                  href={selectedResource.ubicacion}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '12px',
                    border: '1px solid #137333',
                    background: '#e6f4ea',
                    color: '#137333',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    textDecoration: 'none'
                  }}
                >
                  <span>📥</span> Descargar / Ver
                </a>

                <button
                  onClick={() => handleDeleteResource(selectedResource.id, selectedResource.nombreArchivo)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '12px',
                    border: '1px solid #d93025',
                    background: '#fce8e6',
                    color: '#d93025',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>🗑️</span> Eliminar
                </button>
              </>
            )}
          </div>
        </div>

        {/* BARRA DE SELECCIÓN ACTIVA */}
        {selectedResource && (
          <div style={{
            background: '#e8f0fe',
            border: '1px solid #c2e7ff',
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.88rem',
            color: 'var(--google-blue)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📌</span>
              <span>
                Recurso seleccionado: <strong>{selectedResource.nombreArchivo}</strong> ({selectedResource.tipoRecurso || 'Archivo'})
              </span>
            </div>
            <button
              onClick={() => setSelectedResource(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--google-blue)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.84rem'
              }}
            >
              ✕ Deseleccionar
            </button>
          </div>
        )}

        {/* BUSCADOR Y FILTRO DE CATEGORÍAS */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-dim)' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre de archivo, materia, actividad..."
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

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="pos-input"
            style={{
              height: '42px',
              borderRadius: '12px',
              border: '1px solid var(--panel-border)',
              padding: '0 12px',
              fontSize: '0.86rem',
              fontWeight: 600,
              background: '#ffffff',
              minWidth: '220px'
            }}
          >
            <option value="">Todos los Tipos de Recurso</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.descripcion}</option>
            ))}
          </select>
        </div>

        {/* TABLA DE RECURSOS DIGITALES */}
        <div style={{
          border: '1px solid var(--panel-border)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ width: '45px', textAlign: 'center' }}></th>
                <th style={{ width: '70px', textAlign: 'center' }}>ID</th>
                <th>Nombre del Documento / Archivo</th>
                <th style={{ width: '200px' }}>Tipo / Categoría</th>
                <th>Materia / Actividad</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Descargar</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    ⏳ Cargando repositorio institucional...
                  </td>
                </tr>
              ) : paginatedResources.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No se encontraron documentos en esta sección. Haz clic en "Subir Documento" para agregar material.
                  </td>
                </tr>
              ) : (
                paginatedResources.map(r => {
                  const isSelected = selectedResource && selectedResource.id === r.id;
                  const isPdf = (r.nombreArchivo || '').toLowerCase().endsWith('.pdf');
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedResource(isSelected ? null : r)}
                      style={{
                        background: isSelected ? '#f0f7ff' : 'transparent',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelectedResource(isSelected ? null : r)}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }} className="code-col">#{r.id}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>{isPdf ? '📕' : '📄'}</span>
                          <span>{r.nombreArchivo}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '8px',
                          background: '#e8f0fe',
                          color: 'var(--google-blue)',
                          fontWeight: 700,
                          fontSize: '0.76rem'
                        }}>
                          {r.tipoRecurso || 'Documento'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.84rem' }}>
                        {r.nombreMateria ? (
                          <div>
                            <strong>{r.nombreMateria}</strong>
                            {r.nombreActividad && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                                Tarea: {r.nombreActividad}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>Material General</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <a
                          href={r.ubicacion}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: '#e6f4ea',
                            color: '#137333',
                            textDecoration: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}
                        >
                          <span>📥</span> Abrir
                        </a>
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteResource(r.id, r.nombreArchivo)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                          title="Eliminar recurso"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {totalItems > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '8px'
          }}>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} recursos
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="pos-input"
                style={{ height: '32px', borderRadius: '8px', border: '1px solid var(--panel-border)', fontSize: '0.8rem', padding: '0 6px' }}
              >
                <option value={5}>5 por pág.</option>
                <option value={10}>10 por pág.</option>
                <option value={20}>20 por pág.</option>
              </select>

              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--panel-border)',
                  background: currentPage === 1 ? '#f8f9fa' : '#ffffff',
                  color: currentPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                  cursor: currentPage === 1 ? 'default' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
              >
                ◀ Anterior
              </button>

              <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--panel-border)',
                  background: currentPage >= totalPages ? '#f8f9fa' : '#ffffff',
                  color: currentPage >= totalPages ? 'var(--text-dim)' : 'var(--text-main)',
                  cursor: currentPage >= totalPages ? 'default' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
              >
                Siguiente ▶
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================
          MODAL SUBIR DOCUMENTO
         ======================================================== */}
      {isUploadModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                <span>⬆️</span> Subir Documento al Repositorio
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Seleccionar Archivo (PDF, Word, PPTX, etc.) *
                </label>
                <input
                  type="file"
                  required
                  onChange={e => setFileToUpload(e.target.files[0])}
                  style={{ width: '100%', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Nombre Descriptivo del Recurso (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Guía Práctica de Química - Tema 2"
                  value={resourceName}
                  onChange={e => setResourceName(e.target.value)}
                  className="pos-input"
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px', fontSize: '0.86rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Tipo de Recurso *
                </label>
                <select
                  value={resourceTypeId}
                  onChange={e => setResourceTypeId(e.target.value)}
                  required
                  className="pos-input"
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--panel-border)', padding: '0 10px', fontSize: '0.86rem' }}
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.descripcion}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={uploading} className="btn-primary">
                  {uploading ? 'Subiendo...' : 'Subir Archivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
