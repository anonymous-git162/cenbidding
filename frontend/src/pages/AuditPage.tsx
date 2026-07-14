import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Autocomplete, List, ListItem, ListItemIcon, ListItemText,
  Divider, Alert, Button,
} from '@mui/material';
import api from '../services/api';
import { Icon } from '../components/Icon';

export default function AuditPage() {
  const [inputValue, setInputValue] = useState('');
  const [procurements, setProcurements] = useState<any[]>([]);
  const [selectedProcurement, setSelectedProcurement] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.get('/procurements', { params: { limit: 100 } }).then(r => setProcurements(r.data.data || [])).catch(() => {});
  }, []);

  async function loadByProcurementId(procId: string) {
    setSearching(true);
    setError('');
    setLogs([]);
    setSearched(false);
    try {
      const res = await api.get(`/audit/${procId}`);
      setLogs(res.data.data || []);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }

  async function loadLogs() {
    if (!inputValue.trim()) return;
    setSelectedProcurement(null);
    setSearching(true);
    setError('');
    setLogs([]);
    setSearched(false);
    try {
      const trimmed = inputValue.trim();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
      if (isUUID) {
        await loadByProcurementId(trimmed);
      } else {
        const procRes = await api.get('/procurements', { params: { search: trimmed, limit: 1 } });
        if (procRes.data.data && procRes.data.data.length > 0) {
          await loadByProcurementId(procRes.data.data[0].id);
        } else {
          throw new Error(`No procurement found matching "${trimmed}"`);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load audit logs');
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Audit Logs</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Browse by Procurement</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 2 }}>
            <Autocomplete
              options={procurements}
              getOptionLabel={(o) => `${o.requestNo} — ${o.title}`}
              value={selectedProcurement}
              onChange={(_, v) => {
                setSelectedProcurement(v);
                if (v) loadByProcurementId(v.id);
              }}
              renderInput={(params) => <TextField {...params} label="Select Procurement" placeholder="Search by title or number..." />}
              sx={{ flex: 1 }}
            />
          </Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Or Search by UUID / Text</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField fullWidth label="Search" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter procurement UUID, title, or request number" />
            <Button variant="contained" onClick={loadLogs} disabled={!inputValue.trim() || searching}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {searched && logs.length === 0 && !error && (
        <Card><CardContent><Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No audit logs found for this procurement</Typography></CardContent></Card>
      )}

      {logs.length > 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Audit Trail ({logs.length} events)</Typography>
            <List>
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <ListItem>
                    <ListItemIcon><Icon name="History" /></ListItemIcon>
                    <ListItemText
                      primary={`${log.action} by ${log.actorRole || 'System'}`}
                      secondary={`${log.entityType} | ${new Date(log.createdAt).toLocaleString()}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
