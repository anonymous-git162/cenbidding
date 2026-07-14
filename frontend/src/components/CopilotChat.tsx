import { useState } from 'react';
import { Fab, Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import { Icon } from './Icon';

const EMBED_URL = import.meta.env.VITE_COPILOT_URL || 'https://copilotstudio.microsoft.com/environments/Default-0e77a136-7774-4154-8dc7-0b7cb3e3b683/bots/cref5_Ebidding_lP5TIi/canvas?__version__=2&enableFileAttachment=false&cliAgent=true';

export default function CopilotChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Fab
        color="primary"
        aria-label="Open Copilot chat"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
          width: 56,
          height: 56,
          boxShadow: 4,
        }}
      >
        <Icon name="Chat" />
      </Fab>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: 400,
            height: 600,
            maxWidth: '90vw',
            maxHeight: '80vh',
            borderRadius: 2,
            overflow: 'hidden',
            position: 'fixed',
            bottom: 100,
            right: 24,
            m: 0,
          },
        }}
        hideBackdrop
        disableEnforceFocus
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon name="Chat" />
            Copilot Assistant
          </Box>
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
            <Icon name="Close" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, '& > iframe': { width: '100%', height: '100%', border: 'none' } }}>
          <iframe
            src={EMBED_URL}
            title="Copilot Assistant"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
