export const F1_DISPLAY_FONT = '"Barlow Condensed", "Impact", "Arial Narrow Bold", sans-serif';
export const F1_DATA_FONT = '"Inter", "Avenir Next", "Segoe UI", sans-serif';
export const F1_TEKO_FONT = '"Teko", "Barlow Condensed", "Impact", sans-serif';
export const F1_OSWALD_FONT = '"Oswald", "Barlow Condensed", "Arial Narrow", sans-serif';
export const F1_BEBAS_FONT = '"Bebas Neue", "Barlow Condensed", Impact, sans-serif';

export const F1FontFaces = () => (
  <style>
    {`
      @font-face {
        font-family: "Barlow Condensed";
        src: url("/public/fonts/radio-do-box/BarlowCondensed-Black.ttf") format("truetype");
        font-weight: 900;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "Bebas Neue";
        src: url("/public/fonts/radio-do-box/BebasNeue-Regular.ttf") format("truetype");
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }

      @font-face { font-family: "Teko"; src: url("/public/fonts/radio-do-box/Teko-Bold.ttf") format("truetype"); font-weight: 600; }
      @font-face { font-family: "Teko"; src: url("/public/fonts/radio-do-box/Teko-Bold.ttf") format("truetype"); font-weight: 700; }
      @font-face { font-family: "Teko"; src: url("/public/fonts/radio-do-box/Teko-Bold.ttf") format("truetype"); font-weight: 800; }
      @font-face { font-family: "Oswald"; src: url("/public/fonts/radio-do-box/Oswald-SemiBold.ttf") format("truetype"); font-weight: 600; }

      @font-face {
        font-family: "Barlow Condensed";
        src: url("/public/fonts/radio-do-box/BarlowCondensed-ExtraBold.ttf") format("truetype");
        font-weight: 800;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "Barlow Condensed";
        src: url("/public/fonts/radio-do-box/BarlowCondensed-Bold.ttf") format("truetype");
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "Inter";
        src: url("/public/fonts/radio-do-box/Inter-Bold.ttf") format("truetype");
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "Inter";
        src: url("/public/fonts/radio-do-box/Inter-SemiBold.ttf") format("truetype");
        font-weight: 600;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "Inter";
        src: url("/public/fonts/radio-do-box/Inter-Medium.ttf") format("truetype");
        font-weight: 500;
        font-style: normal;
        font-display: swap;
      }
    `}
  </style>
);
