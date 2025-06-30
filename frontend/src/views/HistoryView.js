import React, { useState, useEffect } from 'react';
import { logsApi, cylindersApi } from '../services/api';
import Counter from '../components/Counter';

const HistoryView = () => {
  const [logs, setLogs] = useState([]);
  const [cylinders, setCylinders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    bottle_size: '1L',
    bottle_count: 1,
    cylinder_id: '',
    co2_pushes: 4, // Default for 1L bottle
  });

  // Calculate default CO2 pushes based on bottle size and count
  const calculateDefaultCo2Pushes = (size, count) => {
    const pushesPerBottle = size === '1L' ? 4 : 2;
    return pushesPerBottle * count;
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update CO2 pushes when bottle size or count changes (only for new logs, not editing)
  useEffect(() => {
    if (showAddForm && !editingLog) {
      const defaultPushes = calculateDefaultCo2Pushes(formData.bottle_size, formData.bottle_count);
      setFormData(prev => ({ ...prev, co2_pushes: defaultPushes }));
    }
  }, [formData.bottle_size, formData.bottle_count, showAddForm, editingLog]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsResponse, cylindersResponse] = await Promise.all([
        logsApi.getAll(),
        cylindersApi.getAll(),
      ]);
      setLogs(logsResponse.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setCylinders(cylindersResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log.id);
    setFormData({
      date: log.date,
      bottle_size: log.bottle_size,
      bottle_count: log.bottle_count,
      cylinder_id: parseInt(log.cylinder_id),
      co2_pushes: log.co2_pushes,
    });
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this log?')) {
      return;
    }

    try {
      await logsApi.delete(logId);
      setSuccess('Log deleted successfully!');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete log');
      console.error('Delete error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingLog) {
        await logsApi.update(editingLog, formData);
        setSuccess('Log updated successfully!');
        setEditingLog(null);
      } else {
        await logsApi.create(formData);
        setSuccess('Log created successfully!');
        setShowAddForm(false);
      }
      
      loadData();
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save log');
      console.error('Save error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      bottle_size: '1L',
      bottle_count: 1,
      cylinder_id: '',
      co2_pushes: 4, // Default for 1L bottle
    });
  };

  const handleCancel = () => {
    setEditingLog(null);
    setShowAddForm(false);
    resetForm();
  };

  if (loading) {
    return <div className="loading">Loading history...</div>;
  }

  return (
    <div>
      <h1>Consumption History</h1>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Add New Log Button */}
      {!showAddForm && !editingLog && (
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
          style={{ marginBottom: '1rem' }}
        >
          Add New Log
        </button>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingLog) && (
        <div className="card">
          <h2 className="card-title">
            {editingLog ? 'Edit Log' : 'Add New Log'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-inline">
              <div className="form-group">
                <label className="form-label">Date:</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Bottle Size:</label>
                <select
                  className="form-control"
                  value={formData.bottle_size}
                  onChange={(e) => setFormData({ ...formData, bottle_size: e.target.value })}
                >
                  <option value="1L">1L (840mL)</option>
                  <option value="0.5L">0.5L (455mL)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Bottle Count:</label>
                <Counter
                  value={formData.bottle_count}
                  onChange={(count) => setFormData({ ...formData, bottle_count: count })}
                  min={1}
                  max={20}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Cylinder:</label>
                <select
                  className="form-control"
                  value={formData.cylinder_id}
                  onChange={(e) => setFormData({ ...formData, cylinder_id: parseInt(e.target.value) })}
                  required
                >
                  <option value="">Select Cylinder</option>
                  {cylinders.map((cylinder) => (
                    <option key={cylinder.id} value={cylinder.id}>
                      #{cylinder.number} (¥{cylinder.cost})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">CO2 Pushes:</label>
                <Counter
                  value={formData.co2_pushes || 0}
                  onChange={(pushes) => setFormData({ ...formData, co2_pushes: pushes })}
                  min={0}
                  max={50}
                />
                <small className="form-text text-muted">
                  Default: {calculateDefaultCo2Pushes(formData.bottle_size, formData.bottle_count)} pushes
                </small>
              </div>
              
              <div className="form-group">
                <button type="submit" className="btn btn-success">
                  {editingLog ? 'Update' : 'Add'} Log
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

      {/* Logs Table */}
      <div className="card">
        <h2 className="card-title">All Logs</h2>
        {logs.length === 0 ? (
          <p>No consumption logs found. Add your first log!</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bottle Size</th>
                <th>Count</th>
                <th>Volume (mL)</th>
                <th>CO2 Pushes</th>
                <th>Cylinder</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.date).toLocaleDateString()}</td>
                  <td>{log.bottle_size}</td>
                  <td>{log.bottle_count}</td>
                  <td>{Math.round(log.volume_ml)}</td>
                  <td>{log.co2_pushes}</td>
                  <td>#{log.cylinder.number}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEdit(log)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(log.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoryView;