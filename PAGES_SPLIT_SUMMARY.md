# 页面拆分总结

## 概述
已将原来单一页面中的4个功能（倒计时、秒表、闹钟、世界时间）拆分成独立的页面，并使用SEO友好的URL。

## 新的页面结构

### 1. 倒计时页面（Countdown）
- **路径**: `src/app/[locale]/(clock)/countdown/page.tsx`
- **URL**: `/{locale}/countdown`
- **布局**: 继承自 `(clock)/layout.tsx`，包含 Header 和 Footer
- **功能**: 倒计时功能，包含预设时间、自定义时间、声音提醒等

### 2. 秒表页面（Stopwatch）
- **路径**: `src/app/[locale]/(clock)/stopwatch/page.tsx`
- **URL**: `/{locale}/stopwatch`
- **布局**: 继承自 `(clock)/layout.tsx`，包含 Header 和 Footer
- **功能**: 秒表功能，支持计时、暂停、重置等操作

### 3. 闹钟页面（Alarm）
- **路径**: `src/app/[locale]/(clock)/alarm/page.tsx`
- **URL**: `/{locale}/alarm`
- **布局**: 继承自 `(clock)/layout.tsx`，包含 Header 和 Footer
- **功能**: 闹钟管理，支持添加、编辑、删除闹钟，设置重复规则等

### 4. 世界时间页面（World Clock）
- **路径**: `src/app/[locale]/(clock)/world-clock/page.tsx`
- **URL**: `/{locale}/world-clock`
- **布局**: 继承自 `(clock)/layout.tsx`，包含 Header 和 Footer
- **功能**: 世界时钟，显示不同时区的时间，支持添加自定义城市

## SEO 友好的 URL 设计

所有URL都遵循以下原则：
- ✅ 使用有意义的英文单词
- ✅ 使用小写字母
- ✅ 多个单词使用连字符（-）分隔
- ✅ 简短易记
- ✅ 符合Web标准

### URL 示例
- 英文: `/en/countdown`, `/en/stopwatch`, `/en/alarm`, `/en/world-clock`
- 中文: `/zh/countdown`, `/zh/stopwatch`, `/zh/alarm`, `/zh/world-clock`

## 主要代码更改

### 1. 创建共享常量文件
- **文件**: `src/lib/clock-constants.ts`
- **内容**: 预设时间选项、声音选项、主题颜色、世界城市列表等

### 2. 页面导航机制
原来的模式切换函数：
```typescript
const switchMode = (newMode: 'timer' | 'stopwatch' | 'alarm' | 'worldclock') => {
  setIsRunning(false);
  setMode(newMode);
  // ...
};
```

新的页面导航函数：
```typescript
const navigateToPage = (page: string) => {
  const currentLocale = locale || 'en';
  router.push(`/${currentLocale}/${page}`);
};
```

### 3. 各页面的模式固定
每个页面都将 `mode` 设置为固定值：
- 倒计时: `const mode = 'timer' as const;`
- 秒表: `const mode = 'stopwatch' as const;`
- 闹钟: `const mode = 'alarm' as const;`
- 世界时间: `const mode = 'worldclock' as const;`

## 翻译结构

翻译文件保持不变，仍然使用 `clock` namespace：
- **文件**: `src/i18n/messages/en.json` 和 `src/i18n/messages/zh.json`
- **命名空间**: `clock.timer`, `clock.alarm`, `clock.worldclock` 等
- 所有页面共享同一套翻译

## 测试要点

1. **导航测试**: 确认从首页可以导航到各个功能页面
2. **功能测试**: 确认每个页面的功能正常工作
3. **URL测试**: 确认URL格式正确且SEO友好
4. **国际化测试**: 确认中英文切换正常
5. **浏览器后退/前进**: 确认浏览器导航按钮正常工作

## 布局结构

所有时钟相关页面都放在 `(clock)` 路由组中：
```
src/app/[locale]/
  ├── (clock)/              # 时钟功能路由组
  │   ├── layout.tsx        # 共享布局（Header + Footer）
  │   ├── countdown/
  │   ├── stopwatch/
  │   ├── alarm/
  │   └── world-clock/
  ├── (default)/            # 默认路由组（首页等）
  └── (admin)/              # 管理后台路由组
```

**路由组的优势**：
- ✅ 使用括号命名 `(clock)` 不影响URL路径
- ✅ 可以为同一组页面共享布局
- ✅ 代码组织更清晰
- ✅ 便于维护和扩展

## 下一步建议

1. **添加页面元数据**: 为每个页面添加独立的 `<title>` 和 `<meta>` 标签
2. **性能优化**: 考虑代码分割，减少每个页面的包大小
3. **面包屑导航**: 添加面包屑导航提升用户体验
4. **共享组件**: 提取公共组件到独立文件，减少代码重复

## 文件清单

### 新增文件
- `src/lib/clock-constants.ts` - 共享常量
- `src/app/[locale]/(clock)/layout.tsx` - 时钟页面的共享布局（包含 Header 和 Footer）
- `src/app/[locale]/(clock)/countdown/page.tsx` - 倒计时页面
- `src/app/[locale]/(clock)/stopwatch/page.tsx` - 秒表页面
- `src/app/[locale]/(clock)/alarm/page.tsx` - 闹钟页面
- `src/app/[locale]/(clock)/world-clock/page.tsx` - 世界时间页面

### 修改文件
- `src/app/[locale]/(default)/page.tsx` - 更新导航按钮为页面跳转

## 技术栈

- **框架**: Next.js 14 (App Router)
- **路由**: next-intl 路由系统
- **国际化**: next-intl
- **样式**: Tailwind CSS + Shadcn UI
- **状态管理**: React Hooks + Context API

