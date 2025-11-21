import React from 'react';
import { FiMail } from 'react-icons/fi';
import MessagesPage from './MessagesPage';

const ContactMessagesPage = () => {
  return (
    <MessagesPage
      predefinedType="contact_received"
      pageTitle="Contacts"
      pageIcon={FiMail}
    />
  );
};

export default ContactMessagesPage;
