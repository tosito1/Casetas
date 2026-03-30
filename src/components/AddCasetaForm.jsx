import React, { useState, useEffect } from 'react';
import './AddCasetaForm.css';

const AddCasetaForm = ({ onAdd, onUpdate, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    calle: '',
    numero: '',
    clase: 'Privada',
    descripcion: '',
    imagen: ''
  });
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with initialData for EDIT mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        calle: initialData.calle || '',
        numero: initialData.numero || '',
        clase: initialData.clase || 'Privada',
        descripcion: initialData.descripcion || '',
        imagen: initialData.imagen || ''
      });
    }
  }, [initialData]);

  const isEdit = !!initialData;

  // Helper to compress image using Canvas
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Optimal for Firestore and mobile
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Quality 0.7 for good balance between size and detail
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
      };
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsCompressing(true);
    const compressedBase64 = await compressImage(file);
    setFormData({ ...formData, imagen: compressedBase64 });
    setIsCompressing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imagen) {
      alert('Por favor, sube una foto de la caseta.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && initialData?.id) {
        await onUpdate(initialData.id, formData);
        alert('¡Caseta actualizada correctamente!');
      } else {
        // Create mode
        await onAdd({ ...formData });
        setFormData({ nombre: '', calle: '', numero: '', clase: 'Privada', descripcion: '', imagen: '' });
        alert('¡Caseta añadida con éxito al Real!');
      }
    } catch (err) {
      console.error("Error al guardar caseta:", err);
      alert(`ERROR: ${err.message || 'No se pudo guardar la caseta.'}`);
      // Important: We DON'T clear the form on error so the user can fix the address/data
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-caseta-container glass-panel fade-in">
      <h2 className="section-title">{isEdit ? 'Editar Caseta' : 'Nueva Caseta del Real'}</h2>
      <p>{isEdit ? `Modificando los datos de: ${initialData.nombre}` : 'Completa los datos para asignar un nuevo espacio en la feria.'}</p>

      <form className="caseta-form" onSubmit={handleSubmit}>
        <div className="form-group upload-section">
          <label>Foto de la Caseta</label>
          <div className="image-upload-wrapper">
            {formData.imagen ? (
              <div className="image-preview-container">
                <img src={formData.imagen} alt="Preview" className="upload-preview" />
                <button 
                  type="button" 
                  className="remove-image-btn"
                  onClick={() => setFormData({...formData, imagen: ''})}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="upload-placeholder">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                <span className="upload-icon">📸</span>
                <span className="upload-text">
                  {isCompressing ? 'Comprimiendo...' : 'Haz click para subir foto'}
                </span>
                <span className="upload-hint">Formatos: JPG, PNG (Máx 1MB recomendado)</span>
              </label>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Nombre de la Caseta</label>
          <input 
            type="text" 
            required 
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            placeholder="Ej: Los Claveles de Mayo"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Calle</label>
            <input 
              type="text" 
              required 
              value={formData.calle}
              onChange={(e) => setFormData({...formData, calle: e.target.value})}
              placeholder="Ej: Antonio Bienvenida"
            />
          </div>
          <div className="form-group mini">
            <label>Número</label>
            <input 
              type="number" 
              required 
              value={formData.numero}
              onChange={(e) => setFormData({...formData, numero: e.target.value})}
              placeholder="42"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Clase de Caseta</label>
          <select 
            value={formData.clase} 
            onChange={(e) => setFormData({...formData, clase: e.target.value})}
          >
            <option>Publica</option>
            <option>Privada</option>
            <option>Peña</option>
          </select>
        </div>

        <div className="form-group">
          <label>Descripción / Historia</label>
          <textarea 
            rows="3"
            value={formData.descripcion}
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
            placeholder="Breve historia o descripción de la caseta..."
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn feria-gradient" 
            disabled={isCompressing || isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : (isCompressing ? 'Procesando...' : (isEdit ? 'Guardar Cambios' : 'Añadir al Mapa'))}
          </button>
          {isEdit && (
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddCasetaForm;
