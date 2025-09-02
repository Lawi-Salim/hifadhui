import React, { useState, useEffect } from 'react';
import { createAvatar } from '@dicebear/core';
import * as micah from '@dicebear/micah';

const UserAvatar = ({ name, size = 40, style = {} }) => {
  const [avatarUri, setAvatarUri] = useState('');

  useEffect(() => {
    if (name) {
      const generateAvatar = async () => {
        const avatar = await createAvatar(micah, {
          seed: name,
          radius: 50,
          backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"]
        }).toDataUri();
        setAvatarUri(avatar);
      };
      generateAvatar();
    } else {
      setAvatarUri(''); // Reset if name is not provided
    }
  }, [name]);

  if (!avatarUri) {
    return <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundColor: '#eee' }} />;
  }

  return <img src={avatarUri} alt={`${name}'s avatar`} style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', ...style }} />;
};

export default UserAvatar;
