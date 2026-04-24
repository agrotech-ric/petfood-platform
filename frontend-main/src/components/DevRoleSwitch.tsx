import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type DevRole = 'USER' | 'VET' | 'ADMIN';

export const DevRoleSwitch = () => {
  const [selectedRole, setSelectedRole] = useState<DevRole>('USER');
  const navigate = useNavigate();

  const handleRoleSelect = (role: DevRole) => {
    setSelectedRole(role);


    if (role === 'VET') {
      navigate('/vet/dashboard');
    } else if (role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '3rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
         Role Switch
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>

        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <button
            onClick={() => handleRoleSelect('USER')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: selectedRole === 'USER' ? 'rgba(242, 112, 76, 1)' : '#f3f4f6',
              color: selectedRole === 'USER' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>USER</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              Pet owner
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('VET')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: selectedRole === 'VET' ? 'rgba(242, 112, 76, 1)' : '#f3f4f6',
              color: selectedRole === 'VET' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>VET</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              Veterinarian
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('ADMIN')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: selectedRole === 'ADMIN' ? 'rgba(242, 112, 76, 1)' : '#f3f4f6',
              color: selectedRole === 'ADMIN' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>ADMIN</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              Admin
            </div>
          </button>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <p style={{
            fontSize: '13px',
            color: '#92400e',
            margin: 0
          }}>
           <strong>Development Only</strong>
          </p>
        </div>
      </div>
    </div>
  );
};