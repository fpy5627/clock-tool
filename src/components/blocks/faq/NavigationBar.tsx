"use client";

import HorizontalNavBar from '@/components/blocks/navigation/HorizontalNavBar';

interface NavigationBarProps {
  /** 当前页面ID，用于高亮显示 */
  currentPage?: string;
}

/**
 * FAQ页面的导航栏组件
 * 使用公共的 HorizontalNavBar 组件，并包含FAQ链接
 * 
 * @param currentPage - 当前页面ID，用于高亮显示
 */
export default function NavigationBar({ currentPage }: NavigationBarProps) {
  return <HorizontalNavBar currentPage={currentPage} includeFaq={true} />;
}

