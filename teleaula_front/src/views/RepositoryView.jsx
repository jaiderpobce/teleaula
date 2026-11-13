import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import apiClient from '../services/apiClient';

export default function RepositoryView() {
  const { showSuccess, showError } = useNotification();

  const [resources, setResources] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Modal subir archivo
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [resourceName, setResourceName] = useState('');
  const [resourceTypeId, setResourceTypeId] = useState('1');
  const [uploading, setUploading] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
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
      fetchResources();
    } else {
      showError(res.message);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.nombreArchivo?.toLowerCase().includes(search.toLowerCase()) ||
                          r.tipoRecurso?.toLowerCase().includes(search.toLowerCase()) ||
                          r.nombreMateria?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !selectedType || r.idTipoRecurso.toString() === selectedType;
    return matchesSearch && matchesType;
  });

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
      {/* HEADER DEL REPOSITORIO */}
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
            <span style={{ fontSize: '1.6rem' }}>📂</span>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>
              Repositorio Digital & Recursos Educativos
            </h2>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Biblioteca institucional de guías PDF, lecturas obligatorias, formatos y material de apoyo.
          </p>
        </div>

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
      </div>

      {/* FILTROS Y BUSCADOR */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-dim)' }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre de archivo, tipo o materia..."
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
            background: '#ffffff'
          }}
        >
          <option value="">Todos los Tipos de Recurso</option>
          {types.map(t => (
            <option key={t.id} value={t.id}>{t.descripcion}</option>
          ))}
        </select>
      </div>

      {/* LISTADO DE RECURSOS DIGITALES */}
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
              <th>Nombre del Documento / Archivo</th>
              <th style={{ width: '180px' }}>Tipo de Recurso</th>
              <th>Materia / Origen</th>
              <th style={{ width: '140px', textAlign: 'center' }}>Descargar / Ver</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  ⏳ Cargando repositorio institucional...
                </td>
              </tr>
            ) : filteredResources.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No hay documentos almacenados en el repositorio. Haz clic en "Subir Documento" para comenzar.
                </td>
              </tr>
            ) : (
              filteredResources.map(r => (
                <tr key={r.id}>
                  <td style={{ textAlign: 'center' }} className="code-col">#{r.id}</td>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📄</span> {r.nombreArchivo}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: '#e8f0fe',
                      color: 'var(--google-blue)',
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}>
                      {r.tipoRecurso}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.84rem' }}>{r.nombreMateria} ({r.nombreActividad})</td>
                  <td style={{ textAlign: 'center' }}>
                    <a
                      href={r.ubicacion}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#e6f4ea',
                        color: '#137333',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.78rem'
                      }}
                    >
                      <span>📥</span> Abrir Archivo
                    </a>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteResource(r.id, r.nombreArchivo)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                      title="Eliminar recurso"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL SUBIR DOCUMENTO */}
      {isUploadModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
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
