import React from 'react';
import { FiClock, FiMenu, FiActivity } from 'react-icons/fi';
import ActivityList from './ActivityList';
import './AdminDashboard.css';

const ActivityPage = () => {
  return (
    <div className="admin-dashboard">
      <div className="messages-header">
        <div className="header-title">
          <button 
            className="mobile-hamburger-menu"
            onClick={() => {
              const event = new CustomEvent('toggleSidebar');
              window.dispatchEvent(event);
            }}
            aria-label="Toggle menu"
          >
            <FiMenu />
          </button>
          <div className="title-content">
            <h1><FiActivity className="page-icon" /> Logs d'activité</h1>
          </div>
        </div>
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
