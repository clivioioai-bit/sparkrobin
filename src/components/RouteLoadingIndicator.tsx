"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function RouteLoadingIndicator() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  // 确保只在客户端运行
  useEffect(() => {
    setMounted(true);
  }, []);

  // 监听路径变化
  useEffect(() => {
    if (!mounted || !pathname) return;
    
    // 如果路径发生变化，显示加载指示器
    if (pathname !== currentPath) {
      setCurrentPath(pathname);
      setIsLoading(true);
      setProgress(0);

      // 模拟进度条动画
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            return 90; // 保持在90%，等待页面加载完成
          }
          return prev + 10;
        });
      }, 100);

      // 页面加载完成后，完成进度条并隐藏
      const timer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 200);
      }, 300);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [pathname, currentPath, mounted]);

  if (!mounted || !isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] h-1 bg-transparent">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}
