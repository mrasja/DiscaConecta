import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FavoriteButton } from '@/components/FavoriteButton';

describe('FavoriteButton', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ favorited: true }),
    });
  });

  it('renderiza el botón correctamente', () => {
    render(<FavoriteButton targetType="professional" targetId="prof-1" />);
    const btn = screen.getByRole('button', { name: /favoritos/i });
    expect(btn).toBeInTheDocument();
  });

  it('muestra "Guardar en favoritos" cuando no está guardado', () => {
    render(<FavoriteButton targetType="professional" targetId="prof-1" initialFavorited={false} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Guardar en favoritos');
  });

  it('muestra "Quitar de favoritos" cuando ya está guardado', () => {
    render(<FavoriteButton targetType="professional" targetId="prof-1" initialFavorited={true} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Quitar de favoritos');
  });

  it('llama al API y ejecuta onToggle al hacer click', async () => {
    const onToggle = vi.fn();
    render(
      <FavoriteButton
        targetType="professional"
        targetId="prof-1"
        initialFavorited={false}
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/favorites', expect.objectContaining({
        method: 'POST',
      }));
      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });

  it('no hace nada si no hay token (useAuth mock sin token)', async () => {
    const { useAuth } = await import('@/context/AuthContext');
    vi.mocked(useAuth).mockReturnValueOnce({ token: null } as any);

    render(<FavoriteButton targetType="center" targetId="center-1" />);
    fireEvent.click(screen.getByRole('button'));
    await new Promise(r => setTimeout(r, 50));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('funciona para centros también', () => {
    render(<FavoriteButton targetType="center" targetId="center-1" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
