import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiSend, FiCheck } from 'react-icons/fi';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation email
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/v1/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setError(data.error || 'Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <Link to="/" className="back-to-home">
            <FiArrowLeft />
            Retour à l'accueil
          </Link>

          <div className="auth-header">
            <h1 className="auth-title">Message envoyé !</h1>
            <p className="auth-subtitle">
              Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container contact-container">
        <Link to="/" className="back-to-home">
          <FiArrowLeft />
          Retour à l'accueil
        </Link>

        <div className="auth-header">
          <div className="auth-logo"><FiLock /> Hifadhui</div>
          <h1 className="auth-title">Contactez-nous</h1>
          <p className="auth-subtitle">
            Une question, une suggestion ou besoin d'aide ? Nous sommes là pour vous accompagner.
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Nom complet *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="Votre nom complet"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Adresse email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="subject" className="form-label">
              Sujet
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="form-input"
              placeholder="Sujet de votre message (optionnel)"
              value={formData.subject}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message" className="form-label">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              className="form-textarea"
              placeholder="Décrivez votre demande, question ou suggestion..."
              rows="6"
              value={formData.message}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            <FiSend style={{ marginRight: '0.5rem' }} />
            {loading ? 'Envoi en cours...' : 'Envoyer le message'}
          </button>
        </form>

        <div className="contact-info">
          <p className="contact-note">
            📧 Vous pouvez aussi nous écrire directement à : <strong>mavuna@hifadhui.site</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;