import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { analyticsApi } from '../services/api';

const AnalyticsView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

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

  const prepareChartData = () => {
    if (!analytics?.consumption_data) return [];
    
    // Group by date and sum volumes
    const groupedData = analytics.consumption_data.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { date, volume_ml: 0, retail_cost: 0 };
      }
      acc[date].volume_ml += item.volume_ml;
      acc[date].retail_cost += (item.volume_ml * 45) / 500; // JPY 45 per 500mL
      return acc;
    }, {});

    return Object.values(groupedData).sort((a, b) => new Date(a.date) - new Date(b.date));
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
                vs ¥90 retail
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
                      yAxisId="volume"
                      orientation="left"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="cost"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'volume_ml' ? `${Math.round(value)} mL` : `¥${value.toFixed(0)}`,
                        name === 'volume_ml' ? 'Volume' : 'Retail Cost'
                      ]}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line 
                      yAxisId="volume"
                      type="monotone" 
                      dataKey="volume_ml" 
                      stroke="#007bff" 
                      strokeWidth={2}
                      name="volume_ml"
                    />
                    <Line 
                      yAxisId="cost"
                      type="monotone" 
                      dataKey="retail_cost" 
                      stroke="#dc3545" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="retail_cost"
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
                  <span>Your Consumption (mL)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '2px', 
                    backgroundColor: '#dc3545',
                    borderStyle: 'dashed',
                    borderWidth: '1px 0'
                  }}></div>
                  <span>Retail Cost Equivalent (¥45/500mL)</span>
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
                  ¥{((analytics.total_consumption_ml * 45) / 500).toFixed(0)}
                </p>
              </div>
              
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '0.25rem' }}>
                <h4>Savings</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  ¥{(((analytics.total_consumption_ml * 45) / 500) - analytics.total_cost).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsView;