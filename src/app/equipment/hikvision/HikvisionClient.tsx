// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import styles from '../../page.module.css';
import { getHikvisionDevices, registerHikvisionDevice, testDeviceConnection } from '@/app/actions/hikvisionDeviceService';
// We'll also fetch equipment to link
import { getEquipmentList } from '@/app/actions/equipmentActions';

export default function HikvisionClient() {
  const [devices, setDevices] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ id: string, msg: string, success: boolean } | null>(null);

  const [formData, setFormData] = useState({
    deviceName: '',
    deviceModel: '',
    deviceSerialNumber: '',
    imeiOrUniqueId: '',
    integrationType: 'DEVICE_GATEWAY',
    ipAddress: '',
    port: '',
    username: '',
    password: '',
    equipmentId: '',
    simNumber: '',
    simProvider: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [devs, eqps] = await Promise.all([
        getHikvisionDevices(),
        getEquipmentList()
      ]);
      setDevices(devs);
      setEquipmentList(eqps);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerHikvisionDevice(formData);
      setIsModalOpen(false);
      setFormData({
        deviceName: '', deviceModel: '', deviceSerialNumber: '', imeiOrUniqueId: '',
        integrationType: 'DEVICE_GATEWAY', ipAddress: '', port: '', username: '', password: '',
        equipmentId: '', simNumber: '', simProvider: ''
      });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      const res = await testDeviceConnection(id);
      setTestResult({ id, msg: res.message, success: res.success });
      setTimeout(() => setTestResult(null), 5000);
    } catch (e: any) {
      setTestResult({ id, msg: e.message, success: false });
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1400px' }}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Hikvision Device Registry</h1>
          <p>Register and manage onboard security and video telematics devices.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Add Device
        </button>
      </header>

      {isLoading ? (
        <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading devices...</div>
      ) : (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--glass-border)' }}>
              <tr>
                <th style={{ padding: '15px', color: 'var(--text-secondary)' }}>Device</th>
                <th style={{ padding: '15px', color: 'var(--text-secondary)' }}>Integration</th>
                <th style={{ padding: '15px', color: 'var(--text-secondary)' }}>Network / SIM</th>
                <th style={{ padding: '15px', color: 'var(--text-secondary)' }}>Assigned Vehicle</th>
                <th style={{ padding: '15px', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '15px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No Hikvision devices registered yet.
                  </td>
                </tr>
              ) : (
                devices.map(dev => (
                  <tr key={dev.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '15px' }}>
                      <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{dev.deviceName}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SN: {dev.deviceSerialNumber}</span>
                    </td>
                    <td style={{ padding: '15px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {dev.integrationType}
                    </td>
                    <td style={{ padding: '15px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {dev.ipAddress ? `IP: ${dev.ipAddress}:${dev.port || 80}` : 'Push/Gateway'}
                      {dev.simNumber && <div style={{ fontSize: '0.8rem' }}>SIM: {dev.simNumber}</div>}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {dev.equipment ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.5rem' }}>🚚</span>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{dev.equipment.code}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{dev.equipment.plateNumber || 'No Plate'}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--warning-color)' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        background: dev.status === 'ACTIVE' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                        color: dev.status === 'ACTIVE' ? 'var(--success-color)' : 'var(--error-color)'
                      }}>
                        {dev.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleTestConnection(dev.id)}
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Test Connection
                      </button>
                      {testResult?.id === dev.id && (
                        <div style={{ marginTop: '5px', fontSize: '0.8rem', color: testResult.success ? 'var(--success-color)' : 'var(--error-color)' }}>
                          {testResult.msg}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '700px', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Register Hikvision Device</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Device Name *</label>
                  <input required value={formData.deviceName} onChange={e => setFormData({...formData, deviceName: e.target.value})} style={{ padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }} placeholder="e.g. Front Dashcam 01" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Serial Number *</label>
                  <input required value={formData.deviceSerialNumber} onChange={e => setFormData({...formData, deviceSerialNumber: e.target.value})} style={{ padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }} placeholder="DS-M..." />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Device Model</label>
                  <input value={formData.deviceModel} onChange={e => setFormData({...formData, deviceModel: e.target.value})} style={{ padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>IMEI (if 4G)</label>
                  <input value={formData.imeiOrUniqueId} onChange={e => setFormData({...formData, imeiOrUniqueId: e.target.value})} style={{ padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Integration Strategy *</label>
                <select value={formData.integrationType} onChange={e => setFormData({...formData, integrationType: e.target.value})} style={{ padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }}>
                  <option value="DEVICE_GATEWAY">Device Gateway (Webhook Push - Recommended for 4G)</option>
                  <option value="DIRECT_ISAPI">Direct ISAPI (Polling - Static IP required)</option>
                  <option value="HIKCENTRAL_OPENAPI">HikCentral OpenAPI (Optional 3rd Party)</option>
                </select>
                <span style={{ fontSize: '0.8rem', color: 'var(--warning-color)' }}>Direct ISAPI requires Public IP/VPN. Device Gateway uses ERP-FMS HTTPS Endpoint.</span>
              </div>

              {formData.integrationType === 'DIRECT_ISAPI' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>IP Address / Domain</label>
                    <input value={formData.ipAddress} onChange={e => setFormData({...formData, ipAddress: e.target.value})} style={{ padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }} placeholder="e.g. 192.168.1.100 or vpn.fleet.com" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Port</label>
                    <input type="number" value={formData.port} onChange={e => setFormData({...formData, port: e.target.value})} style={{ padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }} placeholder="80" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ISAPI Username</label>
                    <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} style={{ padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }} placeholder="admin" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ISAPI Password</label>
                    <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }} placeholder="Will be encrypted in DB" />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>SIM Number (Optional)</label>
                  <input value={formData.simNumber} onChange={e => setFormData({...formData, simNumber: e.target.value})} style={{ padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Assign to Vehicle / Equipment</label>
                  <select value={formData.equipmentId} onChange={e => setFormData({...formData, equipmentId: e.target.value})} style={{ padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }}>
                    <option value="">-- No Vehicle Assigned --</option>
                    {equipmentList.map(eq => (
                      <option key={eq.id} value={eq.id}>[{eq.code}] {eq.name} - {eq.plateNumber || 'No Plate'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Register Device</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
