import React from 'react';
import { FiClock } from 'react-icons/fi';
import ActivityList from './ActivityList';
import './AdminDashboard.css';

const ActivityPage = () => {
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Logs d'activité</h1>
      </div>

      {/* Journal des activités récentes */}
      <section className="dashboard-section">
        <h2><FiClock /> Journal des activités récentes</h2>
        <ActivityList />
      </section>
    </div>
  );
};

export default ActivityPage;
