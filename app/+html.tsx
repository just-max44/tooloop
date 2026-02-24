import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                background-color: #F9F7F2;
              }

              body {
                margin: 0;
                overscroll-behavior-y: none;
                -webkit-overflow-scrolling: touch;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
