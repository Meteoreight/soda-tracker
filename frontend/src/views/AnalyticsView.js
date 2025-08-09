import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { analyticsApi, settingsApi } from '../services/api';

const AnalyticsView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [retailPrice, setRetailPrice] = useState(45.0);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  useEffect(() => {
    loadRetailPrice();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getAnalytics(selectedPeriod);
      setAnalytics(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRetailPrice = async () => {
    try {
      const response = await settingsApi.getRetailPrice();
      setRetailPrice(response.data.value);
    } catch (err) {
      console.error('Failed to load retail price:', err);
      // Keep default value of 45.0
    }
  };

  const prepareChartData = () => {
    if (!analytics?.consumption_data) return [];
    
    // The data is already grouped by date from the backend
    const chartData = analytics.consumption_data.map(item => ({
      date: item.date,
      co2_cost: item.co2_cost || 0,
      total_cost: item.total_cost || 0,
      retail_cost: item.retail_cost || 0,
      volume_ml: item.volume_ml || 0,
      cumulative_volume_ml: item.cumulative_volume_ml || 0
    }));

    return chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const chartData = prepareChartData();

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <h1>Analytics</h1>

      {/* Period Toggle Buttons */}
      <div className="card">
        <h2 className="card-title">Time Period</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['30d', '90d', '180d', '365d'].map((period) => (
            <button
              key={period}
              className={`btn ${selectedPeriod === period ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {analytics && (
        <>
          {/* Statistics Cards */}
          <div className="card-grid">
            <div className="card">
              <h3 className="card-title">Total Consumption</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                {(analytics.total_consumption_ml / 1000).toFixed(1)} L
              </p>
              <p style={{ color: '#6c757d' }}>
                {Math.round(analytics.total_consumption_ml)} mL
              </p>
            </div>
            
            <div className="card">
              <h3 className="card-title">Average Daily</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                {Math.round(analytics.average_daily_consumption_ml)} mL
              </p>
              <p style={{ color: '#6c757d' }}>
                per day
              </p>
            </div>
            
            <div className="card">
              <h3 className="card-title">Total Cost</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
                ¥{analytics.total_cost.toFixed(0)}
              </p>
              <p style={{ color: '#6c757d' }}>
                {analytics.period_days} days
              </p>
            </div>
            
            <div className="card">
              <h3 className="card-title">Cost per Liter</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1' }}>
                ¥{analytics.cost_per_liter.toFixed(1)}
              </p>
              <p style={{ color: '#6c757d' }}>
                vs ¥{(retailPrice * 2).toFixed(0)} retail
              </p>
            </div>
          </div>

          {/* Main Chart */}
          <div className="card">
            <h2 className="card-title">
              Consumption Chart ({selectedPeriod})
            </h2>
            <div style={{ height: '400px' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      yAxisId="cost"
                      orientation="left"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Cost (¥)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        `¥${value.toFixed(1)}`,
                        name === 'total_cost' ? 'Your Total Cost' : 'Retail Cost'
                      ]}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line 
                      yAxisId="cost"
                      type="monotone" 
                      dataKey="total_cost" 
                      stroke="#007bff" 
                      strokeWidth={2}
                      name="total_cost"
                      dot={false}
                    />
                    <Line 
                      yAxisId="cost"
                      type="monotone" 
                      dataKey="retail_cost" 
                      stroke="#dc3545" 
                      strokeWidth={2}
                      name="retail_cost"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#6c757d'
                }}>
                  No data available for the selected period
                </div>
              )}
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6c757d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '2px', 
                    backgroundColor: '#007bff' 
                  }}></div>
                  <span>Your Total Cost (¥)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '2px', 
                    backgroundColor: '#dc3545',
                    borderStyle: 'dashed',
                    borderWidth: '1px 0'
                  }}></div>
                  <span>Retail Cost (¥{retailPrice}/500mL)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Comparison */}
          <div className="card">
            <h2 className="card-title">Cost Comparison</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '0.25rem' }}>
                <h4>Your Cost</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  ¥{analytics.total_cost.toFixed(0)}
                </p>
              </div>
              
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '0.25rem' }}>
                <h4>Retail Cost</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                  ¥{((analytics.total_consumption_ml * retailPrice) / 500).toFixed(0)}
                </p>
              </div>
              
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '0.25rem' }}>
                <h4>Savings</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  ¥{(((analytics.total_consumption_ml * retailPrice) / 500) - analytics.total_cost).toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          {/* Cumulative Consumption Chart */}
          <div className="card">
            <h2 className="card-title">
              Cumulative Consumption ({selectedPeriod})
            </h2>
            <div style={{ height: '300px' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Volume (L)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${(value / 1000).toFixed(1)} L`,
                        'Cumulative Volume'
                      ]}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative_volume_ml"
                      stroke="#28a745" 
                      strokeWidth={3}
                      name="cumulative_volume_ml"
                      dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#6c757d'
                }}>
                  No data available for the selected period
                </div>
              )}
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6c757d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '20px', 
                  height: '3px', 
                  backgroundColor: '#28a745' 
                }}></div>
                <span>Total Carbonated Water Produced (L)</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsView;