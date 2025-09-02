import React from 'react';
import ActivityList from './ActivityList';
import './AdminDashboard.css';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <h1>Page d'activités</h1>
      <section className="dashboard-section">
        <h2>Journal des activités récentes</h2>
        <ActivityList />
      </section>
    </div>
  );
};

export default AdminDashboard;
