import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DiscoveryPage } from './DiscoveryPage';

describe('DiscoveryPage', () => {
  it('renders seeded notes', () => {
    render(
      <MemoryRouter>
        <DiscoveryPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('敏感肌修护面霜测评，48 小时收藏暴涨')).toBeInTheDocument();
    expect(screen.getByText('平价通勤穿搭公式，3 套模板直接抄')).toBeInTheDocument();
  });

  it('filters by search keyword', () => {
    render(
      <MemoryRouter>
        <DiscoveryPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('搜索关键词、标题或作者'), {
      target: { value: '空气炸锅' },
    });

    expect(screen.getByText('5 分钟空气炸锅早餐，打工人懒人菜单')).toBeInTheDocument();
    expect(screen.queryByText('平价通勤穿搭公式，3 套模板直接抄')).not.toBeInTheDocument();
  });

  it('filters by viral level', () => {
    render(
      <MemoryRouter>
        <DiscoveryPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByDisplayValue('全部等级'), {
      target: { value: 'POTENTIAL' },
    });

    expect(screen.getByText('5 分钟空气炸锅早餐，打工人懒人菜单')).toBeInTheDocument();
    expect(screen.queryByText('敏感肌修护面霜测评，48 小时收藏暴涨')).not.toBeInTheDocument();
  });
});
