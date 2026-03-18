import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NoteDetailPage } from './NoteDetailPage';

describe('NoteDetailPage', () => {
  it('renders detail metrics and review notes for the selected note', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/101']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('敏感肌修护面霜测评，48小时收藏暴涨')).toBeInTheDocument();
    expect(await screen.findByText('Viral Rule v1')).toBeInTheDocument();
    expect(await screen.findByText('Saved to 护肤爆款')).toBeInTheDocument();
    expect(screen.getByText('89.4')).toBeInTheDocument();
  });
});
