import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUploader from '../components/FileUploader';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { post: vi.fn(), delete: vi.fn() },
}));

const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

describe('FileUploader', () => {
  const onAttachmentsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders attach button and max size hint', () => {
    render(<FileUploader onAttachmentsChange={onAttachmentsChange} />);
    expect(screen.getByText('Attach File')).toBeInTheDocument();
    expect(screen.getByText('Max 10MB')).toBeInTheDocument();
  });

  it('shows initial attachments', () => {
    const initial = [{ id: 'f-1', fileName: 'doc.pdf', fileSize: 2048 }];
    render(<FileUploader onAttachmentsChange={onAttachmentsChange} initialAttachments={initial} />);
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    expect(screen.getByText('2KB')).toBeInTheDocument();
  });

  it('uploads a file and notifies parent', async () => {
    const user = userEvent.setup();
    const mockResponse = { data: { id: 'f-2', fileName: 'test.pdf', fileSize: 1024 } };
    (api.post as any).mockResolvedValue(mockResponse);

    const { container } = render(<FileUploader onAttachmentsChange={onAttachmentsChange} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, mockFile);
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
      expect(onAttachmentsChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ fileName: 'test.pdf' })])
      );
    });
  });

  it('removes a file on delete click', async () => {
    const user = userEvent.setup();
    const initial = [{ id: 'f-1', fileName: 'doc.pdf', fileSize: 2048 }];
    (api.delete as any).mockResolvedValue({});

    render(<FileUploader onAttachmentsChange={onAttachmentsChange} initialAttachments={initial} />);
    const removeBtn = screen.getByRole('button', { name: '' });
    await user.click(removeBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/files/f-1');
      expect(onAttachmentsChange).toHaveBeenCalledWith([]);
    });
  });
});
