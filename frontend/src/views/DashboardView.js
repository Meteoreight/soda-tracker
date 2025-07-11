import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsApi, logsApi, cylindersApi, settingsApi } from '../services/api';
import Counter from '../components/Counter';

const DashboardView = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bottleSize, setBottleSize] = useState('1L');
  const [bottleCount, setBottleCount] = useState(1);
  const [co2Pushes, setCo2Pushes] = useState(null); // null means use default calculation
  const [cylinders, setCylinders] = useState([]);
  const [activeCylinderId, setActiveCylinderId] = useState(null);
  const [defaultPushes1L, setDefaultPushes1L] = useState(4);
  const [defaultPushes05L, setDefaultPushes05L] = useState(2);

  // Calculate default CO2 pushes based on bottle size and count
  const calculateDefaultCo2Pushes = (size, count) => {
    const pushesPerBottle = size === '1L' ? defaultPushes1L : defaultPushes05L;
    return pushesPerBottle * count;
  };

  useEffect(() => {
    loadDashboardData();
    loadCylinders();
    loadDefaultPushes();
  }, []);

  // Initialize CO2 pushes with default value
  useEffect(() => {
    const defaultPushes = calculateDefaultCo2Pushes(bottleSize, bottleCount);
    setCo2Pushes(defaultPushes);
  }, []); // Run only once on mount

  // Update default CO2 pushes when bottle size or count changes
  useEffect(() => {
    const defaultPushes = calculateDefaultCo2Pushes(bottleSize, bottleCount);
    setCo2Pushes(defaultPushes);
  }, [bottleSize, bottleCount, defaultPushes1L, defaultPushes05L, calculateDefaultCo2Pushes]);

  const loadDefaultPushes = async () => {
    try {
      const [pushes1LResponse, pushes05LResponse] = await Promise.all([
        settingsApi.getDefaultPushes1L(),
        settingsApi.getDefaultPushes05L(),
      ]);
      
      setDefaultPushes1L(pushes1LResponse.data.value);
      setDefaultPushes05L(pushes05LResponse.data.value);
    } catch (err) {
      console.error('Load default pushes error:', err);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getDashboardSummary();
      setSummary(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCylinders = async () => {
    try {
      const response = await cylindersApi.getAll();
      setCylinders(response.data);
      const activeCylinder = response.data.find(c => c.is_active);
      if (activeCylinder) {
        setActiveCylinderId(activeCylinder.id);
      }
    } catch (err) {
      console.error('Failed to load cylinders:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!activeCylinderId) {
      setError('Please select an active cylinder in the Cylinders section first');
      return;
    }

    try {
      const logData = {
        date,
        bottle_size: bottleSize,
        bottle_count: bottleCount,
        cylinder_id: activeCylinderId,
        co2_pushes: co2Pushes,
      };

      console.log('Submitting log data:', logData); // Debug log for iOS Safari
      await logsApi.create(logData);
      
      // Use requestAnimationFrame for Safari compatibility
      requestAnimationFrame(() => {
        setSuccess('Consumption logged successfully!');
        setError(null);
        
        // Reset form
        setBottleCount(1);
        setDate(new Date().toISOString().split('T')[0]);
        const defaultPushes = calculateDefaultCo2Pushes(bottleSize, 1);
        setCo2Pushes(defaultPushes);
        
        // Reload dashboard data
        loadDashboardData();
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Log creation error details:', err.response || err); // Enhanced error logging
      requestAnimationFrame(() => {
        setError('Failed to log consumption');
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Quick Add Section */}
      <div className="card">
        <h2 className="card-title">Log Consumption</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-inline">
            <div className="form-group">
              <label className="form-label">Date:</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onBlur={(e) => setDate(e.target.value)}
                onKeyUp={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Bottle Size:</label>
              <select
                className="form-control"
                value={bottleSize}
                onChange={(e) => setBottleSize(e.target.value)}
                onBlur={(e) => setBottleSize(e.target.value)}
              >
                <option value="1L">1L (840mL)</option>
                <option value="0.5L">0.5L (455mL)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Bottle Count:</label>
              <Counter
                value={bottleCount}
                onChange={setBottleCount}
                min={1}
                max={20}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">CO2 Pushes:</label>
              <Counter
                value={co2Pushes || 0}
                onChange={setCo2Pushes}
                min={0}
                max={50}
              />
              <small className="form-text text-muted">
                Default: {calculateDefaultCo2Pushes(bottleSize, bottleCount)} pushes
              </small>
            </div>
            
            <button type="submit" className="btn btn-primary btn-lg">
              Log Consumption
            </button>
          </div>
        </form>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="card-grid">
          <div className="card">
            <h3 className="card-title">Today's Consumption</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
              {Math.round(summary.today_consumption_ml)} mL
            </p>
          </div>
          
          <div className="card">
            <h3 className="card-title">This Month's Cost</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
              ¥{summary.this_month_cost.toFixed(0)}
            </p>
          </div>
          
          <div className="card">
            <h3 className="card-title">Savings vs. Retail</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
              ¥{summary.savings_vs_retail.toFixed(0)}
            </p>
          </div>
          
          <div className="card">
            <h3 className="card-title">Active Cylinder</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6c757d' }}>
              {summary.active_cylinder ? `#${summary.active_cylinder.number}` : 'None'}
            </p>
          </div>
        </div>
      )}

      {/* Consumption Chart Preview */}
      {summary && summary.recent_consumption_data && (
        <div className="card">
          <h2 className="card-title">Recent Consumption (30 days)</h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.recent_consumption_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="volume_ml" 
                  stroke="#007bff" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link to="/analytics" className="btn btn-primary">
              View Detailed Analytics
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;