// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

// ปุ่มสลับธีมใน toolbar + ใส่ class 'light'/'dark' ให้ body (เข้ากับ Tailwind)
import { withThemeByClassName } from '@storybook/addon-themes';

const preview: Preview = {
  parameters: {
  
    // คุม control panel ให้เดา color/date ได้
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // รองรับ Next.js App Router + mock navigation ขั้นพื้นฐาน
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
        query: {},
      },
    },

    // โครงหน้าสตอรี่สบายตา
    layout: 'padded',
    backgrounds: { default: 'transparent' },

    // a11y: ใช้โหมด manual (กดรันเอง) – ค่าที่ถูกต้องคือ manual, ไม่ใช่ 'test'
    a11y: { manual: true },
  },

  // ธีม light/dark แบบ className (ทำงานกับ Tailwind 'dark' mode)
  decorators: [
    withThemeByClassName({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;
