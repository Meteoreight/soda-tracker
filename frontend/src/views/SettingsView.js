import React, { useState, useEffect } from 'react';
import { settingsApi, dataApi } from '../services/api';

const SettingsView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Settings state
  const [retailPrice, setRetailPrice] = useState(45);
  const [initialCost, setInitialCost] = useState(0);
  const [defaultPushes1L, setDefaultPushes1L] = useState(4);
  const [defaultPushes05L, setDefaultPushes05L] = useState(2);
  
  // Import/Export state
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [retailResponse, initialResponse] = await Promise.all([
        settingsApi.getRetailPrice(),
        settingsApi.getInitialCost(),
      ]);
      
      setRetailPrice(retailResponse.data.value);
      setInitialCost(initialResponse.data.value);
      setError(null);
    } catch (err) {
      setError('Failed to load settings');
      console.error('Load settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRetailPrice = async () => {
    try {
      await settingsApi.updateRetailPrice(retailPrice);
      setSuccess('Retail price updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update retail price');
      console.error('Update retail price error:', err);
    }
  };

  const handleSaveInitialCost = async () => {
    try {
      await settingsApi.updateInitialCost(initialCost);
      setSuccess('Initial cost updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update initial cost');
      console.error('Update initial cost error:', err);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setError('Please select a CSV file to import');
      return;
    }

    try {
      setImporting(true);
      const response = await dataApi.importCsv(importFile);
      setSuccess(`Import completed! ${response.data.imported_count} records imported.`);
      
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Some errors occurred: ${response.data.errors.slice(0, 3).join(', ')}`);
      }
      
      setImportFile(null);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to import CSV');
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await dataApi.exportCsv();
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `soda_consumption_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Data exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to export data');
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await dataApi.getSampleCsv();
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_import.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download sample CSV');
      console.error('Download sample error:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div>
      <h1>Settings</h1>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Data Management Section */}
      <div className="card">
        <h2 className="card-title">Data Management</h2>
        
        <div style={{ marginBottom: '2rem' }}>
          <h3>Import from CSV</h3>
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
            Import consumption data from a CSV file. The CSV should contain columns: date, bottle_size, bottle_count, cylinder_number.
          </p>
          
          <div className="form-inline" style={{ marginBottom: '1rem' }}>
            <input
              type="file"
              accept=".csv"
              className="form-control"
              onChange={(e) => setImportFile(e.target.files[0])}
            />
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importing || !importFile}
            >
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
          </div>
          
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleDownloadSample}
          >
            Download Sample CSV
          </button>
        </div>
        
        <div>
          <h3>Export to CSV</h3>
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
            Export all consumption data to a CSV file for backup or analysis.
          </p>
          <button
            className="btn btn-success"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="card">
        <h2 className="card-title">Configuration</h2>
        
        <div style={{ marginBottom: '2rem' }}>
          <h3>Retail Price Reference</h3>
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
            Set the retail price of commercial sparkling water for cost comparison calculations.
          </p>
          <div className="form-inline">
            <div className="form-group">
              <label className="form-label">Price per 500mL (¥):</label>
              <input
                type="number"
                className="form-control"
                value={retailPrice}
                onChange={(e) => setRetailPrice(parseFloat(e.target.value))}
                step="0.01"
                min="0"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSaveRetailPrice}
            >
              Save
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3>Initial Cost</h3>
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
            Set the initial purchase cost of your SodaStream device. This will be added to your total cost calculations.
          </p>
          <div className="form-inline">
            <div className="form-group">
              <label className="form-label">SodaStream Device Cost (¥):</label>
              <input
                type="number"
                className="form-control"
                value={initialCost}
                onChange={(e) => setInitialCost(parseFloat(e.target.value))}
                step="0.01"
                min="0"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSaveInitialCost}
            >
              Save
            </button>
          </div>
        </div>

        <div>
          <h3>Default CO2 Push Counts</h3>
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
            Configure the default number of CO2 button pushes for each bottle size. These are automatically calculated when logging consumption.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">1L Bottle (840mL):</label>
              <input
                type="number"
                className="form-control"
                value={defaultPushes1L}
                onChange={(e) => setDefaultPushes1L(parseInt(e.target.value))}
                min="1"
                max="20"
                disabled
              />
              <small style={{ color: '#6c757d' }}>Currently fixed at 4 pushes</small>
            </div>
            
            <div className="form-group">
              <label className="form-label">0.5L Bottle (455mL):</label>
              <input
                type="number"
                className="form-control"
                value={defaultPushes05L}
                onChange={(e) => setDefaultPushes05L(parseInt(e.target.value))}
                min="1"
                max="20"
                disabled
              />
              <small style={{ color: '#6c757d' }}>Currently fixed at 2 pushes</small>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="card">
        <h2 className="card-title">About</h2>
        <div style={{ color: '#6c757d' }}>
          <h4>SodaStream Consumption Tracker</h4>
          <p>Version 1.2.0</p>
          
          <h4 style={{ marginTop: '1rem' }}>Features:</h4>
          <ul>
            <li>Track daily sparkling water consumption</li>
            <li>Manage CO2 cylinder costs and usage</li>
            <li>Compare costs with retail sparkling water</li>
            <li>Visualize consumption trends over time</li>
            <li>Import/export data via CSV files</li>
          </ul>
          
          <h4 style={{ marginTop: '1rem' }}>How to use:</h4>
          <ol>
            <li>Set up your CO2 cylinders in the Cylinders section</li>
            <li>Log daily consumption in the Dashboard</li>
            <li>View trends and savings in Analytics</li>
            <li>Manage data and settings here</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;