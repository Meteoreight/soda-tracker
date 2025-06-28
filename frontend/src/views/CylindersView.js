import React, { useState, useEffect } from 'react';
import { cylindersApi } from '../services/api';

const CylindersView = () => {
  const [cylinders, setCylinders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCylinder, setEditingCylinder] = useState(null);
  const [dateRanges, setDateRanges] = useState({});
  
  const [formData, setFormData] = useState({
    number: '',
    cost: 0,
  });

  useEffect(() => {
    loadCylinders();
  }, []);

  const loadCylinders = async () => {
    try {
      setLoading(true);
      const response = await cylindersApi.getAll();
      setCylinders(response.data);
      
      // Load date ranges for each cylinder
      const ranges = {};
      for (const cylinder of response.data) {
        try {
          const dateResponse = await cylindersApi.getDateRange(cylinder.id);
          ranges[cylinder.id] = dateResponse.data;
        } catch (err) {
          ranges[cylinder.id] = { start_date: null, end_date: null };
        }
      }
      setDateRanges(ranges);
      
      setError(null);
    } catch (err) {
      setError('Failed to load cylinders');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCylinder) {
        await cylindersApi.update(editingCylinder.id, { cost: parseFloat(formData.cost) });
        setSuccess('Cylinder updated successfully!');
        setEditingCylinder(null);
      } else {
        await cylindersApi.create({
          number: parseInt(formData.number),
          cost: parseFloat(formData.cost),
        });
        setSuccess('Cylinder created successfully!');
        setShowAddForm(false);
      }
      
      loadCylinders();
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save cylinder');
      console.error('Save error:', err);
    }
  };

  const handleEdit = (cylinder) => {
    setEditingCylinder(cylinder);
    setFormData({
      number: cylinder.number.toString(),
      cost: cylinder.cost,
    });
  };

  const handleDelete = async (cylinderId) => {
    if (!window.confirm('Are you sure you want to delete this cylinder?')) {
      return;
    }

    try {
      await cylindersApi.delete(cylinderId);
      setSuccess('Cylinder deleted successfully!');
      loadCylinders();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete cylinder');
      console.error('Delete error:', err);
    }
  };

  const handleChangeActive = async (cylinderId) => {
    try {
      await cylindersApi.changeActive(cylinderId);
      setSuccess('Active cylinder changed successfully!');
      loadCylinders();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to change active cylinder');
      console.error('Change active error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      number: '',
      cost: 0,
    });
  };

  const handleCancel = () => {
    setEditingCylinder(null);
    setShowAddForm(false);
    resetForm();
  };

  const formatDateRange = (range) => {
    if (!range.start_date && !range.end_date) {
      return 'No usage data';
    }
    
    const start = range.start_date ? new Date(range.start_date).toLocaleDateString() : 'Unknown';
    const end = range.end_date ? new Date(range.end_date).toLocaleDateString() : 'Unknown';
    
    if (start === end) {
      return start;
    }
    
    return `${start} - ${end}`;
  };

  if (loading) {
    return <div className="loading">Loading cylinders...</div>;
  }

  return (
    <div>
      <h1>CO2 Cylinders</h1>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Add New Cylinder Button */}
      {!showAddForm && !editingCylinder && (
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
          style={{ marginBottom: '1rem' }}
        >
          Add New Cylinder
        </button>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingCylinder) && (
        <div className="card">
          <h2 className="card-title">
            {editingCylinder ? 'Edit Cylinder' : 'Add New Cylinder'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-inline">
              <div className="form-group">
                <label className="form-label">Cylinder Number:</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  disabled={!!editingCylinder}
                  required
                  min="1"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Cost (¥):</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div className="form-group">
                <button type="submit" className="btn btn-success">
                  {editingCylinder ? 'Update' : 'Add'} Cylinder
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Cylinders List */}
      <div className="card">
        <h2 className="card-title">All Cylinders</h2>
        {cylinders.length === 0 ? (
          <p>No cylinders found. Add your first cylinder!</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Cost (¥)</th>
                <th>Status</th>
                <th>Usage Period</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cylinders.map((cylinder) => (
                <tr key={cylinder.id}>
                  <td>
                    <strong>#{cylinder.number}</strong>
                  </td>
                  <td>¥{cylinder.cost.toFixed(2)}</td>
                  <td>
                    {cylinder.is_active ? (
                      <span style={{ 
                        backgroundColor: '#28a745', 
                        color: 'white', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        ACTIVE
                      </span>
                    ) : (
                      <span style={{ 
                        backgroundColor: '#6c757d', 
                        color: 'white', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        INACTIVE
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                    {formatDateRange(dateRanges[cylinder.id] || {})}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(cylinder)}
                      >
                        Edit Cost
                      </button>
                      
                      {!cylinder.is_active && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleChangeActive(cylinder.id)}
                        >
                          Make Active
                        </button>
                      )}
                      
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(cylinder.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Change Cylinder Help */}
      <div className="card">
        <h2 className="card-title">Cylinder Management</h2>
        <div style={{ color: '#6c757d' }}>
          <h4>How to use:</h4>
          <ul>
            <li><strong>Add New Cylinder:</strong> Create a new cylinder with a unique number and cost.</li>
            <li><strong>Make Active:</strong> Set a cylinder as active for new consumption logs.</li>
            <li><strong>Edit Cost:</strong> Update the cost of a cylinder (useful when you know the actual purchase price).</li>
            <li><strong>Usage Period:</strong> Shows the date range when this cylinder was used for logging consumption.</li>
          </ul>
          
          <h4 style={{ marginTop: '1rem' }}>Tips:</h4>
          <ul>
            <li>Only one cylinder can be active at a time.</li>
            <li>New consumption logs will automatically use the active cylinder.</li>
            <li>You can change the active cylinder when you replace your CO2 cylinder.</li>
            <li>Cylinders with associated logs cannot be deleted.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CylindersView;